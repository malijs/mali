const assert = require('assert')
const _ = require('lodash')
const Emitter = require('events')
const pify = require('pify')
const compose = require('mali-compose')
const grpc = require('grpc')
const gi = require('grpc-inspect')
const pMap = require('p-map')

const Context = require('./context')
const run = require('./run')
const mu = require('./utils')

const REMOVE_PROPS = ['grpc', 'middleware', 'handlers', 'servers', 'load', 'proto', 'service', 'methods']
const EE_PROPS = Object.getOwnPropertyNames(new Emitter())

/**
 * Represents a gRPC service
 * @extends Emitter
 *
 * @example <caption>Create service dynamically</caption>
 * const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
 * const app = new Mali(PROTO_PATH, 'Greeter')
 * @example <caption>Create service from static definition</caption>
 * const services = require('./static/helloworld_grpc_pb')
 * const app = new Mali(services, 'GreeterService')
 */
class Mali extends Emitter {
  /**
   * Create a gRPC service
   * @class
   * @param {String|Object} proto - Path to the protocol buffer definition file or the static service proto object itself
   * @param {Object} name - Name of the service.
   *                      In case of proto path the name of the service as defined in the proto definition.
   *                      In case of proto object the name of the constructor.
   * @param {Object} options - Options to be passed to <code>grpc.load</code>
   */
  constructor (path, name, options) {
    super()

    this.grpc = grpc
    this.middleware = [] // just the global middleware
    this.handlers = {} // specific middleware and handlers
    this.servers = []

    // app options / settings
    this.context = new Context()
    this.env = process.env.NODE_ENV || 'development'

    if (path && name) {
      this.init(path, name, options)
    }
  }

  /**
   * Init's the app with the proto. Basically this can be used if you don't have the data at
   * app construction time for some reason.
   * @param {String|Object} proto - Path to the protocol buffer definition file or the static service proto object itself
   * @param {Object} name - Name of the service.
   *                      In case of proto path the name of the service as defined in the proto definition.
   *                      In case of proto object the name of the constructor.
   * @param {Object} options - Options to be passed to <code>grpc.load</code>
   */
  init (path, name, options) {
    this.name = name
    this.load = _.isString(path)
    this.proto = this.load ? this.grpc.load(path, options) : path

    let service
    let descriptor
    if (this.load) {
      descriptor = gi(this.proto)
      if (!descriptor) {
        throw new Error(String.raw `Error parsing protocol buffer`)
      }
      const client = descriptor.client(name)
      service = client ? client.service : null
    } else if (_.isObject(this.proto)) {
      service = this.proto[name]
    }

    if (!_.isObject(service)) {
      throw new Error(String.raw `${name} is not a service definition within the protocol buffer definition`)
    }

    this.service = service
    if (this.load) {
      const methods = descriptor.methods(name)
      this.methods = {}
      methods.forEach(m => {
        this.methods[_.camelCase(m.name)] = m
      })
    } else {
      this.methods = mu.getMethodDescriptors(service)
    }
  }

  /**
   * Define midelware and handlers
   * @param {String|Object} name Name of the function as specified in the protocol buffer definition.
   *                             or an object of name and handlers
   * @param {Function|Array} fns - Middleware and/or handler
   *
   * @example <caption>Define handler for rpc function 'fn1'</caption>
   * app.use('fn1', fn1)
   *
   * @example <caption>Define handler with middleware for rpc function 'fn2'</caption>
   * app.use('fn2', mw1, mw2, fn2)
   *
   * @example <caption>Using destructuring define handlers for rpc functions 'fn1' and 'fn2'</caption>
   * app.use({ fn1, fn2 })
   *
   * @example <caption>Using destructuring define handlers for rpc functions 'fn1' and 'fn2'</caption>
   * // fn2 has middleware mw1 and mw2
   * app.use({ fn1, fn2: [mw1, mw2, fn2] })
   */
  use (name, ...fns) {
    if (_.isPlainObject(name)) {
      for (var prop in name) {
        if (name.hasOwnProperty(prop)) {
          const mw = name[prop]
          if (_.isFunction(mw)) {
            this.use(prop, mw)
          } else if (_.isArray(mw)) {
            this.use(prop, ...mw)
          } else {
            throw new TypeError(`Handler for ${prop} is not a function or array`)
          }
        }
      }
    } else if (_.isFunction(name)) {
      this.middleware = _.concat(this.middleware, name, fns)
    } else {
      if (this.handlers[name]) {
        throw new Error(String.raw `Handler for ${name} already defined`)
      }
      if (!this.methods[name]) {
        throw new Error(String.raw `Unknown method: ${name}`)
      }
      this.handlers[name] = _.concat(this.middleware, fns)
    }
  }

  callback (descriptor, mw) {
    const fn = compose(mw)
    if (!this.listeners('error').length) this.on('error', this.onerror)

    const app = this
    return (call, callback) => {
      return run({ call, callback, descriptor, app }, fn)
    }
  }

  /**
   * Default error handler.
   *
   * @param {Error} err
   */
  onerror (err, ctx) {
    assert(err instanceof Error, `non-error thrown: ${err}`)

    if (this.silent) return

    const msg = err.stack || err.toString()
    console.error()
    console.error(msg.replace(/^/gm, '  '))
    console.error()
  }

  /**
   * Start the service. All middleware and handlers have to be set up prior to calling <code>start</code>.
   * @param {String} port - The hostport for the service
   * @param {Object} creds - Credentials options. Default: <code>grpc.ServerCredentials.createInsecure()</code>
   * @return {Object} server - The <code>grpc.Server</code> instance
   * @example
   * app.start('localhost:50051')
   */
  start (port, creds = null) {
    const server = new this.grpc.Server()
    server.tryShutdownAsync = pify(server.tryShutdown)
    if (!creds) {
      creds = this.grpc.ServerCredentials.createInsecure()
    }

    const method = this.load ? 'addProtoService' : 'addService'

    const composed = {}
    _.forOwn(this.handlers, (v, k) => {
      composed[k] = this.callback(this.methods[k], v)
    })

    server[method](this.service, composed)
    server.bind(port, creds)

    server.start()
    this.servers.push(server)
    return server
  }

  /**
   * Close the service(s).
   * @example
   * app.close()
   */
  close () {
    return pMap(this.servers, s => s.tryShutdownAsync())
  }

  /**
   * Return JSON representation.
   * We only bother showing settings.
   *
   * @return {Object}
   * @api public
   */

  toJSON () {
    const own = Object.getOwnPropertyNames(this)
    const props = _.pull(own, ...REMOVE_PROPS, ...EE_PROPS)
    return _.pick(this, props)
  }

  /**
   * Inspect implementation.
   * @return {Object}
   */
  inspect () {
    return this.toJSON()
  }

  /**
   * @member {String} name The service name
   * @memberof Mali#
   * @example
   * console.log(app.name) // 'Greeter'
   */

  /**
   * @member {String} env The environment. Taken from <code>process.end.NODE_ENV</code>. Default: <code>development</code>
   * @memberof Mali#
   * @example
   * console.log(app.env) // 'development'
   */

  /**
   * @member {Boolean} silent Whether to log errors in <code>onerror</code>. Default: <code>false</code>
   * @memberof Mali#
   */
}

module.exports = Mali

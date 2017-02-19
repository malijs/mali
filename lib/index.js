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

const REMOVE_PROPS = ['grpc', 'middleware', 'handlers', 'servers', 'load', 'proto', 'services', 'methods']
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
   * @param {String|Object} proto - Path to the protocol buffer definition file
   *                              - Object specifying <code>root</code> directory and <code>file</code> to load
   *                              - The static service proto object itself
   * @param {Object} name - Optional name of the service or an array of names. Otherwise all services are used.
   *                      In case of proto path the name of the service as defined in the proto definition.
   *                      In case of proto object the name of the constructor.
   * @param {Object} options - Options to be passed to <code>grpc.load</code>
   */
  constructor (path, name, options) {
    super()

    this.grpc = grpc
    this.middleware = {} // just the global middleware
    this.handlers = {} // specific middleware and handlers
    this.servers = []

    // app options / settings
    this.context = new Context()
    this.env = process.env.NODE_ENV || 'development'

    if (path) {
      this.init(path, name, options)
    }
  }

  /**
   * Init's the app with the proto. Basically this can be used if you don't have the data at
   * app construction time for some reason.
   * @param {String|Object} proto - Path to the protocol buffer definition file
   *                              - Object specifying <code>root</code> directory and <code>file</code> to load
   *                              - The static service proto object itself
   * @param {Object} name - Optional name of the service or an array of names. Otherwise all services are used.
   *                      In case of proto path the name of the service as defined in the proto definition.
   *                      In case of proto object the name of the constructor.
   * @param {Object} options - Options to be passed to <code>grpc.load</code>
   */
  init (path, name, options) {
    this.name = name
    this.load = _.isString(path) || (_.isObject(path) && path.root && path.file)
    this.proto = this.load ? this.grpc.load(path, options) : path

    this.services = {}
    this.methods = {}
    if (this.load) {
      let descriptor = gi(this.proto)
      if (!descriptor) {
        throw new Error(String.raw `Error parsing protocol buffer`)
      }
      let names = descriptor.serviceNames()
      if (_.isString(name)) {
        names = [name]
      } else if (_.isArray(name)) {
        names = _.intersection(name, names)
      }
      names.forEach(n => {
        const client = descriptor.client(n)
        const service = client ? client.service : null
        if (service) {
          this.services[n] = service
          this.methods[n] = {}
          this.middleware[n] = []
          const methods = descriptor.methods(n)
          methods.forEach(m => {
            this.methods[n][_.camelCase(m.name)] = m
          })
        }
      })
    } else if (_.isObject(this.proto)) {
      let names = _.keys(this.proto)
      if (_.isString(name)) {
        names = [name]
      } else if (_.isArray(name)) {
        names = _.intersection(name, names)
      }

      _.forOwn(this.proto, (v, n) => {
        if (_.isObject(v) && !_.isFunction(v) && names.indexOf(n) >= 0) {
          this.services[n] = v
          this.middleware[n] = []
          this.methods[n] = mu.getMethodDescriptors(v)
        }
      })
    }
  }

  /**
   * Define middleware and handlers
   * @param {String|Object} service name of the service as specified in protocol buffer definition
   *                        name Name of the function as specified in the protocol buffer definition
   *                        or an object of name and handlers
   *                        if service name is given but name is omitted applies middleware to all
   *                        handlers for that service
   *                        if the service name does not match a service name in protocol definition
   *                        and no hanler name is given takes <code>0</code>th service and applies
   *                        middleware to that handler
   * @param {Function|Array} fns - Middleware and/or handler
   *
   * @example <caption>Define handler for rpc function 'fn1'</caption>
   * app.use('fn1', fn1)
   *
   * @example <caption>Define handler with middleware for rpc function 'fn2'</caption>
   * app.use('fn2', mw1, mw2, fn2)
   * 
   * @example <caption>Define handler with middleware for rpc function 'fn2' in service 'Service2'</caption>
   * app.use('Service2', 'fn2', mw1, mw2, fn2)
   *
   * @example <caption>Using destructuring define handlers for rpc functions 'fn1' and 'fn2'</caption>
   * app.use({ fn1, fn2 })
   *
   * @example <caption>Apply middleware to all handers for a service</caption>
   * app.use('Service1', mw1)
   *
   * @example <caption>Using destructuring define handlers for rpc functions 'fn1' and 'fn2'</caption>
   * // fn2 has middleware mw1 and mw2
   * app.use({ MyService: { fn1, fn2: [mw1, mw2, fn2] } })
   *
   * @example <caption>Multiple services using object notation</caption>
   * app.use(mw1) // global for all services
   * app.use('Service1', mw2) // applies to all Service1 handers
   * app.use({
   *   Service1: {
   *     sayGoodbye: handler1, // has mw1, mw2
   *     sayHello: [ mw3, handler2 ] // has mw1, mw2, mw3
   *   },
   *   Service2: {
   *     saySomething: handler3 // only has mw1
   *   }
   * })
   */
  use (service, name, ...fns) {
    if (_.isFunction(service)) {
      _.forOwn(this.middleware, (v, sn) => {
        this.middleware[sn] = _.concat(v, service, fns)
      })
    } else if (_.isPlainObject(service)) {
      const testKey = _.keys(service)[0]
      if (_.isFunction(service[testKey]) || _.isArray(service[testKey])) {
        const serviceName = _.keys(this.services)[0]
        _.forOwn(service, (mw, mwName) => {
          if (_.isFunction(mw)) {
            this.use(serviceName, mwName, mw)
          } else if (_.isArray(mw)) {
            this.use(serviceName, mwName, ...mw)
          } else {
            throw new TypeError(`Handler for ${mwName} is not a function or array`)
          }
        })
      } else if (_.isPlainObject(service[testKey])) {
        _.forOwn(service, (def, serviceName) => {
          _.forOwn(def, (mw, mwName) => {
            if (_.isFunction(mw)) {
              this.use(serviceName, mwName, mw)
            } else if (_.isArray(mw)) {
              this.use(serviceName, mwName, ...mw)
            } else {
              throw new TypeError(`Handler for ${mwName} is not a function or array`)
            }
          })
        })
      } else {
        throw new TypeError(`Invalid type for handler for ${testKey}`)
      }
    } else {
      let serviceName = service
      if (!_.isString(name)) {
        fns.unshift(name)
        const sNames = _.keys(this.services)
        if (sNames.indexOf(service) >= 0) {
          this.middleware[service] = _.concat(this.middleware[service], fns)
          return
        } else {
          name = serviceName
          serviceName = _.keys(this.services)[0]
        }
      }
      if (!this.services[serviceName]) {
        throw new Error(String.raw `Unknown service ${serviceName}`)
      }
      if (!this.handlers[serviceName]) {
        this.handlers[serviceName] = {}
      }
      if (this.handlers[serviceName][name]) {
        throw new Error(String.raw `Handler for ${name} already defined for service ${serviceName}`)
      }
      if (!this.methods[serviceName][name]) {
        throw new Error(String.raw `Unknown method: ${name} for service ${serviceName}`)
      }
      this.handlers[serviceName][name] = _.concat(this.middleware[serviceName], fns)
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

    _.forOwn(this.services, (s, sn) => {
      const composed = {}
      const methods = this.methods[sn]
      const handlers = this.handlers[sn]
      _.forOwn(handlers, (v, k) => {
        composed[k] = this.callback(methods[k], v)
      })
      server[method](s, composed)
    })

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

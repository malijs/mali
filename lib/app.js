const assert = require('assert')
const Emitter = require('events')
const pify = require('pify')
const compose = require('mali-compose')
const grpc = require('grpc')
const gi = require('grpc-inspect')
const pMap = require('p-map')
const pl = require('@grpc/proto-loader')

const _ = require('./lo')
const Context = require('./context')
const { exec } = require('./run')
const mu = require('./utils')
const Request = require('./request')
const Response = require('./response')

const REMOVE_PROPS = [
  'grpc',
  'middleware',
  'handlers',
  'servers',
  'load',
  'proto',
  'services',
  'methods'
]
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
   *                              - Loaded grpc object
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
    this.ports = []
    this.services = {}
    this.methods = {}

    // app options / settings
    this.context = new Context()
    this.env = process.env.NODE_ENV || 'development'

    if (path) {
      this.addService(path, name, options)
    }
  }

  /**
   * Add the service and initialize the app with the proto.
   * Basically this can be used if you don't have the data at app construction time for some reason.
   * This is different with `grpc.Server.addService()`.
   * @param {String|Object} proto - Path to the protocol buffer definition file
   *                              - Object specifying <code>root</code> directory and <code>file</code> to load
   *                              - Loaded grpc object
   *                              - The static service proto object itself
   * @param {Object} name - Optional name of the service or an array of names. Otherwise all services are used.
   *                      In case of proto path the name of the service as defined in the proto definition.
   *                      In case of proto object the name of the constructor.
   * @param {Object} options - Options to be passed to <code>grpc.load</code>
   */
  addService (path, name, options) {
    const load = _.isString(path) || (_.isObject(path) && path.root && path.file)

    let proto = path
    if (load) {
      let protoFilePath = path
      let loadOptions = _.assign({}, options)

      if (_.isObject(path) && path.root && path.file) {
        protoFilePath = path.file
        if (!loadOptions.includeDirs) {
          loadOptions.includeDirs = [path.root]
        }
      }

      const pd = pl.loadSync(protoFilePath, loadOptions)
      proto = grpc.loadPackageDefinition(pd)
    }

    if (load || !mu.isStaticGRPCObject(proto)) {
      let descriptor = gi(proto)
      let names = descriptor.serviceNames()
      if (_.isString(name)) {
        names = [name]
      } else if (_.isArray(name)) {
        names = _.intersection(name, names)
      }

      names.forEach(n => {
        const client = descriptor.client(n)
        const service = client && client.service ? client.service : client
        if (service) {
          this.services[n] = service
          this.middleware[n] = []
          this.methods[n] = mu.getMethodDescriptorsLoad(n, service, descriptor)
        }
      })
    } else if (_.isObject(proto)) {
      let names = _.keys(proto)
      if (_.isString(name)) {
        names = [name]
      } else if (_.isArray(name)) {
        names = _.intersection(name, names)
      }

      _.forOwn(proto, (v, n) => {
        if (_.isObject(v) && !_.isFunction(v) && names.indexOf(n) >= 0) {
          this.services[n] = v
          this.middleware[n] = []
          this.methods[n] = mu.getMethodDescriptorsProto(n, v)
        }
      })
    }

    if (!this.name) {
      if (name && _.isString(name)) {
        this.name = name
      } else {
        this.name = _.keys(this.services)[0]
      }
    }
  }

  /**
   * Define middleware and handlers.
   * If <code>service</code> and name are given applies fns for that call under that service.
   * If <code>service</code> name is provided and matches one of the services defined in proto,
   * but no </code>name</code> is provided applies the fns as service level middleware
   * for all handlers in that service.
   * If <code>service</code> is provided and no <code>name</code> is provided, and service does not
   * match any of the service names in the proto, assumes <code>service</code> is actually rpc call
   * name. Uses <code>0</code>th property in internal services object. Useful for protos with only
   * one service.
   * If an <code>object</code> is provided, you can set middleware and handlers for all services.
   * If <code>object</code> provided but <code>0</code>th key does not match any of the services in
   * proto, we try to match the key to one of the rpc function names in one of the services.
   * If we can't find the matching rpc function name just tries the `0`th service name.
   * @param {String|Object} service Service name
   * @param {String|Function} name RPC name
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
   * @example <caption>Apply middleware to all handlers for a service</caption>
   * app.use('Service1', mw1)
   *
   * @example <caption>Using destructuring define handlers for rpc functions 'fn1' and 'fn2'</caption>
   * // fn2 has middleware mw1 and mw2
   * app.use({ MyService: { fn1, fn2: [mw1, mw2, fn2] } })
   *
   * @example <caption>Multiple services using object notation</caption>
   * app.use(mw1) // global for all services
   * app.use('Service1', mw2) // applies to all Service1 handlers
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
        if (_.isFunction(name)) {
          this.middleware[sn] = _.concat(v, service, name, fns)
        } else {
          this.middleware[sn] = _.concat(v, service, fns)
        }
      })
    } else if (_.isPlainObject(service)) {
      const testKey = _.keys(service)[0]
      if (_.isFunction(service[testKey]) || _.isArray(service[testKey])) {
        _.forOwn(service, (mw, mwName) => {
          let serviceName
          _.forOwn(this.services, (sd, sn) => {
            if (!serviceName) {
              const serviceFunctions = _.keys(sd).map(f => f.toLowerCase())
              if (serviceFunctions.indexOf(mwName.toLowerCase()) >= 0) {
                serviceName = sn
              }
            }
          })
          if (!serviceName) {
            serviceName = _.keys(this.services)[0]
          }

          if (_.isFunction(mw)) {
            this.use(serviceName, mwName, mw)
          } else {
            this.use(serviceName, mwName, ...mw)
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
        throw new Error(String.raw`Unknown service ${serviceName}`)
      }

      if (!this.handlers[serviceName]) {
        this.handlers[serviceName] = {}
      }

      if (this.handlers[serviceName][name]) {
        throw new Error(String.raw`Handler for ${name} already defined for service ${serviceName}`)
      }

      if (!this.methods[serviceName][name]) {
        throw new Error(String.raw`Unknown method: ${name} for service ${serviceName}`)
      }

      this.handlers[serviceName][name] = _.concat(this.middleware[serviceName], fns)
    }
  }

  callback (descriptor, mw) {
    const handler = compose(mw)
    if (!this.listeners('error').length) this.on('error', this.onerror)

    return (call, callback) => {
      const context = this._createContext(call, descriptor)
      return exec(context, handler, callback)
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
   * Throws in case we fail to bind to the given port.
   * @param {String} port - The hostport for the service. Default: <code>127.0.0.1:0</code>
   * @param {Object} creds - Credentials options. Default: <code>grpc.ServerCredentials.createInsecure()</code>
   * @param {Object} options - The start options to be passed to `grpc.Server` constructor.
   * @return {Object} server - The <code>grpc.Server</code> instance
   * @example
   * app.start('localhost:50051')
   * @example <caption>Start same app on multiple ports</caption>
   * app.start('127.0.0.1:50050')
   * app.start('127.0.0.1:50051')
   */
  start (port, creds, options) {
    if (_.isObject(port)) {
      if (_.isObject(creds)) {
        options = creds
      }
      creds = port
      port = null
    }

    if (!port || !_.isString(port) || (_.isString(port) && port.length === 0)) {
      port = '127.0.0.1:0'
    }

    if (!creds || !_.isObject(creds)) {
      creds = this.grpc.ServerCredentials.createInsecure()
    }

    const server = new this.grpc.Server(options)

    server.tryShutdownAsync = pify(server.tryShutdown)

    _.forOwn(this.services, (s, sn) => {
      const composed = {}
      const methods = this.methods[sn]
      const handlers = this.handlers[sn]
      if (handlers) {
        _.forOwn(handlers, (v, k) => {
          composed[k] = this.callback(methods[k], v)
        })
        server.addService(s, composed)
      }
    })

    const bound = server.bind(port, creds)
    if (!bound) {
      throw new Error(`Failed to bind to port: ${port}`)
    }

    this.ports.push(bound)

    server.start()
    this.servers.push({
      server,
      port
    })
    return server
  }

  /**
   * Close the service(s).
   * @example
   * app.close()
   */
  close () {
    return pMap(this.servers, s => s.server.tryShutdownAsync())
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
   * @member {String} name The service name.
   *                       If multiple services are initialized, this will be equal to the first service loaded.
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
   * @member {Array} ports The ports of the started service(s)
   * @memberof Mali#
   * @example
   * console.log(app.ports) // [ 52239 ]
   */

  /**
   * @member {Boolean} silent Whether to log errors in <code>onerror</code>. Default: <code>false</code>
   * @memberof Mali#
   */

  /*!
   * Internal create context
   */
  _createContext (call, descriptor) {
    const type = mu.getCallTypeFromCall(call) || mu.getCallTypeFromDescriptor(descriptor)
    const { name, fullName, service } = descriptor
    const pkgName = descriptor.package
    const context = new Context()
    Object.assign(context, this.context)
    context.request = new Request(call, type)
    context.response = new Response(call, type)
    Object.assign(context, { name, fullName, service, app: this, package: pkgName })
    return context
  }
}

module.exports = Mali

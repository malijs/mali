const util = require('util')
const assert = require('assert')
const Emitter = require('events')
const compose = require('@malijs/compose')
const grpc = require('grpc')
const pMap = require('p-map')

const _ = require('./lo')
const Context = require('./context')
const { exec } = require('./run')
const mu = require('./utils')
const Request = require('./request')
const Response = require('./response')

const REMOVE_PROPS = [
  'grpc',
  'servers',
  'load',
  'proto',
  'data'
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
   * @param {String|Object} proto - Optional path to the protocol buffer definition file
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
    this.servers = []
    this.ports = []

    this.data = {}

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
   * This is different than `grpc.Server.addService()`.
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
      const loadOptions = _.assign({}, options)

      if (_.isObject(path) && path.root && path.file) {
        protoFilePath = path.file
        if (!loadOptions.includeDirs) {
          loadOptions.includeDirs = [path.root]
        }
      }

      const pl = require('@grpc/proto-loader')
      const pd = pl.loadSync(protoFilePath, loadOptions)
      proto = grpc.loadPackageDefinition(pd)
    }

    const data = mu.getServiceDefintions(proto)

    if (!name) {
      name = _.keys(data)
    } else if (_.isString(name)) {
      name = [name]
    }

    const picked = {}
    _.forOwn(data, (v, k) => {
      if (name.indexOf(k) >= 0 || name.indexOf(v.shortServiceName) >= 0) {
        picked[k] = v
      }
    })

    _.forOwn(picked, (v, k) => {
      v.middleware = []
      v.handlers = {}
      _.forOwn(v.methods, (method, methodName) => {
        v.handlers[methodName] = null
      })
    })

    this.data = _.assign(this.data, picked)

    if (!this.name) {
      if (Array.isArray(name)) {
        this.name = name[0]
      }
    }
  }

  /**
   * Define middleware and handlers.
   * @param {String|Object} service Service name
   * @param {String|Function} name RPC name
   * @param {Function|Array} fns - Middleware and/or handler
   *
   * @example <caption>Define handler for RPC function 'getUser' in first service we find that has that call name.</caption>
   * app.use('getUser', getUser)
   *
   * @example <caption>Define handler with middleware for RPC function 'getUser' in first service we find that has that call name.</caption>
   * app.use('getUser', mw1, mw2, getUser)
   *
   * @example <caption>Define handler with middleware for RPC function 'getUser' in service 'MyService'. We pick first service that matches the name.</caption>
   * app.use('MyService', 'getUser', mw1, mw2, getUser)
   *
   * @example <caption>Define handler with middleware for rpc function 'getUser' in service 'MyService' with full package name.</caption>
   * app.use('myorg.myapi.v1.MyService', 'getUser', mw1, mw2, getUser)
   *
   * @example <caption>Using destructuring define handlers for rpc functions 'getUser' and 'deleteUser'. Here we would match the first service that has a `getUser` RPC method.</caption>
   * app.use({ getUser, deleteUser })
   *
   * @example <caption>Apply middleware to all handlers for a given service. We match first service that has the given name.</caption>
   * app.use('MyService', mw1)
   *
   * @example <caption>Apply middleware to all handlers for a given service using full namespaced package name.</caption>
   * app.use('myorg.myapi.v1.MyService', mw1)
   *
   * @example <caption>Using destructuring define handlers for RPC functions 'getUser' and 'deleteUser'. We match first service that has the given name.</caption>
   * // deleteUser has middleware mw1 and mw2
   * app.use({ MyService: { getUser, deleteUser: [mw1, mw2, deleteUser] } })
   *
   * @example <caption>Using destructuring define handlers for RPC functions 'getUser' and 'deleteUser'.</caption>
   * // deleteUser has middleware mw1 and mw2
   * app.use({ 'myorg.myapi.v1.MyService': { getUser, deleteUser: [mw1, mw2, deleteUser] } })
   *
   * @example <caption>Multiple services using object notation.</caption>
   * app.use(mw1) // global for all services
   * app.use('MyService', mw2) // applies to first matched service named 'MyService'
   * app.use({
   *   'myorg.myapi.v1.MyService': { // matches MyService
   *     sayGoodbye: handler1, // has mw1, mw2
   *     sayHello: [ mw3, handler2 ] // has mw1, mw2, mw3
   *   },
   *   'myorg.myapi.v1.MyOtherService': {
   *     saySomething: handler3 // only has mw1
   *   }
   * })
   */
  use (service, name, ...fns) {
    if (_.isFunction(service)) {
      // service is a function
      // apply global middlware

      _.forOwn(this.data, (sd, sn) => {
        if (_.isFunction(name)) { // make sure name is given and is also a function
          sd.middleware = _.concat(sd.middleware, service, name, fns)
        } else {
          sd.middleware = _.concat(sd.middleware, service, fns)
        }
      })
    } else if (_.isPlainObject(service)) {
      // we have object notation
      const testKey = _.keys(service)[0]
      if (_.isFunction(service[testKey]) || _.isArray(service[testKey])) {
        // first property of object is a function or array
        // that means we have service-level middleware of RPC handlers

        _.forOwn(service, (val, key) => {
          // lets try to match the key to any service name first
          const serviceName = this._getMatchingServiceName(key)

          if (serviceName) {
            // we have a matching service
            // lets add service-level middleware to that service
            const sd = this.data[serviceName]
            sd.middleware = _.concat(sd.middleware, val)
          } else {
            // we need to find the matching function to set it as handler
            const { serviceName, methodName } = this._getMatchingCall(key)

            if (serviceName && methodName) {
              if (_.isFunction(val)) {
                this.use(serviceName, methodName, val)
              } else {
                this.use(serviceName, methodName, ...val)
              }
            } else {
              throw new TypeError(`Unknown method: ${key}`)
            }
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
      if (!_.isString(name)) {
        // name is a function pre-pand it to fns
        fns.unshift(name)

        // service param can either be a service name or a function name
        // first lets try to match a service

        const serviceName = this._getMatchingServiceName(service)
        if (serviceName) {
          // we have a matching service
          // lets add service-level middleware to that service
          const sd = this.data[serviceName]
          sd.middleware = _.concat(sd.middleware, fns)

          return
        } else {
          // service param is a function name
          // lets try to find the matching call and service

          const { serviceName, methodName } = this._getMatchingCall(service)
          if (!serviceName || !methodName) {
            throw new Error(`Unknown identifier: ${service}`)
          }

          this.use(serviceName, methodName, ...fns)

          return
        }
      }

      // we have a string service, and string name

      const serviceName = this._getMatchingServiceName(service)

      if (!serviceName) {
        throw new Error(`Unknown service ${service}`)
      }

      const sd = this.data[serviceName]

      let methodName

      _.forOwn(sd.methods, (h, hName) => {
        if (!methodName && this._matchesHandlerName(h, hName, name)) {
          methodName = hName
        }
      })

      if (!methodName) {
        throw new Error(`Unknown method ${name} for service ${serviceName}`)
      }

      if (sd.handlers[methodName]) {
        throw new Error(`Handler for ${name} already defined for service ${serviceName}`)
      }

      sd.handlers[methodName] = _.concat(sd.middleware, fns)
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

    server.tryShutdownAsync = util.promisify(server.tryShutdown)

    _.forOwn(this.data, (sd, sn) => {
      const composed = {}
      const { methods, handlers } = sd

      let handlerValues = _.values(handlers)
      handlerValues = _.compact(handlerValues)
      const hasHandlers = handlerValues && handlerValues.length

      if (handlers && hasHandlers) {
        _.forOwn(handlers, (v, k) => {
          if (!v) {
            return
          }

          const md = methods[k]
          const shortComposedKey = md.originalName || _.camelCase(md.name)

          composed[shortComposedKey] = this.callback(methods[k], v)
        })

        server.addService(sd.service, composed)
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
  [util.inspect.custom] (depth, options) {
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
   * @member {Boolean} silent Whether to supress logging errors in <code>onerror</code>. Default: <code>false</code>, that is errors will be logged to `stderr`.
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
    Object.assign(context, {
      name,
      fullName,
      service,
      app: this,
      package: pkgName,
      locals: {} // set fresh locals
    })

    return context
  }

  /*!
   * gets matching service name
   */
  _getMatchingServiceName (key) {
    let serviceName
    if (key.indexOf('.') > 0) {
      // we have full path

      if (this.data[key]) {
        serviceName = key
      }
    } else {
      _.forOwn(this.data, (sd, sn) => {
        if (!serviceName && (sn === key || sn.endsWith('.' + key))) {
          serviceName = sn
        }
      })
    }

    return serviceName
  }

  /*!
   * gets matching service name and method name
   */
  _getMatchingCall (key) {
    // we need to find the matching function to set it as handler
    let methodName
    let serviceName

    _.forOwn(this.data, (sd, sn) => {
      if (!methodName) {
        _.forOwn(sd.methods, (h, hName) => {
          if (!methodName && this._matchesHandlerName(h, hName, key)) {
            methodName = key
            serviceName = sn
          }
        })
      }
    })

    return { serviceName, methodName }
  }

  /*!
   * gets matching service name and method name
   */
  _matchesHandlerName (handlerObj, handlerName, testValue) {
    return handlerName === testValue ||
      handlerName.endsWith('/' + testValue) ||
      (handlerObj && handlerObj.originalName === testValue) ||
      (handlerObj && handlerObj.name === testValue) ||
      (handlerObj && _.camelCase(handlerObj.name) === _.camelCase(testValue))
  }
}

module.exports = Mali

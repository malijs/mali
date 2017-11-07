const delegate = require('delegates')

/**
 * @name Context
 * @class
 * @global
 * @classdesc Represents the application context
 */

/**
 * The call function name.
 * @member {String} name
 * @memberof Context#
 * @example
 * console.log(ctx.name) // 'SayHello'
 */

/**
 * The full name of the call.
 * @member {String} fullName
 * @memberof Context#
 * @example
 * console.log(ctx.fullName) // '/helloworld.Greeter/SayHello'
 */

/**
 * The service name of the call.
 * @member {String} service
 * @memberof Context#
 * @example
 * console.log(ctx.service) // 'Greeter'
 */

/**
 * The package name of the call.
 * @member {String} package
 * @memberof Context#
 * @example
 * console.log(ctx.package) // 'helloworld'
 */

/**
 * The call type. One of <code>CallType</code> enums.
 * @member {String} type
 * @memberof Context#
 * @example
 * console.log(ctx.type) // 'unary'
 *
 * @example
 * if(ctx.type === CallType.DUPLEX) {
 *   console.log('Duplex stream call')
 * }
 */

/**
 * The call metadata if present.
 * @member {Object} metadata
 * @memberof Context#
 * @example
 * console.log(ctx.metadata)
 * // { 'user-agent': 'grpc-node/1.0.1 grpc-c/1.0.1 (osx; chttp2)' }
 */

/**
 * The application instance reference.
 * @member {Object} app
 * @memberof Context#
 */

/**
 * The internal gRPC call instance reference.
 * This is an alias to `ctx.request.call`.
 * @member {Object} call
 * @memberof Context#
 */

/**
 * Represents a RPC call context.
 * @example
 * async function toUpper(ctx) {
 *   console.log(ctx.type) // logs the type
 *   ctx.res = { message: ctx.req.message.toUpperCase() }
 * }
 */

/**
 * The call's Mali Request object.
 * @member {Object} request
 * @memberof Context#
 */

/**
 * The call's Mali Response object.
 * @member {Object} response
 * @memberof Context#
 */

/**
 * The call request object or stream. This is an alias to `ctx.request.res`.
 * @member {Object|Stream} req
 * @memberof Context#
 * @example
 * console.dir(ctx.req) // { name: 'Bob' }
 */

/**
 * The call's type. One of `mali-call-types` enums.
 * This is an alias to `ctx.request.type`.
 * @member {String} type
 * @memberof Context#
 * @example
 * console.log(ctx.type) // 'unary'
 */

/**
 * The call's request metadata plain object.
 * This is an alias to `ctx.request.metadata`.
 * @member {String} metadata
 * @memberof Context#
 * @example
 * console.dir(ctx.metadata) // { foo: 'bar' }
 */

/**
 * Get request metadata value
 * This is an alias to `ctx.request.get()`.
 * @member {Function} get
 * @memberof Context#
 * @example
 * console.log(ctx.get('foo')) // 'bar'
 */

/**
 * The response object or stream. Should be set in handler.
 * This is an alias to `ctx.response.res`.
 * @member {Object|Stream} res
 * @memberof Context#
 * @example
 * ctx.res = { name: 'Bob' }
 */

/**
 * Send response header metadata.
 * This is an alias to `ctx.response.sendMetadata()`.
 * @member {Function} sendMetadata
 * @memberof Context#
 * @example
 * ctx.sendMetadata()
 */

/**
 * Set response header metadata value.
 * This is an alias to `ctx.response.set()`.
 * @member {Function} set
 * @memberof Context#
 * @example <caption>Using string field name and value</caption>
 * ctx.set('foo', 'bar')
 * @example <caption>Using object</caption>
 * ctx.set({
 *   foo: 'bar'
 * })
 */

/**
 * Get response status / trailer metadata value.
 * This is an alias to `ctx.response.getStatus()`.
 * @member {Function} getStatus
 * @memberof Context#
 * console.log(ctx.getStatus('foo')) // 'bar'
 */

/**
 * Set response status / trailer metadata value.
 * This is an alias to `ctx.response.setStatus()`.
 * @member {Function} setStatus
 * @memberof Context#
 * @example <caption>Using string field name and value</caption>
 * ctx.setStatus('foo', 'bar')
 * @example <caption>Using object</caption>
 * ctx.setStatus({
 *   foo: 'bar'
 * })
 */

class Context {}

delegate(Context.prototype, 'request')
  .access('req')
  .access('type')
  .getter('call')
  .getter('metadata')
  .method('get')

delegate(Context.prototype, 'response')
  .access('res')
  .method('sendMetadata')
  .method('set')
  .method('getStatus')
  .method('setStatus')

module.exports = Context

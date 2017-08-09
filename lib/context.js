const grpc = require('grpc')
const _ = require('./lo')

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
 * The request object or stream.
 * @member {Object|Stream} req
 * @memberof Context#
 * @example
 * console.dir(ctx.req) // { name: 'Bob' }
 */

/**
 * The response object or stream. Should be set in handler.
 * @member {Object|Stream} res
 * @memberof Context#
 * @example
 * ctx.res = { name: 'Bob' }
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
class Context {
  /**
   * Context constructor. Clients do not need to call this.
   */
  constructor (d) {
    _.forOwn(d, (v, k) => { this[k] = v })

    if (this.metadata instanceof grpc.Metadata) {
      this.metadata = this.metadata.getMap()
    }
  }
}

module.exports = Context

const _ = require('lodash')
const grpc = require('grpc')

/**
 * @member {String} name The call function name.
 * @memberof Context#
 * @example
 * console.log(ctx.name) // 'SayHello'
 */

/**
 * @member {String} type The call type. One of <code>CallType</code> enums.
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
 * @member {Object|Stream} req The request object or stream.
 * @memberof Context#
 * @example
 * console.dir(ctx.req) // { name: 'Bob' }
 */

/**
 * @member {Object|Stream} res The response object or stream.
 *                             Should be set in handler.
 * @memberof Context#
 * @example
 * ctx.res = { name: 'Bob' }
 */

/**
 * @member {Object} metadata The call metadata if present.
 * @memberof Context#
 * console.log(ctx.metadata)
 * // { 'user-agent': 'grpc-node/1.0.1 grpc-c/1.0.1 (osx; chttp2)' }
 */

/**
 * @member {Object} app The application instance reference.
 * @memberof Context#
 */

/**
 * @member {Object} call The internal gRPC call instance reference.
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

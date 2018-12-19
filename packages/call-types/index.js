const UNARY = 'unary'
const REQUEST_STREAM = 'request_stream'
const RESPONSE_STREAM = 'response_stream'
const DUPLEX = 'duplex'

/**
 * @module mali-call-types
 *
 * @example
 * const CallType = require('mali-call-types')
 * console.log(CallType.DUPLEX)
 *
 * @example <caption>Within Mali call handler</caption>
 * if(ctx.type === CallType.UNARY) {
 *   console.log('Unary call')
 * }
 */

module.exports = {
  /**
     * Enum for call type
     * @readonly
     * @enum {string}
     */

  /** Unary call */
  UNARY,
  /** Request is a stream */
  REQUEST_STREAM,
  /** Response is a stream */
  RESPONSE_STREAM,
  /** Duplex call where both request and response are streams */
  DUPLEX
}

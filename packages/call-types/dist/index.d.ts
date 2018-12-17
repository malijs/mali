/**
 * @module mali-call-types
 *
 * @example
 * const { CallType } = require('@malijs/call-types')
 * console.log(CallType.DUPLEX)
 * // "duplex"
 *
 * @example <caption>Within Mali call handler</caption>
 * if (ctx.type === CallType.UNARY) {
 *   console.log('Unary call')
 * }
 */
export declare enum CallType {
    /**
     * Enum for call type
     * @readonly
     * @enum {string}
     */
    /** Unary call */
    UNARY = "unary",
    /** Request streming call */
    REQUEST_STREAM = "request_stream",
    /** Response streming call */
    RESPONSE_STREAM = "response_stream",
    /** Duplex / bi-directional streaming call */
    DUPLEX = "duplex"
}

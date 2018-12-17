"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
var CallType;
(function (CallType) {
    /**
     * Enum for call type
     * @readonly
     * @enum {string}
     */
    /** Unary call */
    CallType["UNARY"] = "unary";
    /** Request streming call */
    CallType["REQUEST_STREAM"] = "request_stream";
    /** Response streming call */
    CallType["RESPONSE_STREAM"] = "response_stream";
    /** Duplex / bi-directional streaming call */
    CallType["DUPLEX"] = "duplex";
})(CallType = exports.CallType || (exports.CallType = {}));

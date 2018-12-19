const grpc = require('grpc')
const CallType = require('mali-call-types')
const create = require('grpc-create-metadata')

const _ = require('./lo')

/**
 * Mali Response class that encapsulates the response of a call.
 * Clients to not create this. Mali does it for us.
 */
class Response {
  /**
   * Creates a Mali Response instance
   * @param {Object} call the grpc call instance
   * @param {String} type the call type. one of `mali-call-types` enums.
   */
  constructor (call, type) {
    this.call = call
    this.type = type

    if (type === CallType.DUPLEX) {
      this.res = call
    }
  }

  /**
   * Sets specific response header metadata field value
   * @param {String|Object} field the metadata field name or object for metadata
   * @param {*} val the value of the field
   * @example <caption>Using string field name and value</caption>
   * ctx.response.set('foo', 'bar')
   * @example <caption>Using object</caption>
   * ctx.response.set({
   *   foo: 'bar'
   * })
   */
  set (field, val) {
    if (arguments.length === 2) {
      if (!this.metadata) {
        this.metadata = {}
      }
      this.metadata[field] = val
    } else {
      const md = field instanceof grpc.Metadata ? field.getMap() : field

      if (_.isObject(md)) {
        for (const key in md) {
          this.set(key, md[key])
        }
      }
    }
  }

  /**
   * Gets the response header metadata value
   * @param {String} field the field name
   * @return {*} the metadata field value
   * @example
   * console.log(ctx.response.get('foo')) // 'bar'
   */
  get (field) {
    let val
    if (this.metadata) {
      val = this.metadata[field]
    }
    return val
  }

  /**
   * Gets the response metadata as a `grpc.Metadata` object instance
   * @return {Object} response metadata
   */
  getMetadata () {
    return create(this.metadata)
  }

  /**
   * Sends the response header metadata. Optionally (re)sets the header metadata as well.
   * @param {Object} md optional header metadata object to set into the request before sending
   *                    if there is existing metadata in the response it is cleared
   *                    if param is not provided `sendMetadata` sends the existing metadata in the response
   * @example <caption>Set and send</caption>
   * ctx.response.sendMetadata({
   *   foo: 'bar'
   * })
   * @example <caption>Set and send later</caption>
   * ctx.response.set('foo', 'bar')
   * // ... later
   * ctx.response.sendMetadata()
   */
  sendMetadata (md) {
    // if forcing send reset our metadata
    if (md && (_.isObject(md) || md instanceof grpc.Metadata)) {
      this.metadata = null
      this.set(md)
    }

    const data = this.getMetadata()
    if (data) {
      this.call.sendMetadata(data)
    }
  }

  /**
   * Gets the response status / trailer metadata value
   * @param {String} field the field name
   * @return {*} the metadata field value
   * @example
   * console.log(ctx.response.getStatus('bar')) // 'baz'
   */
  getStatus (field) {
    let val
    if (this.status) {
      val = this.status[field]
    }
    return val
  }

  /**
   * Sets specific response status / trailer metadata field value
   * @param {String|Object} field the metadata field name or object for metadata
   * @param {*} val the value of the field
   * @example <caption>Using string field name and value</caption>
   * ctx.response.setStatus('foo', 'bar')
   * @example <caption>Using object</caption>
   * ctx.response.setStatus({
   *   foo: 'bar'
   * })
   */
  setStatus (field, val) {
    if (arguments.length === 2) {
      if (!this.status) {
        this.status = {}
      }
      this.status[field] = val
    } else {
      const md = field instanceof grpc.Metadata ? field.getMap() : field

      if (_.isObject(md)) {
        for (const key in md) {
          this.setStatus(key, md[key])
        }
      }
    }
  }

  /**
   * Gets the response status / trailer metadata as a `grpc.Metadata` object instance
   * @return {Object} response status / trailer metadata
   */
  getStatusMetadata () {
    return create(this.status)
  }
}

/**
 * The internal gRPC call instance reference.
 * @member {Object} call
 * @memberof Response#
 */

/**
 * The call's type. One of `mali-call-types` enums.
 * This will match Request's type.
 * @member {String} type
 * @memberof Response#
 * @example
 * console.log(ctx.response.type) // 'unary'
 */

/**
 * The call's response header metadata plain object if present.
 * @member {Object} metadata
 * @memberof Response#
 * @example
 * ctx.response.set('foo', 'bar')
 * console.log(ctx.response.metadata)  // { 'foo': 'bar' }
 */

/**
 * The call's response trailer / status metadata plain object if present.
 * @member {Object} status
 * @memberof Response#
 * @example
 * ctx.response.setStatus('biz', 'baz')
 * console.log(ctx.response.status) // { biz: 'baz' }
 */

/**
 * The call's response actual payload object / stream.
 * In case of `DUPLEX` call this is automatically set the actual `call` instance.
 * @member {Object|Stream} res
 * @memberof Response#
 * @example <caption>UNARY or REQUEST STREAM calls</caption>
 * ctx.response.res = { foo: 'bar' }
 * @example <caption>RESPONSE STREAM calls</caption>
 * ctx.response.res = createResponseStream()
 * @example <caption>DUPLEX calls</caption>
 * ctx.response.res.write({ foo: 'bar' })
 */

module.exports = Response

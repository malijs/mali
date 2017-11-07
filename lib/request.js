const grpc = require('grpc')
const CallType = require('mali-call-types')
const create = require('grpc-create-metadata')

/**
 * Mali Request class that encasulates the request of a call.
 * Clients to not create this. Mali does it for us.
 */
class Request {
  /**
   * Creates a Mali Request instance
   * @param {Object} call the grpc call instance
   * @param {String} type the call type. one of `mali-call-types` enums.
   */
  constructor (call, type) {
    this.call = call
    this.type = type
    if (call.metadata instanceof grpc.Metadata) {
      this.metadata = call.metadata.getMap()
    } else {
      this.metadata = call.metadata
    }

    if (type === CallType.RESPONSE_STREAM ||
      type === CallType.UNARY) {
      this.req = call.request
    } else {
      this.req = call
    }
  }

  /**
   * Gets the requests metadata as a `grpc.Metadata` object instance
   * @return {Object} request metadata
   */
  getMetadata () {
    return create(this.metadata)
  }

  /**
   * Gets specific request meatadata field value
   * @param {*} field the metadata field name
   * @return {*} the metadata value for the field
   * @example
   * console.log(ctx.request.get('foo')) // 'bar'
   */
  get (field) {
    let val
    if (this.metadata) {
      val = this.metadata[field]
    }
    return val
  }
}

module.exports = Request

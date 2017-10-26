const grpc = require('grpc')
const CallType = require('mali-call-types')
const create = require('grpc-create-metadata')

/**
 * Request class
 */
class Request {
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

  getMetadata () {
    return create(this.metadata)
  }

  get (field) {
    let val
    if (this.metadata) {
      val = this.metadata[field]
    }
    return val
  }
}

module.exports = Request

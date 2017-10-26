const CallType = require('mali-call-types')
const create = require('grpc-create-metadata')

/**
 * Response class
 */
class Response {
  constructor (call, type) {
    this.call = call
    this.type = type

    if (type === CallType.DUPLEX) {
      this.res = call.req
    }
  }

  set (field, val) {
    if (arguments.length === 2) {
      if (!this.metadata) {
        this.metadata = {}
      }
      this.metadata[field] = val
    } else {
      for (const key in field) {
        this.set(key, field[key])
      }
    }
  }

  getMetadata () {
    create(this.metadata)
  }
}

module.exports = Response

const grpc = require('grpc')
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
      this.res = call
    }
  }

  set (field, val) {
    if (arguments.length === 2) {
      if (!this.metadata) {
        this.metadata = {}
      }
      this.metadata[field] = val
    } else {
      const md = field instanceof grpc.Metadata ? field.getMap() : field

      for (const key in md) {
        this.set(key, md[key])
      }
    }
  }

  get (field) {
    let val
    if (this.metadata) {
      val = this.metadata[field]
    }
    return val
  }

  getMetadata () {
    return create(this.metadata)
  }
}

module.exports = Response

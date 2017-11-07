const grpc = require('grpc')
const CallType = require('mali-call-types')
const create = require('grpc-create-metadata')

const _ = require('./lo')

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

      if (_.isObject(md)) {
        for (const key in md) {
          this.set(key, md[key])
        }
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

  sendMetadata (md) {
    // if forcing send reset our metadata
    if (md && (_.isObject(md) || md instanceof grpc.Metadata)) {
      this.metadata = null
    }
    this.set(md)

    const data = this.getMetadata()
    if (data) {
      this.call.sendMetadata(data)
    }
  }

  getStatus (field) {
    let val
    if (this.status) {
      val = this.status[field]
    }
    return val
  }

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

  getStatusMetadata () {
    return create(this.status)
  }
}

module.exports = Response

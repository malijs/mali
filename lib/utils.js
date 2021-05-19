const traverse = require('traverse')
const CallType = require('@malijs/call-types')

const _ = require('./lo')

const METHOD_PROPS = ['name', 'options', 'type', 'requestStream', 'responseStream',
  'requestName', 'responseName', 'path', 'requestType', 'responseType', 'originalName']

function getCallTypeFromCall (call) {
  const callPrototype = Object.getPrototypeOf(call)
  if (callPrototype && callPrototype.constructor && callPrototype.constructor.name) {
    const ctorName = callPrototype.constructor.name
    if (ctorName.indexOf('ServerUnaryCall') === 0) {
      return CallType.UNARY
    } else if (ctorName.indexOf('ServerWritableStream') === 0) {
      return CallType.RESPONSE_STREAM
    } else if (ctorName.indexOf('ServerReadableStream') === 0) {
      return CallType.REQUEST_STREAM
    } else if (ctorName.indexOf('ServerDuplexStream') === 0) {
      return CallType.DUPLEX
    }
  }
}

function getCallTypeFromDescriptor (descriptor) {
  if (!descriptor.requestStream && !descriptor.responseStream) {
    return CallType.UNARY
  } else if (!descriptor.requestStream && descriptor.responseStream) {
    return CallType.RESPONSE_STREAM
  } else if (descriptor.requestStream && !descriptor.responseStream) {
    return CallType.REQUEST_STREAM
  } else {
    return CallType.DUPLEX
  }
}

function getServiceDefintions (proto) {
  const services = {}

  traverse(proto).forEach(function (v) {
    if (isService(v)) {
      const srviceObj = v.service || v
      const vKeys = Object.keys(srviceObj)
      const name = getServiceNameFromPath(srviceObj[vKeys[0]].path)

      if (services[name]) {
        return
      }

      const shortServiceName = getShortServiceNameFromPath(srviceObj[vKeys[0]].path)

      services[name] = {
        shortServiceName: shortServiceName,
        fullServiceName: name,
        service: srviceObj
      }

      const methods = {}
      _.forOwn(srviceObj, (m, k) => {
        methods[m.path] = METHOD_PROPS.reduce((acc, method) => {
          if (method !== 'name') {
            acc[method] = m[method]
          }
          return acc
        }, {
          name: getMethodNameFromPath(m.path),
          fullName: m.path,
          package: getPackageNameFromPath(m.path),
          service: shortServiceName
        })
      })

      services[name].methods = methods
    } else if (v && v.type) {
      this.update(v, true)
    }
  })

  return services
}

function getServiceNameFromPath (path) {
  const parts = path.split('/')
  return parts[1]
}

function getMethodNameFromPath (path) {
  const parts = path.split('/')
  return parts[parts.length - 1]
}

function getPackageNameFromPath (path) {
  const sName = getServiceNameFromPath(path)
  if (sName.indexOf('.') === -1) {
    return ''
  }

  const parts = sName.split('.')
  parts.pop()
  return parts.join('.')
}

function getShortServiceNameFromPath (path) {
  const sName = getServiceNameFromPath(path)
  if (sName.indexOf('.') === -1) {
    return sName
  }

  const parts = sName.split('.')
  return parts.pop()
}

function isService (v) {
  if (v && v.service) {
    const vKeys = Object.keys(v.service)

    return vKeys && vKeys.length && v.service[vKeys[0]] && v.service[vKeys[0]].path &&
      _.isString(v.service[vKeys[0]].path) && v.service[vKeys[0]].path[0] === '/'
  } else if (v) {
    const vKeys = Object.keys(v)

    return vKeys && vKeys.length && v[vKeys[0]] && v[vKeys[0]].path &&
      _.isString(v[vKeys[0]].path) && v[vKeys[0]].path[0] === '/'
  }

  return false
}

module.exports = {
  getCallTypeFromCall,
  getCallTypeFromDescriptor,
  getServiceDefintions,
  getServiceNameFromPath,
  getMethodNameFromPath,
  getPackageNameFromPath,
  getShortServiceNameFromPath
}

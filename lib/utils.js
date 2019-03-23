const traverse = require('traverse')
const CallType = require('@malijs/call-types')

const _ = require('./lo')

const METHOD_PROPS = ['name', 'options', 'type', 'requestStream', 'responseStream',
  'requestName', 'responseName', 'path', 'requestType', 'responseType', 'originalName']

function getCallTypeFromCall (call) {
  const callPrototype = Object.getPrototypeOf(call)
  if (callPrototype && callPrototype.constructor && callPrototype.constructor.name) {
    const ctorName = callPrototype.constructor.name
    if (ctorName === 'ServerUnaryCall') {
      return CallType.UNARY
    } else if (ctorName === 'ServerWritableStream') {
      return CallType.RESPONSE_STREAM
    } else if (ctorName === 'ServerReadableStream') {
      return CallType.REQUEST_STREAM
    } else if (ctorName === 'ServerDuplexStream') {
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
      const vKeys = _.keys(srviceObj)
      const name = getServiceNameFromPath(srviceObj[vKeys[0]].path)

      if (services[name]) {
        return
      }

      const shortServiceName = getShortServiceNameFromPath(srviceObj[vKeys[0]].path)

      services[name] = {}
      services[name].shortServiceName = shortServiceName
      services[name].fullServiceName = name
      services[name].service = srviceObj

      const methods = {}
      _.forOwn(srviceObj, (m, k) => {
        methods[m.path] = _.pick(m, METHOD_PROPS)
        methods[m.path].name = getMethodNameFromPath(m.path)
        methods[m.path].fullName = m.path
        methods[m.path].package = getPackageNameFromPath(m.path)
        methods[m.path].service = shortServiceName
      })

      services[name].methods = methods
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
  if (v && v.service && v.super_) {
    const vKeys = _.keys(v.service)

    return vKeys && vKeys.length && v.service[vKeys[0]] && v.service[vKeys[0]].path &&
      _.isString(v.service[vKeys[0]].path) && v.service[vKeys[0]].path[0] === '/'
  } else if (v) {
    const vKeys = _.keys(v)

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

const traverse = require('traverse')
const CallType = require('@malijs/call-types')

const METHOD_PROPS = ['name', 'options', 'type', 'requestStream', 'responseStream',
  'requestName', 'responseName', 'path', 'requestType', 'responseType', 'originalName']

function getCallTypeFromCall (call) {
  const name = Object.getPrototypeOf(call).constructor.name

  if (name.indexOf('ServerUnaryCall') === 0) {
    return CallType.UNARY
  } else if (name.indexOf('ServerWritableStream') === 0) {
    return CallType.RESPONSE_STREAM
  } else if (name.indexOf('ServerReadableStream') === 0) {
    return CallType.REQUEST_STREAM
  } else if (name.indexOf('ServerDuplexStream') === 0) {
    return CallType.DUPLEX
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
        service: srviceObj,
        methods: {}
      }

      for (const k in srviceObj) {
        const m = srviceObj[k]
        services[name].methods[m.path] = METHOD_PROPS.reduce((acc, method) => {
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
      }
    } else if (v && v.type && typeof v.type !== 'object') {
      // Skip children
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

    return vKeys.length > 0 && v.service[vKeys[0]] && v.service[vKeys[0]].path &&
      typeof v.service[vKeys[0]].path === 'string' && v.service[vKeys[0]].path[0] === '/'
  } else if (v) {
    const vKeys = Object.keys(v)

    return vKeys.length > 0 && v[vKeys[0]] && v[vKeys[0]].path &&
      typeof v[vKeys[0]].path === 'string' && v[vKeys[0]].path[0] === '/'
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

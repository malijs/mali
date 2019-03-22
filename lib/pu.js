const traverse = require('traverse')
const _ = require('./lo')

const METHOD_PROPS = ['name', 'options', 'type', 'requestStream', 'responseStream',
  'requestName', 'responseName', 'path', 'requestType', 'responseType', 'originalName']

function getMethods (proto) {
  const methods = {}

  traverse(proto).forEach(function (v) {
    if (isService(v)) {
      _.forOwn(v.service, (m, k) => {
        methods[m.path] = _.pick(m, METHOD_PROPS)
      })
    }
  })

  return methods
}

function getServices (proto) {
  const services = {}

  traverse(proto).forEach(function (v) {
    if (isService(v)) {
      const vKeys = _.keys(v.service)
      const name = getServiceNameFromPath(v.service[vKeys[0]].path)

      if (!services[name]) {
        services[name] = v
      }
    }
  })

  return services
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
  getMethods,
  getServices,
  getServiceDefintions,
  getServiceNameFromPath,
  getMethodNameFromPath,
  getPackageNameFromPath,
  getShortServiceNameFromPath
}

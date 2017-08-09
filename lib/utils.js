const _ = require('./lo')

const PICK_PATHS = [
  'options',
  'name',
  'requestName',
  'responseName',
  'requestStream',
  'responseStream'
]

function actionMapper (action, name) {
  const r = _.pick(action, PICK_PATHS)
  r.name = _.camelCase(name)
  return r
}

function getFullName (packageName, serviceName, name) {
  return '/'.concat(packageName, '.', serviceName, '/', name)
}

function getPackageName (path) {
  if (path && path.indexOf('/') === 0) {
    return path.substring(1, path.indexOf('.'))
  }
  return ''
}

exports.getMethodDescriptorsProto = function (serviceName, service) {
  const r = {}
  let packageName = ''
  _.forOwn(service, (action, name) => {
    if (action && _.isString(action.path)) {
      if (!packageName) {
        packageName = getPackageName(action.path)
      }

      r[name] = actionMapper(action, name)
      r[name].service = serviceName
      if (packageName) {
        r[name].package = packageName
        r[name].fullName = getFullName(packageName, serviceName, name)
      }
    }
  })
  return r
}

exports.getMethodDescriptorsLoad = function (serviceName, service, descriptor) {
  const r = {}
  const methods = descriptor.methods(serviceName)
  const serviceDescriptor = descriptor.service(serviceName)
  let packageName = ''
  if (service && service.parent && service.parent.name) {
    packageName = service.parent.name
  } else if (serviceDescriptor && serviceDescriptor.package) {
    packageName = serviceDescriptor.package
  }

  methods.forEach(m => {
    r[_.camelCase(m.name)] = m
    r[_.camelCase(m.name)].name = _.upperFirst(m.name)
    r[_.camelCase(m.name)].package = packageName
    r[_.camelCase(m.name)].service = serviceName
    r[_.camelCase(m.name)].fullName = getFullName(packageName, serviceName, m.name)
  })

  return r
}

exports.isStaticGRPCObject = function (proto) {
  if (!proto) {
    return false
  }

  const vs = _.values(proto)

  if (!vs || !vs.length) {
    return false
  }

  const t = _.find(vs, v => {
    return v && _.isFunction(v) && v.service
  })

  return Boolean(t)
}

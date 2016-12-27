const _ = require('lodash')

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

exports.getMethodDescriptors = function (service) {
  const r = {}
  _.forOwn(service, (action, name) => {
    if (action && _.isString(action.path)) {
      r[name] = actionMapper(action, name)
    }
  })
  return r
}

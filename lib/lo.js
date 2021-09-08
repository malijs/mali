const pull = require('lodash.pull')
const camelCase = require('lodash.camelcase')

module.exports = {
  pull,
  pick: (original, fields) =>
    fields.reduce((obj, field) => {
      if (original && Object.prototype.hasOwnProperty.call(original, field)) {
        obj[field] = original[field]
      }
      return obj
    }, {}),
  camelCase,
  isObject: (value) => value != null && (typeof value === 'object' || typeof value === 'function')
}

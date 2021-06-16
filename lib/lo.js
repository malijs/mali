const pull = require('lodash.pull')
const pick = require('lodash.pick')
const camelCase = require('lodash.camelcase')

module.exports = {
  pull,
  pick,
  camelCase,
  isObject: (value) => value != null && (typeof value === 'object' || typeof value === 'function')
}

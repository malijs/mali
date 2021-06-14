const forOwn = require('lodash.forown')
const isPlainObject = require('lodash.isplainobject')
const pull = require('lodash.pull')
const pick = require('lodash.pick')
const camelCase = require('lodash.camelcase')

module.exports = {
  forOwn,
  isPlainObject,
  pull,
  pick,
  camelCase,
  assign: Object.assign,
  isObject: (value) => value != null && (typeof value === 'object' || typeof value === 'function'),
  upperFirst: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : '',
  compact: (values) => values.filter(v => !!v)
}

const forOwn = require('lodash.forown')
const concat = require('lodash.concat')
const isPlainObject = require('lodash.isplainobject')
const pull = require('lodash.pull')
const pick = require('lodash.pick')
const camelCase = require('lodash.camelcase')

module.exports = {
  forOwn,
  concat,
  isPlainObject,
  pull,
  pick,
  camelCase,
  isArray: Array.isArray,
  keys: Object.keys,
  assign: Object.assign,
  isString: (value) => typeof value === 'string',
  isObject: (value) => value != null && (typeof value === 'object' || typeof value === 'function'),
  isFunction: (value) => typeof value === 'function',
  upperFirst: (value) => value ? value.charAt(0).toUpperCase() + value.slice(1) : '',
  values: Object.values,
  find: (value, callback) => value.find(callback),
  compact: (values) => values.filter(v => !!v)
}

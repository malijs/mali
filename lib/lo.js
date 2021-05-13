import forOwn from 'lodash.forown'
import concat from 'lodash.concat'
import isPlainObject from 'lodash.isplainobject'
import pull from 'lodash.pull'
import pick from 'lodash.pick'
import camelCase from 'lodash.camelcase'
import compact from 'lodash.compact'

export default {
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
  isObject: (value) =>
    value !== null && ['object', 'function'].includes(typeof value),
  isFunction: (value) => typeof value === 'function',
  upperFirst: (value) => value[0].toUpperCase() + value.slice(1),
  values: (value) => Object.values(value),
  compact,
  isUndefined: (value) => value !== null && typeof value === 'undefined',
}

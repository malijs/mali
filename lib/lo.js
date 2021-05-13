import forOwn from 'lodash.forown'
import intersection from 'lodash.intersection'
import concat from 'lodash.concat'
import isPlainObject from 'lodash.isplainobject'
import pull from 'lodash.pull'
import pick from 'lodash.pick'
import find from 'lodash.find'
import values from 'lodash.values'
import camelCase from 'lodash.camelcase'
import upperFirst from 'lodash.upperfirst'
import compact from 'lodash.compact'

function isString(value) {
  return typeof value === 'string'
}

function isObject(value) {
  return value !== null && ['object', 'function'].includes(typeof value)
}

function isFunction(value) {
  return typeof value === 'function'
}

export default {
  forOwn,
  intersection,
  concat,
  isPlainObject,
  pull,
  pick,
  camelCase,
  isArray: Array.isArray,
  keys: Object.keys,
  assign: Object.assign,
  isString,
  isObject,
  isFunction,
  upperFirst,
  values,
  find,
  compact,
}

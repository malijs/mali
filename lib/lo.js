const forOwn = require('lodash.forown')
const intersection = require('lodash.intersection')
const concat = require('lodash.concat')
const isPlainObject = require('lodash.isplainobject')
const pull = require('lodash.pull')
const pick = require('lodash.pick')
const find = require('lodash.find')
const camelCase = require('lodash.camelcase')
const upperFirst = require('lodash.upperfirst')

const isArray = Array.isArray
const keys = Object.keys
const assign = Object.assign

function isString (value) {
  const type = typeof value
  return type === 'string'
}

function isObject (value) {
  const type = typeof value
  return value != null && (type === 'object' || type === 'function')
}

function isFunction (value) {
  const type = typeof value
  return type === 'function'
}

function values (object) {
  if (!object) {
    return []
  }

  return Object.values(object)
}

module.exports = {
  forOwn,
  intersection,
  concat,
  isPlainObject,
  pull,
  pick,
  camelCase,
  isArray,
  keys,
  assign,
  isString,
  isObject,
  isFunction,
  upperFirst,
  values,
  find
}

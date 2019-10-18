const _ = require('lodash')

function getPort () {
  return _.random(1000, 65000)
}

function getHostport (port) {
  return '0.0.0.0:'.concat(port || getPort())
}

exports.getHost = getHostport
exports.getPort = getPort

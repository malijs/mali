const _ = require('lodash')

function getPort () {
  return _.random(1000, 60000)
}

function getHostport (port) {
  return '127.0.0.1:'.concat(port || getPort())
}

exports.getHost = getHostport
exports.getPort = getPort

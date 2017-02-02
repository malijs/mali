const _ = require('lodash')

function getHostport (port) {
  return '0.0.0.0:'.concat(port || _.random(1000, 60000))
}

exports.getHost = getHostport

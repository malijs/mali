import _ from 'lodash'

export function getPort() {
  return _.random(1000, 65000)
}

export function getHost(port) {
  return '0.0.0.0:'.concat(port || getPort())
}

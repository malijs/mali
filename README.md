# [![Mali](https://raw.githubusercontent.com/malijs/mali/master/mali-logo.png)](https://malijs.github.io)

**A minimalistic [gRPC](http://www.grpc.io) microservice framework.**

[![npm version](https://img.shields.io/npm/v/mali.svg?style=flat-square)](https://www.npmjs.com/package/mali)
[![build status](https://github.com/malijs/mali/workflows/Node%20CI/badge.svg)](https://github.com/malijs/mali/actions)
[![coverage status](https://img.shields.io/coveralls/github/malijs/mali.svg?style=flat-square)](https://coveralls.io/github/malijs/mali)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square)](https://standardjs.com)
[![License](https://img.shields.io/github/license/malijs/mali.svg?style=flat-square)](https://raw.githubusercontent.com/malijs/mali/master/LICENSE)
[![chat on gitter](https://img.shields.io/gitter/room/malijs/Lobby.svg?style=flat-square)](https://gitter.im/malijs/Lobby)
[![Donate](https://img.shields.io/badge/Donate-PayPal-green.svg?style=flat-square)](https://www.paypal.me/bojandj)
[![Buy me a coffee](https://img.shields.io/badge/buy%20me-a%20coffee-orange.svg?style=flat-square)](https://www.buymeacoffee.com/bojand)

## Installation

Install module and required peer dependencies.

```
$ npm install mali grpc @grpc/proto-loader
```

## Example

```js
const Mali = require('mali')

async function sayHello (ctx) {
  ctx.res = { message: 'Hello '.concat(ctx.req.name) }
}

function main () {
  const app = new Mali('helloworld.proto')
  app.use({ sayHello })
  app.start('127.0.0.1:50051')
}
```

## Documentation

Full [documentation](https://mali.js.org).

## License

Apache-2.0

# [![Mali](https://raw.githubusercontent.com/malijs/mali/master/mali-logo.png)](https://malijs.github.io)

**A minimalistic [gRPC](http://www.grpc.io) microservice framework.**

[![npm version](https://img.shields.io/npm/v/mali.svg?style=flat-square)](https://www.npmjs.com/package/mali)
[![build status](https://img.shields.io/travis/malijs/mali/master.svg?style=flat-square)](https://travis-ci.org/malijs/mali)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg?style=flat-square)](https://standardjs.com)
[![License](https://img.shields.io/github/license/malijs/mali.svg?style=flat-square)](https://raw.githubusercontent.com/malijs/mali/master/LICENSE)
[![chat on gitter](https://img.shields.io/gitter/room/malijs/Lobby.svg?style=flat-square)](https://gitter.im/malijs/Lobby)

**Mali is still in development and preview state. It is good for exploration, but may not
be suitable for production use yet.**

## Installation

```
$ npm install mali
```

## Example

```js
const path = require('path')
const Mali = require('mali')

const PROTO_PATH = path.resolve(__dirname, '../protos/helloworld.proto')

async function sayHello (ctx) {
  ctx.res = { message: 'Hello '.concat(ctx.req.name) }
}

function main () {
  const app = new Mali(PROTO_PATH)
  app.use({ sayHello })
  app.start('0.0.0.0:50051')
}
```

## Documentation

Full [documentation](https://malijs.github.io).

## License

Apache-2.0

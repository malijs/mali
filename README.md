# Mali

A minimalistic [gRPC](http://www.grpc.io) microservice framework.

[![npm version](https://img.shields.io/npm/v/mali.svg?style=flat-square)](https://www.npmjs.com/package/mali)
[![build status](https://img.shields.io/travis/malijs/mali/master.svg?style=flat-square)](https://travis-ci.org/malijs/mali)

<div style="position: relative; padding: 15px; color: #4c4a42; background-color: #fff9ea; border: 1px solid #dfd8c2; border-radius: 3px;">
<strong>Mali is still in development and preview state. It is good for exploration, but may not
be suitable for production use yet.
</strong></div>
<br />

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
  const app = new Mali(PROTO_PATH, 'Greeter')
  app.use({ sayHello })
  app.start('0.0.0.0:50051')
}
```

## Documentation

Full [documentation](https://malijs.github.io).

## License

Apache-2.0

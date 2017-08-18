import test from 'ava'
import path from 'path'
import grpc from 'grpc'

import Mali from '../lib'
import * as tu from './util'

const protobuf67 = require('protobufjs67')
const protobuf68 = require('protobufjs68')

const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

const apps = []

let skipTests = false

// FIXME hack for node 8.4 in travis builds fail
// for some reason `load` is not present in protobufjs ???
if (typeof protobuf67.load !== 'function' || typeof protobuf68.load !== 'function') {
  skipTests = true
}

let tester = skipTests ? test.serial.cb.skip : test.serial.cb
tester('should handle req/res request with protobufjs 6.7', t => {
  t.plan(8)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  protobuf67.load(PROTO_PATH, (err, root) => {
    t.ifError(err)
    t.truthy(root)
    const loaded = grpc.loadObject(root)
    t.truthy(loaded)

    const app = new Mali(loaded)
    t.truthy(app)
    app.use({ sayHello })
    const server = app.start(APP_HOST)
    t.truthy(server)

    const helloproto = grpc.load(PROTO_PATH).helloworld
    const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
    client.sayHello({ name: 'Bob' }, (err, response) => {
      t.ifError(err)
      t.truthy(response)
      t.is(response.message, 'Hello Bob')
      app.close().then(() => t.end())
    })
  })
})

tester('should handle req/res request with protobufjs 6.8', t => {
  t.plan(8)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  protobuf68.load(PROTO_PATH, (err, root) => {
    t.ifError(err)
    t.truthy(root)
    const loaded = grpc.loadObject(root)
    t.truthy(loaded)

    const app = new Mali(loaded)
    t.truthy(app)
    app.use({ sayHello })
    const server = app.start(APP_HOST)
    t.truthy(server)

    const helloproto = grpc.load(PROTO_PATH).helloworld
    const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
    client.sayHello({ name: 'Bob' }, (err, response) => {
      t.ifError(err)
      t.truthy(response)
      t.is(response.message, 'Hello Bob')
      app.close().then(() => t.end())
    })
  })
})

tester = skipTests ? test.serial.skip : test.serial
tester('should work with protobuf 6.7 loaded object', async t => {
  t.plan(4)
  const root = await protobuf67.load(PROTO_PATH)
  t.truthy(root)

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const loaded = grpc.loadObject(root)
  t.truthy(loaded)
  const app = new Mali(loaded)
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(tu.getHost())
  t.truthy(server)
})

tester('should work with protobuf 6.8 loaded object', async t => {
  t.plan(4)
  const root = await protobuf68.load(PROTO_PATH)
  t.truthy(root)

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const loaded = grpc.loadObject(root)
  t.truthy(loaded)
  const app = new Mali(loaded)
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(tu.getHost())
  t.truthy(server)
})

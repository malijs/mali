import test from 'ava'
import path from 'path'
import grpc from 'grpc'

import Mali from '../lib'
import * as tu from './util'

const protobuf67 = require('protobufjs67')
const protobuf68 = require('protobufjs68')

const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

const apps = []

// FIXME hack for node 8 in travis builds
// for some reason load is not there, but loadProto, loadProtoFile, loadJson are
function getLoadFnName (pbjs) {
  if (typeof pbjs.load === 'function') {
    return 'load'
  } else if (typeof pbjs.loadProtoFile === 'function') {
    return 'loadProtoFile'
  }
  return null
}

test.serial.cb('should handle req/res request with protobufjs 6.7', t => {
  t.plan(9)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const loadFn = getLoadFnName(protobuf67)
  t.truthy(loadFn)

  protobuf67[loadFn](PROTO_PATH, (err, root) => {
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

test.serial.cb('should handle req/res request with protobufjs 6.8', t => {
  t.plan(9)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const loadFn = getLoadFnName(protobuf68)
  t.truthy(loadFn)

  protobuf68[loadFn](PROTO_PATH, (err, root) => {
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

test.serial.serial('should work with protobuf 6.7 loaded object', async t => {
  t.plan(5)

  const loadFn = getLoadFnName(protobuf67)
  t.truthy(loadFn)

  const root = await protobuf67[loadFn](PROTO_PATH)
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

test.serial.serial('should work with protobuf 6.8 loaded object', async t => {
  t.plan(5)

  const loadFn = getLoadFnName(protobuf68)
  t.truthy(loadFn)

  const root = await protobuf68[loadFn](PROTO_PATH)
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

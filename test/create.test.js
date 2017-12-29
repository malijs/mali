import test from 'ava'
import path from 'path'
import _ from 'lodash'
import pMap from 'p-map'

import Mali from '../'
import * as tu from './util'

const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
const PROTO_PATH_MULTI = path.resolve(__dirname, './protos/multi.proto')

const apps = []

test.serial('should dynamically create service', t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(tu.getHost())
  t.truthy(server)
})

test.serial('should dynamically create service without specifying a name and default to the one in proto', t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(tu.getHost())
  t.truthy(server)
  t.is(app.name, 'Greeter')
  t.truthy(app.handlers.Greeter.sayHello)
  t.true(typeof app.handlers.Greeter.sayHello[0] === 'function')
})

test.serial('should dynamically create service using addService() without specifying a name and default to the one in proto', t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali()
  app.addService(PROTO_PATH)
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(tu.getHost())
  t.truthy(server)
  t.is(app.name, 'Greeter')
  t.truthy(app.handlers.Greeter.sayHello)
  t.true(typeof app.handlers.Greeter.sayHello[0] === 'function')
})

test.serial('should dynamically create service without a service name', t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(tu.getHost())
  t.truthy(server)
})

test.serial('should statically create service', t => {
  const messages = require('./static/helloworld_pb')
  const services = require('./static/helloworld_grpc_pb')

  function sayHello (ctx) {
    const reply = new messages.HelloReply()
    reply.setMessage('Hello ' + ctx.req.getName())
    ctx.res = reply
  }

  const app = new Mali(services, 'GreeterService')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(tu.getHost())
  t.truthy(server)
})

test.serial('should statically create service without a service name', t => {
  const messages = require('./static/helloworld_pb')
  const services = require('./static/helloworld_grpc_pb')

  function sayHello (ctx) {
    const reply = new messages.HelloReply()
    reply.setMessage('Hello ' + ctx.req.getName())
    ctx.res = reply
  }

  const app = new Mali(services)
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(tu.getHost())
  t.truthy(server)
})

test.serial('should dynamically create service using object specifying root and file', async t => {
  t.plan(2)

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const load = {
    root: __dirname,
    file: 'protos/helloworld.proto'
  }

  const app = new Mali(load, 'Greeter')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(tu.getHost())
  t.truthy(server)
  await app.close()
})

test.serial('should dynamically create service using object specifying root and file using imports', async t => {
  t.plan(2)

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const load = {
    root: __dirname,
    file: 'protos/load.proto'
  }

  const app = new Mali(load, 'Greeter')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(tu.getHost())
  t.truthy(server)
  await app.close()
})

test.serial('should dynamically create a named service from defition with multiple services', t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH_MULTI, 'Greeter')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(tu.getHost())
  t.truthy(server)
})

test.serial('should dynamically create all named services from defition with multiple services', t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH_MULTI, [ 'Greeter', 'Greeter2' ])
  t.truthy(app)
  t.truthy(app.services)
  t.is(_.keys(app.services).length, 2)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(tu.getHost())
  t.truthy(server)
})

test.serial('should dynamically create all services from defition with multiple services', t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH_MULTI)
  t.truthy(app)
  t.truthy(app.services)
  t.is(_.keys(app.services).length, 4)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(tu.getHost())
  t.truthy(server)
})

test.serial('should statically create a named service from defition with multiple services', t => {
  const messages = require('./static/multi_pb')
  const services = require('./static/multi_grpc_pb')

  function sayHello (ctx) {
    const reply = new messages.HelloReply()
    reply.setMessage('Hello ' + ctx.req.getName())
    ctx.res = reply
  }

  const app = new Mali(services, 'GreeterService')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(tu.getHost())
  t.truthy(server)
})

test.serial('should statically create all named services from defition with multiple services', t => {
  const messages = require('./static/multi_pb')
  const services = require('./static/multi_grpc_pb')

  function sayHello (ctx) {
    const reply = new messages.HelloReply()
    reply.setMessage('Hello ' + ctx.req.getName())
    ctx.res = reply
  }

  const app = new Mali(services, [ 'GreeterService', 'Greeter2Service' ])
  t.truthy(app)
  t.truthy(app.services)
  t.is(_.keys(app.services).length, 2)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(tu.getHost())
  t.truthy(server)
})

test.serial('should statically create all services from defition with multiple services', t => {
  const messages = require('./static/multi_pb')
  const services = require('./static/multi_grpc_pb')

  function sayHello (ctx) {
    const reply = new messages.HelloReply()
    reply.setMessage('Hello ' + ctx.req.getName())
    ctx.res = reply
  }

  const app = new Mali(services)
  t.truthy(app)
  t.truthy(app.services)
  t.is(_.keys(app.services).length, 4)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(tu.getHost())
  t.truthy(server)
})

test.serial('should dynamically create a named service from multi package proto', t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali({ file: 'protos/multipkg.proto', root: __dirname })
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = app.start(tu.getHost())
  t.truthy(server)
})

test.after.always('cleanup', async t => {
  await pMap(apps, app => app.close())
})

test.serial('should dynamically create service from multiple protos', t => {
  const proto1 = path.resolve(__dirname, './protos/helloworld.proto')
  const proto2 = path.resolve(__dirname, './protos/reqres.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  function doSomething (ctx) {
    ctx.res = { message: ctx.req.message.toUppercase() }
  }

  const app = new Mali()
  app.addService(proto1)
  app.addService(proto2)
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  app.use({ doSomething })

  t.is(app.name, 'Greeter')
  t.truthy(app.handlers.Greeter.sayHello)
  t.true(typeof app.handlers.Greeter.sayHello[0] === 'function')
  t.is(app.handlers.Greeter.sayHello[0], sayHello)

  t.truthy(app.handlers.ArgService.doSomething)
  t.true(typeof app.handlers.ArgService.doSomething[0] === 'function')
  t.is(app.handlers.ArgService.doSomething[0], doSomething)

  const server = app.start(tu.getHost())
  t.truthy(server)
})

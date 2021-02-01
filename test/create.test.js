const test = require('ava')
const path = require('path')
const _ = require('lodash')
const pMap = require('p-map')

const Mali = require('../')
const tu = require('./util')

const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
const PROTO_PATH_MULTI = path.resolve(__dirname, './protos/multi.proto')

const apps = []

test.serial('should dynamically create service ', async t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = await app.start(tu.getHost())
  t.truthy(server)
  t.is(app.name, 'helloworld.Greeter')
})

test.serial('should dynamically create service with name', async t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'helloworld.Greeter')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = await app.start(tu.getHost())
  t.truthy(server)
  t.is(app.name, 'helloworld.Greeter')
})

test.serial('should dynamically create service without specifying a name and default to the one in proto', async t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = await app.start(tu.getHost())
  t.truthy(server)
  t.is(app.name, 'helloworld.Greeter')
  t.truthy(app.data['helloworld.Greeter'].handlers['/helloworld.Greeter/SayHello'])
  t.true(typeof app.data['helloworld.Greeter'].handlers['/helloworld.Greeter/SayHello'][0] === 'function')
})

test.serial('should dynamically create service using addService() without specifying a name and default to the one in proto', async t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali()
  app.addService(PROTO_PATH)
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = await app.start(tu.getHost())
  t.truthy(server)
  t.is(app.name, 'helloworld.Greeter')
  t.truthy(app.data['helloworld.Greeter'].handlers['/helloworld.Greeter/SayHello'])
  t.true(typeof app.data['helloworld.Greeter'].handlers['/helloworld.Greeter/SayHello'][0] === 'function')
})

test.serial('should dynamically create service without a service name', async t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'helloworld.Greeter')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = await app.start(tu.getHost())
  t.truthy(server)
})

test.serial('should statically create service', async t => {
  const messages = require('./static/helloworld_pb')
  const services = require('./static/helloworld_grpc_pb')

  function sayHello (ctx) {
    const reply = new messages.HelloReply()
    reply.setMessage('Hello ' + ctx.req.getName())
    ctx.res = reply
  }

  const app = new Mali(services, 'helloworld.Greeter')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = await app.start(tu.getHost())
  t.truthy(server)
})

test.serial('should statically create service without a service name', async t => {
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
  const server = await app.start(tu.getHost())
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

  const app = new Mali(load, 'helloworld.Greeter')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = await app.start(tu.getHost())
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

  const app = new Mali(load, 'helloworld.Greeter')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = await app.start(tu.getHost())
  t.truthy(server)
  await app.close()
})

test.serial('should dynamically create a named service from defition with multiple services', async t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH_MULTI, 'helloworld.Greeter')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = await app.start(tu.getHost())
  t.truthy(server)
})

test.serial('should dynamically create all named services from defition with multiple services', async t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH_MULTI, ['helloworld.Greeter', 'helloworld.Greeter2'])
  t.truthy(app)
  t.truthy(app.data)
  t.is(_.keys(app.data).length, 2)
  apps.push(app)

  app.use({ sayHello })
  const server = await app.start(tu.getHost())
  t.truthy(server)
})

test.serial('should dynamically create all services from defition with multiple services', async t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH_MULTI)
  t.truthy(app)
  t.truthy(app.data)
  t.is(_.keys(app.data).length, 4)
  apps.push(app)

  app.use({ sayHello })
  const server = await app.start(tu.getHost())
  t.truthy(server)
})

test.serial('should statically create a named service from defition with multiple services', async t => {
  const messages = require('./static/multi_pb')
  const services = require('./static/multi_grpc_pb')

  function sayHello (ctx) {
    const reply = new messages.HelloReply()
    reply.setMessage('Hello ' + ctx.req.getName())
    ctx.res = reply
  }

  const app = new Mali(services, 'helloworld.Greeter')
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = await app.start(tu.getHost())
  t.truthy(server)
})

test.serial('should statically create all named services from defition with multiple services', async t => {
  const messages = require('./static/multi_pb')
  const services = require('./static/multi_grpc_pb')

  function sayHello (ctx) {
    const reply = new messages.HelloReply()
    reply.setMessage('Hello ' + ctx.req.getName())
    ctx.res = reply
  }

  const app = new Mali(services, ['helloworld.Greeter', 'helloworld.Greeter2'])
  t.truthy(app)
  t.truthy(app.data)
  t.is(_.keys(app.data).length, 2)
  apps.push(app)

  app.use({ sayHello })
  const server = await app.start(tu.getHost())
  t.truthy(server)
})

test.serial('should statically create all services from defition with multiple services', async t => {
  const messages = require('./static/multi_pb')
  const services = require('./static/multi_grpc_pb')

  function sayHello (ctx) {
    const reply = new messages.HelloReply()
    reply.setMessage('Hello ' + ctx.req.getName())
    ctx.res = reply
  }

  const app = new Mali(services)
  t.truthy(app)
  t.truthy(app.data)
  t.is(_.keys(app.data).length, 4)
  apps.push(app)

  app.use({ sayHello })
  const server = await app.start(tu.getHost())
  t.truthy(server)
})

test.serial('should dynamically create a named service from multi package proto', async t => {
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali({ file: 'protos/multipkg.proto', root: __dirname })
  t.truthy(app)
  apps.push(app)

  app.use({ sayHello })
  const server = await app.start(tu.getHost())
  t.truthy(server)
})

test.after.always('cleanup', async t => {
  await pMap(apps, app => app.close())
})

test.serial('should dynamically create service from multiple protos', async t => {
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

  t.is(app.name, 'helloworld.Greeter')
  t.truthy(app.data['helloworld.Greeter'].handlers['/helloworld.Greeter/SayHello'])
  t.true(typeof app.data['helloworld.Greeter'].handlers['/helloworld.Greeter/SayHello'][0] === 'function')
  t.is(app.data['helloworld.Greeter'].handlers['/helloworld.Greeter/SayHello'][0], sayHello)

  t.truthy(app.data['argservice.ArgService'].handlers['/argservice.ArgService/DoSomething'])
  t.true(typeof app.data['argservice.ArgService'].handlers['/argservice.ArgService/DoSomething'][0] === 'function')
  t.is(app.data['argservice.ArgService'].handlers['/argservice.ArgService/DoSomething'][0], doSomething)

  const server = await app.start(tu.getHost())
  t.truthy(server)
})

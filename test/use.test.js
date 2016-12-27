import path from 'path'
import test from 'ava'
import Mali from '../lib'

test('shoud throw on unknown function', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
  function saySomething (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  const error = t.throws(() => {
    app.use({ saySomething })
  }, Error)

  t.is(error.message, 'Unknown method: saySomething')
})

test('shoud throw on invalid parameter', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
  const sayHello = 'sayHello'

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  const error = t.throws(() => {
    app.use({ sayHello })
  }, Error)

  t.is(error.message, 'Handler for sayHello is not a function or array')
})

test('shoud add handler using object notation', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  app.use({ sayHello })
  t.pass()
})

test('shoud add handler using name and function', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  app.use('sayHello', handler)
  t.pass()
})

test('shoud throw on duplicate handlers', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  function sayHello2 (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  app.use({ sayHello })
  const error = t.throws(() => {
    app.use('sayHello', sayHello2)
  }, Error)

  t.is(error.message, 'Handler for sayHello already defined')
})

test('shoud add handler and middleware when set using name', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  async function mw1 (ctx, next) {
    ctx.mw1 = 'mw1'
    await next()
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  app.use('sayHello', mw1, handler)

  t.truthy(app.handlers.sayHello)
  t.true(Array.isArray(app.handlers.sayHello))
  t.is(app.handlers.sayHello.length, 2)
  t.is(app.handlers.sayHello[0], mw1)
  t.is(app.handlers.sayHello[1], handler)
})

test('shoud add handler and middleware when set as array using object', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  async function mw1 (ctx, next) {
    ctx.mw1 = 'mw1'
    await next()
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  app.use({ sayHello: [mw1, handler] })

  t.truthy(app.handlers.sayHello)
  t.true(Array.isArray(app.handlers.sayHello))
  t.is(app.handlers.sayHello.length, 2)
  t.is(app.handlers.sayHello[0], mw1)
  t.is(app.handlers.sayHello[1], handler)
})

test('shoud add global middleware when set before app.use for that handler', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  async function mw1 (ctx, next) {
    ctx.mw1 = 'mw1'
    await next()
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  app.use(mw1)
  app.use({ sayHello: handler })

  t.truthy(app.handlers.sayHello)
  t.true(Array.isArray(app.handlers.sayHello))
  t.is(app.handlers.sayHello.length, 2)
  t.is(app.handlers.sayHello[0], mw1)
  t.is(app.handlers.sayHello[1], handler)
})

test('shoud not add global middleware when set after app.use for that handler', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  async function mw1 (ctx, next) {
    ctx.mw1 = 'mw1'
    await next()
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  app.use({ sayHello: handler })
  app.use(mw1)

  t.truthy(app.handlers.sayHello)
  t.true(Array.isArray(app.handlers.sayHello))
  t.is(app.handlers.sayHello.length, 1)
  t.is(app.handlers.sayHello[0], handler)
})

test('shoud add global middleware and handler and middleware', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  async function mw1 (ctx, next) {
    ctx.mw1 = 'mw1'
    await next()
  }

  async function mw2 (ctx, next) {
    ctx.mw2 = 'mw2'
    await next()
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  app.use(mw1)
  app.use('sayHello', mw2, handler)

  t.truthy(app.handlers.sayHello)
  t.true(Array.isArray(app.handlers.sayHello))
  t.is(app.handlers.sayHello.length, 3)
  t.is(app.handlers.sayHello[0], mw1)
  t.is(app.handlers.sayHello[1], mw2)
  t.is(app.handlers.sayHello[2], handler)
})

test('shoud not add global middleware if added after handler and middleware', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  async function mw1 (ctx, next) {
    ctx.mw1 = 'mw1'
    await next()
  }

  async function mw2 (ctx, next) {
    ctx.mw2 = 'mw2'
    await next()
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  app.use('sayHello', mw2, handler)
  app.use(mw1)

  t.truthy(app.handlers.sayHello)
  t.true(Array.isArray(app.handlers.sayHello))
  t.is(app.handlers.sayHello.length, 2)
  t.is(app.handlers.sayHello[0], mw2)
  t.is(app.handlers.sayHello[1], handler)
})

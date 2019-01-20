import path from 'path'
import test from 'ava'
import _ from 'lodash'
import Mali from '../'

test('should throw on unknown function', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function saySomething (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  const error = t.throws(() => {
    app.use({ saySomething })
  }, Error)

  t.is(error.message, 'Unknown method: saySomething for service Greeter')
})

test('should throw on invalid parameter', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
  const sayHello = 'sayHello'

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  const error = t.throws(() => {
    app.use({ sayHello })
  }, Error)

  t.is(error.message, 'Invalid type for handler for sayHello')
})

test('should throw on invalid service name parameter', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  const error = t.throws(() => {
    app.use('UnknownService', 'sayHello', sayHello)
  }, Error)

  t.is(error.message, 'Unknown service UnknownService')
})

test('should throw on invalid handler type', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/multi.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)

  const error = t.throws(() => {
    app.use({
      Greeter4: {
        sayGoodbye: sayHello,
        sayHello: 2
      }
    })
  }, Error)

  t.is(error.message, 'Handler for sayHello is not a function or array')
})

test('should add handler using object notation', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  app.use({ sayHello })
  t.pass()
})

test('should add handler using name and function', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  app.use('sayHello', handler)
  t.pass()
})

test('should throw on duplicate handlers', t => {
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

  t.is(error.message, 'Handler for sayHello already defined for service Greeter')
})

test('should add handler and middleware when set using name', t => {
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

  t.truthy(app.handlers.Greeter.sayHello)
  t.true(Array.isArray(app.handlers.Greeter.sayHello))
  t.is(app.handlers.Greeter.sayHello.length, 2)
  t.is(app.handlers.Greeter.sayHello[0], mw1)
  t.is(app.handlers.Greeter.sayHello[1], handler)
})

test('should add handler and middleware when set using service and call name', t => {
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

  app.use('Greeter', 'sayHello', mw1, handler)

  t.truthy(app.handlers.Greeter.sayHello)
  t.true(Array.isArray(app.handlers.Greeter.sayHello))
  t.is(app.handlers.Greeter.sayHello.length, 2)
  t.is(app.handlers.Greeter.sayHello[0], mw1)
  t.is(app.handlers.Greeter.sayHello[1], handler)
})

test('should add handler and middleware when set as array using object', t => {
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

  t.truthy(app.handlers.Greeter)
  t.truthy(app.handlers.Greeter.sayHello)
  t.true(Array.isArray(app.handlers.Greeter.sayHello))
  t.is(app.handlers.Greeter.sayHello.length, 2)
  t.is(app.handlers.Greeter.sayHello[0], mw1)
  t.is(app.handlers.Greeter.sayHello[1], handler)
})

test('should add global middleware when set before app.use for that handler', t => {
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

  t.truthy(app.handlers.Greeter)
  t.truthy(app.handlers.Greeter.sayHello)
  t.true(Array.isArray(app.handlers.Greeter.sayHello))
  t.is(app.handlers.Greeter.sayHello.length, 2)
  t.is(app.handlers.Greeter.sayHello[0], mw1)
  t.is(app.handlers.Greeter.sayHello[1], handler)
})

test('should not add global middleware when set after app.use for that handler', t => {
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

  t.truthy(app.handlers.Greeter)
  t.truthy(app.handlers.Greeter.sayHello)
  t.true(Array.isArray(app.handlers.Greeter.sayHello))
  t.is(app.handlers.Greeter.sayHello.length, 1)
  t.is(app.handlers.Greeter.sayHello[0], handler)
})

test('should add global middleware and handler and middleware', t => {
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

  t.truthy(app.handlers.Greeter)
  t.truthy(app.handlers.Greeter.sayHello)
  t.true(Array.isArray(app.handlers.Greeter.sayHello))
  t.is(app.handlers.Greeter.sayHello.length, 3)
  t.is(app.handlers.Greeter.sayHello[0], mw1)
  t.is(app.handlers.Greeter.sayHello[1], mw2)
  t.is(app.handlers.Greeter.sayHello[2], handler)
})

test('should not add global middleware if added after handler and middleware', t => {
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

  t.truthy(app.handlers.Greeter)
  t.truthy(app.handlers.Greeter.sayHello)
  t.true(Array.isArray(app.handlers.Greeter.sayHello))
  t.is(app.handlers.Greeter.sayHello.length, 2)
  t.is(app.handlers.Greeter.sayHello[0], mw2)
  t.is(app.handlers.Greeter.sayHello[1], handler)
})

test('multi: should add handler using object notation', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/multi.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)

  app.use({ sayHello })
  t.is(_.keys(app.handlers).length, 1)
  t.truthy(app.handlers.Greeter.sayHello)

  t.pass()
})

test('multi: should add handler using object notation specifying service', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/multi.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)

  app.use({ Greeter2: { sayHello } })
  t.is(_.keys(app.handlers).length, 1)
  t.truthy(app.handlers.Greeter2.sayHello)

  t.pass()
})

test('multi: should add handler using object notation specifying services', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/multi.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)

  app.use({
    Greeter: { sayHello },
    Greeter2: { sayHello }
  })
  t.is(_.keys(app.handlers).length, 2)
  t.truthy(app.handlers.Greeter.sayHello)
  t.truthy(app.handlers.Greeter2.sayHello)

  t.pass()
})

test('multi: should add handler using name and function', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/multi.proto')

  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)

  app.use('sayHello', handler)
  t.is(_.keys(app.handlers).length, 1)
  t.truthy(app.handlers.Greeter.sayHello)
  t.pass()
})

test('multi: should add handler using name, service name and function', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/multi.proto')

  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)

  app.use('Greeter2', 'sayHello', handler)
  t.is(_.keys(app.handlers).length, 1)
  t.truthy(app.handlers.Greeter2.sayHello)
  t.pass()
})

test('multi: should add handler using name, and service names and function', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/multi.proto')

  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)

  app.use('Greeter', 'sayHello', handler)
  app.use('Greeter2', 'sayHello', handler)
  t.is(_.keys(app.handlers).length, 2)
  t.truthy(app.handlers.Greeter.sayHello)
  t.truthy(app.handlers.Greeter2.sayHello)
  t.pass()
})

test('multi: should throw on duplicate handlers using multimple services', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/multi.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  function sayHello2 (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)

  app.use({ sayHello })
  app.use('Greeter2', 'sayHello', sayHello2)
  t.is(_.keys(app.handlers).length, 2)
  t.truthy(app.handlers.Greeter.sayHello)
  t.truthy(app.handlers.Greeter2.sayHello)

  const error = t.throws(() => {
    app.use('Greeter2', 'sayHello', sayHello2)
  }, Error)

  t.is(error.message, 'Handler for sayHello already defined for service Greeter2')
})

test('multi: should add handler and middleware when set using name', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/multi.proto')

  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  async function mw1 (ctx, next) {
    ctx.mw1 = 'mw1'
    await next()
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)

  app.use('sayHello', mw1, handler)

  t.truthy(app.handlers.Greeter.sayHello)
  t.true(Array.isArray(app.handlers.Greeter.sayHello))
  t.is(app.handlers.Greeter.sayHello.length, 2)
  t.is(app.handlers.Greeter.sayHello[0], mw1)
  t.is(app.handlers.Greeter.sayHello[1], handler)
})

test('multi: should add handler and middleware when set using service name and function name', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/multi.proto')

  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  async function mw1 (ctx, next) {
    ctx.mw1 = 'mw1'
    await next()
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)

  app.use('Greeter2', 'sayHello', mw1, handler)

  t.truthy(app.handlers.Greeter2.sayHello)
  t.true(Array.isArray(app.handlers.Greeter2.sayHello))
  t.is(app.handlers.Greeter2.sayHello.length, 2)
  t.is(app.handlers.Greeter2.sayHello[0], mw1)
  t.is(app.handlers.Greeter2.sayHello[1], handler)
})

test('multi: should add handler and middleware when set using service name and function name 2', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/multi.proto')

  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  async function mw1 (ctx, next) {
    ctx.mw1 = 'mw1'
    await next()
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)

  app.use('Greeter2', 'sayHello', mw1, handler)
  app.use('Greeter4', 'sayGoodbye', handler)

  t.truthy(app.handlers.Greeter2.sayHello)
  t.true(Array.isArray(app.handlers.Greeter2.sayHello))
  t.is(app.handlers.Greeter2.sayHello.length, 2)
  t.is(app.handlers.Greeter2.sayHello[0], mw1)
  t.is(app.handlers.Greeter2.sayHello[1], handler)

  t.truthy(app.handlers.Greeter4.sayGoodbye)
  t.true(Array.isArray(app.handlers.Greeter4.sayGoodbye))
  t.is(app.handlers.Greeter4.sayGoodbye.length, 1)
  t.is(app.handlers.Greeter4.sayGoodbye[0], handler)
})

test('multi: should add service level global middleware', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/multi.proto')

  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  async function mw1 (ctx, next) {
    ctx.mw1 = 'mw1'
    await next()
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)

  app.use('Greeter2', mw1)
  app.use('Greeter2', 'sayHello', handler)
  app.use('Greeter4', 'sayGoodbye', handler)

  t.truthy(app.handlers.Greeter2.sayHello)
  t.true(Array.isArray(app.handlers.Greeter2.sayHello))
  t.is(app.handlers.Greeter2.sayHello.length, 2)
  t.is(app.handlers.Greeter2.sayHello[0], mw1)
  t.is(app.handlers.Greeter2.sayHello[1], handler)

  t.truthy(app.handlers.Greeter4.sayGoodbye)
  t.true(Array.isArray(app.handlers.Greeter4.sayGoodbye))
  t.is(app.handlers.Greeter4.sayGoodbye.length, 1)
  t.is(app.handlers.Greeter4.sayGoodbye[0], handler)
})

test('multi: should add service level global middleware 2', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/multi.proto')

  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  async function mw1 (ctx, next) {
    ctx.mw1 = 'mw1'
    await next()
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)

  app.use('Greeter4', mw1)
  app.use('Greeter2', 'sayHello', handler)
  app.use('Greeter4', 'sayGoodbye', handler)

  t.truthy(app.handlers.Greeter2.sayHello)
  t.true(Array.isArray(app.handlers.Greeter2.sayHello))
  t.is(app.handlers.Greeter2.sayHello.length, 1)
  t.is(app.handlers.Greeter2.sayHello[0], handler)

  t.truthy(app.handlers.Greeter4.sayGoodbye)
  t.true(Array.isArray(app.handlers.Greeter4.sayGoodbye))
  t.is(app.handlers.Greeter4.sayGoodbye.length, 2)
  t.is(app.handlers.Greeter4.sayGoodbye[0], mw1)
  t.is(app.handlers.Greeter4.sayGoodbye[1], handler)
})

test('multi: should add global middleware to all services', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/multi.proto')

  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  async function mw1 (ctx, next) {
    ctx.mw1 = 'mw1'
    await next()
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)

  app.use(mw1)
  app.use('Greeter2', 'sayHello', handler)
  app.use('Greeter4', 'sayGoodbye', handler)

  t.truthy(app.handlers.Greeter2.sayHello)
  t.true(Array.isArray(app.handlers.Greeter2.sayHello))
  t.is(app.handlers.Greeter2.sayHello.length, 2)
  t.is(app.handlers.Greeter2.sayHello[0], mw1)
  t.is(app.handlers.Greeter2.sayHello[1], handler)

  t.truthy(app.handlers.Greeter4.sayGoodbye)
  t.true(Array.isArray(app.handlers.Greeter4.sayGoodbye))
  t.is(app.handlers.Greeter4.sayGoodbye.length, 2)
  t.is(app.handlers.Greeter4.sayGoodbye[0], mw1)
  t.is(app.handlers.Greeter4.sayGoodbye[1], handler)
})

test('multi: should add global middleware to all services after the global use', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/multi.proto')

  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  async function mw1 (ctx, next) {
    ctx.mw1 = 'mw1'
    await next()
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)

  app.use('Greeter4', 'sayGoodbye', handler)
  app.use(mw1)
  app.use('Greeter2', 'sayHello', handler)
  app.use('Greeter4', 'sayHello', handler)

  t.truthy(app.handlers.Greeter2.sayHello)
  t.true(Array.isArray(app.handlers.Greeter2.sayHello))
  t.is(app.handlers.Greeter2.sayHello.length, 2)
  t.is(app.handlers.Greeter2.sayHello[0], mw1)
  t.is(app.handlers.Greeter2.sayHello[1], handler)

  t.truthy(app.handlers.Greeter4.sayGoodbye)
  t.true(Array.isArray(app.handlers.Greeter4.sayGoodbye))
  t.is(app.handlers.Greeter4.sayGoodbye.length, 1)
  t.is(app.handlers.Greeter4.sayGoodbye[0], handler)

  t.truthy(app.handlers.Greeter4.sayHello)
  t.true(Array.isArray(app.handlers.Greeter4.sayHello))
  t.is(app.handlers.Greeter4.sayHello.length, 2)
  t.is(app.handlers.Greeter4.sayHello[0], mw1)
  t.is(app.handlers.Greeter4.sayHello[1], handler)
})

test('multi: should add handlers using object notation for all services', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/multi.proto')

  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  async function mw1 (ctx, next) {
    ctx.mw1 = 'mw1'
    await next()
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)

  app.use({
    Greeter4: {
      sayGoodbye: handler,
      sayHello: [mw1, handler]
    },
    Greeter2: { sayHello: handler }
  })

  t.truthy(app.handlers.Greeter2.sayHello)
  t.true(Array.isArray(app.handlers.Greeter2.sayHello))
  t.is(app.handlers.Greeter2.sayHello.length, 1)
  t.is(app.handlers.Greeter2.sayHello[0], handler)

  t.truthy(app.handlers.Greeter4.sayGoodbye)
  t.true(Array.isArray(app.handlers.Greeter4.sayGoodbye))
  t.is(app.handlers.Greeter4.sayGoodbye.length, 1)
  t.is(app.handlers.Greeter4.sayGoodbye[0], handler)

  t.truthy(app.handlers.Greeter4.sayHello)
  t.true(Array.isArray(app.handlers.Greeter4.sayHello))
  t.is(app.handlers.Greeter4.sayHello.length, 2)
  t.is(app.handlers.Greeter4.sayHello[0], mw1)
  t.is(app.handlers.Greeter4.sayHello[1], handler)
})

test('multi: should add handlers using object notation for all services with global middleware', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/multi.proto')

  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  async function mw1 (ctx, next) {
    ctx.mw1 = 'mw1'
    await next()
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)

  app.use(mw1)
  app.use({
    Greeter4: {
      sayGoodbye: handler,
      sayHello: handler
    },
    Greeter2: { sayHello: handler }
  })

  t.truthy(app.handlers.Greeter2.sayHello)
  t.true(Array.isArray(app.handlers.Greeter2.sayHello))
  t.is(app.handlers.Greeter2.sayHello.length, 2)
  t.is(app.handlers.Greeter2.sayHello[0], mw1)
  t.is(app.handlers.Greeter2.sayHello[1], handler)

  t.truthy(app.handlers.Greeter4.sayGoodbye)
  t.true(Array.isArray(app.handlers.Greeter4.sayGoodbye))
  t.is(app.handlers.Greeter4.sayGoodbye.length, 2)
  t.is(app.handlers.Greeter4.sayGoodbye[0], mw1)
  t.is(app.handlers.Greeter4.sayGoodbye[1], handler)

  t.truthy(app.handlers.Greeter4.sayHello)
  t.true(Array.isArray(app.handlers.Greeter4.sayHello))
  t.is(app.handlers.Greeter4.sayHello.length, 2)
  t.is(app.handlers.Greeter4.sayHello[0], mw1)
  t.is(app.handlers.Greeter4.sayHello[1], handler)
})

test('multi: should add handlers using object notation for all services with service level middleware', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/multi.proto')

  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  async function mw1 (ctx, next) {
    ctx.mw1 = 'mw1'
    await next()
  }

  const app = new Mali(PROTO_PATH)
  t.truthy(app)

  app.use('Greeter2', mw1)
  app.use({
    Greeter4: {
      sayGoodbye: handler,
      sayHello: [mw1, handler]
    },
    Greeter2: { sayHello: handler }
  })

  t.truthy(app.handlers.Greeter2.sayHello)
  t.true(Array.isArray(app.handlers.Greeter2.sayHello))
  t.is(app.handlers.Greeter2.sayHello.length, 2)
  t.is(app.handlers.Greeter2.sayHello[0], mw1)
  t.is(app.handlers.Greeter2.sayHello[1], handler)

  t.truthy(app.handlers.Greeter4.sayGoodbye)
  t.true(Array.isArray(app.handlers.Greeter4.sayGoodbye))
  t.is(app.handlers.Greeter4.sayGoodbye.length, 1)
  t.is(app.handlers.Greeter4.sayGoodbye[0], handler)

  t.truthy(app.handlers.Greeter4.sayHello)
  t.true(Array.isArray(app.handlers.Greeter4.sayHello))
  t.is(app.handlers.Greeter4.sayHello.length, 2)
  t.is(app.handlers.Greeter4.sayHello[0], mw1)
  t.is(app.handlers.Greeter4.sayHello[1], handler)
})

test('should add multiple middleware if just functions passed to use()', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function handler (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  async function mw1 (ctx, next) {
    ctx.mw1 = 'mw1'
    await next()
  }

  async function mw2 (ctx, next) {
    ctx.mw1 = 'mw2'
    await next()
  }

  async function mw3 (ctx, next) {
    ctx.mw1 = 'mw3'
    await next()
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  app.use(mw1, mw2, mw3)
  app.use('sayHello', handler)

  t.truthy(app.handlers.Greeter.sayHello)
  t.true(Array.isArray(app.handlers.Greeter.sayHello))
  t.is(app.handlers.Greeter.sayHello.length, 4)
  t.is(app.handlers.Greeter.sayHello[0], mw1)
  t.is(app.handlers.Greeter.sayHello[1], mw2)
  t.is(app.handlers.Greeter.sayHello[2], mw3)
  t.is(app.handlers.Greeter.sayHello[3], handler)
})

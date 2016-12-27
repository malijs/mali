import test from 'ava'
import path from 'path'
import grpc from 'grpc'
import BB from 'bluebird'

import Mali from '../lib'
import * as tu from './util'

const fs = BB.promisifyAll(require('fs'))

const PROTO_PATH = path.resolve(__dirname, './protos/transform.proto')

const apps = []

const DYNAMIC_HOST = tu.getHost()

const gmwcalled = {}

// util
function strrot13 (s) {
  return s.replace(/[a-zA-Z]/g, function (c) {
    return String.fromCharCode((c <= 'Z' ? 90 : 122) >= (c = c.charCodeAt(0) + 13) ? c : c - 26)
  })
}

function reverseString (s) {
  return s.split('').reverse().join('')
}

// Middleware
async function gmw1 (ctx, next) {
  ctx.mw = (ctx.mw || '').concat('gmw1')
  await next()
  gmwcalled[ctx.req.id] = (gmwcalled[ctx.req.id] || '').concat(':gmw1')
}

async function gmw2 (ctx, next) {
  ctx.mw = (ctx.mw || '').concat(':gmw2')
  await next()
  gmwcalled[ctx.req.id] = (gmwcalled[ctx.req.id] || '').concat(':gmw2')
}

async function gmw3 (ctx, next) {
  ctx.mw = (ctx.mw || '').concat(':gmw3')
  await next()
  gmwcalled[ctx.req.id] = (gmwcalled[ctx.req.id] || '').concat(':gmw3')
}

async function mw1 (ctx, next) {
  ctx.value = 'MW1'
  ctx.mw = (ctx.mw || '').concat(':mw1')
  await next()
}

async function mw2 (ctx, next) {
  const filepath = path.resolve(__dirname, './static/mw2.txt')
  const v = await fs.readFileAsync(filepath, 'utf8')
  ctx.value = v ? v.trim() : ''
  ctx.mw = (ctx.mw || '').concat(':mw2')
  await next()
}

async function mw3 (ctx, next) {
  ctx.value = 'mw3'
  ctx.mw = (ctx.mw || '').concat(':mw3')
  await next()
}

async function reverseMW (ctx, next) {
  if (ctx.req.message) {
    ctx.req.message = reverseString(ctx.req.message)
  }
  ctx.mw = (ctx.mw || '').concat(':reverse')
  await next()
}

function payloadrot13 (ctx, next) {
  ctx.mw = (ctx.mw || '').concat(':rot13')
  return next().then(() => {
    ctx.res.message = strrot13(ctx.res.message)
  })
}

test.before('should dynamically create service', t => {
  // Handlers
  async function upper (ctx) {
    ctx.res = {
      message: ctx.req.message.toUpperCase(),
      value: ctx.value,
      mw: ctx.mw
    }
  }

  async function lower (ctx) {
    ctx.res = {
      message: ctx.req.message.toLowerCase(),
      value: ctx.value,
      mw: ctx.mw
    }
  }

  async function reverse (ctx) {
    ctx.res = {
      message: reverseString(ctx.req.message),
      value: ctx.value,
      mw: ctx.mw
    }
  }

  async function rot13 (ctx) {
    ctx.res = {
      message: strrot13(ctx.req.message),
      value: ctx.value,
      mw: ctx.mw
    }
  }

  async function echo (ctx) {
    ctx.res = {
      message: ctx.req.message,
      value: ctx.value,
      mw: ctx.mw
    }
  }

  const app = new Mali(PROTO_PATH, 'TransformService')
  t.truthy(app)
  apps.push(app)

  app.use(gmw1)
  app.use('upper', mw1, upper)
  app.use('lower', mw2, lower)
  app.use('reverse', mw1, mw2, reverse)
  app.use(gmw2)
  app.use('rot13', mw1, mw2, mw3, rot13)
  app.use('reverseRot13', reverseMW, mw2, payloadrot13, echo)
  app.use(gmw3)
  const server = app.start(DYNAMIC_HOST)

  t.truthy(server)
})

test.cb('single sync middleware', t => {
  t.plan(8)
  const ts = grpc.load(PROTO_PATH).Transform
  const client = new ts.TransformService(DYNAMIC_HOST, grpc.credentials.createInsecure())
  const id = tu.getRandomInt(10, 10000).toString()
  client.upper({ id, message: 'hello world' }, (err, response) => {
    t.ifError(err)
    t.truthy(response)
    t.truthy(response.message)
    t.is(response.message, 'HELLO WORLD')
    t.truthy(response.value)
    t.is(response.value, 'MW1')
    t.is(response.mw, 'gmw1:mw1')
    t.is(gmwcalled[id], ':gmw1')
    t.end()
  })
})

test.cb('single async middleware', t => {
  t.plan(8)
  const ts = grpc.load(PROTO_PATH).Transform
  const client = new ts.TransformService(DYNAMIC_HOST, grpc.credentials.createInsecure())
  const id = tu.getRandomInt(10, 10000).toString()
  client.lower({ id, message: 'HELLO WORLD' }, (err, response) => {
    t.ifError(err)
    t.truthy(response)
    t.truthy(response.message)
    t.is(response.message, 'hello world')
    t.truthy(response.value)
    t.is(response.value, 'MW2')
    t.is(response.mw, 'gmw1:mw2')
    t.is(gmwcalled[id], ':gmw1')
    t.end()
  })
})

test.cb('sync + async middleware', t => {
  t.plan(8)
  const ts = grpc.load(PROTO_PATH).Transform
  const client = new ts.TransformService(DYNAMIC_HOST, grpc.credentials.createInsecure())
  const id = tu.getRandomInt(10, 10000).toString()
  client.reverse({ id, message: 'Hello WORLD' }, (err, response) => {
    t.ifError(err)
    t.truthy(response)
    t.truthy(response.message)
    t.is(response.message, 'DLROW olleH')
    t.truthy(response.value)
    t.is(response.value, 'MW2')
    t.is(response.mw, 'gmw1:mw1:mw2')
    t.is(gmwcalled[id], ':gmw1')
    t.end()
  })
})

test.cb('multiple sync + async middleware', t => {
  t.plan(8)
  const ts = grpc.load(PROTO_PATH).Transform
  const client = new ts.TransformService(DYNAMIC_HOST, grpc.credentials.createInsecure())
  const id = tu.getRandomInt(10, 10000).toString()
  client.rot13({ id, message: 'HELLO world' }, (err, response) => {
    t.ifError(err)
    t.truthy(response)
    t.truthy(response.message)
    t.is(response.message, 'URYYB jbeyq')
    t.truthy(response.value)
    t.is(response.value, 'mw3')
    t.is(response.mw, 'gmw1:gmw2:mw1:mw2:mw3')
    t.is(gmwcalled[id], ':gmw2:gmw1')
    t.end()
  })
})

test.cb('mutate + payload middleware', t => {
  t.plan(8)
  const ts = grpc.load(PROTO_PATH).Transform
  const client = new ts.TransformService(DYNAMIC_HOST, grpc.credentials.createInsecure())
  const id = tu.getRandomInt(10, 10000).toString()
  client.reverseRot13({ id, message: 'hello WORLD' }, (err, response) => {
    t.ifError(err)
    t.truthy(response)
    t.truthy(response.message)
    t.is(response.message, 'QYEBJ byyru')
    t.truthy(response.value)
    t.is(response.value, 'MW2')
    t.is(response.mw, 'gmw1:gmw2:reverse:mw2:rot13')
    t.is(gmwcalled[id], ':gmw2:gmw1')
    t.end()
  })
})

test.cb('should compose middleware w/ async functions', t => {
  t.plan(6)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
  const calls = []

  function sayHello (ctx) {
    ctx.res = { message: 'Hello '.concat(ctx.req.name) }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  app.use(async (ctx, next) => {
    calls.push(1)
    await next()
    calls.push(6)
  })

  app.use(async (ctx, next) => {
    calls.push(2)
    await next()
    calls.push(5)
  })

  app.use(async (ctx, next) => {
    calls.push(3)
    await next()
    calls.push(4)
  })

  app.use({ sayHello })
  const server = app.start(APP_HOST)
  t.truthy(server)

  const helloproto = grpc.load(PROTO_PATH).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  client.sayHello({ name: 'Bob' }, (err, response) => {
    t.ifError(err)
    t.truthy(response)
    t.is(response.message, 'Hello Bob')
    t.deepEqual(calls, [1, 2, 3, 4, 5, 6])
    app.close()
    t.end()
  })
})

test.cb('should not call middleware downstream of one that does not call next', t => {
  t.plan(6)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
  const calls = []

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  async function fn1 (ctx, next) {
    calls.push(1)
    await next()
    calls.push(6)
  }

  async function fn2 (ctx, next) {
    calls.push(2)
    ctx.res = { message: 'Hello '.concat(ctx.req.name) }
    calls.push(5)
  }

  async function fn3 (ctx, next) {
    calls.push(3)
    await next()
    calls.push(4)
  }

  app.use('sayHello', fn1, fn2, fn3)
  const server = app.start(APP_HOST)
  t.truthy(server)

  const helloproto = grpc.load(PROTO_PATH).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  client.sayHello({ name: 'Bob' }, (err, response) => {
    t.ifError(err)
    t.truthy(response)
    t.is(response.message, 'Hello Bob')
    t.deepEqual(calls, [1, 2, 5, 6])
    app.close()
    t.end()
  })
})

test.after.always('guaranteed cleanup', t => {
  apps.forEach(app => app.close())
})

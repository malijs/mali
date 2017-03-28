import test from 'ava'
import path from 'path'
import grpc from 'grpc'
import hl from 'highland'
import async from 'async'
import _ from 'lodash'
const CallType = require('mali-call-types')

import Mali from '../lib'
import * as tu from './util'

const ARRAY_DATA = [
  { message: '1 foo' },
  { message: '2 bar' },
  { message: '3 asd' },
  { message: '4 qwe' },
  { message: '5 rty' },
  { message: '6 zxc' }
]

function getArrayData () {
  return _.cloneDeep(ARRAY_DATA)
}

function crashMapper (d) {
  if (d.message.indexOf(3) >= 0) {
    // cause a crash
    let str = JSON.stringify(d)
    str = str.concat('asdf')
    let no = JSON.parse(str)
    return no
  } else {
    d.message = d.message.toUpperCase()
    return d
  }
}

test.cb('should handle an error in the handler in req/res app', t => {
  t.plan(11)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    throw new Error('boom')
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  let errMsg
  let errCtx
  app.on('error', (err, ctx) => {
    errCtx = ctx
    errMsg = err.message
  })

  app.use({ sayHello })
  const server = app.start(APP_HOST)
  t.truthy(server)

  const helloproto = grpc.load(PROTO_PATH).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  client.sayHello({ name: 'Bob' }, (err, response) => {
    t.truthy(err)
    t.is(err.message, 'boom')
    t.falsy(response)
    t.is(errMsg, 'boom')
    t.truthy(errCtx)
    t.truthy(errCtx.call)
    t.truthy(errCtx.req)
    t.is(errCtx.name, 'SayHello')
    t.is(errCtx.type, CallType.UNARY)
    app.close().then(() => t.end())
  })
})

test.cb('should handle an error with code in the handler in req/res app', t => {
  t.plan(12)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    const err = new Error('crash')
    err.code = 2000
    throw err
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  let errMsg
  let errCtx
  app.on('error', (err, ctx) => {
    errCtx = ctx
    errMsg = err.message
  })

  app.use({ sayHello })
  const server = app.start(APP_HOST)
  t.truthy(server)

  const helloproto = grpc.load(PROTO_PATH).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  client.sayHello({ name: 'Bob' }, (err, response) => {
    t.truthy(err)
    t.is(err.message, 'crash')
    t.is(err.code, 2000)
    t.falsy(response)
    t.is(errMsg, 'crash')
    t.truthy(errCtx)
    t.truthy(errCtx.call)
    t.truthy(errCtx.req)
    t.is(errCtx.name, 'SayHello')
    t.is(errCtx.type, CallType.UNARY)
    app.close().then(() => t.end())
  })
})

test.cb('should handle custom error in the handler in req/res app', t => {
  class MyCustomError extends Error {
    constructor (message, code) {
      super(message)
      this.code = code
    }
  }

  t.plan(12)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    throw new MyCustomError('burn', 1234)
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)

  let errMsg
  let errCtx
  app.on('error', (err, ctx) => {
    errCtx = ctx
    errMsg = err.message
  })

  app.use({ sayHello })
  const server = app.start(APP_HOST)
  t.truthy(server)

  const helloproto = grpc.load(PROTO_PATH).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  client.sayHello({ name: 'Bob' }, (err, response) => {
    t.truthy(err)
    t.is(err.message, 'burn')
    t.is(err.code, 1234)
    t.falsy(response)
    t.is(errMsg, 'burn')
    t.truthy(errCtx)
    t.truthy(errCtx.call)
    t.truthy(errCtx.req)
    t.is(errCtx.name, 'SayHello')
    t.is(errCtx.type, CallType.UNARY)
    app.close().then(() => t.end())
  })
})

test.cb('should handle an error in the handler in res stream app', t => {
  t.plan(13)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/resstream.proto')

  function listStuff (ctx) {
    const s = hl(getArrayData())
      .map(crashMapper)

    ctx.res = s
  }

  const app = new Mali(PROTO_PATH, 'ArgService')
  t.truthy(app)

  let errMsg1
  let errCtx
  app.on('error', (err, ctx) => {
    errCtx = ctx
    errMsg1 = err ? err.message : ''
  })

  app.use({ listStuff })
  const server = app.start(APP_HOST)
  t.truthy(server)

  const proto = grpc.load(PROTO_PATH).argservice
  const client = new proto.ArgService(APP_HOST, grpc.credentials.createInsecure())
  const call = client.listStuff({ message: 'Hello' })

  let dataCounter = 0
  call.on('data', msg => {
    dataCounter++
  })

  let errMsg2
  call.on('error', err => {
    errMsg2 = err ? err.message : ''
    if (!endCalled) {
      endCalled = true
      _.delay(() => {
        endTest()
      }, 200)
    }
  })

  let endCalled = false
  call.on('end', () => {
    if (!endCalled) {
      endCalled = true
      _.delay(() => {
        endTest()
      }, 200)
    }
  })

  function endTest () {
    t.true(dataCounter >= 1)
    t.truthy(errMsg1)
    t.truthy(errMsg2)
    t.true(endCalled)
    t.true(errMsg1.indexOf('Unexpected token') >= 0)
    t.true(errMsg2.indexOf('Unexpected token') >= 0)
    t.truthy(errCtx)
    t.truthy(errCtx.call)
    t.truthy(errCtx.req)
    t.is(errCtx.name, 'ListStuff')
    t.is(errCtx.type, CallType.RESPONSE_STREAM)
    app.close().then(() => t.end())
  }
})

test.cb('should handle an error in the handler in req stream app', t => {
  t.plan(12)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/reqstream.proto')

  async function writeStuff (ctx) {
    return new Promise((resolve, reject) => {
      hl(ctx.req)
        .map(crashMapper)
        .collect()
        .toCallback((err, r) => {
          if (err) {
            return reject(err)
          }

          ctx.res = {
            message: r.length.toString()
          }
          resolve()
        })
    })
  }

  const app = new Mali(PROTO_PATH, 'ArgService')
  t.truthy(app)

  let errMsg1
  let errCtx
  app.on('error', (err, ctx) => {
    errCtx = ctx
    errMsg1 = err ? err.message : ''
  })

  app.use({ writeStuff })
  const server = app.start(APP_HOST)
  t.truthy(server)

  let w = true
  let ended = false
  const proto = grpc.load(PROTO_PATH).argservice
  const client = new proto.ArgService(APP_HOST, grpc.credentials.createInsecure())
  const call = client.writeStuff((err, res) => {
    w = false
    ended = true
    t.truthy(err)
    t.truthy(err.message)
    t.true(errMsg1.indexOf('Unexpected token') >= 0)
    t.true(err.message.indexOf('Unexpected token') >= 0)
    t.falsy(res)
    t.truthy(errCtx)
    t.truthy(errCtx.call)
    t.truthy(errCtx.req)
    t.is(errCtx.name, 'WriteStuff')
    t.is(errCtx.type, CallType.REQUEST_STREAM)
    app.close().then(() => t.end())
  })

  call.on('error', () => {
    w = false
  })

  call.on('close', () => {
    w = false
  })

  call.on('finish', () => {
    w = false
  })

  async.eachSeries(getArrayData(), (d, asfn) => {
    if (w) {
      call.write(d)
    }
    _.delay(asfn, _.random(10, 50))
  }, () => {
    if (!ended) {
      call.end()
    }
  })
})

test('should handle error in response stream', async t => {
  t.plan(3)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/resstream.proto')

  const data = ['a', 'b', 'c', 'ERROR', 'd'];
  function listStuff (ctx) {
    const s = hl(data)
      .consume((err, d, push, next) => {
        setTimeout(() => {
          if (d === 'ERROR') {
            push(new Error('stream error'))
          } else {
            push(null, { message: d })
            next()
          }
        }, 10)
      })

    ctx.res = s
  }
  const app = new Mali(PROTO_PATH, 'ArgService')
  app.use({ listStuff })
  const appErrorPromise = new Promise(resolve => {
    app.on('error', err => {
      resolve(err);
    })
  })
  const server = app.start(APP_HOST)

  const proto = grpc.load(PROTO_PATH).argservice
  const client = new proto.ArgService(APP_HOST, grpc.credentials.createInsecure())
  const call = client.listStuff({ message: 'Hello' })
  const callErrorPromise = new Promise(resolve => {
    call.on('error', err => {
      resolve(err)
    })
  })
  const resData = []
  call.on('data', d => {
    resData.push(d)
  })
  call.on('end', () => {
    t.fail('not expecting end')
  })
  t.is((await appErrorPromise).message, 'stream error')
  t.is((await callErrorPromise).message, 'stream error')
  t.is(resData.length, 3)
})

test.cb('should handle an error in the handler of duplex call', t => {
  t.plan(13)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/duplex.proto')
  async function processStuff (ctx) {
    ctx.req.on('data', d => {
      ctx.req.pause()
      _.delay(() => {
        let ret = {}
        try {
          ret = crashMapper(d)
        } catch (e) {
          ctx.res.emit('error', e)
          return
        }
        ctx.res.write(ret)
        ctx.req.resume()
      }, _.random(50, 150))
    })

    ctx.req.on('end', () => {
      _.delay(() => {
        ctx.res.end()
      }, 200)
    })
  }

  const app = new Mali(PROTO_PATH, 'ArgService')
  t.truthy(app)

  let errMsg1 = ''
  let errCtx
  app.on('error', (err, ctx) => {
    errCtx = ctx
    errMsg1 = err ? err.message : ''
  })

  app.use({ processStuff })
  const server = app.start(APP_HOST)
  t.truthy(server)
  const proto = grpc.load(PROTO_PATH).argservice
  const client = new proto.ArgService(APP_HOST, grpc.credentials.createInsecure())
  const call = client.processStuff()

  let dataCounter = 0
  call.on('data', d => {
    dataCounter++
  })

  let errMsg2 = ''
  call.on('error', err2 => {
    errMsg2 = err2 ? err2.message : ''
    if (!endCalled) {
      endCalled = true
      _.delay(() => {
        endTest()
      }, 200)
    }
  })

  let endCalled = false
  call.on('end', () => {
    if (!endCalled) {
      endCalled = true
      _.delay(() => {
        endTest()
      }, 200)
    }
  })

  async.eachSeries(getArrayData(), (d, asfn) => {
    call.write(d)
    _.delay(asfn, _.random(10, 50))
  }, () => {
    call.end()
  })

  function endTest () {
    t.is(dataCounter, 2)
    t.truthy(errMsg1)
    t.truthy(errMsg2)
    t.true(endCalled)
    t.true(errMsg1.indexOf('Unexpected token') >= 0)
    t.true(errMsg2.indexOf('Unexpected token') >= 0)
    t.truthy(errCtx)
    t.truthy(errCtx.call)
    t.truthy(errCtx.req)
    t.is(errCtx.name, 'ProcessStuff')
    t.is(errCtx.type, CallType.DUPLEX)
    app.close().then(() => t.end())
  }
})

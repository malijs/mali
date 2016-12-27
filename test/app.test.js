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
    app.close()
    t.end()
  })
})

test.cb('should handle an error in the handler in res stream app', t => {
  t.plan(13)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/resstream.proto')

  function listStuff (ctx) {
    const s = hl(ARRAY_DATA)
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
  })

  let endCalled = false
  call.on('end', () => {
    endCalled = true
    _.delay(() => {
      endTest()
    }, 200)
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
    app.close()
    t.end()
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

  const proto = grpc.load(PROTO_PATH).argservice
  const client = new proto.ArgService(APP_HOST, grpc.credentials.createInsecure())
  const call = client.writeStuff((err, res) => {
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
    app.close()
    t.end()
  })

  async.eachSeries(ARRAY_DATA, (d, asfn) => {
    call.write(d)
    _.delay(asfn, _.random(10, 50))
  }, () => {
    call.end()
  })
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
  })

  let endCalled = false
  call.on('end', () => {
    endCalled = true
    _.delay(() => {
      endTest()
    }, 200)
  })

  async.eachSeries(ARRAY_DATA, (d, asfn) => {
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
    app.close()
    t.end()
  }
})

test('should set development env when NODE_ENV missing', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
  const NODE_ENV = process.env.NODE_ENV
  process.env.NODE_ENV = ''

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  process.env.NODE_ENV = NODE_ENV
  t.is(app.env, 'development')
  app.close()
})

test('app.inspect should return app properties', t => {
  const util = require('util')
  const NODE_ENV = process.env.NODE_ENV
  process.env.NODE_ENV = ''
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
  const app = new Mali(PROTO_PATH, 'Greeter')
  app.port = 50000
  t.truthy(app)
  const str = util.inspect(app)
  process.env.NODE_ENV = NODE_ENV
  t.is('{ context: Context {},\n  env: \'development\',\n  name: \'Greeter\',\n  port: 50000 }', str)
})

test.cb('should handle req/res request', t => {
  t.plan(5)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
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
    app.close()
    t.end()
  })
})

test.cb('should handle res stream request', t => {
  t.plan(3)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/resstream.proto')

  function listStuff (ctx) {
    ctx.res = hl(_.cloneDeep(ARRAY_DATA))
      .map(d => {
        d.message = d.message.toUpperCase()
        return d
      })
  }

  const app = new Mali(PROTO_PATH, 'ArgService')
  t.truthy(app)
  app.use({ listStuff })
  const server = app.start(APP_HOST)
  t.truthy(server)

  const proto = grpc.load(PROTO_PATH).argservice
  const client = new proto.ArgService(APP_HOST, grpc.credentials.createInsecure())
  const call = client.listStuff({ message: 'Hello' })

  const resData = []
  call.on('data', d => {
    resData.push(d.message)
  })

  call.on('end', () => {
    _.delay(() => {
      endTest()
    }, 200)
  })

  function endTest () {
    t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
    app.close()
    t.end()
  }
})

test.cb('should handle req stream app', t => {
  t.plan(6)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/reqstream.proto')

  async function writeStuff (ctx) {
    return new Promise((resolve, reject) => {
      hl(ctx.req)
        .map(d => {
          return d.message.toUpperCase()
        })
        .collect()
        .toCallback((err, r) => {
          if (err) {
            return reject(err)
          }

          ctx.res = {
            message: r.join(':')
          }
          resolve()
        })
    })
  }

  const app = new Mali(PROTO_PATH, 'ArgService')
  t.truthy(app)
  app.use({ writeStuff })
  const server = app.start(APP_HOST)
  t.truthy(server)

  const proto = grpc.load(PROTO_PATH).argservice
  const client = new proto.ArgService(APP_HOST, grpc.credentials.createInsecure())
  const call = client.writeStuff((err, res) => {
    t.ifError(err)
    t.truthy(res)
    t.truthy(res.message)
    t.is(res.message, '1 FOO:2 BAR:3 ASD:4 QWE:5 RTY:6 ZXC')
    app.close()
    t.end()
  })

  async.eachSeries(ARRAY_DATA, (d, asfn) => {
    call.write(d)
    _.delay(asfn, _.random(10, 50))
  }, () => {
    call.end()
  })
})

test.cb('should handle an error in the handler of duplex call', t => {
  t.plan(3)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/duplex.proto')
  async function processStuff (ctx) {
    ctx.req.on('data', d => {
      ctx.req.pause()
      _.delay(() => {
        let ret = {
          message: d.message.toUpperCase()
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

  app.use({ processStuff })
  const server = app.start(APP_HOST)
  t.truthy(server)

  const proto = grpc.load(PROTO_PATH).argservice
  const client = new proto.ArgService(APP_HOST, grpc.credentials.createInsecure())
  const call = client.processStuff()

  let resData = []
  call.on('data', d => {
    resData.push(d.message)
  })

  call.on('end', () => {
    _.delay(() => {
      endTest()
    }, 200)
  })

  async.eachSeries(ARRAY_DATA, (d, asfn) => {
    call.write(d)
    _.delay(asfn, _.random(10, 50))
  }, () => {
    call.end()
  })

  function endTest () {
    t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
    app.close()
    t.end()
  }
})

test.cb('should start multipe servers from same application and handle requests', t => {
  t.plan(10)
  const APP_HOST1 = tu.getHost()
  const APP_HOST2 = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server1 = app.start(APP_HOST1)
  const server2 = app.start(APP_HOST2)
  t.truthy(server1)
  t.truthy(server2)
  t.truthy(Array.isArray(app.servers))
  t.is(app.servers.length, 2)

  const helloproto = grpc.load(PROTO_PATH).helloworld
  const client = new helloproto.Greeter(APP_HOST1, grpc.credentials.createInsecure())
  const client2 = new helloproto.Greeter(APP_HOST2, grpc.credentials.createInsecure())

  async.parallel({
    req1: aecb => client.sayHello({ name: 'Bob' }, aecb),
    req2: aecb => client2.sayHello({ name: 'Kate' }, aecb)
  }, (err, results) => {
    t.ifError(err)
    t.truthy(results.req1)
    t.is(results.req1.message, 'Hello Bob')
    t.truthy(results.req2)
    t.is(results.req2.message, 'Hello Kate')
    app.close()
    t.end()
  })
})

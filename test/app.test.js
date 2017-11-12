import test from 'ava'
import path from 'path'
import grpc from 'grpc'
import hl from 'highland'
import async from 'async'
import _ from 'lodash'

import Mali from '../'
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

test('should set development env when NODE_ENV missing', t => {
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
  const NODE_ENV = process.env.NODE_ENV
  process.env.NODE_ENV = ''

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  process.env.NODE_ENV = NODE_ENV
  t.is(app.env, 'development')
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
    app.close().then(() => t.end())
  })
})

test.cb('should handle res stream request', t => {
  t.plan(3)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/resstream.proto')

  function listStuff (ctx) {
    ctx.res = hl(getArrayData())
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
    app.close().then(() => t.end())
  }
})

test.cb('should handle req stream app', t => {
  t.plan(6)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/reqstream.proto')

  async function doWork (inputStream) {
    return new Promise((resolve, reject) => {
      hl(inputStream)
        .map(d => {
          return d.message.toUpperCase()
        })
        .collect()
        .toCallback((err, r) => {
          if (err) {
            return reject(err)
          }

          resolve({
            message: r.join(':')
          })
        })
    })
  }

  async function writeStuff (ctx) {
    ctx.res = await doWork(ctx.req)
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
    app.close().then(() => t.end())
  })

  async.eachSeries(getArrayData(), (d, asfn) => {
    call.write(d)
    _.delay(asfn, _.random(10, 50))
  }, () => {
    call.end()
  })
})

test.cb('should handle duplex call', t => {
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
    endTest()
  })

  async.eachSeries(getArrayData(), (d, asfn) => {
    call.write(d)
    _.delay(asfn, _.random(10, 50))
  }, () => {
    call.end()
  })

  function endTest () {
    t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
    app.close().then(() => t.end())
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
    app.close().then(() => t.end())
  })
})

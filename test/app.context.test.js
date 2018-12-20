import test from 'ava'
import path from 'path'
import grpc from 'grpc'
import CallType from 'mali-call-types'
import hl from 'highland'
import async from 'async'
import _ from 'lodash'
import pMap from 'p-map'

import Mali from '../'
import * as tu from './util'

const pl = require('@grpc/proto-loader')

const ARRAY_DATA = [
  { message: '1 foo' },
  { message: '2 bar' },
  { message: '3 asd' },
  { message: '4 qwe' },
  { message: '5 rty' },
  { message: '6 zxc' }
]

const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

const apps = []

const APP1_HOST = tu.getHost()
const APP2_HOST = tu.getHost()

test.before('should merge properties', t => {
  function sayHello (ctx) {
    ctx.res = { message: ctx.msg }
  }

  const app1 = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app1)
  t.truthy(app1.context)
  app1.context.msg = 'app1 msg'
  apps.push(app1)

  app1.use({ sayHello })
  const server1 = app1.start(APP1_HOST)
  t.truthy(server1)

  const app2 = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app2)
  t.truthy(app2.context)
  apps.push(app2)

  app2.use({ sayHello })
  const server2 = app2.start(APP2_HOST)
  t.truthy(server2)
})

test.cb('should merge properties', t => {
  t.plan(4)
  const pd = pl.loadSync(PROTO_PATH)
  const helloproto = grpc.loadPackageDefinition(pd).helloworld

  const client = new helloproto.Greeter(APP1_HOST, grpc.credentials.createInsecure())
  client.sayHello({ name: 'Bob' }, (err, response) => {
    t.falsy(err)
    t.truthy(response)
    t.truthy(response.message)
    t.is(response.message, 'app1 msg')
    t.end()
  })
})

test.cb('should not affect the original prototype', t => {
  t.plan(3)
  const pd = pl.loadSync(PROTO_PATH)
  const helloproto = grpc.loadPackageDefinition(pd).helloworld

  const client = new helloproto.Greeter(APP2_HOST, grpc.credentials.createInsecure())
  client.sayHello({ name: 'Bob' }, (err, response) => {
    t.falsy(err)
    t.truthy(response)
    t.falsy(response.message)
    t.end()
  })
})

test.cb('should have correct properties for req / res', t => {
  t.plan(20)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    t.truthy(ctx)
    t.truthy(ctx.req)
    t.truthy(ctx.metadata)
    t.truthy(ctx.app)
    t.truthy(ctx.call)
    t.truthy(ctx.type)
    t.truthy(ctx.name)
    t.truthy(ctx.fullName)
    t.truthy(ctx.service)
    t.truthy(ctx.package)
    t.is(ctx.name, 'SayHello')
    t.is(ctx.fullName, '/helloworld.Greeter/SayHello')
    t.is(ctx.service, 'Greeter')
    t.is(ctx.package, 'helloworld')
    t.is(ctx.type, CallType.UNARY)
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = app.start(APP_HOST)
  t.truthy(server)

  const pd = pl.loadSync(PROTO_PATH)
  const helloproto = grpc.loadPackageDefinition(pd).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  client.sayHello({ name: 'Bob' }, (err, response) => {
    t.falsy(err)
    t.truthy(response)
    t.is(response.message, 'Hello Bob')
    app.close().then(() => t.end())
  })
})

test.cb('should have correct properties for req / res with proto', t => {
  t.plan(20)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  const messages = require('./static/helloworld_pb')

  function sayHello (ctx) {
    t.truthy(ctx)
    t.truthy(ctx.req)
    t.truthy(ctx.metadata)
    t.truthy(ctx.app)
    t.truthy(ctx.call)
    t.truthy(ctx.type)
    t.truthy(ctx.name)
    t.truthy(ctx.fullName)
    t.truthy(ctx.service)
    t.truthy(ctx.package)
    t.is(ctx.name, 'sayHello')
    t.is(ctx.fullName, '/helloworld.GreeterService/sayHello')
    t.is(ctx.service, 'GreeterService')
    t.is(ctx.package, 'helloworld')
    t.is(ctx.type, CallType.UNARY)
    const reply = new messages.HelloReply()
    reply.setMessage('Hello ' + ctx.req.getName())
    ctx.res = reply
  }

  const services = require('./static/helloworld_grpc_pb')
  const app = new Mali(services)
  t.truthy(app)
  app.use({ sayHello })
  const server = app.start(APP_HOST)
  t.truthy(server)

  const pd = pl.loadSync(PROTO_PATH)
  const helloproto = grpc.loadPackageDefinition(pd).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  client.sayHello({ name: 'Bob' }, (err, response) => {
    t.falsy(err)
    t.truthy(response)
    t.is(response.message, 'Hello Bob')
    app.close().then(() => t.end())
  })
})

test.cb('should have correct properties res stream request', t => {
  t.plan(18)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/resstream.proto')

  function listStuff (ctx) {
    t.truthy(ctx)
    t.truthy(ctx.req)
    t.truthy(ctx.metadata)
    t.truthy(ctx.app)
    t.truthy(ctx.call)
    t.truthy(ctx.type)
    t.truthy(ctx.name)
    t.truthy(ctx.fullName)
    t.truthy(ctx.service)
    t.truthy(ctx.package)
    t.is(ctx.name, 'ListStuff')
    t.is(ctx.fullName, '/argservice.ArgService/ListStuff')
    t.is(ctx.service, 'ArgService')
    t.is(ctx.package, 'argservice')
    t.is(ctx.type, CallType.RESPONSE_STREAM)

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

  const pd = pl.loadSync(PROTO_PATH)
  const proto = grpc.loadPackageDefinition(pd).argservice
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

test.cb('should have correct properties for req stream', t => {
  t.plan(21)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/reqstream.proto')

  async function writeStuff (ctx) {
    t.truthy(ctx)
    t.truthy(ctx.req)
    t.truthy(ctx.metadata)
    t.truthy(ctx.app)
    t.truthy(ctx.call)
    t.truthy(ctx.type)
    t.truthy(ctx.name)
    t.truthy(ctx.fullName)
    t.truthy(ctx.service)
    t.truthy(ctx.package)
    t.is(ctx.name, 'WriteStuff')
    t.is(ctx.fullName, '/argservice.ArgService/WriteStuff')
    t.is(ctx.service, 'ArgService')
    t.is(ctx.package, 'argservice')
    t.is(ctx.type, CallType.REQUEST_STREAM)

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

  const pd = pl.loadSync(PROTO_PATH)
  const proto = grpc.loadPackageDefinition(pd).argservice
  const client = new proto.ArgService(APP_HOST, grpc.credentials.createInsecure())
  const call = client.writeStuff((err, res) => {
    t.falsy(err)
    t.truthy(res)
    t.truthy(res.message)
    t.is(res.message, '1 FOO:2 BAR:3 ASD:4 QWE:5 RTY:6 ZXC')
    app.close().then(() => t.end())
  })

  async.eachSeries(ARRAY_DATA, (d, asfn) => {
    call.write(d)
    _.delay(asfn, _.random(10, 50))
  }, () => {
    call.end()
  })
})

test.cb('should have correct properties for duplex call', t => {
  t.plan(19)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/duplex.proto')

  async function processStuff (ctx) {
    t.truthy(ctx)
    t.truthy(ctx.req)
    t.truthy(ctx.metadata)
    t.truthy(ctx.app)
    t.truthy(ctx.res)
    t.truthy(ctx.call)
    t.truthy(ctx.type)
    t.truthy(ctx.name)
    t.truthy(ctx.fullName)
    t.truthy(ctx.service)
    t.truthy(ctx.package)
    t.is(ctx.name, 'ProcessStuff')
    t.is(ctx.fullName, '/argservice.ArgService/ProcessStuff')
    t.is(ctx.service, 'ArgService')
    t.is(ctx.package, 'argservice')
    t.is(ctx.type, CallType.DUPLEX)

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

  const pd = pl.loadSync(PROTO_PATH)
  const proto = grpc.loadPackageDefinition(pd).argservice
  const client = new proto.ArgService(APP_HOST, grpc.credentials.createInsecure())
  const call = client.processStuff()

  let resData = []
  call.on('data', d => {
    resData.push(d.message)
  })

  call.on('end', () => {
    endTest()
  })

  async.eachSeries(ARRAY_DATA, (d, asfn) => {
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

test.after.always('cleanup', async t => {
  await pMap(apps, app => app.close())
})

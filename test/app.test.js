import test from 'ava'
import path from 'path'
import grpc from 'grpc'
import hl from 'highland'
import async from 'async'
import _ from 'lodash'

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
  app.foo = 'bar'
  t.truthy(app)
  const str = util.inspect(app)
  process.env.NODE_ENV = NODE_ENV
  t.is('{ ports: [],\n  context: Context {},\n  env: \'development\',\n  name: \'Greeter\',\n  foo: \'bar\' }', str)
})

test.cb('app.start() with a default port from OS when no params given', t => {
  t.plan(5)
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = app.start()
  t.truthy(server)
  const ports = app.ports
  t.truthy(ports)
  t.is(ports.length, 1)
  t.true(typeof ports[0] === 'number')
  app.close().then(() => t.end())
})

test.cb('app.start() with a default port from OS with object param', t => {
  t.plan(5)
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = app.start(grpc.ServerCredentials.createInsecure())
  t.truthy(server)
  const ports = app.ports
  t.truthy(ports)
  t.is(ports.length, 1)
  t.true(typeof ports[0] === 'number')
  app.close().then(() => t.end())
})

test.cb('app.start() with a default port from OS with "127.0.0.1:0"', t => {
  t.plan(5)
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = app.start('127.0.0.1:0')
  t.truthy(server)
  const ports = app.ports
  t.truthy(ports)
  t.is(ports.length, 1)
  t.true(typeof ports[0] === 'number')
  app.close().then(() => t.end())
})

test.cb('app.start() with a default port from OS with ""', t => {
  t.plan(5)
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = app.start('')
  t.truthy(server)
  const ports = app.ports
  t.truthy(ports)
  t.is(ports.length, 1)
  t.true(typeof ports[0] === 'number')
  app.close().then(() => t.end())
})

test.cb('app.start() with param', t => {
  t.plan(5)
  const PORT = tu.getPort()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = app.start(`127.0.0.1:0${PORT}`)
  t.truthy(server)
  const ports = app.ports
  t.truthy(ports)
  t.is(ports.length, 1)
  t.is(ports[0], PORT)
  app.close().then(() => t.end())
})

test.cb('app.start() with port param and invalid creds', t => {
  t.plan(5)
  const PORT = tu.getPort()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = app.start(`127.0.0.1:0${PORT}`, 'foo')
  t.truthy(server)
  const ports = app.ports
  t.truthy(ports)
  t.is(ports.length, 1)
  t.is(ports[0], PORT)
  app.close().then(() => t.end())
})

test.cb('app.start() should throw when binding to taken port', t => {
  t.plan(3)
  function sayHello (ctx) {
    ctx.res = { message: `Hello ${ctx.req.name}!` }
  }

  const app = new Mali({ file: 'protos/multipkg.proto', root: __dirname })
  const port = tu.getHost()
  console.log(port)

  app.use({ sayHello })
  const server = app.start(port)
  t.truthy(server)

  const app2 = new Mali({ file: 'protos/multipkg.proto', root: __dirname })
  app2.use({ sayHello })

  const error = t.throws(() => {
    console.log('starting')
    app2.start(port)
    console.log('started')
  }, Error)

  console.log(error)
  t.is(error.message, `Failed to bind to port: ${port}`)

  app.close().then(() => t.end())
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

  const pd = pl.loadSync(PROTO_PATH)
  const helloproto = grpc.loadPackageDefinition(pd).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  client.sayHello({ name: 'Bob' }, (err, response) => {
    t.ifError(err)
    t.truthy(response)
    t.is(response.message, 'Hello Bob')
    app.close().then(() => t.end())
  })
})

test.cb('should handle req/res request where res is a promise', t => {
  t.plan(5)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = new Promise((resolve, reject) => {
      setTimeout(() => {
        resolve({ message: 'Hello ' + ctx.req.name })
      }, 40)
    })
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = app.start(APP_HOST)
  t.truthy(server)

  const pd = pl.loadSync(PROTO_PATH)
  const helloproto = grpc.loadPackageDefinition(pd).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  client.sayHello({ name: 'Jim' }, (err, response) => {
    t.ifError(err)
    t.truthy(response)
    t.is(response.message, 'Hello Jim')
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

  const pd = pl.loadSync(PROTO_PATH)
  const proto = grpc.loadPackageDefinition(pd).argservice
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
  t.plan(11)
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
  t.is(app.ports.length, 2)

  const pd = pl.loadSync(PROTO_PATH)
  const helloproto = grpc.loadPackageDefinition(pd).helloworld
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

test.cb('should work with multi package proto', t => {
  t.plan(4)
  function sayHello (ctx) {
    ctx.res = { message: `Hello ${ctx.req.name}!` }
  }

  const app = new Mali({ file: 'protos/multipkg.proto', root: __dirname })
  const port = tu.getHost()

  app.use({ sayHello })
  const server = app.start(port)
  t.truthy(server)

  const pd = pl.loadSync('protos/multipkg.proto', { includeDirs: [ __dirname ] })
  const greet = grpc.loadPackageDefinition(pd).greet
  const client = new greet.Greeter(port, grpc.credentials.createInsecure())
  client.sayHello({ name: 'Kate' }, (err, response) => {
    t.ifError(err)
    t.truthy(response)
    t.is(response.message, 'Hello Kate!')
    app.close().then(() => t.end())
  })
})

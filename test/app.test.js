const test = require('ava')
const path = require('path')
const grpc = require('@grpc/grpc-js')
const hl = require('highland')
const async = require('async')
const _ = require('lodash')
const isCI = require('is-ci')

const Mali = require('../')
const tu = require('./util')

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
  t.is('{ ports: [],\n  context: Context {},\n  env: \'development\',\n  name: \'Greeter\',\n  foo: \'bar\' }'.replace(/\s/g, ''), str.replace(/\s/g, ''))
})

test('app.start() with a default port from OS when no params given', async t => {
  t.plan(5)
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = await app.start()
  t.truthy(server)
  const ports = app.ports
  t.truthy(ports)
  t.is(ports.length, 1)
  t.true(typeof ports[0] === 'number')
  await app.close()
})

test('app.start() should start and not throw with incomplete API', async t => {
  t.plan(5)
  const PROTO_PATH = path.resolve(__dirname, './protos/transform.proto')

  function upper (ctx) {
    ctx.res = { message: ctx.req.message.toUpperCase() }
  }

  const app = new Mali(PROTO_PATH, 'TransformService')
  t.truthy(app)
  app.use({ upper })
  const server = await app.start()
  t.truthy(server)
  const ports = app.ports
  t.truthy(ports)
  t.is(ports.length, 1)
  t.true(typeof ports[0] === 'number')
  await app.close()
})

test('app.start() with a default port from OS with object param', async t => {
  t.plan(5)
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = await app.start(grpc.ServerCredentials.createInsecure())
  t.truthy(server)
  const ports = app.ports
  t.truthy(ports)
  t.is(ports.length, 1)
  t.true(typeof ports[0] === 'number')
  await app.close()
})

test('app.start() with a default port from OS with "127.0.0.1:0"', async t => {
  t.plan(5)
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = await app.start('127.0.0.1:0')
  t.truthy(server)
  const ports = app.ports
  t.truthy(ports)
  t.is(ports.length, 1)
  t.true(typeof ports[0] === 'number')
  await app.close()
})

test('app.start() with a default port from OS with ""', async t => {
  t.plan(5)
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = await app.start('')
  t.truthy(server)
  const ports = app.ports
  t.truthy(ports)
  t.is(ports.length, 1)
  t.true(typeof ports[0] === 'number')
  await app.close()
})

test('app.start() with param', async t => {
  t.plan(5)
  const PORT = tu.getPort()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = await app.start(`127.0.0.1:0${PORT}`)
  t.truthy(server)
  const ports = app.ports
  t.truthy(ports)
  t.is(ports.length, 1)
  t.is(ports[0], PORT)
  await app.close()
})

test('app.start() with port param and invalid creds', async t => {
  t.plan(5)
  const PORT = tu.getPort()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = await app.start(`127.0.0.1:0${PORT}`, 'foo')
  t.truthy(server)
  const ports = app.ports
  t.truthy(ports)
  t.is(ports.length, 1)
  t.is(ports[0], PORT)
  await app.close()
})

test.cb('app.start() should throw when binding to taken port', t => {
  // workround for https://github.com/travis-ci/travis-ci/issues/9918
  if (isCI) {
    t.pass()
    t.end()
    return
  }

  t.plan(3)
  function sayHello (ctx) {
    ctx.res = { message: `Hello ${ctx.req.name}!` }
  }

  const app = new Mali({ file: 'protos/multipkg.proto', root: __dirname })
  const port = tu.getHost()

  app.use({ sayHello })
  app.start(port).then(server => {
    t.truthy(server)

    const app2 = new Mali({ file: 'protos/multipkg.proto', root: __dirname })
    app2.use({ sayHello })

    app2.start(`0.0.0.0:${app.ports[0]}`).catch(error => {
      console.log(error)
      t.true(error instanceof Error)
      t.is(error.message, 'No address added out of total 1 resolved')
      app.close().then(() => t.end())
    })
  })
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
  app.start(APP_HOST).then(server => {
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
})

test.cb('should handle multiple protos request', t => {
  t.plan(5)
  const APP_HOST = tu.getHost()
  const PROTO_ROOT_FOLDER = path.resolve(__dirname, './protos')
  const PROTO_ROOT_MULTIPLE = path.resolve(__dirname, './protosnewroute')
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali()
  t.truthy(app)
  console.log(PROTO_ROOT_MULTIPLE)
  console.log(PROTO_ROOT_FOLDER)
  app.addService({ root: [PROTO_ROOT_MULTIPLE, PROTO_ROOT_FOLDER], file: 'helloworld.proto' }, 'helloworld.Greeter')
  app.use('helloworld.Greeter', 'SayHello', sayHello)
  app.start(APP_HOST).then(server => {
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
})

test.cb('should handle multiple protos with second folder definitions request', t => {
  t.plan(5)
  const APP_HOST = tu.getHost()
  const PROTO_ROOT_FOLDER = path.resolve(__dirname, './protos')
  const PROTO_ROOT_MULTIPLE = path.resolve(__dirname, './protosnewroute')
  const PROTO_PATH = path.resolve(__dirname, './protosnewroute/hellomultiple.proto')

  function sayMultiple (ctx) {
    ctx.res = { message: 'Hello Multiple ' + ctx.req.name }
  }

  const app = new Mali()
  t.truthy(app)
  console.log(PROTO_ROOT_MULTIPLE)
  console.log(PROTO_ROOT_FOLDER)
  app.addService({ root: [PROTO_ROOT_MULTIPLE, PROTO_ROOT_FOLDER], file: 'hellomultiple.proto' }, 'multiple.hello.GreeterMultiple')
  app.use('multiple.hello.GreeterMultiple', 'SayMultiple', sayMultiple)
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    const pd = pl.loadSync(PROTO_PATH)
    const helloproto = grpc.loadPackageDefinition(pd).multiple.hello
    const client = new helloproto.GreeterMultiple(APP_HOST, grpc.credentials.createInsecure())
    client.sayMultiple({ name: 'Bob' }, (err, response) => {
      t.falsy(err)
      t.truthy(response)
      t.is(response.message, 'Hello Multiple Bob')
      app.close().then(() => t.end())
    })
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
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    const pd = pl.loadSync(PROTO_PATH)
    const helloproto = grpc.loadPackageDefinition(pd).helloworld
    const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
    client.sayHello({ name: 'Jim' }, (err, response) => {
      t.falsy(err)
      t.truthy(response)
      t.is(response.message, 'Hello Jim')
      app.close().then(() => t.end())
    })
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
  app.start(APP_HOST).then(server => {
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
  app.start(APP_HOST).then(server => {
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

    async.eachSeries(getArrayData(), (d, asfn) => {
      call.write(d)
      _.delay(asfn, _.random(10, 50))
    }, () => {
      call.end()
    })
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
        const ret = {
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
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    const pd = pl.loadSync(PROTO_PATH)
    const proto = grpc.loadPackageDefinition(pd).argservice
    const client = new proto.ArgService(APP_HOST, grpc.credentials.createInsecure())
    const call = client.processStuff()

    const resData = []
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
  app.start(APP_HOST1).then(server1 => {
    app.start(APP_HOST2).then(server2 => {
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
        t.falsy(err)
        t.truthy(results.req1)
        t.is(results.req1.message, 'Hello Bob')
        t.truthy(results.req2)
        t.is(results.req2.message, 'Hello Kate')
        app.close().then(() => t.end())
      })
    })
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
  app.start(port).then(server => {
    t.truthy(server)

    const pd = pl.loadSync('protos/multipkg.proto', { includeDirs: [__dirname] })
    const greet = grpc.loadPackageDefinition(pd).greet
    const client = new greet.Greeter(port, grpc.credentials.createInsecure())
    client.sayHello({ name: 'Kate' }, (err, response) => {
      t.falsy(err)
      t.truthy(response)
      t.is(response.message, 'Hello Kate!')
      app.close().then(() => t.end())
    })
  })
})

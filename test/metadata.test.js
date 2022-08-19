const test = require('ava')
const path = require('path')
const grpc = require('@grpc/grpc-js')
const hl = require('highland')
const async = require('async')
const _ = require('lodash')
const Stream = require('stream')

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

const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
const pd = pl.loadSync(PROTO_PATH)
const helloproto = grpc.loadPackageDefinition(pd).helloworld

const ARG_PROTO_PATH = path.resolve(__dirname, './protos/resstream.proto')
const apd = pl.loadSync(ARG_PROTO_PATH)
const argproto = grpc.loadPackageDefinition(apd).argservice

const DUPLEX_PROTO_PATH = path.resolve(__dirname, './protos/duplex.proto')
const dpd = pl.loadSync(DUPLEX_PROTO_PATH)
const duplexproto = grpc.loadPackageDefinition(dpd).argservice

test.cb('req/res: no metadata', t => {
  t.plan(14)
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

    let metadata
    let status

    const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
    const call = client.sayHello({ name: 'Bob' }, (err, response) => {
      setTimeout(() => {
        t.falsy(err)
        t.truthy(response)
        t.is(response.message, 'Hello Bob')
        t.truthy(metadata)
        t.true(metadata instanceof grpc.Metadata)
        const header = metadata.getMap()
        t.is(header['content-type'], 'application/grpc+proto')
        t.truthy(header.date)
        t.truthy(status)
        t.true(typeof status.code === 'number')
        t.truthy(status.metadata)
        t.true(status.metadata instanceof grpc.Metadata)
        const trailer = status.metadata.getMap()
        t.deepEqual(trailer, {})
        app.close().then(() => t.end())
      }, 250)
    })

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })
  })
})

test.cb('req/res: header metadata set', t => {
  t.plan(15)
  const APP_HOST = tu.getHost()

  function sayHello (ctx) {
    ctx.set('foo', 'bar')
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status

    const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
    const call = client.sayHello({ name: 'Bob' }, (err, response) => {
      setTimeout(() => {
        t.falsy(err)
        t.truthy(response)
        t.is(response.message, 'Hello Bob')
        t.truthy(metadata)
        t.true(metadata instanceof grpc.Metadata)
        const header = metadata.getMap()
        t.is(header.foo, 'bar')
        t.is(header['content-type'], 'application/grpc+proto')
        t.truthy(header.date)
        t.truthy(status)
        t.true(typeof status.code === 'number')
        t.truthy(status.metadata)
        t.true(status.metadata instanceof grpc.Metadata)
        const trailer = status.metadata.getMap()
        t.deepEqual(trailer, {})
        app.close().then(() => t.end())
      }, 250)
    })

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })
  })
})

test.cb('req/res: header metadata set even if error occurred', t => {
  t.plan(15)
  const APP_HOST = tu.getHost()

  function sayHello (ctx) {
    ctx.set('foo', 'bar')
    throw Error('boom')
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status

    const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
    const call = client.sayHello({ name: 'Bob' }, (err, response) => {
      setTimeout(() => {
        t.truthy(err)
        t.true(err.message.indexOf('boom') >= 0)
        t.falsy(response)
        t.truthy(metadata)
        t.true(metadata instanceof grpc.Metadata)
        const header = metadata.getMap()
        t.is(header.foo, 'bar')
        t.is(header['content-type'], 'application/grpc+proto')
        t.truthy(header.date)
        t.truthy(status)
        t.true(typeof status.code === 'number')
        t.truthy(status.metadata)
        t.true(status.metadata instanceof grpc.Metadata)
        const trailer = status.metadata.getMap()
        t.deepEqual(trailer, {})
        app.close().then(() => t.end())
      }, 250)
    })

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })
  })
})

test.cb('req/res: header metadata sent using ctx.sendMetadata', t => {
  t.plan(15)
  const APP_HOST = tu.getHost()

  function sayHello (ctx) {
    ctx.sendMetadata({ baz: 'foo' })
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
    const call = client.sayHello({ name: 'Bob' }, (err, response) => {
      setTimeout(() => {
        t.falsy(err)
        t.truthy(response)
        t.is(response.message, 'Hello Bob')
        t.truthy(metadata)
        t.true(metadata instanceof grpc.Metadata)
        const header = metadata.getMap()
        t.is(header.baz, 'foo')
        t.is(header['content-type'], 'application/grpc+proto')
        t.truthy(header.date)
        t.truthy(status)
        t.true(typeof status.code === 'number')
        t.truthy(status.metadata)
        t.true(status.metadata instanceof grpc.Metadata)
        const trailer = status.metadata.getMap()
        t.deepEqual(trailer, {})
        app.close().then(() => t.end())
      }, 250)
    })

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })
  })
})

test.cb('req/res: header metadata sent using ctx.sendMetadata(Metadata)', t => {
  t.plan(15)
  const APP_HOST = tu.getHost()

  function sayHello (ctx) {
    const md = new grpc.Metadata()
    md.set('foo', 'bar')
    ctx.sendMetadata(md)
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
    const call = client.sayHello({ name: 'Bob' }, (err, response) => {
      setTimeout(() => {
        t.falsy(err)
        t.truthy(response)
        t.is(response.message, 'Hello Bob')
        t.truthy(metadata)
        t.true(metadata instanceof grpc.Metadata)
        const header = metadata.getMap()
        t.is(header.foo, 'bar')
        t.is(header['content-type'], 'application/grpc+proto')
        t.truthy(header.date)
        t.truthy(status)
        t.true(typeof status.code === 'number')
        t.truthy(status.metadata)
        t.true(status.metadata instanceof grpc.Metadata)
        const trailer = status.metadata.getMap()
        t.deepEqual(trailer, {})
        app.close().then(() => t.end())
      }, 250)
    })

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })
  })
})

test.cb('req/res: header metadata set and sent using ctx.sendMetadata', t => {
  t.plan(15)
  const APP_HOST = tu.getHost()

  function sayHello (ctx) {
    ctx.set('foo', 'bar')
    ctx.sendMetadata()
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
    const call = client.sayHello({ name: 'Bob' }, (err, response) => {
      setTimeout(() => {
        t.falsy(err)
        t.truthy(response)
        t.is(response.message, 'Hello Bob')
        t.truthy(metadata)
        t.true(metadata instanceof grpc.Metadata)
        const header = metadata.getMap()
        t.is(header.foo, 'bar')
        t.is(header['content-type'], 'application/grpc+proto')
        t.truthy(header.date)
        t.truthy(status)
        t.true(typeof status.code === 'number')
        t.truthy(status.metadata)
        t.true(status.metadata instanceof grpc.Metadata)
        const trailer = status.metadata.getMap()
        t.deepEqual(trailer, {})
        app.close().then(() => t.end())
      }, 250)
    })

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })
  })
})

test.cb('req/res: header metadata set and then new metadata sent using ctx.sendMetadata', t => {
  t.plan(16)
  const APP_HOST = tu.getHost()

  function sayHello (ctx) {
    ctx.set('foo', 'bar')
    ctx.sendMetadata({ biz: 'baz' })
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
    const call = client.sayHello({ name: 'Bob' }, (err, response) => {
      setTimeout(() => {
        t.falsy(err)
        t.truthy(response)
        t.is(response.message, 'Hello Bob')
        t.truthy(metadata)
        t.true(metadata instanceof grpc.Metadata)
        const header = metadata.getMap()
        t.is(header.biz, 'baz')
        t.is(header.foo, undefined)
        t.is(header['content-type'], 'application/grpc+proto')
        t.truthy(header.date)
        t.truthy(status)
        t.true(typeof status.code === 'number')
        t.truthy(status.metadata)
        t.true(status.metadata instanceof grpc.Metadata)
        const trailer = status.metadata.getMap()
        t.deepEqual(trailer, {})
        app.close().then(() => t.end())
      }, 250)
    })

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })
  })
})

test.cb(
  'req/res: header metadata ctx.sendMetadata and then set new metadata, should get first',
  t => {
    t.plan(16)
    const APP_HOST = tu.getHost()

    function sayHello (ctx) {
      ctx.sendMetadata({ biz: 'baz' })
      ctx.set('foo', 'bar')
      ctx.res = { message: 'Hello ' + ctx.req.name }
    }

    const app = new Mali(PROTO_PATH, 'Greeter')
    t.truthy(app)
    app.use({ sayHello })
    app.start(APP_HOST).then(server => {
      t.truthy(server)

      let metadata
      let status
      const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
      const call = client.sayHello({ name: 'Bob' }, (err, response) => {
        setTimeout(() => {
          t.falsy(err)
          t.truthy(response)
          t.is(response.message, 'Hello Bob')
          t.truthy(metadata)
          t.true(metadata instanceof grpc.Metadata)
          const header = metadata.getMap()
          t.is(header.foo, undefined)
          t.is(header.biz, 'baz')
          t.is(header['content-type'], 'application/grpc+proto')
          t.truthy(header.date)
          t.truthy(status)
          t.true(typeof status.code === 'number')
          t.truthy(status.metadata)
          t.true(status.metadata instanceof grpc.Metadata)
          const trailer = status.metadata.getMap()
          t.deepEqual(trailer, {})
          app.close().then(() => t.end())
        }, 250)
      })

      call.on('metadata', md => {
        metadata = md
      })

      call.on('status', s => {
        status = s
      })
    })
  }
)

test.cb(
  'req/res: header metadata send invalid param usingctx.sendMetadata and then set new metadata, should get 2nd',
  t => {
    t.plan(15)
    const APP_HOST = tu.getHost()

    function sayHello (ctx) {
      ctx.set('foo', 'bar')
      ctx.sendMetadata(1)
      ctx.res = { message: 'Hello ' + ctx.req.name }
    }

    const app = new Mali(PROTO_PATH, 'Greeter')
    t.truthy(app)
    app.use({ sayHello })
    app.start(APP_HOST).then(server => {
      t.truthy(server)

      let metadata
      let status
      const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
      const call = client.sayHello({ name: 'Bob' }, (err, response) => {
        setTimeout(() => {
          t.falsy(err)
          t.truthy(response)
          t.is(response.message, 'Hello Bob')
          t.truthy(metadata)
          t.true(metadata instanceof grpc.Metadata)
          const header = metadata.getMap()
          t.is(header.foo, 'bar')
          t.is(header['content-type'], 'application/grpc+proto')
          t.truthy(header.date)
          t.truthy(status)
          t.true(typeof status.code === 'number')
          t.truthy(status.metadata)
          t.true(status.metadata instanceof grpc.Metadata)
          const trailer = status.metadata.getMap()
          t.deepEqual(trailer, {})
          app.close().then(() => t.end())
        }, 250)
      })

      call.on('metadata', md => {
        metadata = md
      })

      call.on('status', s => {
        status = s
      })
    })
  }
)

test.cb('req/res: trailer metadata set', t => {
  t.plan(14)
  const APP_HOST = tu.getHost()

  function sayHello (ctx) {
    ctx.setStatus('foo', 'bar')
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
    const call = client.sayHello({ name: 'Bob' }, (err, response) => {
      setTimeout(() => {
        t.falsy(err)
        t.truthy(response)
        t.is(response.message, 'Hello Bob')
        t.truthy(metadata)
        t.true(metadata instanceof grpc.Metadata)
        const header = metadata.getMap()
        t.is(header['content-type'], 'application/grpc+proto')
        t.truthy(header.date)
        t.truthy(status)
        t.true(typeof status.code === 'number')
        t.truthy(status.metadata)
        t.true(status.metadata instanceof grpc.Metadata)
        const trailer = status.metadata.getMap()
        t.deepEqual(trailer, {
          foo: 'bar'
        })
        app.close().then(() => t.end())
      }, 250)
    })

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })
  })
})

test.cb('req/res: header and trailer metadata set', t => {
  t.plan(15)
  const APP_HOST = tu.getHost()

  function sayHello (ctx) {
    ctx.set('asdf', 'qwerty')
    ctx.setStatus('foo', 'bar')
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
    const call = client.sayHello({ name: 'Bob' }, (err, response) => {
      setTimeout(() => {
        t.falsy(err)
        t.truthy(response)
        t.is(response.message, 'Hello Bob')
        t.truthy(metadata)
        t.true(metadata instanceof grpc.Metadata)
        const header = metadata.getMap()
        t.is(header.asdf, 'qwerty')
        t.is(header['content-type'], 'application/grpc+proto')
        t.truthy(header.date)
        t.truthy(status)
        t.true(typeof status.code === 'number')
        t.truthy(status.metadata)
        t.true(status.metadata instanceof grpc.Metadata)
        const trailer = status.metadata.getMap()
        t.deepEqual(trailer, {
          foo: 'bar'
        })
        app.close().then(() => t.end())
      }, 250)
    })

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })
  })
})

test.cb('res stream: no metadata', t => {
  t.plan(12)
  const APP_HOST = tu.getHost()

  function listStuff (ctx) {
    ctx.res = hl(getArrayData()).map(d => {
      d.message = d.message.toUpperCase()
      return d
    })
  }

  const app = new Mali(ARG_PROTO_PATH, 'ArgService')
  t.truthy(app)
  app.use({ listStuff })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new argproto.ArgService(APP_HOST, grpc.credentials.createInsecure())
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

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })

    function endTest () {
      t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.is(header['content-type'], 'application/grpc+proto')
      t.truthy(header.date)
      t.truthy(status)
      t.true(typeof status.code === 'number')
      t.truthy(status.metadata)
      t.true(status.metadata instanceof grpc.Metadata)
      const trailer = status.metadata.getMap()
      t.deepEqual(trailer, {})
      app.close().then(() => t.end())
    }
  })
})

test.cb('res stream: header metadata set', t => {
  t.plan(13)
  const APP_HOST = tu.getHost()

  function listStuff (ctx) {
    ctx.set('foo', 'bar')
    ctx.res = hl(getArrayData()).map(d => {
      d.message = d.message.toUpperCase()
      return d
    })
  }

  const app = new Mali(ARG_PROTO_PATH, 'ArgService')
  t.truthy(app)
  app.use({ listStuff })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new argproto.ArgService(APP_HOST, grpc.credentials.createInsecure())
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

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })

    function endTest () {
      t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.is(header.foo, 'bar')
      t.is(header['content-type'], 'application/grpc+proto')
      t.truthy(header.date)
      t.truthy(status)
      t.true(typeof status.code === 'number')
      t.truthy(status.metadata)
      t.true(status.metadata instanceof grpc.Metadata)
      const trailer = status.metadata.getMap()
      t.deepEqual(trailer, {})
      app.close().then(() => t.end())
    }
  })
})

test.cb('res stream: header metadata sendMetadata(object)', t => {
  t.plan(13)
  const APP_HOST = tu.getHost()

  function listStuff (ctx) {
    ctx.sendMetadata({ foo: 'bar' })
    ctx.res = hl(getArrayData()).map(d => {
      d.message = d.message.toUpperCase()
      return d
    })
  }

  const app = new Mali(ARG_PROTO_PATH, 'ArgService')
  t.truthy(app)
  app.use({ listStuff })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new argproto.ArgService(APP_HOST, grpc.credentials.createInsecure())
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

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })

    function endTest () {
      t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.is(header.foo, 'bar')
      t.is(header['content-type'], 'application/grpc+proto')
      t.truthy(header.date)
      t.truthy(status)
      t.true(typeof status.code === 'number')
      t.truthy(status.metadata)
      t.true(status.metadata instanceof grpc.Metadata)
      const trailer = status.metadata.getMap()
      t.deepEqual(trailer, {})
      app.close().then(() => t.end())
    }
  })
})

test.cb(
  'res stream: header metadata sendMetadata(object) with set after, set should not be sent',
  t => {
    t.plan(13)
    const APP_HOST = tu.getHost()

    function listStuff (ctx) {
      ctx.sendMetadata({ asdf: 'qwerty' })
      ctx.set('biz', 'baz')
      ctx.res = hl(getArrayData()).map(d => {
        d.message = d.message.toUpperCase()
        return d
      })
    }

    const app = new Mali(ARG_PROTO_PATH, 'ArgService')
    t.truthy(app)
    app.use({ listStuff })
    app.start(APP_HOST).then(server => {
      t.truthy(server)

      let metadata
      let status
      const client = new argproto.ArgService(APP_HOST, grpc.credentials.createInsecure())
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

      call.on('metadata', md => {
        metadata = md
      })

      call.on('status', s => {
        status = s
      })

      function endTest () {
        t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
        t.truthy(metadata)
        t.true(metadata instanceof grpc.Metadata)
        const header = metadata.getMap()
        t.is(header.asdf, 'qwerty')
        t.is(header['content-type'], 'application/grpc+proto')
        t.truthy(header.date)
        t.truthy(status)
        t.true(typeof status.code === 'number')
        t.truthy(status.metadata)
        t.true(status.metadata instanceof grpc.Metadata)
        const trailer = status.metadata.getMap()
        t.deepEqual(trailer, {})
        app.close().then(() => t.end())
      }
    })
  }
)

test.cb('res stream: trailer metadata set', t => {
  t.plan(12)
  const APP_HOST = tu.getHost()

  function listStuff (ctx) {
    ctx.setStatus('foo', 'bar')
    ctx.res = hl(getArrayData()).map(d => {
      d.message = d.message.toUpperCase()
      return d
    })
  }

  const app = new Mali(ARG_PROTO_PATH, 'ArgService')
  t.truthy(app)
  app.use({ listStuff })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new argproto.ArgService(APP_HOST, grpc.credentials.createInsecure())
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

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })

    function endTest () {
      t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.is(header['content-type'], 'application/grpc+proto')
      t.truthy(header.date)
      t.truthy(status)
      t.true(typeof status.code === 'number')
      t.truthy(status.metadata)
      t.true(status.metadata instanceof grpc.Metadata)
      const trailer = status.metadata.getMap()
      t.deepEqual(trailer, {
        foo: 'bar'
      })
      app.close().then(() => t.end())
    }
  })
})

test.cb('res stream: trailer metadata set and also sent using res.end() should get 2nd', t => {
  t.plan(12)
  const APP_HOST = tu.getHost()

  function listStuff (ctx) {
    ctx.setStatus('foo', 'bar')
    const readable = new Stream.Readable({ objectMode: true, read () { return true } })
    ctx.res = readable
    getArrayData().forEach((v, i) => {
      setTimeout(() => {
        readable.push({ message: v.message.toUpperCase() })
        if (i === ARRAY_DATA.length - 1) { ctx.call.end({ bar: 'biz' }) }
      }, 10)
    })
  }

  const app = new Mali(ARG_PROTO_PATH, 'ArgService')
  t.truthy(app)
  app.use({ listStuff })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new argproto.ArgService(APP_HOST, grpc.credentials.createInsecure())
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

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })

    function endTest () {
      t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.is(header['content-type'], 'application/grpc+proto')
      t.truthy(header.date)
      t.truthy(status)
      t.true(typeof status.code === 'number')
      t.truthy(status.metadata)
      t.true(status.metadata instanceof grpc.Metadata)
      const trailer = status.metadata.getMap()
      t.deepEqual(trailer, {
        bar: 'biz'
      })
      app.close().then(() => t.end())
    }
  })
})

test.cb('res stream: trailer metadata set and also use empty res.end() should get 1st', t => {
  t.plan(12)
  const APP_HOST = tu.getHost()

  function listStuff (ctx) {
    ctx.setStatus('foo', 'bar')
    ctx.res = hl(getArrayData())
      .map(d => {
        d.message = d.message.toUpperCase()
        return d
      })
      .on('end', () => {
        ctx.call.end()
      })
  }

  const app = new Mali(ARG_PROTO_PATH, 'ArgService')
  t.truthy(app)
  app.use({ listStuff })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new argproto.ArgService(APP_HOST, grpc.credentials.createInsecure())
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

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })

    function endTest () {
      t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.is(header['content-type'], 'application/grpc+proto')
      t.truthy(header.date)
      t.truthy(status)
      t.true(typeof status.code === 'number')
      t.truthy(status.metadata)
      t.true(status.metadata instanceof grpc.Metadata)
      const trailer = status.metadata.getMap()
      t.deepEqual(trailer, {
        foo: 'bar'
      })
      app.close().then(() => t.end())
    }
  })
})

test.cb('res stream: trailer metadata set and also use invalid res.end() should get 1st', t => {
  t.plan(12)
  const APP_HOST = tu.getHost()

  function listStuff (ctx) {
    ctx.setStatus('foo', 'bar')
    ctx.res = hl(getArrayData())
      .map(d => {
        d.message = d.message.toUpperCase()
        return d
      })
      .on('end', () => {
        ctx.call.end(1)
      })
  }

  const app = new Mali(ARG_PROTO_PATH, 'ArgService')
  t.truthy(app)
  app.use({ listStuff })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new argproto.ArgService(APP_HOST, grpc.credentials.createInsecure())
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

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })

    function endTest () {
      t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.is(header['content-type'], 'application/grpc+proto')
      t.truthy(header.date)
      t.truthy(status)
      t.true(typeof status.code === 'number')
      t.truthy(status.metadata)
      t.true(status.metadata instanceof grpc.Metadata)
      const trailer = status.metadata.getMap()
      t.deepEqual(trailer, {
        foo: 'bar'
      })
      app.close().then(() => t.end())
    }
  })
})

test.cb('res stream: header and trailer metadata set', t => {
  t.plan(13)
  const APP_HOST = tu.getHost()

  function listStuff (ctx) {
    ctx.set('asdf', 'qwerty')
    ctx.setStatus('foo', 'bar')
    ctx.res = hl(getArrayData()).map(d => {
      d.message = d.message.toUpperCase()
      return d
    })
  }

  const app = new Mali(ARG_PROTO_PATH, 'ArgService')
  t.truthy(app)
  app.use({ listStuff })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new argproto.ArgService(APP_HOST, grpc.credentials.createInsecure())
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

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })

    function endTest () {
      t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.is(header.asdf, 'qwerty')
      t.is(header['content-type'], 'application/grpc+proto')
      t.truthy(header.date)
      t.truthy(status)
      t.true(typeof status.code === 'number')
      t.truthy(status.metadata)
      t.true(status.metadata instanceof grpc.Metadata)
      const trailer = status.metadata.getMap()
      t.deepEqual(trailer, {
        foo: 'bar'
      })
      app.close().then(() => t.end())
    }
  })
})

test.cb('duplex: no metadata', t => {
  t.plan(12)
  const APP_HOST = tu.getHost()

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

  const app = new Mali(DUPLEX_PROTO_PATH, 'ArgService')
  t.truthy(app)

  app.use({ processStuff })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new duplexproto.ArgService(APP_HOST, grpc.credentials.createInsecure())
    const call = client.processStuff()

    const resData = []
    call.on('data', d => {
      resData.push(d.message)
    })

    call.on('end', () => {
      endTest()
    })

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })

    async.eachSeries(
      getArrayData(),
      (d, asfn) => {
        call.write(d)
        _.delay(asfn, _.random(10, 50))
      },
      () => {
        call.end()
      }
    )

    function endTest () {
      t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.is(header['content-type'], 'application/grpc+proto')
      t.truthy(header.date)
      t.truthy(status)
      t.true(typeof status.code === 'number')
      t.truthy(status.metadata)
      t.true(status.metadata instanceof grpc.Metadata)
      const trailer = status.metadata.getMap()
      t.deepEqual(trailer, {})
      app.close().then(() => t.end())
    }
  })
})

test.cb('duplex: header metadata set', t => {
  t.plan(13)
  const APP_HOST = tu.getHost()

  async function processStuff (ctx) {
    ctx.set('foo', 'bar')
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

  const app = new Mali(DUPLEX_PROTO_PATH, 'ArgService')
  t.truthy(app)

  app.use({ processStuff })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new duplexproto.ArgService(APP_HOST, grpc.credentials.createInsecure())
    const call = client.processStuff()

    const resData = []
    call.on('data', d => {
      resData.push(d.message)
    })

    call.on('end', () => {
      endTest()
    })

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })

    async.eachSeries(
      getArrayData(),
      (d, asfn) => {
        call.write(d)
        _.delay(asfn, _.random(10, 50))
      },
      () => {
        call.end()
      }
    )

    function endTest () {
      t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.is(header.foo, 'bar')
      t.is(header['content-type'], 'application/grpc+proto')
      t.truthy(header.date)
      t.truthy(status)
      t.true(typeof status.code === 'number')
      t.truthy(status.metadata)
      t.true(status.metadata instanceof grpc.Metadata)
      const trailer = status.metadata.getMap()
      t.deepEqual(trailer, {})
      app.close().then(() => t.end())
    }
  })
})

test.cb('duplex: header metadata sendMetadata(object)', t => {
  t.plan(13)
  const APP_HOST = tu.getHost()
  async function processStuff (ctx) {
    ctx.sendMetadata({ foo: 'bar' })
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

  const app = new Mali(DUPLEX_PROTO_PATH, 'ArgService')
  t.truthy(app)

  app.use({ processStuff })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new duplexproto.ArgService(APP_HOST, grpc.credentials.createInsecure())
    const call = client.processStuff()

    const resData = []
    call.on('data', d => {
      resData.push(d.message)
    })

    call.on('end', () => {
      endTest()
    })

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })

    async.eachSeries(
      getArrayData(),
      (d, asfn) => {
        call.write(d)
        _.delay(asfn, _.random(10, 50))
      },
      () => {
        call.end()
      }
    )

    function endTest () {
      t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.is(header.foo, 'bar')
      t.is(header['content-type'], 'application/grpc+proto')
      t.truthy(header.date)
      t.truthy(status)
      t.true(typeof status.code === 'number')
      t.truthy(status.metadata)
      t.true(status.metadata instanceof grpc.Metadata)
      const trailer = status.metadata.getMap()
      t.deepEqual(trailer, {})
      app.close().then(() => t.end())
    }
  })
})

test.cb('duplex: header metadata sendMetadata(object) with set after, set no effect', t => {
  t.plan(13)
  const APP_HOST = tu.getHost()
  async function processStuff (ctx) {
    ctx.sendMetadata({ asdf: 'qwerty' })
    ctx.set('foo', 'bar')
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

  const app = new Mali(DUPLEX_PROTO_PATH, 'ArgService')
  t.truthy(app)

  app.use({ processStuff })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new duplexproto.ArgService(APP_HOST, grpc.credentials.createInsecure())
    const call = client.processStuff()

    const resData = []
    call.on('data', d => {
      resData.push(d.message)
    })

    call.on('end', () => {
      endTest()
    })

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })

    async.eachSeries(
      getArrayData(),
      (d, asfn) => {
        call.write(d)
        _.delay(asfn, _.random(10, 50))
      },
      () => {
        call.end()
      }
    )

    function endTest () {
      t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.is(header.asdf, 'qwerty')
      t.is(header['content-type'], 'application/grpc+proto')
      t.truthy(header.date)
      t.truthy(status)
      t.true(typeof status.code === 'number')
      t.truthy(status.metadata)
      t.true(status.metadata instanceof grpc.Metadata)
      const trailer = status.metadata.getMap()
      t.deepEqual(trailer, {})
      app.close().then(() => t.end())
    }
  })
})

test.cb('duplex: trailer metadata', t => {
  t.plan(12)
  const APP_HOST = tu.getHost()

  async function processStuff (ctx) {
    ctx.setStatus('foo', 'bar')
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

  const app = new Mali(DUPLEX_PROTO_PATH, 'ArgService')
  t.truthy(app)

  app.use({ processStuff })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new duplexproto.ArgService(APP_HOST, grpc.credentials.createInsecure())
    const call = client.processStuff()

    const resData = []
    call.on('data', d => {
      resData.push(d.message)
    })

    call.on('end', () => {
      endTest()
    })

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })

    async.eachSeries(
      getArrayData(),
      (d, asfn) => {
        call.write(d)
        _.delay(asfn, _.random(10, 50))
      },
      () => {
        call.end()
      }
    )

    function endTest () {
      t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.is(header['content-type'], 'application/grpc+proto')
      t.truthy(header.date)
      t.truthy(status)
      t.true(typeof status.code === 'number')
      t.truthy(status.metadata)
      t.true(status.metadata instanceof grpc.Metadata)
      const trailer = status.metadata.getMap()
      t.deepEqual(trailer, {
        foo: 'bar'
      })
      app.close().then(() => t.end())
    }
  })
})

test.cb('duplex: trailer metadata using end()', t => {
  t.plan(12)
  const APP_HOST = tu.getHost()

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
        ctx.res.end({ foo: 'bar' })
      }, 200)
    })
  }

  const app = new Mali(DUPLEX_PROTO_PATH, 'ArgService')
  t.truthy(app)

  app.use({ processStuff })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new duplexproto.ArgService(APP_HOST, grpc.credentials.createInsecure())
    const call = client.processStuff()

    const resData = []
    call.on('data', d => {
      resData.push(d.message)
    })

    call.on('end', () => {
      endTest()
    })

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })

    async.eachSeries(
      getArrayData(),
      (d, asfn) => {
        call.write(d)
        _.delay(asfn, _.random(10, 50))
      },
      () => {
        call.end()
      }
    )

    function endTest () {
      t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.is(header['content-type'], 'application/grpc+proto')
      t.truthy(header.date)
      t.truthy(status)
      t.true(typeof status.code === 'number')
      t.truthy(status.metadata)
      t.true(status.metadata instanceof grpc.Metadata)
      const trailer = status.metadata.getMap()
      t.deepEqual(trailer, {
        foo: 'bar'
      })
      app.close().then(() => t.end())
    }
  })
})

test.cb('duplex: trailer metadata valid setStatus() and invalid end()', t => {
  t.plan(12)
  const APP_HOST = tu.getHost()

  async function processStuff (ctx) {
    ctx.setStatus('foo', 'bar')
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
        ctx.res.end(1)
      }, 200)
    })
  }

  const app = new Mali(DUPLEX_PROTO_PATH, 'ArgService')
  t.truthy(app)

  app.use({ processStuff })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new duplexproto.ArgService(APP_HOST, grpc.credentials.createInsecure())
    const call = client.processStuff()

    const resData = []
    call.on('data', d => {
      resData.push(d.message)
    })

    call.on('end', () => {
      endTest()
    })

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })

    async.eachSeries(
      getArrayData(),
      (d, asfn) => {
        call.write(d)
        _.delay(asfn, _.random(10, 50))
      },
      () => {
        call.end()
      }
    )

    function endTest () {
      t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.is(header['content-type'], 'application/grpc+proto')
      t.truthy(header.date)
      t.truthy(status)
      t.true(typeof status.code === 'number')
      t.truthy(status.metadata)
      t.true(status.metadata instanceof grpc.Metadata)
      const trailer = status.metadata.getMap()
      t.deepEqual(trailer, {
        foo: 'bar'
      })
      app.close().then(() => t.end())
    }
  })
})

test.cb('duplex: header and trailer metadata', t => {
  t.plan(13)
  const APP_HOST = tu.getHost()
  async function processStuff (ctx) {
    ctx.set('asdf', 'qwerty')
    ctx.setStatus('foo', 'bar')
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

  const app = new Mali(DUPLEX_PROTO_PATH, 'ArgService')
  t.truthy(app)

  app.use({ processStuff })
  app.start(APP_HOST).then(server => {
    t.truthy(server)

    let metadata
    let status
    const client = new duplexproto.ArgService(APP_HOST, grpc.credentials.createInsecure())
    const call = client.processStuff()

    const resData = []
    call.on('data', d => {
      resData.push(d.message)
    })

    call.on('end', () => {
      endTest()
    })

    call.on('metadata', md => {
      metadata = md
    })

    call.on('status', s => {
      status = s
    })

    async.eachSeries(
      getArrayData(),
      (d, asfn) => {
        call.write(d)
        _.delay(asfn, _.random(10, 50))
      },
      () => {
        call.end()
      }
    )

    function endTest () {
      t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.is(header.asdf, 'qwerty')
      t.is(header['content-type'], 'application/grpc+proto')
      t.truthy(header.date)
      t.truthy(status)
      t.true(typeof status.code === 'number')
      t.truthy(status.metadata)
      t.true(status.metadata instanceof grpc.Metadata)
      const trailer = status.metadata.getMap()
      t.deepEqual(trailer, {
        foo: 'bar'
      })
      app.close().then(() => t.end())
    }
  })
})

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

test.cb('req/res: no metadata', t => {
  t.plan(13)
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

  let metadata
  let status
  const helloproto = grpc.load(PROTO_PATH).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  const call = client.sayHello({ name: 'Bob' }, (err, response) => {
    setTimeout(() => {
      t.ifError(err)
      t.truthy(response)
      t.is(response.message, 'Hello Bob')
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.deepEqual(header, {})
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

test.cb('req/res: header metadata set', t => {
  t.plan(13)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.set('foo', 'bar')
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = app.start(APP_HOST)
  t.truthy(server)

  let metadata
  let status
  const helloproto = grpc.load(PROTO_PATH).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  const call = client.sayHello({ name: 'Bob' }, (err, response) => {
    setTimeout(() => {
      t.ifError(err)
      t.truthy(response)
      t.is(response.message, 'Hello Bob')
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.deepEqual(header, {
        foo: 'bar'
      })
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

test.cb('req/res: header metadata sent using ctx.sendMetadata', t => {
  t.plan(13)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.sendMetadata({ baz: 'foo' })
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = app.start(APP_HOST)
  t.truthy(server)

  let metadata
  let status
  const helloproto = grpc.load(PROTO_PATH).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  const call = client.sayHello({ name: 'Bob' }, (err, response) => {
    setTimeout(() => {
      t.ifError(err)
      t.truthy(response)
      t.is(response.message, 'Hello Bob')
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.deepEqual(header, {
        baz: 'foo'
      })
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

test.cb('req/res: header metadata sent using ctx.sendMetadata(Metadata)', t => {
  t.plan(13)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    const md = new grpc.Metadata()
    md.set('foo', 'bar')
    ctx.sendMetadata(md)
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = app.start(APP_HOST)
  t.truthy(server)

  let metadata
  let status
  const helloproto = grpc.load(PROTO_PATH).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  const call = client.sayHello({ name: 'Bob' }, (err, response) => {
    setTimeout(() => {
      t.ifError(err)
      t.truthy(response)
      t.is(response.message, 'Hello Bob')
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.deepEqual(header, {
        foo: 'bar'
      })
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

test.cb('req/res: header metadata set and sent using ctx.sendMetadata', t => {
  t.plan(13)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.set('foo', 'bar')
    ctx.sendMetadata()
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = app.start(APP_HOST)
  t.truthy(server)

  let metadata
  let status
  const helloproto = grpc.load(PROTO_PATH).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  const call = client.sayHello({ name: 'Bob' }, (err, response) => {
    setTimeout(() => {
      t.ifError(err)
      t.truthy(response)
      t.is(response.message, 'Hello Bob')
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.deepEqual(header, {
        foo: 'bar'
      })
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

test.cb('req/res: header metadata set and then new metadata sent using ctx.sendMetadata', t => {
  t.plan(13)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.set('foo', 'bar')
    ctx.sendMetadata({ biz: 'baz' })
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = app.start(APP_HOST)
  t.truthy(server)

  let metadata
  let status
  const helloproto = grpc.load(PROTO_PATH).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  const call = client.sayHello({ name: 'Bob' }, (err, response) => {
    setTimeout(() => {
      t.ifError(err)
      t.truthy(response)
      t.is(response.message, 'Hello Bob')
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.deepEqual(header, {
        biz: 'baz'
      })
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

test.cb('req/res: header metadata ctx.sendMetadata and then set new metadata, should get first', t => {
  t.plan(13)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.sendMetadata({ biz: 'baz' })
    ctx.set('foo', 'bar')
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = app.start(APP_HOST)
  t.truthy(server)

  let metadata
  let status
  const helloproto = grpc.load(PROTO_PATH).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  const call = client.sayHello({ name: 'Bob' }, (err, response) => {
    setTimeout(() => {
      t.ifError(err)
      t.truthy(response)
      t.is(response.message, 'Hello Bob')
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.deepEqual(header, {
        biz: 'baz'
      })
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

test.cb('req/res: header metadata send invalid param usingctx.sendMetadata and then set new metadata, should get 2nd', t => {
  t.plan(13)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.set('foo', 'bar')
    ctx.sendMetadata(1)
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = app.start(APP_HOST)
  t.truthy(server)

  let metadata
  let status
  const helloproto = grpc.load(PROTO_PATH).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  const call = client.sayHello({ name: 'Bob' }, (err, response) => {
    setTimeout(() => {
      t.ifError(err)
      t.truthy(response)
      t.is(response.message, 'Hello Bob')
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.deepEqual(header, {
        foo: 'bar'
      })
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

test.cb('req/res: trailer metadata set', t => {
  t.plan(13)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.setStatus('foo', 'bar')
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = app.start(APP_HOST)
  t.truthy(server)

  let metadata
  let status
  const helloproto = grpc.load(PROTO_PATH).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  const call = client.sayHello({ name: 'Bob' }, (err, response) => {
    setTimeout(() => {
      t.ifError(err)
      t.truthy(response)
      t.is(response.message, 'Hello Bob')
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.deepEqual(header, {})
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

test.cb('req/res: header and trailer metadata set', t => {
  t.plan(13)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    ctx.set('asdf', 'qwerty')
    ctx.setStatus('foo', 'bar')
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = app.start(APP_HOST)
  t.truthy(server)

  let metadata
  let status
  const helloproto = grpc.load(PROTO_PATH).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  const call = client.sayHello({ name: 'Bob' }, (err, response) => {
    setTimeout(() => {
      t.ifError(err)
      t.truthy(response)
      t.is(response.message, 'Hello Bob')
      t.truthy(metadata)
      t.true(metadata instanceof grpc.Metadata)
      const header = metadata.getMap()
      t.deepEqual(header, {
        asdf: 'qwerty'
      })
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

test.cb('res stream: no metadata', t => {
  t.plan(11)
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

  let metadata
  let status
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
    t.deepEqual(header, {})
    t.truthy(status)
    t.true(typeof status.code === 'number')
    t.truthy(status.metadata)
    t.true(status.metadata instanceof grpc.Metadata)
    const trailer = status.metadata.getMap()
    t.deepEqual(trailer, {})
    app.close().then(() => t.end())
  }
})

test.cb('res stream: header metadata set', t => {
  t.plan(11)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/resstream.proto')

  function listStuff (ctx) {
    ctx.set('foo', 'bar')
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

  let metadata
  let status
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
    t.deepEqual(header, {
      foo: 'bar'
    })
    t.truthy(status)
    t.true(typeof status.code === 'number')
    t.truthy(status.metadata)
    t.true(status.metadata instanceof grpc.Metadata)
    const trailer = status.metadata.getMap()
    t.deepEqual(trailer, {})
    app.close().then(() => t.end())
  }
})

test.cb('res stream: header metadata sendMetadata(object)', t => {
  t.plan(11)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/resstream.proto')

  function listStuff (ctx) {
    ctx.sendMetadata({ foo: 'bar' })
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

  let metadata
  let status
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
    t.deepEqual(header, {
      foo: 'bar'
    })
    t.truthy(status)
    t.true(typeof status.code === 'number')
    t.truthy(status.metadata)
    t.true(status.metadata instanceof grpc.Metadata)
    const trailer = status.metadata.getMap()
    t.deepEqual(trailer, {})
    app.close().then(() => t.end())
  }
})

test.cb('res stream: header metadata sendMetadata(object) with set after, set should not be sent', t => {
  t.plan(11)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/resstream.proto')

  function listStuff (ctx) {
    ctx.sendMetadata({ asdf: 'qwerty' })
    ctx.set('biz', 'baz')
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

  let metadata
  let status
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
    t.deepEqual(header, {
      asdf: 'qwerty'
    })
    t.truthy(status)
    t.true(typeof status.code === 'number')
    t.truthy(status.metadata)
    t.true(status.metadata instanceof grpc.Metadata)
    const trailer = status.metadata.getMap()
    t.deepEqual(trailer, {})
    app.close().then(() => t.end())
  }
})

test.cb('res stream: trailer metadata set', t => {
  t.plan(11)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/resstream.proto')

  function listStuff (ctx) {
    ctx.setStatus('foo', 'bar')
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

  let metadata
  let status
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
    t.deepEqual(header, {})
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

test.cb('res stream: header and trailer metadata set', t => {
  t.plan(11)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/resstream.proto')

  function listStuff (ctx) {
    ctx.set('asdf', 'qwerty')
    ctx.setStatus('foo', 'bar')
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

  let metadata
  let status
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
    t.deepEqual(header, {
      asdf: 'qwerty'
    })
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

test.cb('duplex: no metadata', t => {
  t.plan(11)
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

  let metadata
  let status
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

  call.on('metadata', md => {
    metadata = md
  })

  call.on('status', s => {
    status = s
  })

  async.eachSeries(getArrayData(), (d, asfn) => {
    call.write(d)
    _.delay(asfn, _.random(10, 50))
  }, () => {
    call.end()
  })

  function endTest () {
    t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
    t.truthy(metadata)
    t.true(metadata instanceof grpc.Metadata)
    const header = metadata.getMap()
    t.deepEqual(header, {})
    t.truthy(status)
    t.true(typeof status.code === 'number')
    t.truthy(status.metadata)
    t.true(status.metadata instanceof grpc.Metadata)
    const trailer = status.metadata.getMap()
    t.deepEqual(trailer, {})
    app.close().then(() => t.end())
  }
})

test.cb('duplex: header metadata set', t => {
  t.plan(11)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/duplex.proto')
  async function processStuff (ctx) {
    ctx.set('foo', 'bar')
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

  let metadata
  let status
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

  call.on('metadata', md => {
    metadata = md
  })

  call.on('status', s => {
    status = s
  })

  async.eachSeries(getArrayData(), (d, asfn) => {
    call.write(d)
    _.delay(asfn, _.random(10, 50))
  }, () => {
    call.end()
  })

  function endTest () {
    t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
    t.truthy(metadata)
    t.true(metadata instanceof grpc.Metadata)
    const header = metadata.getMap()
    t.deepEqual(header, {
      foo: 'bar'
    })
    t.truthy(status)
    t.true(typeof status.code === 'number')
    t.truthy(status.metadata)
    t.true(status.metadata instanceof grpc.Metadata)
    const trailer = status.metadata.getMap()
    t.deepEqual(trailer, {})
    app.close().then(() => t.end())
  }
})

test.cb('duplex: header metadata sendMetadata(object)', t => {
  t.plan(11)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/duplex.proto')
  async function processStuff (ctx) {
    ctx.sendMetadata({ foo: 'bar' })
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

  let metadata
  let status
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

  call.on('metadata', md => {
    metadata = md
  })

  call.on('status', s => {
    status = s
  })

  async.eachSeries(getArrayData(), (d, asfn) => {
    call.write(d)
    _.delay(asfn, _.random(10, 50))
  }, () => {
    call.end()
  })

  function endTest () {
    t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
    t.truthy(metadata)
    t.true(metadata instanceof grpc.Metadata)
    const header = metadata.getMap()
    t.deepEqual(header, {
      foo: 'bar'
    })
    t.truthy(status)
    t.true(typeof status.code === 'number')
    t.truthy(status.metadata)
    t.true(status.metadata instanceof grpc.Metadata)
    const trailer = status.metadata.getMap()
    t.deepEqual(trailer, {})
    app.close().then(() => t.end())
  }
})

test.cb('duplex: header metadata sendMetadata(object) with set after, set no effect', t => {
  t.plan(11)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/duplex.proto')
  async function processStuff (ctx) {
    ctx.sendMetadata({ asdf: 'qwerty' })
    ctx.set('foo', 'bar')
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

  let metadata
  let status
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

  call.on('metadata', md => {
    metadata = md
  })

  call.on('status', s => {
    status = s
  })

  async.eachSeries(getArrayData(), (d, asfn) => {
    call.write(d)
    _.delay(asfn, _.random(10, 50))
  }, () => {
    call.end()
  })

  function endTest () {
    t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
    t.truthy(metadata)
    t.true(metadata instanceof grpc.Metadata)
    const header = metadata.getMap()
    t.deepEqual(header, {
      asdf: 'qwerty'
    })
    t.truthy(status)
    t.true(typeof status.code === 'number')
    t.truthy(status.metadata)
    t.true(status.metadata instanceof grpc.Metadata)
    const trailer = status.metadata.getMap()
    t.deepEqual(trailer, {})
    app.close().then(() => t.end())
  }
})

test.cb('duplex: trailer metadata', t => {
  t.plan(11)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/duplex.proto')
  async function processStuff (ctx) {
    ctx.setStatus('foo', 'bar')
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

  let metadata
  let status
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

  call.on('metadata', md => {
    metadata = md
  })

  call.on('status', s => {
    status = s
  })

  async.eachSeries(getArrayData(), (d, asfn) => {
    call.write(d)
    _.delay(asfn, _.random(10, 50))
  }, () => {
    call.end()
  })

  function endTest () {
    t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
    t.truthy(metadata)
    t.true(metadata instanceof grpc.Metadata)
    const header = metadata.getMap()
    t.deepEqual(header, {})
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

test.cb('duplex: header and trailer metadata', t => {
  t.plan(11)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/duplex.proto')
  async function processStuff (ctx) {
    ctx.set('asdf', 'qwerty')
    ctx.setStatus('foo', 'bar')
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

  let metadata
  let status
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

  call.on('metadata', md => {
    metadata = md
  })

  call.on('status', s => {
    status = s
  })

  async.eachSeries(getArrayData(), (d, asfn) => {
    call.write(d)
    _.delay(asfn, _.random(10, 50))
  }, () => {
    call.end()
  })

  function endTest () {
    t.deepEqual(resData, ['1 FOO', '2 BAR', '3 ASD', '4 QWE', '5 RTY', '6 ZXC'])
    t.truthy(metadata)
    t.true(metadata instanceof grpc.Metadata)
    const header = metadata.getMap()
    t.deepEqual(header, {
      asdf: 'qwerty'
    })
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

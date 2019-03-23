import test from 'ava'
import path from 'path'
import grpc from 'grpc'
import CallType from '@malijs/call-types'
import hl from 'highland'
import _ from 'lodash'
import async from 'async'

import * as tu from './util'
import Mali from '../'
import utils from '../lib/utils'

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

test('getCallTypeFromDescriptor() should get call type from UNARY call', t => {
  const desc = {
    requestStream: false,
    responseStream: false,
    requestName: 'Point',
    responseName: 'Feature',
    name: 'GetFeature',
    service: 'RouteGuide',
    package: 'routeguide',
    fullName: '/routeguide.RouteGuide/GetFeature'
  }

  const v = utils.getCallTypeFromDescriptor(desc)
  t.is(v, CallType.UNARY)
})

test('getCallTypeFromDescriptor() should get call type from REQUEST_STREAM call', t => {
  const desc = {
    requestStream: true,
    responseStream: false,
    requestName: 'Point',
    responseName: 'RouteSummary',
    name: 'RecordRoute',
    service: 'RouteGuide',
    package: 'routeguide',
    fullName: '/routeguide.RouteGuide/RecordRoute'
  }

  const v = utils.getCallTypeFromDescriptor(desc)
  t.is(v, CallType.REQUEST_STREAM)
})

test('getCallTypeFromDescriptor() should get call type from RESPONSE_STREAM call', t => {
  const desc = {
    requestStream: false,
    responseStream: true,
    requestName: 'Rectangle',
    responseName: 'Feature',
    name: 'ListFeatures',
    service: 'RouteGuide',
    package: 'routeguide',
    fullName: '/routeguide.RouteGuide/ListFeatures'
  }

  const v = utils.getCallTypeFromDescriptor(desc)
  t.is(v, CallType.RESPONSE_STREAM)
})

test('getCallTypeFromDescriptor() should get call type from DUPLEX call', t => {
  const desc = {
    requestStream: true,
    responseStream: true,
    requestName: 'RouteNote',
    responseName: 'RouteNote',
    name: 'RouteChat',
    service: 'RouteGuide',
    package: 'routeguide',
    fullName: '/routeguide.RouteGuide/RouteChat'
  }

  const v = utils.getCallTypeFromDescriptor(desc)
  t.is(v, CallType.DUPLEX)
})

test.cb('getCallTypeFromCall() should get call type from UNARY call', t => {
  t.plan(1)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  let callType

  function sayHello (ctx) {
    callType = utils.getCallTypeFromCall(ctx.call)
    ctx.res = { message: 'Hello ' + ctx.req.name }
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  app.use({ sayHello })
  app.start(APP_HOST)

  const pd = pl.loadSync(PROTO_PATH)
  const helloproto = grpc.loadPackageDefinition(pd).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  client.sayHello({ name: 'Bob' }, (e_, response) => {
    t.is(callType, CallType.UNARY)
    app.close().then(() => t.end())
  })
})

test.cb('getCallTypeFromCall() should get call type from RESPONSE_STREAM call', t => {
  t.plan(1)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/resstream.proto')

  let callType

  function listStuff (ctx) {
    callType = utils.getCallTypeFromCall(ctx.call)
    ctx.res = hl(getArrayData())
      .map(d => {
        d.message = d.message.toUpperCase()
        return d
      })
  }

  const app = new Mali(PROTO_PATH, 'ArgService')
  app.use({ listStuff })
  app.start(APP_HOST)

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
    t.is(callType, CallType.RESPONSE_STREAM)
    app.close().then(() => t.end())
  }
})

test.cb('getCallTypeFromCall() should get call type from REQUEST_STREAM call', t => {
  t.plan(2)
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

  let callType
  async function writeStuff (ctx) {
    callType = utils.getCallTypeFromCall(ctx.call)
    ctx.res = await doWork(ctx.req)
  }

  const app = new Mali(PROTO_PATH, 'ArgService')
  app.use({ writeStuff })
  app.start(APP_HOST)

  const pd = pl.loadSync(PROTO_PATH)
  const proto = grpc.loadPackageDefinition(pd).argservice
  const client = new proto.ArgService(APP_HOST, grpc.credentials.createInsecure())
  const call = client.writeStuff((err, res) => {
    t.falsy(err)
    t.is(callType, CallType.REQUEST_STREAM)
    app.close().then(() => t.end())
  })

  async.eachSeries(getArrayData(), (d, asfn) => {
    call.write(d)
    _.delay(asfn, _.random(10, 50))
  }, () => {
    call.end()
  })
})

test.cb('getCallTypeFromCall() should get call type from DUPLEX call', t => {
  t.plan(1)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/duplex.proto')

  let callType
  async function processStuff (ctx) {
    callType = utils.getCallTypeFromCall(ctx.call)
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
  app.use({ processStuff })
  app.start(APP_HOST)

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
    t.is(callType, CallType.DUPLEX)
    app.close().then(() => t.end())
  }
})

test('getPackageNameFromPath() should get the package name', t => {
  const testData = [{
    input: '/helloworld.Greeter/SayHello',
    expected: 'helloworld'
  }, {
    input: '/Greeter/SayHello',
    expected: ''
  }]

  testData.forEach(td => {
    const { input, expected } = td
    const actual = utils.getPackageNameFromPath(input)
    t.is(actual, expected)
  })
})

test('getShortServiceNameFromPath() should get the short service name name', t => {
  const testData = [{
    input: '/helloworld.Greeter/SayHello',
    expected: 'Greeter'
  }, {
    input: '/Greeter/SayHello',
    expected: 'Greeter'
  }]

  testData.forEach(td => {
    const { input, expected } = td
    const actual = utils.getShortServiceNameFromPath(input)
    t.is(actual, expected)
  })
})

import test from 'ava'
import path from 'path'
import grpc from 'grpc'
import CallType from 'mali-call-types'
import gi from 'grpc-inspect'
import hl from 'highland'
import _ from 'lodash'
import async from 'async'

import * as tu from './util'
import Mali from '../'
import utils from '../lib/utils'

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

test('isStaticGRPCObject() should return false for an undefined path', t => {
  const v = utils.isStaticGRPCObject()
  t.false(v)
})

test('isStaticGRPCObject() should return false for an empty path', t => {
  const v = utils.isStaticGRPCObject({})
  t.false(v)
})

test('isStaticGRPCObject() should return false for a loaded grpc', t => {
  const protoPath = path.resolve(__dirname, './protos/helloworld.proto')
  const v = utils.isStaticGRPCObject(protoPath)
  t.false(v)
})

test('isStaticGRPCObject() should return true for prebuilt grpc', t => {
  const services = require('./static/helloworld_grpc_pb')
  const v = utils.isStaticGRPCObject(services)
  t.true(v)
})

test('isStaticGRPCObject() should return true for prebuilt multi-service grpc', t => {
  const services = require('./static/multi_grpc_pb')
  const v = utils.isStaticGRPCObject(services)
  t.true(v)
})

test('getMethodDescriptorsProto() should return descriptor for service', t => {
  const services = require('./static/route_guide_grpc_pb')
  const serviceName = 'RouteGuideService'
  const proto = services[serviceName]
  const v = utils.getMethodDescriptorsProto(serviceName, proto)
  const expected = {
    getFeature: {
      requestStream: false,
      responseStream: false,
      name: 'getFeature',
      service: 'RouteGuideService',
      package: 'routeguide',
      fullName: '/routeguide.RouteGuideService/getFeature'
    },
    listFeatures: {
      requestStream: false,
      responseStream: true,
      name: 'listFeatures',
      service: 'RouteGuideService',
      package: 'routeguide',
      fullName: '/routeguide.RouteGuideService/listFeatures'
    },
    recordRoute: {
      requestStream: true,
      responseStream: false,
      name: 'recordRoute',
      service: 'RouteGuideService',
      package: 'routeguide',
      fullName: '/routeguide.RouteGuideService/recordRoute'
    },
    routeChat: {
      requestStream: true,
      responseStream: true,
      name: 'routeChat',
      service: 'RouteGuideService',
      package: 'routeguide',
      fullName: '/routeguide.RouteGuideService/routeChat'
    }
  }

  t.deepEqual(v, expected)
})

test('getMethodDescriptorsLoad() should return descriptor for service', t => {
  const protoPath = path.resolve(__dirname, './protos/route_guide.proto')
  const proto = grpc.load(protoPath)
  const desc = gi(proto)
  const serviceName = 'RouteGuide'
  const client = desc.client(serviceName)
  const service = client && client.service ? client.service : client
  const v = utils.getMethodDescriptorsLoad(serviceName, service, desc)

  const expected = {
    getFeature: {
      requestStream: false,
      responseStream: false,
      requestName: 'Point',
      responseName: 'Feature',
      name: 'GetFeature',
      service: 'RouteGuide',
      package: 'routeguide',
      fullName: '/routeguide.RouteGuide/GetFeature'
    },
    listFeatures: {
      requestStream: false,
      responseStream: true,
      requestName: 'Rectangle',
      responseName: 'Feature',
      name: 'ListFeatures',
      service: 'RouteGuide',
      package: 'routeguide',
      fullName: '/routeguide.RouteGuide/ListFeatures'
    },
    recordRoute: {
      requestStream: true,
      responseStream: false,
      requestName: 'Point',
      responseName: 'RouteSummary',
      name: 'RecordRoute',
      service: 'RouteGuide',
      package: 'routeguide',
      fullName: '/routeguide.RouteGuide/RecordRoute'
    },
    routeChat: {
      requestStream: true,
      responseStream: true,
      requestName: 'RouteNote',
      responseName: 'RouteNote',
      name: 'RouteChat',
      service: 'RouteGuide',
      package: 'routeguide',
      fullName: '/routeguide.RouteGuide/RouteChat'
    }
  }

  t.deepEqual(v, expected)
})

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

  const helloproto = grpc.load(PROTO_PATH).helloworld
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

  const proto = grpc.load(PROTO_PATH).argservice
  const client = new proto.ArgService(APP_HOST, grpc.credentials.createInsecure())
  const call = client.writeStuff((err, res) => {
    t.ifError(err)
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
    t.is(callType, CallType.DUPLEX)
    app.close().then(() => t.end())
  }
})

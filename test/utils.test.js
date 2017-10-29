import test from 'ava'
import path from 'path'
import grpc from 'grpc'
import CallType from 'mali-call-types'
import gi from 'grpc-inspect'

import utils from '../lib/utils'

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

test.todo('getCallTypeFromCall() should get call type from UNARY call')

test.todo('getCallTypeFromCall() should get call type from REQUEST_STREAM call')

test.todo('getCallTypeFromCall() should get call type from RESPONSE_STREAM call')

test.todo('getCallTypeFromCall() should get call type from DUPLEX call')

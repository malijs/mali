import test from 'ava'
import grpc from 'grpc'
import CallType from 'mali-call-types'

import Context from '../lib/context'
import Request from '../lib/request'
import Response from '../lib/response'
import { createContext } from '../lib/run'

const APP = {
  context: Object.create(Context)
}

test('createContext should create context for a UNARY call', t => {
  const runContext = {
    app: APP,
    descriptor: {
      requestStream: false,
      responseStream: false,
      requestName: 'Point',
      responseName: 'Feature',
      name: 'GetFeature',
      service: 'RouteGuide',
      package: 'routeguide',
      fullName: '/routeguide.RouteGuide/GetFeature'
    },
    call: {
      request: {
        foo: 'bar'
      },
      metadata: {
        one: 'two'
      }
    }
  }

  const ctx = createContext(runContext)

  t.truthy(ctx)
  t.truthy(ctx.request)
  t.true(ctx.request instanceof Request)
  t.truthy(ctx.response)
  t.true(ctx.response instanceof Response)
  t.truthy(ctx.call)
  t.is(ctx.call, ctx.request.call)
  t.is(ctx.type, CallType.UNARY)
  t.is(ctx.name, 'GetFeature')
  t.is(ctx.fullName, '/routeguide.RouteGuide/GetFeature')
  t.is(ctx.service, 'RouteGuide')
  t.is(ctx.package, 'routeguide')

  t.truthy(ctx.request.req)
  t.truthy(ctx.req)
  t.is(ctx.req, ctx.request.req)
  t.truthy(ctx.metadata)
  t.is(ctx.metadata, ctx.request.metadata)
  t.is(ctx.type, ctx.type)

  const mdv = ctx.get('one')
  t.is(mdv, 'two')

  t.is(ctx.req.foo, 'bar')

  t.falsy(ctx.res)
  t.falsy(ctx.response.res)

  ctx.res = { p: 'q' }
  t.truthy(ctx.response.res)
  t.deepEqual(ctx.response.res, { p: 'q' })
  t.truthy(ctx.res)
  t.deepEqual(ctx.res, { p: 'q' })
  t.is(ctx.res, ctx.response.res)
})

test('createContext should create context for a REQUEST_STREAM call', t => {
  const runContext = {
    app: APP,
    descriptor: {
      requestStream: true,
      responseStream: false,
      requestName: 'Point',
      responseName: 'RouteSummary',
      name: 'RecordRoute',
      service: 'RouteGuide',
      package: 'routeguide',
      fullName: '/routeguide.RouteGuide/RecordRoute'
    },
    call: {
      metadata: {
        one: 'two'
      }
    }
  }

  const ctx = createContext(runContext)

  t.truthy(ctx)
  t.truthy(ctx.request)
  t.true(ctx.request instanceof Request)
  t.truthy(ctx.response)
  t.true(ctx.response instanceof Response)
  t.truthy(ctx.call)
  t.is(ctx.call, ctx.request.call)
  t.is(ctx.type, CallType.REQUEST_STREAM)
  t.is(ctx.name, 'RecordRoute')
  t.is(ctx.service, 'RouteGuide')
  t.is(ctx.package, 'routeguide')
  t.is(ctx.fullName, '/routeguide.RouteGuide/RecordRoute')

  t.truthy(ctx.request.req)
  t.truthy(ctx.req)
  t.is(ctx.req, ctx.request.req)
  t.truthy(ctx.metadata)
  t.is(ctx.metadata, ctx.request.metadata)
  t.is(ctx.type, ctx.type)

  const mdv = ctx.get('one')
  t.is(mdv, 'two')

  t.is(ctx.req, ctx.call)

  t.falsy(ctx.res)
  t.falsy(ctx.response.res)
})

test('createContext should create context for a RESPONSE_STREAM call', t => {
  const runContext = {
    app: APP,
    descriptor: {
      requestStream: false,
      responseStream: true,
      requestName: 'Rectangle',
      responseName: 'Feature',
      name: 'ListFeatures',
      service: 'RouteGuide',
      package: 'routeguide',
      fullName: '/routeguide.RouteGuide/ListFeatures'
    },
    call: {
      request: {
        foo: 'bar'
      },
      metadata: {
        one: 'two'
      }
    }
  }

  const ctx = createContext(runContext)

  t.truthy(ctx)
  t.truthy(ctx.request)
  t.true(ctx.request instanceof Request)
  t.truthy(ctx.response)
  t.true(ctx.response instanceof Response)
  t.truthy(ctx.call)
  t.is(ctx.call, ctx.request.call)
  t.is(ctx.type, CallType.RESPONSE_STREAM)
  t.is(ctx.name, 'ListFeatures')
  t.is(ctx.service, 'RouteGuide')
  t.is(ctx.package, 'routeguide')
  t.is(ctx.fullName, '/routeguide.RouteGuide/ListFeatures')

  t.truthy(ctx.request.req)
  t.truthy(ctx.req)
  t.is(ctx.req, ctx.request.req)
  t.truthy(ctx.metadata)
  t.is(ctx.metadata, ctx.request.metadata)
  t.is(ctx.type, ctx.type)

  const mdv = ctx.get('one')
  t.is(mdv, 'two')

  t.is(ctx.req.foo, 'bar')

  t.falsy(ctx.res)
  t.falsy(ctx.response.res)
})

test('createContext should create context for a DUPLEX call', t => {
  const runContext = {
    app: APP,
    descriptor: {
      requestStream: true,
      responseStream: true,
      requestName: 'RouteNote',
      responseName: 'RouteNote',
      name: 'RouteChat',
      service: 'RouteGuide',
      package: 'routeguide',
      fullName: '/routeguide.RouteGuide/RouteChat'
    },
    call: {
      metadata: {
        one: 'two'
      }
    }
  }

  const ctx = createContext(runContext)

  t.truthy(ctx)
  t.truthy(ctx.request)
  t.true(ctx.request instanceof Request)
  t.truthy(ctx.response)
  t.true(ctx.response instanceof Response)
  t.truthy(ctx.call)
  t.is(ctx.call, ctx.request.call)
  t.is(ctx.type, CallType.DUPLEX)
  t.is(ctx.name, 'RouteChat')
  t.is(ctx.service, 'RouteGuide')
  t.is(ctx.package, 'routeguide')
  t.is(ctx.fullName, '/routeguide.RouteGuide/RouteChat')

  t.truthy(ctx.request.req)
  t.truthy(ctx.req)
  t.is(ctx.req, ctx.request.req)
  t.truthy(ctx.metadata)
  t.is(ctx.metadata, ctx.request.metadata)
  t.is(ctx.type, ctx.type)

  const mdv = ctx.get('one')
  t.is(mdv, 'two')

  t.is(ctx.req, ctx.call)

  t.truthy(ctx.res)
  t.is(ctx.res, ctx.call)
  t.truthy(ctx.response.res)
  t.is(ctx.response.res, ctx.call)
})

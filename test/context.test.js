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

  t.falsy(ctx.response.res)
})

const test = require('ava')
const grpc = require('@grpc/grpc-js')
const CallType = require('@malijs/call-types')

const Response = require('../lib/response')

test('should create with UNARY type', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const res = new Response(call, CallType.UNARY)
  t.truthy(res)
  t.is(res.call, call)
  t.is(res.type, CallType.UNARY)
  t.falsy(res.res)
  t.falsy(res.metadata)
})

test('should create with RESPONSE_STREAM type', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const res = new Response(call, CallType.RESPONSE_STREAM)
  t.truthy(res)
  t.is(res.call, call)
  t.is(res.type, CallType.RESPONSE_STREAM)
  t.falsy(res.res)
  t.falsy(res.metadata)
})

test('should create with REQUEST_STREAM type', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const res = new Response(call, CallType.REQUEST_STREAM)
  t.truthy(res)
  t.is(res.call, call)
  t.is(res.type, CallType.REQUEST_STREAM)
  t.falsy(res.res)
  t.falsy(res.metadata)
})

test('should create with DUPLEX type', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const res = new Response(call, CallType.DUPLEX)
  t.truthy(res)
  t.is(res.call, call)
  t.is(res.type, CallType.DUPLEX)
  t.truthy(res.res)
  t.is(res.res, call)
  t.falsy(res.metadata)
})

test('set() should create metadata from simple key and value', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const res = new Response(call, CallType.UNARY)
  t.truthy(res)

  t.falsy(res.metadata)
  res.set('one', 'two')
  t.deepEqual(res.metadata, { one: 'two' })
})

test('set() should create metadata from plain object', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const res = new Response(call, CallType.UNARY)
  t.truthy(res)

  t.falsy(res.metadata)
  const md = {
    one: 'two',
    three: 'four'
  }
  res.set(md)
  t.deepEqual(res.metadata, md)
})

test('set() should create metadata from Metadata object', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const res = new Response(call, CallType.UNARY)
  t.truthy(res)

  t.falsy(res.metadata)
  const md = new grpc.Metadata()
  md.set('one', 'two')
  md.set('three', 'four')
  res.set(md)
  t.deepEqual(res.metadata, {
    one: 'two',
    three: 'four'
  })
})

test('set() should not set any metadata if passed an invalid value', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const res = new Response(call, CallType.UNARY)
  t.truthy(res)

  t.falsy(res.metadata)
  res.set(1)
  t.falsy(res.metadata)
})

test('get() should return proper values', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const res = new Response(call, CallType.UNARY)
  t.truthy(res)

  t.falsy(res.metadata)
  let v = res.get('one')
  t.falsy(v)
  res.set('one', 'two')
  v = res.get('one')
  t.is(v, 'two')
  v = res.get('two')
  t.falsy(v)
})

test('getMetadata() should return undefined when no metadata', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const res = new Response(call, CallType.UNARY)
  t.truthy(res)

  const md = res.getMetadata()
  t.falsy(md)
})

test('getMetadata() should return metadata object', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const res = new Response(call, CallType.UNARY)
  t.truthy(res)

  t.falsy(res.metadata)
  res.set('one', 'two')
  res.set('three', 'four')
  const md = res.getMetadata()
  t.truthy(md)
  t.truthy(md instanceof grpc.Metadata)
  t.deepEqual(md.getMap(), { one: 'two', three: 'four' })
})

test('setStatus() should create status metadata from simple key and value', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const res = new Response(call, CallType.UNARY)
  t.truthy(res)

  t.falsy(res.status)
  res.setStatus('one', 'two')
  t.deepEqual(res.status, { one: 'two' })
})

test('setStatus() should create status metadata from plain object', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const res = new Response(call, CallType.UNARY)
  t.truthy(res)

  t.falsy(res.status)
  const md = {
    one: 'two',
    three: 'four'
  }
  res.setStatus(md)
  t.deepEqual(res.status, md)
})

test('setStatus() should create status metadata from Metadata object', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const res = new Response(call, CallType.UNARY)
  t.truthy(res)

  t.falsy(res.status)
  const md = new grpc.Metadata()
  md.set('one', 'two')
  md.set('three', 'four')
  res.setStatus(md)
  t.deepEqual(res.status, {
    one: 'two',
    three: 'four'
  })
})

test('setStatus() should not set any status metadata if passed an invalid value', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const res = new Response(call, CallType.UNARY)
  t.truthy(res)

  t.falsy(res.status)
  const md = {
    one: 'two',
    three: 'four'
  }
  res.setStatus(md)
  t.deepEqual(res.status, md)
  res.setStatus(1)
  t.deepEqual(res.status, md)
})

test('getStatus() should return proper values', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const res = new Response(call, CallType.UNARY)
  t.truthy(res)

  t.falsy(res.status)
  let v = res.getStatus('one')
  t.falsy(v)
  res.setStatus('one', 'two')
  v = res.getStatus('one')
  t.is(v, 'two')
  v = res.getStatus('two')
  t.falsy(v)
})

test('getStatusMetadata() should return undefined when no metadata', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const res = new Response(call, CallType.UNARY)
  t.truthy(res)

  const md = res.getStatusMetadata()
  t.falsy(md)
})

test('getStatusMetadata() should return metadata object', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const res = new Response(call, CallType.UNARY)
  t.truthy(res)

  t.falsy(res.status)
  res.setStatus('one', 'two')
  res.setStatus('three', 'four')
  const md = res.getStatusMetadata()
  t.truthy(md)
  t.truthy(md instanceof grpc.Metadata)
  t.deepEqual(md.getMap(), { one: 'two', three: 'four' })
})

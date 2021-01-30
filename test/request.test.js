const test = require('ava')
const grpc = require('@grpc/grpc-js')
const CallType = require('@malijs/call-types')

const Request = require('../lib/request')

test('should create with UNARY type and no metadata', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const req = new Request(call, CallType.UNARY)
  t.truthy(req)
  t.is(req.call, call)
  t.is(req.req, call.request)
  t.is(req.type, CallType.UNARY)
  t.falsy(req.metadata)
})

test('should create with UNARY type with metadata plain object', t => {
  const call = {
    request: {
      foo: 'bar'
    },
    metadata: {
      one: 'two'
    }
  }

  const req = new Request(call, CallType.UNARY)
  t.truthy(req)
  t.is(req.call, call)
  t.is(req.req, call.request)
  t.is(req.type, CallType.UNARY)
  t.truthy(req.metadata)
  t.is(req.metadata, call.metadata)
})

test('should create with UNARY type with metadata object', t => {
  const call = {
    request: {
      foo: 'bar'
    },
    metadata: new grpc.Metadata()
  }

  call.metadata.set('one', 'two')

  const req = new Request(call, CallType.UNARY)
  t.truthy(req)
  t.is(req.call, call)
  t.is(req.req, call.request)
  t.is(req.type, CallType.UNARY)
  t.truthy(req.metadata)
  t.deepEqual(req.metadata, { one: 'two' })
})

test('should create with RESPONSE_STREAM type and no metadata', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const req = new Request(call, CallType.RESPONSE_STREAM)
  t.truthy(req)
  t.is(req.call, call)
  t.is(req.req, call.request)
  t.is(req.type, CallType.RESPONSE_STREAM)
  t.falsy(req.metadata)
})

test('should create with RESPONSE_STREAM type with metadata plain object', t => {
  const call = {
    request: {
      foo: 'bar'
    },
    metadata: {
      one: 'two'
    }
  }

  const req = new Request(call, CallType.RESPONSE_STREAM)
  t.truthy(req)
  t.is(req.call, call)
  t.is(req.req, call.request)
  t.is(req.type, CallType.RESPONSE_STREAM)
  t.truthy(req.metadata)
  t.is(req.metadata, call.metadata)
})

test('should create with RESPONSE_STREAM type with metadata object', t => {
  const call = {
    request: {
      foo: 'bar'
    },
    metadata: new grpc.Metadata()
  }

  call.metadata.set('one', 'two')

  const req = new Request(call, CallType.RESPONSE_STREAM)
  t.truthy(req)
  t.is(req.call, call)
  t.is(req.req, call.request)
  t.is(req.type, CallType.RESPONSE_STREAM)
  t.truthy(req.metadata)
  t.deepEqual(req.metadata, { one: 'two' })
})

test('should create with REQUEST_STREAM type and no metadata', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const req = new Request(call, CallType.REQUEST_STREAM)
  t.truthy(req)
  t.is(req.call, call)
  t.is(req.req, call)
  t.is(req.type, CallType.REQUEST_STREAM)
  t.falsy(req.metadata)
})

test('should create with REQUEST_STREAM type with metadata plain object', t => {
  const call = {
    request: {
      foo: 'bar'
    },
    metadata: {
      one: 'two'
    }
  }

  const req = new Request(call, CallType.REQUEST_STREAM)
  t.truthy(req)
  t.is(req.call, call)
  t.is(req.req, call)
  t.is(req.type, CallType.REQUEST_STREAM)
  t.truthy(req.metadata)
  t.is(req.metadata, call.metadata)
})

test('should create with REQUEST_STREAM type with metadata object', t => {
  const call = {
    request: {
      foo: 'bar'
    },
    metadata: new grpc.Metadata()
  }

  call.metadata.set('one', 'two')

  const req = new Request(call, CallType.REQUEST_STREAM)
  t.truthy(req)
  t.is(req.call, call)
  t.is(req.req, call)
  t.is(req.type, CallType.REQUEST_STREAM)
  t.truthy(req.metadata)
  t.deepEqual(req.metadata, { one: 'two' })
})

test('should create with DUPLEX type and no metadata', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const req = new Request(call, CallType.DUPLEX)
  t.truthy(req)
  t.is(req.call, call)
  t.is(req.req, call)
  t.is(req.type, CallType.DUPLEX)
  t.falsy(req.metadata)
})

test('should create with DUPLEX type with metadata plain object', t => {
  const call = {
    request: {
      foo: 'bar'
    },
    metadata: {
      one: 'two'
    }
  }

  const req = new Request(call, CallType.DUPLEX)
  t.truthy(req)
  t.is(req.call, call)
  t.is(req.req, call)
  t.is(req.type, CallType.DUPLEX)
  t.truthy(req.metadata)
  t.is(req.metadata, call.metadata)
})

test('should create with DUPLEX type with metadata object', t => {
  const call = {
    request: {
      foo: 'bar'
    },
    metadata: new grpc.Metadata()
  }

  call.metadata.set('one', 'two')

  const req = new Request(call, CallType.DUPLEX)
  t.truthy(req)
  t.is(req.call, call)
  t.is(req.req, call)
  t.is(req.type, CallType.DUPLEX)
  t.truthy(req.metadata)
  t.deepEqual(req.metadata, { one: 'two' })
})

test('getMetadata() should return undefined when created without metadata', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const req = new Request(call, CallType.UNARY)
  t.truthy(req)
  const md = req.getMetadata()
  t.falsy(md)
})

test('getMetadata() should return Metadata when created with plain object metadata', t => {
  const call = {
    request: {
      foo: 'bar'
    },
    metadata: {
      one: 'two'
    }
  }

  const req = new Request(call, CallType.UNARY)
  t.truthy(req)
  const md = req.getMetadata()
  t.truthy(md)
  t.truthy(md instanceof grpc.Metadata)
  t.deepEqual(md.getMap(), { one: 'two' })
})

test('getMetadata() should return Metadata when created with metadata', t => {
  const call = {
    request: {
      foo: 'bar'
    },
    metadata: new grpc.Metadata()
  }

  call.metadata.set('one', 'two')

  const req = new Request(call, CallType.UNARY)
  t.truthy(req)
  const md = req.getMetadata()
  t.truthy(md)
  t.truthy(md instanceof grpc.Metadata)
  t.deepEqual(md.getMap(), { one: 'two' })
})

test('get() should return undefined when created without metadata', t => {
  const call = {
    request: {
      foo: 'bar'
    }
  }

  const req = new Request(call, CallType.UNARY)
  t.truthy(req)
  const v = req.get('one')
  t.falsy(v)
})

test('get() should return Metadata value when created with plain object metadata', t => {
  const call = {
    request: {
      foo: 'bar'
    },
    metadata: {
      one: 'two'
    }
  }

  const req = new Request(call, CallType.UNARY)
  t.truthy(req)
  const v = req.get('one')
  t.truthy(v)
  t.is(v, 'two')
  const v2 = req.get('two')
  t.falsy(v2)
})

test('get() should return Metadata value when created with metadata', t => {
  const call = {
    request: {
      foo: 'bar'
    },
    metadata: new grpc.Metadata()
  }

  call.metadata.set('one', 'two')

  const req = new Request(call, CallType.UNARY)
  t.truthy(req)
  const v = req.get('one')
  t.truthy(v)
  t.is(v, 'two')
  const v2 = req.get('two')
  t.falsy(v2)
})

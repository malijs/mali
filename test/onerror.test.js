import test from 'ava'
import { AssertionError } from 'assert'
import { stderr } from 'test-console'
import path from 'path'
import grpc from 'grpc'

import Mali from '../'
import * as tu from './util'

test('should throw an error if a non-error is given', t => {
  const app = new Mali()
  t.truthy(app)

  const error = t.throws(() => {
    app.onerror('foo')
  }, AssertionError)

  t.is(error.message, 'non-error thrown: foo')
})

test('should do nothing if .silent', t => {
  const app = new Mali()
  t.truthy(app)
  app.silent = true

  const err = new Error()
  const output = stderr.inspectSync(() => app.onerror(err))

  t.deepEqual(output, [])
})

test('should log the error to stderr', t => {
  const app = new Mali()
  t.truthy(app)
  app.env = 'dev'

  const err = new Error()
  err.stack = 'Foo'

  const output = stderr.inspectSync(() => app.onerror(err))

  t.deepEqual(output, ['\n', '  Foo\n', '\n'])
})

test('should use err.toString() instad of err.stack', t => {
  const app = new Mali()
  t.truthy(app)
  app.env = 'dev'

  const err = new Error('mock stack null')
  err.stack = null

  const output = stderr.inspectSync(() => app.onerror(err))

  t.deepEqual(output, ['\n', '  Error: mock stack null\n', '\n'])
})

test.cb('should log an error in the handler in req/res app', t => {
  t.plan(7)
  const APP_HOST = tu.getHost()
  const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')

  function sayHello (ctx) {
    throw new Error('boom')
  }

  const app = new Mali(PROTO_PATH, 'Greeter')
  t.truthy(app)
  app.use({ sayHello })
  const server = app.start(APP_HOST)
  t.truthy(server)

  const helloproto = grpc.load(PROTO_PATH).helloworld
  const client = new helloproto.Greeter(APP_HOST, grpc.credentials.createInsecure())
  const inspect = stderr.inspect()
  client.sayHello({ name: 'Bob' }, (err, response) => {
    t.truthy(err)
    t.is(err.message, 'boom')
    t.falsy(response)
    inspect.restore()
    const output = Array.isArray(inspect.output) ? inspect.output.join() : inspect.output
    t.true(output.indexOf('Error: boom') > 0)
    t.true(output.indexOf('at sayHello') > 0)
    app.close().then(() => t.end())
  })
})

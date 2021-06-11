const test = require('ava')
const grpc = require('@grpc/grpc-js')
const create = require('../lib/metadata')

test('should return undefined if not-object', (t) => {
  t.is(create('hello'), undefined)
  t.is(create(undefined), undefined)
})

test('should return grpc.Metadata', (t) => {
  const meta = new grpc.Metadata()
  meta.set('hello', 'world')

  const returned = create(meta)
  t.truthy(returned instanceof grpc.Metadata)
  t.deepEqual(meta.get('hello'), ['world'])
})

test('should handle buffers', (t) => {
  const meta = create({ 'john-bin': Buffer.from('snow'), 'non-existing': null, john: [] })
  t.deepEqual(meta.get('john-bin'), [Buffer.from('snow')])
  t.deepEqual(meta.get('non-existing'), [])
  t.deepEqual(meta.get('john'), [])

  try {
    create({ john: Buffer.from('snow') })
    t.fail()
  } catch (error) {
    t.is(error.message, 'Metadata key "john" should end with "-bin" since it has a non-string value.')
  }
})

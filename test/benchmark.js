const Benchmark = require('benchmark')
const metaCreate = require('../lib/metadata')
const Mali = require('../lib/app')
const path = require('path')

const suite = new Benchmark.Suite()

const largeMetadata = {
  hello: 'world',
  maxSafe: Number.MAX_SAFE_INTEGER
}

for (let i = 0; i < 5000; i++) {
  largeMetadata[`key-${i}`] = `value-${i}`
}

suite
  .add('metadata.create', () => {
    metaCreate(largeMetadata)
  })
  .add('mali.addService', () => {
    const app = new Mali()
    app.addService(path.join(__dirname, './protos/helloworld.proto'), 'Greeter')
  })
  .on('cycle', (event) => console.log(event.target.toString()))
  .run({ async: true })

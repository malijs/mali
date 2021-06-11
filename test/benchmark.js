const Benchmark = require('benchmark')
const metaCreate = require('../lib/metadata')

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
  .on('cycle', (event) => console.log(event.target.toString()))
  .run({ async: true })

const Benchmark = require('benchmarkify')
const metaCreate = require('../lib/metadata')
const Mali = require('../lib/app')
const path = require('path')

const benchmark = new Benchmark('Mali').printHeader()
const suite = benchmark.createSuite('Functions')

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

suite.add('mali.addService', () => {
  const app = new Mali()
  app.addService(path.join(__dirname, './protos/helloworld.proto'), 'Greeter')
})

suite.add('mali.use', () => {
  const app = new Mali()
  app.addService(path.join(__dirname, './protos/helloworld.proto'), 'Greeter')
  app.use({
    SayHello: (ctx) => {
      ctx.res = { message: `Hi ${ctx.name}!` }
    }
  })
})

suite.add('mali.use as global middleware', () => {
  const app = new Mali()
  app.addService(path.join(__dirname, './protos/helloworld.proto'), 'Greeter')
  app.use((ctx, next) => next())
})

suite.run()

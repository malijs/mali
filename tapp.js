const path = require('path')
const Mali = require('./')

const PROTO_PATH = path.resolve(__dirname, './protos/multipkg.proto')

const services = require('./test/static/multi_grpc_pb')

// console.dir(services, {depth: 3, colors: true})

async function sayHellos (ctx) {
  ctx.res = { message: 'Hello '.concat(ctx.req.name) }
}

function main () {
  const app = new Mali(PROTO_PATH)
  app.use({ sayHellos })
  app.start('127.0.0.1:50051')
}

main()

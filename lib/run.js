const CallType = require('@malijs/call-types')
const destroy = require('destroy')
const first = require('ee-first')
const stream = require('stream')
const Metadata = require('./metadata')

function onEnd (s, fn) {
  const ee = first([
    [s, 'close', 'end', 'error']
  ], err => {
    ee.cancel()
    fn(err)
  })
}

function wrapEnd (ctx) {
  const endFn = ctx.call.end
  ctx.call.end = function end (statusMetadata) {
    return endFn.call(ctx.call, Metadata.create(statusMetadata) || ctx.response.getStatusMetadata())
  }
}

async function execRes (ctx, handler, fn) {
  if (ctx.call instanceof stream.Readable) {
    ctx.call.on('error', (err) => onerror(err, ctx))
    onEnd(ctx.call, destroy.bind(null, ctx.call))
  }

  try {
    await handler(ctx)
    ctx.response.sendMetadata()
    const response = await Promise.resolve(ctx.res)
    const statusMetadata = ctx.response.getStatusMetadata()

    if (response instanceof Error) {
      return fn(response, null, statusMetadata)
    }

    return fn(null, response, statusMetadata)
  } catch (error) {
    onerror(error, ctx)
    fn(error)
  }
}

async function execStream (ctx, handler) {
  wrapEnd(ctx)

  try {
    await handler(ctx)

    ctx.response.sendMetadata()
    ctx.res.pipe(ctx.call)
    ctx.res.on('error', err => {
      ctx.call.emit('error', err)
      onerror(err, ctx)
    })
  } catch (error) {
    ctx.call.emit('error', error)
    onerror(error, ctx)
  }
}

async function execDuplex (ctx, handler) {
  wrapEnd(ctx)
  ctx.call.on('error', (err) => onerror(err, ctx))
  ctx.call.on('finish', destroy.bind(null, ctx.call))

  try {
    await handler(ctx)
    ctx.response.sendMetadata()
  } catch (error) {
    ctx.call.emit('error', error)
    onerror(error, ctx)
  }
}

function onerror (error, ctx) {
  ctx.app.emit('error', error, ctx)
}

function exec (ctx, handler, callback) {
  if (ctx.type === CallType.UNARY || ctx.type === CallType.REQUEST_STREAM) {
    return execRes(ctx, handler, callback)
  } else if (ctx.type === CallType.RESPONSE_STREAM) {
    return execStream(ctx, handler)
  } else if (ctx.type === CallType.DUPLEX) {
    return execDuplex(ctx, handler)
  } else {
    throw new Error('Unknown call type')
  }
}

module.exports = {
  exec
}

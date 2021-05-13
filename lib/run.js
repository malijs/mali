import CallType from '@malijs/call-types'
import inject from 'error-inject'
import destroy from 'destroy'
import first from 'ee-first'
import stream from 'stream'
import { create } from './metadata.js'

function onEnd(s, fn) {
  const ee = first([[s, 'close', 'end', 'error']], (err) => {
    ee.cancel()
    fn(err)
  })
}

function wrapEnd(ctx) {
  const endFn = ctx.call.end
  ctx.call.end = function end(statusMetadata) {
    return endFn.call(
      ctx.call,
      create(statusMetadata, { addEmpty: false }) ||
        ctx.response.getStatusMetadata(),
    )
  }
}

function execRes(ctx, handler, fn) {
  if (ctx.call instanceof stream.Readable) {
    inject(ctx.call, function (err) {
      onerror(err, ctx)
    })
    onEnd(ctx.call, destroy.bind(null, ctx.call))
  }

  handler(ctx)
    .then(async () => {
      ctx.response.sendMetadata()
      const response = await ctx.res
      const statusMetadata = ctx.response.getStatusMetadata()
      if (response instanceof Error) {
        return fn(response, null, statusMetadata)
      }

      return fn(null, response, statusMetadata)
    })
    .catch((err) => {
      onerror(err, ctx)
      fn(err)
    })
}

function execStream(ctx, handler) {
  wrapEnd(ctx)
  handler(ctx)
    .then(() => {
      ctx.response.sendMetadata()
      ctx.res.pipe(ctx.call)
      ctx.res.on('error', (err) => {
        ctx.call.emit('error', err)
        onerror(err, ctx)
      })
    })
    .catch((err) => {
      ctx.call.emit('error', err)
      onerror(err, ctx)
    })
}

function execDuplex(ctx, handler) {
  wrapEnd(ctx)
  inject(ctx.call, function (err) {
    onerror(err, ctx)
  })
  ctx.call.on('finish', destroy.bind(null, ctx.call))
  handler(ctx)
    .then(() => {
      ctx.response.sendMetadata()
    })
    .catch((err) => {
      ctx.call.emit('error', err)
      onerror(err, ctx)
    })
}

function onerror(err, ctx) {
  ctx.app.emit('error', err, ctx)
}

export function exec(ctx, handler, callback) {
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

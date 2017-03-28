const _ = require('lodash')
const asCallback = require('ascallback')
const CallType = require('mali-call-types')
const inject = require('error-inject')
const destroy = require('destroy')
const first = require('ee-first')
const isStream = require('is-stream')

const Context = require('./context')

function getCallType (ctx) {
  let { descriptor, call } = ctx
  const callPrototype = Object.getPrototypeOf(call)
  if (callPrototype && callPrototype.constructor && callPrototype.constructor.name) {
    const ctorName = callPrototype.constructor.name
    if (ctorName === 'ServerUnaryCall') {
      return CallType.UNARY
    } else if (ctorName === 'ServerWritableStream') {
      return CallType.RESPONSE_STREAM
    } else if (ctorName === 'ServerReadableStream') {
      return CallType.REQUEST_STREAM
    } else if (ctorName === 'ServerDuplexStream') {
      return CallType.DUPLEX
    }
  }

  if (!descriptor.requestStream && !descriptor.responseStream) {
    return CallType.UNARY
  } else if (!descriptor.requestStream && descriptor.responseStream) {
    return CallType.RESPONSE_STREAM
  } else if (descriptor.requestStream && !descriptor.responseStream) {
    return CallType.REQUEST_STREAM
  } else {
    return CallType.DUPLEX
  }
}

function onFinish (s, fn) {
  const ee = first([[s, 'close', 'end', 'error']], err => {
    ee.cancel()
    fn(err)
  })
}

function wrapCallback (ctx) {
  const { callback } = ctx
  return (err, res) => {
    if (err) {
      return callback(err)
    }
    return callback(err, res)
  }
}

function execRes (ctx, fn) {
  const cb = wrapCallback(ctx)

  if (isStream(ctx.call)) {
    inject(ctx.call, function (err) { onerror(err, ctx) })
    onFinish(ctx.call, destroy.bind(null, ctx.call))
  }

  fn(ctx.ctx).then(() => {
    return asCallback(Promise.resolve(ctx.ctx.res), cb)
  }).catch(err => {
    onerror(err, ctx)
    cb(err)
  })
}

function execStream (ctx, fn) {
  fn(ctx.ctx).then(() => {
    ctx.ctx.res.pipe(ctx.call)
    ctx.ctx.res.once('error', err => {
      ctx.call.emit('error', err)
      onerror(err, ctx)
    })
  }).catch(err => {
    ctx.call.emit('error', err)
    onerror(err, ctx)
  })
}

function execDuplex (ctx, fn) {
  inject(ctx.call, function (err) { onerror(err, ctx) })
  onFinish(ctx.call, destroy.bind(null, ctx.call))
  fn(ctx.ctx).catch(err => {
    ctx.call.emit('error', err)
    onerror(err, ctx)
  })
}

function onerror (err, ctx) {
  ctx.app.emit('error', err, ctx.ctx)
}

module.exports = function exec (ctx, fn) {
  const call = ctx.call
  const { name, fullName, service } = ctx.descriptor
  const packageName = ctx.descriptor.package
  const type = getCallType(ctx)
  const appCtx = ctx.app.context

  const common = {
    type,
    name,
    fullName,
    service,
    package: packageName,
    metadata: call.metadata,
    call,
    app: ctx.app
  }

  if (type === CallType.UNARY) {
    ctx.ctx = new Context(_.assign({},
      appCtx,
      common, {
        req: call.request
      }))
    return execRes(ctx, fn)
  } else if (type === CallType.RESPONSE_STREAM) {
    ctx.ctx = new Context(_.assign({},
      appCtx,
      common, {
        req: call.request
      }))
    return execStream(ctx, fn)
  } else if (type === CallType.REQUEST_STREAM) {
    ctx.ctx = new Context(_.assign({},
      appCtx,
      common, {
        req: call
      }))
    return execRes(ctx, fn)
  } else if (type === CallType.DUPLEX) {
    ctx.ctx = new Context(_.assign({},
      appCtx,
      common, {
        req: call,
        res: call
      }))
    return execDuplex(ctx, fn)
  } else {
    throw new Error('Unknown call type')
  }
}

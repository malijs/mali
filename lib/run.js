const asCallback = require('ascallback')
const CallType = require('mali-call-types')
const inject = require('error-inject')
const destroy = require('destroy')
const first = require('ee-first')
const isStream = require('is-stream')
const {
  getCallTypeFromDescriptor,
  getCallTypeFromCall
} = require('./utils')

const Request = require('./request')
const Response = require('./response')

function getCallType (ctx) {
  let { descriptor, call } = ctx
  return getCallTypeFromCall(call) || getCallTypeFromDescriptor(descriptor)
}

function onEnd (s, fn) {
  const ee = first([
    [s, 'close', 'end', 'error']
  ], err => {
    ee.cancel()
    fn(err)
  })
}

function wrapCallback (ctx) {
  const { callback } = ctx
  return (err, response) => {
    if (err) {
      return callback(err)
    }
    return callback(err, response.res)
  }
}

function execRes (ctx, fn) {
  const cb = wrapCallback(ctx)

  if (isStream(ctx.call)) {
    inject(ctx.call, function (err) { onerror(err, ctx) })
    onEnd(ctx.call, destroy.bind(null, ctx.call))
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
  ctx.call.on('finish', destroy.bind(null, ctx.call))
  fn(ctx.ctx).catch(err => {
    ctx.call.emit('error', err)
    onerror(err, ctx)
  })
}

function onerror (err, ctx) {
  ctx.app.emit('error', err, ctx.ctx)
}

function createContext (runContext) {
  const type = getCallType(runContext)
  const { name, fullName, service } = runContext.descriptor
  const pkgName = runContext.descriptor.package

  const context = Object.create(runContext.app.context)
  context.request = new Request(runContext.call, type)
  context.response = new Response(runContext.call, type)
  Object.assign(context, { name, fullName, service, package: pkgName })
  return context
}

function exec (runContext, fn) {
  const ctx = createContext(runContext)

  if (ctx.type === CallType.UNARY) {
    return execRes(runContext, fn)
  } else if (ctx.type === CallType.RESPONSE_STREAM) {
    return execStream(runContext, fn)
  } else if (ctx.type === CallType.REQUEST_STREAM) {
    return execRes(runContext, fn)
  } else if (ctx.type === CallType.DUPLEX) {
    return execDuplex(runContext, fn)
  } else {
    throw new Error('Unknown call type')
  }
}

module.exports = {
  createContext,
  exec
}

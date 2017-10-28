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
const Context = require('./context')
const Request = require('./request')
const Response = require('./response')

function getCallType (runContext) {
  let { descriptor, call } = runContext
  return getCallTypeFromCall(call) || getCallTypeFromDescriptor(descriptor)
}

function createContext (runContext) {
  const type = getCallType(runContext)
  const { name, fullName, service } = runContext.descriptor
  const pkgName = runContext.descriptor.package

  const context = new Context()
  Object.assign(context, runContext.app.context)
  context.request = new Request(runContext.call, type)
  context.response = new Response(runContext.call, type)
  Object.assign(context, { name, fullName, service, app: runContext.app, package: pkgName })
  return context
}

function wrapCallback (callback) {
  return (err, response) => {
    if (err) {
      return callback(err)
    }
    return callback(err, response)
  }
}

function onEnd (s, fn) {
  const ee = first([
    [s, 'close', 'end', 'error']
  ], err => {
    ee.cancel()
    fn(err)
  })
}

function execRes (ctx, handler, fn) {
  const cb = wrapCallback(fn)

  if (isStream(ctx.call)) {
    inject(ctx.call, function (err) { onerror(err, ctx) })
    onEnd(ctx.call, destroy.bind(null, ctx.call))
  }

  handler(ctx).then(() => {
    return asCallback(Promise.resolve(ctx.res), cb)
  }).catch(err => {
    onerror(err, ctx)
    cb(err)
  })
}

function execStream (ctx, handler) {
  handler(ctx).then(() => {
    ctx.res.pipe(ctx.call)
    ctx.res.once('error', err => {
      ctx.call.emit('error', err)
      onerror(err, ctx)
    })
  }).catch(err => {
    ctx.call.emit('error', err)
    onerror(err, ctx)
  })
}

function execDuplex (ctx, handler) {
  inject(ctx.call, function (err) { onerror(err, ctx) })
  ctx.call.on('finish', destroy.bind(null, ctx.call))
  handler(ctx).catch(err => {
    ctx.call.emit('error', err)
    onerror(err, ctx)
  })
}

function onerror (err, ctx) {
  ctx.app.emit('error', err, ctx)
}

function exec (runContext, fn) {
  const ctx = createContext(runContext)

  if (ctx.type === CallType.UNARY || ctx.type === CallType.REQUEST_STREAM) {
    const { callback } = runContext
    return execRes(ctx, fn, callback)
  } else if (ctx.type === CallType.RESPONSE_STREAM) {
    return execStream(ctx, fn)
  } else if (ctx.type === CallType.DUPLEX) {
    return execDuplex(ctx, fn)
  } else {
    throw new Error('Unknown call type')
  }
}

module.exports = {
  createContext,
  exec
}

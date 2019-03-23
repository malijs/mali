const CallType = require('@malijs/call-types')

exports.getCallTypeFromCall = function (call) {
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
}

exports.getCallTypeFromDescriptor = function (descriptor) {
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

// GENERATED CODE -- DO NOT EDIT!

'use strict'
import grpc from '@grpc/grpc-js'
import test_protos_multi_pb from './multi_pb.js'

function serialize_helloworld_Reply(arg) {
  if (!(arg instanceof test_protos_multi_pb.Reply)) {
    throw new Error('Expected argument of type helloworld.Reply')
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_helloworld_Reply(buffer_arg) {
  return test_protos_multi_pb.Reply.deserializeBinary(
    new Uint8Array(buffer_arg),
  )
}

function serialize_helloworld_Request(arg) {
  if (!(arg instanceof test_protos_multi_pb.Request)) {
    throw new Error('Expected argument of type helloworld.Request')
  }
  return Buffer.from(arg.serializeBinary())
}

function deserialize_helloworld_Request(buffer_arg) {
  return test_protos_multi_pb.Request.deserializeBinary(
    new Uint8Array(buffer_arg),
  )
}

export const GreeterService = {
  sayHello: {
    path: '/helloworld.Greeter/SayHello',
    requestStream: false,
    responseStream: false,
    requestType: test_protos_multi_pb.Request,
    responseType: test_protos_multi_pb.Reply,
    requestSerialize: serialize_helloworld_Request,
    requestDeserialize: deserialize_helloworld_Request,
    responseSerialize: serialize_helloworld_Reply,
    responseDeserialize: deserialize_helloworld_Reply,
  },
}

export const GreeterClient = grpc.makeGenericClientConstructor(GreeterService)
export const Greeter2Service = {
  sayHello: {
    path: '/helloworld.Greeter2/SayHello',
    requestStream: false,
    responseStream: false,
    requestType: test_protos_multi_pb.Request,
    responseType: test_protos_multi_pb.Reply,
    requestSerialize: serialize_helloworld_Request,
    requestDeserialize: deserialize_helloworld_Request,
    responseSerialize: serialize_helloworld_Reply,
    responseDeserialize: deserialize_helloworld_Reply,
  },
}

export const Greeter2Client = grpc.makeGenericClientConstructor(Greeter2Service)
export const Greeter3Service = {
  sayGoodbye: {
    path: '/helloworld.Greeter3/SayGoodbye',
    requestStream: false,
    responseStream: false,
    requestType: test_protos_multi_pb.Request,
    responseType: test_protos_multi_pb.Reply,
    requestSerialize: serialize_helloworld_Request,
    requestDeserialize: deserialize_helloworld_Request,
    responseSerialize: serialize_helloworld_Reply,
    responseDeserialize: deserialize_helloworld_Reply,
  },
}

export const Greeter3Client = grpc.makeGenericClientConstructor(Greeter3Service)
export const Greeter4Service = {
  sayHello: {
    path: '/helloworld.Greeter4/SayHello',
    requestStream: false,
    responseStream: false,
    requestType: test_protos_multi_pb.Request,
    responseType: test_protos_multi_pb.Reply,
    requestSerialize: serialize_helloworld_Request,
    requestDeserialize: deserialize_helloworld_Request,
    responseSerialize: serialize_helloworld_Reply,
    responseDeserialize: deserialize_helloworld_Reply,
  },
  sayGoodbye: {
    path: '/helloworld.Greeter4/SayGoodbye',
    requestStream: false,
    responseStream: false,
    requestType: test_protos_multi_pb.Request,
    responseType: test_protos_multi_pb.Reply,
    requestSerialize: serialize_helloworld_Request,
    requestDeserialize: deserialize_helloworld_Request,
    responseSerialize: serialize_helloworld_Reply,
    responseDeserialize: deserialize_helloworld_Reply,
  },
}

export const Greeter4Client = grpc.makeGenericClientConstructor(Greeter4Service)

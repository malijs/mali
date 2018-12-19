import grpc = require('grpc');
import { CallType } from '@malijs/call-types';

type Call =
  grpc.ServerUnaryCall<any> |
  grpc.ServerReadableStream<any> |
  grpc.ServerWriteableStream<any> |
  grpc.ServerDuplexStream<any, any>;

/**
 * Mali Request class that encapsulates the request of a call.
 * Clients to not create this. Mali does it for us.
 */
export class Request {
  call: Call;
  type: CallType;
  metadata: object;
  req: any;


  /**
   * Creates a Mali Request instance
   * @param {Object} call the grpc call instance
   * @param {String} type the call type. one of `mali-call-types` enums.
   */
  constructor(call: Call, type: CallType) {
    this.call = call;
    this.type = type;
    this.metadata = call.metadata.getMap();

    if (type instanceof grpc.ServerUnaryCall) {

    }
    // if (type === CallType.RESPONSE_STREAM || type === CallType.UNARY) {
    //   this.req = call.request;
    // }
  }
}


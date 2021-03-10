/// <reference types="node" />

import { EventEmitter } from 'events';
import * as grpc from '@grpc/grpc-js';

type GrpcRequest = any;

type GrpcResponse = any;

type GrpcCall =
  grpc.ServerUnaryCall<any, any> |
  grpc.ServerReadableStream<any, any> |
  grpc.ServerWritableStream<any, any> |
  grpc.ServerDuplexStream<any, any>

interface App<T> {
  context: T
}

declare class Mali<T> extends EventEmitter implements App<T> {
  constructor(path?: any, name?: string | ReadonlyArray<string>, options?: any);
  name: string;
  env: string;
  ports: ReadonlyArray<number>;
  silent: boolean;
  context: T

  addService (path: any, name: string | ReadonlyArray<string>, options?: any): void;
  use (service?: any, name?: any, fns?: any): void;
  start (port: number | string, creds?: any, options?: any): Promise<grpc.Server>;
  toJSON (): any;
  close (): Promise<void>;
  inspect (): any;
}

declare namespace Mali {
  interface Context<R> {
    name: string;
    fullName: string;
    service: string;
    package: string;
    app: App<R>;
    call: GrpcCall;
    request: Request;
    response: Response;
    req: GrpcRequest;
    res: GrpcResponse;
    type: string;
    metadata: any;
    locals: object;
    get (field: string): any;
    set (field: any, val?: any): void;
    sendMetadata (md: any): void;
    getStatus (field: string): any;
    setStatus (field: any, val?: any): void;
  }

  class Request {
    constructor(call: any, type: string);
    call: any;
    type: string;
    metadata: any;
    req: GrpcRequest;

    getMetadata (): grpc.Metadata;
    get (field: string): any;
  }

  class Response {
    constructor(call: any, type: string);
    call: any;
    type: string;
    metadata: any;
    status: any;
    res: GrpcResponse;
    set (field: any, val?: any): void;
    get (field: string): any;
    getMetadata (): grpc.Metadata;
    sendMetadata (md?: any): void;
    getStatus (field: string): any;
    setStatus (field: any, val?: any): void;
  }

}

export = Mali;

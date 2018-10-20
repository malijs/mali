/// <reference types="node" />

import { EventEmitter } from 'events'
import { Stream } from 'stream'
import {
  Server,
  Metadata,
  MetadataValue,
  ServerUnaryCall,
  ServerReadableStream,
  ServerWriteableStream,
  ServerDuplexStream,
  ClientUnaryCall,
  ClientReadableStream,
  ClientWritableStream,
  ClientDuplexStream
} from 'grpc'

declare class Mali extends EventEmitter {
  constructor(path: any, name?: string | ReadonlyArray<string>, options?: any)
  name: string
  env: string
  ports: ReadonlyArray<number>
  silent: boolean

  addService(path: any, name: string | ReadonlyArray<string>, options?: any): void
  use(service?: any, name?: any, fns?: any): void
  start(port: number | string, creds?: any, options?: any): Server
  toJSON(): any
  close(): Promise<void>
  inspect(): any
}

declare namespace Mali {
  interface Context {
    name: string
    fullName: string
    service: string
    package: string
    app: Mali
    call: any
    request: Request
    response: Response
    req: ServerUnaryCall | ServerReadableStream | ServerWriteableStream | ServerDuplexStream
    res: ClientUnaryCall | ClientReadableStream | ClientWriteableStream | ClientDuplexStream
    type: string
    metadata: Metadata
    get(field: string): any
    set(field: any, val: MetadataValue): void
    sendMetadata(md: any): void
    getStatus(field: string): any
    setStatus(field: any, val?: any): void
  }

  class Request {
    constructor(call: any, type: string)
    call: any
    type: string
    metadata: any
    req: ServerUnaryCall | ServerReadableStream | ServerWriteableStream | ServerDuplexStream

    getMetadata(): any
    get(field: string): any
  }

  class Response {
    constructor(call: any, type: string)
    call: any
    type: string
    metadata: any
    status: any
    res: ClientUnaryCall | ClientReadableStream | ClientWriteableStream | ClientDuplexStream
    set(field: any, val: MetadataValue): void
    get(field: string): any
    getMetadata(): any
    sendMetadata(md?: any): void
    getStatus(field: string): any
    setStatus(field: any, val: any): void
  }

  function exec(ctx: Context, handler: any, cb?: any): void
}

export = Mali

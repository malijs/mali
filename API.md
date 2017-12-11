### Classes

<dl>
<dt><a href="#Mali">Mali</a> ⇐ <code>Emitter</code></dt>
<dd><p>Represents a gRPC service</p>
</dd>
<dt><a href="#Context">Context</a></dt>
<dd><p>Represents the application and call context. Clients to not create this. Mali does it for us.</p>
</dd>
<dt><a href="#Request">Request</a></dt>
<dd><p>Mali Request class that encasulates the request of a call.
Clients to not create this. Mali does it for us.</p>
</dd>
<dt><a href="#Response">Response</a></dt>
<dd><p>Mali Response class that encasulates the response of a call.
Clients to not create this. Mali does it for us.</p>
</dd>
</dl>

<a name="mali" id="mali" data-id="mali"></a>

### Mali ⇐ <code>Emitter</code>

Represents a gRPC service

**Kind**: global class  
**Extends**: <code>Emitter</code>

* [Mali](#Mali) ⇐ <code>Emitter</code>
  * [new Mali(proto, name, options)](#new_Mali_new)
  * [.silent](#Malisilent) : <code>Boolean</code>
  * [.name](#Maliname) : <code>String</code>
  * [.env](#Malienv) : <code>String</code>
  * [.init(proto, name, options)](#Maliinit)
  * [.addService(proto, name, options)](#Maliinit)
  * [.use(service, name, ...fns)](#Maliuse)
  * [.onerror(err)](#Malionerror)
  * [.start(port, creds)](#Malistart) ⇒ <code>Object</code>
  * [.close()](#Maliclose)
  * [.toJSON()](#MalitoJSON) ⇒ <code>Object</code>
  * [.inspect()](#Maliinspect) ⇒ <code>Object</code>

<a name="new_mali_new" id="new_mali_new" data-id="new_mali_new"></a>

#### new Mali(proto, name, options)

Create a gRPC service

| Param   | Type                                       | Description                                                                                                                                                                                                                |
| ------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| proto   | <code>String</code> \| <code>Object</code> | Path to the protocol buffer definition file - Object specifying <code>root</code> directory and <code>file</code> to load - Loaded grpc object - The static service proto object itself                                    |
| name    | <code>Object</code>                        | Optional name of the service or an array of names. Otherwise all services are used. In case of proto path the name of the service as defined in the proto definition. In case of proto object the name of the constructor. |
| options | <code>Object</code>                        | Options to be passed to <code>grpc.load</code>                                                                                                                                                                             |

**Example** _(Create service dynamically)_

```js
const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
const app = new Mali(PROTO_PATH, 'Greeter')
```

**Example** _(Create service from static definition)_

```js
const services = require('./static/helloworld_grpc_pb')
const app = new Mali(services, 'GreeterService')
```

<a name="malisilent" id="malisilent" data-id="malisilent"></a>

#### mali.silent : <code>Boolean</code>

Whether to log errors in <code>onerror</code>. Default: <code>false</code>

**Kind**: instance property of [<code>Mali</code>](#Mali)  
<a name="maliname" id="maliname" data-id="maliname"></a>

#### mali.name : <code>String</code>

The service name

**Kind**: instance property of [<code>Mali</code>](#Mali)  
**Example**

```js
console.log(app.name) // 'Greeter'
```

<a name="malienv" id="malienv" data-id="malienv"></a>

#### mali.env : <code>String</code>

The environment. Taken from <code>process.end.NODE_ENV</code>. Default: <code>development</code>

**Kind**: instance property of [<code>Mali</code>](#Mali)  
**Example**

```js
console.log(app.env) // 'development'
```

<a name="maliinit" id="maliinit" data-id="maliinit"></a>

#### mali.init(proto, name, options)

Init's the app with the proto. Basically this can be used if you don't have the data at
app construction time for some reason.

**Kind**: instance method of [<code>Mali</code>](#Mali)

| Param   | Type                                       | Description                                                                                                                                                                                                                |
| ------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| proto   | <code>String</code> \| <code>Object</code> | Path to the protocol buffer definition file - Object specifying <code>root</code> directory and <code>file</code> to load - Loaded grpc object - The static service proto object itself                                    |
| name    | <code>Object</code>                        | Optional name of the service or an array of names. Otherwise all services are used. In case of proto path the name of the service as defined in the proto definition. In case of proto object the name of the constructor. |
| options | <code>Object</code>                        | Options to be passed to <code>grpc.load</code>                                                                                                                                                                             |

<a name="maliuse" id="maliuse" data-id="maliuse"></a>

#### mali.use(service, name, ...fns)

Define middleware and handlers.
If <code>service</code> and name are given applies fns for that call under that service.
If <code>service</code> name is provided and matches one of the services defined in proto,
but no </code>name</code> is provided applies the fns as service level middleware
for all handlers in that service.
If <code>service</code> is provided and no <code>name</code> is provided, and service does not
match any of the service names in the proto, assumes <code>service</code> is actually rpc call
name. Uses <code>0</code>th property in internal services object. Useful for protos with only
one service.
If an <code>object</code> is provided, you can set middleware and handlers for all services.
If <code>object</code> provided but <code>0</code>th key does not match any of the services in
proto, assumes <code>0</code>th service. Useful for protos with only one service.

**Kind**: instance method of [<code>Mali</code>](#Mali)

| Param   | Type                                         | Description               |
| ------- | -------------------------------------------- | ------------------------- |
| service | <code>String</code> \| <code>Object</code>   | Service name              |
| name    | <code>String</code> \| <code>function</code> | RPC name                  |
| ...fns  | <code>function</code> \| <code>Array</code>  | Middleware and/or handler |

**Example** _(Define handler for rpc function &#x27;fn1&#x27;)_

```js
app.use('fn1', fn1)
```

**Example** _(Define handler with middleware for rpc function &#x27;fn2&#x27;)_

```js
app.use('fn2', mw1, mw2, fn2)
```

**Example** _(Define handler with middleware for rpc function &#x27;fn2&#x27; in service &#x27;Service2&#x27;)_

```js
app.use('Service2', 'fn2', mw1, mw2, fn2)
```

**Example** _(Using destructuring define handlers for rpc functions &#x27;fn1&#x27; and &#x27;fn2&#x27;)_

```js
app.use({ fn1, fn2 })
```

**Example** _(Apply middleware to all handers for a service)_

```js
app.use('Service1', mw1)
```

**Example** _(Using destructuring define handlers for rpc functions &#x27;fn1&#x27; and &#x27;fn2&#x27;)_

```js
// fn2 has middleware mw1 and mw2
app.use({ MyService: { fn1, fn2: [mw1, mw2, fn2] } })
```

**Example** _(Multiple services using object notation)_

```js
app.use(mw1) // global for all services
app.use('Service1', mw2) // applies to all Service1 handers
app.use({
  Service1: {
    sayGoodbye: handler1, // has mw1, mw2
    sayHello: [mw3, handler2], // has mw1, mw2, mw3
  },
  Service2: {
    saySomething: handler3, // only has mw1
  },
})
```

<a name="malionerror" id="malionerror" data-id="malionerror"></a>

#### mali.onerror(err)

Default error handler.

**Kind**: instance method of [<code>Mali</code>](#Mali)

| Param | Type               |
| ----- | ------------------ |
| err   | <code>Error</code> |

<a name="malistart" id="malistart" data-id="malistart"></a>

#### mali.start(port, creds) ⇒ <code>Object</code>

Start the service. All middleware and handlers have to be set up prior to calling <code>start</code>.

**Kind**: instance method of [<code>Mali</code>](#Mali)  
**Returns**: <code>Object</code> - server - The <code>grpc.Server</code> instance

| Param | Type                | Default       | Description                                                                        |
| ----- | ------------------- | ------------- | ---------------------------------------------------------------------------------- |
| port  | <code>String</code> |               | The hostport for the service                                                       |
| creds | <code>Object</code> | <code></code> | Credentials options. Default: <code>grpc.ServerCredentials.createInsecure()</code> |

**Example**

```js
app.start('localhost:50051')
```

<a name="maliclose" id="maliclose" data-id="maliclose"></a>

#### mali.close()

Close the service(s).

**Kind**: instance method of [<code>Mali</code>](#Mali)  
**Example**

```js
app.close()
```

<a name="malitojson" id="malitojson" data-id="malitojson"></a>

#### mali.toJSON() ⇒ <code>Object</code>

Return JSON representation.
We only bother showing settings.

**Kind**: instance method of [<code>Mali</code>](#Mali)  
**Api**: public  
<a name="maliinspect" id="maliinspect" data-id="maliinspect"></a>

#### mali.inspect() ⇒ <code>Object</code>

Inspect implementation.

**Kind**: instance method of [<code>Mali</code>](#Mali)  
<a name="context" id="context" data-id="context"></a>

### Context

Represents the application and call context. Clients to not create this. Mali does it for us.

**Kind**: global class  
**Summary**: Represents a Mali call context

* [Context](#Context)
  * [.name](#Contextname) : <code>String</code>
  * [.fullName](#ContextfullName) : <code>String</code>
  * [.service](#Contextservice) : <code>String</code>
  * [.package](#Contextpackage) : <code>String</code>
  * [.app](#Contextapp) : <code>Object</code>
  * [.call](#Contextcall) : <code>Object</code>
  * [.request](#Contextrequest) : <code>Object</code>
  * [.response](#Contextresponse) : <code>Object</code>
  * [.req](#Contextreq) : <code>Object</code> \| <code>Stream</code>
  * [.type](#Contexttype) : <code>String</code>
  * [.metadata](#Contextmetadata) : <code>String</code>
  * [.get](#Contextget) ⇒ <code>\*</code>
  * [.res](#Contextres) : <code>Object</code> \| <code>Stream</code>
  * [.set](#Contextset) : <code>function</code>
  * [.sendMetadata](#ContextsendMetadata) : <code>function</code>
  * [.getStatus](#ContextgetStatus) ⇒ <code>\*</code>
  * [.setStatus](#ContextsetStatus) : <code>function</code>

<a name="contextname" id="contextname" data-id="contextname"></a>

#### context.name : <code>String</code>

The call function name.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Example**

```js
console.log(ctx.name) // 'SayHello'
```

<a name="contextfullname" id="contextfullname" data-id="contextfullname"></a>

#### context.fullName : <code>String</code>

The full name of the call.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Example**

```js
console.log(ctx.fullName) // '/helloworld.Greeter/SayHello'
```

<a name="contextservice" id="contextservice" data-id="contextservice"></a>

#### context.service : <code>String</code>

The service name of the call.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Example**

```js
console.log(ctx.service) // 'Greeter'
```

<a name="contextpackage" id="contextpackage" data-id="contextpackage"></a>

#### context.package : <code>String</code>

The package name of the call.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Example**

```js
console.log(ctx.package) // 'helloworld'
```

<a name="contextapp" id="contextapp" data-id="contextapp"></a>

#### context.app : <code>Object</code>

The application instance reference.

**Kind**: instance property of [<code>Context</code>](#Context)  
<a name="contextcall" id="contextcall" data-id="contextcall"></a>

#### context.call : <code>Object</code>

The internal gRPC call instance reference.
This is an alias to `ctx.request.call`.

**Kind**: instance property of [<code>Context</code>](#Context)  
<a name="contextrequest" id="contextrequest" data-id="contextrequest"></a>

#### context.request : <code>Object</code>

The call's Mali Request object.

**Kind**: instance property of [<code>Context</code>](#Context)  
<a name="contextresponse" id="contextresponse" data-id="contextresponse"></a>

#### context.response : <code>Object</code>

The call's Mali Response object.

**Kind**: instance property of [<code>Context</code>](#Context)  
<a name="contextreq" id="contextreq" data-id="contextreq"></a>

#### context.req : <code>Object</code> \| <code>Stream</code>

The call request object or stream. This is an alias to `ctx.request.res`.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Example**

```js
console.dir(ctx.req) // { name: 'Bob' }
```

<a name="contexttype" id="contexttype" data-id="contexttype"></a>

#### context.type : <code>String</code>

The call's type. One of `mali-call-types` enums.
This is an alias to `ctx.request.type`.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Example**

```js
console.log(ctx.type) // 'unary'
```

**Example**

```js
if (ctx.type === CallType.DUPLEX) {
  console.log('Duplex stream call')
}
```

<a name="contextmetadata" id="contextmetadata" data-id="contextmetadata"></a>

#### context.metadata : <code>String</code>

The call's request metadata plain object.
This is an alias to `ctx.request.metadata`.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Example**

```js
console.log(ctx.metadata)
// { 'user-agent': 'grpc-node/1.7.1 grpc-c/1.7.1 (osx; chttp2)' }
```

<a name="contextget" id="contextget" data-id="contextget"></a>

#### context.get ⇒ <code>\*</code>

Get request metadata value
This is an alias to `ctx.request.get()`.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Returns**: <code>\*</code> - the metadata field value

| Param | Type                | Description    |
| ----- | ------------------- | -------------- |
| field | <code>String</code> | the field name |

**Example**

```js
console.log(ctx.get('user-agent'))
// 'grpc-node/1.7.1 grpc-c/1.7.1 (osx; chttp2)'
```

<a name="contextres" id="contextres" data-id="contextres"></a>

#### context.res : <code>Object</code> \| <code>Stream</code>

The response object or stream. Should be set in handler.
This is an alias to `ctx.response.res`.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Example**

```js
ctx.res = { message: 'Hello World!' }
```

<a name="contextset" id="contextset" data-id="contextset"></a>

#### context.set : <code>function</code>

Set response header metadata value.
This is an alias to `ctx.response.set()`.

**Kind**: instance property of [<code>Context</code>](#Context)

| Param | Type                                       | Description                                    |
| ----- | ------------------------------------------ | ---------------------------------------------- |
| field | <code>String</code> \| <code>Object</code> | the metadata field name or object for metadata |
| val   | <code>\*</code>                            | the value of the field                         |

**Example** _(Using string field name and value)_

```js
ctx.set('foo', 'bar')
```

**Example** _(Using object)_

```js
ctx.set({
  foo: 'bar',
})
```

<a name="contextsendmetadata" id="contextsendmetadata" data-id="contextsendmetadata"></a>

#### context.sendMetadata : <code>function</code>

Send response header metadata.
This is an alias to `ctx.response.sendMetadata()`.

**Kind**: instance property of [<code>Context</code>](#Context)

| Param | Type                | Description                                                                                                                                                                                                            |
| ----- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| md    | <code>Object</code> | optional header metadata object to set into the request before sending if there is existing metadata in the response it is cleared if param is not provided `sendMetadata` sends the existing metadata in the response |

**Example** _(Set and send)_

```js
ctx.sendMetadata({
  foo: 'bar',
})
```

**Example** _(Set and send later)_

```js
ctx.set('foo', 'bar')
// ... later
ctx.response.sendMetadata()
```

<a name="contextgetstatus" id="contextgetstatus" data-id="contextgetstatus"></a>

#### context.getStatus ⇒ <code>\*</code>

Get response status / trailer metadata value.
This is an alias to `ctx.response.getStatus()`.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Returns**: <code>\*</code> - the metadata field value
console.log(ctx.getStatus('foo')) // 'bar'

| Param | Type                | Description    |
| ----- | ------------------- | -------------- |
| field | <code>String</code> | the field name |

<a name="contextsetstatus" id="contextsetstatus" data-id="contextsetstatus"></a>

#### context.setStatus : <code>function</code>

Set response status / trailer metadata value.
This is an alias to `ctx.response.setStatus()`.

**Kind**: instance property of [<code>Context</code>](#Context)

| Param | Type                                       | Description                                    |
| ----- | ------------------------------------------ | ---------------------------------------------- |
| field | <code>String</code> \| <code>Object</code> | the metadata field name or object for metadata |
| val   | <code>\*</code>                            | the value of the field                         |

**Example**

```js
ctx.setStatus('foo', 'bar')
```

**Example** _(Using object)_

```js
ctx.setStatus({
  foo: 'bar',
})
```

<a name="request" id="request" data-id="request"></a>

### Request

Mali Request class that encasulates the request of a call.
Clients to not create this. Mali does it for us.

**Kind**: global class

* [Request](#Request)
  * [new Request(call, type)](#new_Request_new)
  * [.call](#Requestcall) : <code>Object</code>
  * [.req](#Requestreq) : <code>Object</code> \| <code>Stream</code>
  * [.metadata](#Requestmetadata) : <code>Object</code>
  * [.type](#Requesttype) : <code>String</code>
  * [.getMetadata()](#RequestgetMetadata) ⇒ <code>Object</code>
  * [.get(field)](#Requestget) ⇒ <code>\*</code>

<a name="new_request_new" id="new_request_new" data-id="new_request_new"></a>

#### new Request(call, type)

Creates a Mali Request instance

| Param | Type                | Description                                    |
| ----- | ------------------- | ---------------------------------------------- |
| call  | <code>Object</code> | the grpc call instance                         |
| type  | <code>String</code> | the call type. one of `mali-call-types` enums. |

<a name="requestcall" id="requestcall" data-id="requestcall"></a>

#### request.call : <code>Object</code>

The internal gRPC call instance reference.

**Kind**: instance property of [<code>Request</code>](#Request)  
<a name="requestreq" id="requestreq" data-id="requestreq"></a>

#### request.req : <code>Object</code> \| <code>Stream</code>

The call request object or stream.

**Kind**: instance property of [<code>Request</code>](#Request)  
**Example**

```js
console.log(ctx.request.req) // { name: 'Bob' }
```

<a name="requestmetadata" id="requestmetadata" data-id="requestmetadata"></a>

#### request.metadata : <code>Object</code>

The call's request metadata plain object if present.

**Kind**: instance property of [<code>Request</code>](#Request)  
**Example**

```js
console.log(ctx.request.metadata)
// { 'user-agent': 'grpc-node/1.7.1 grpc-c/1.7.1 (osx; chttp2)' }
```

<a name="requesttype" id="requesttype" data-id="requesttype"></a>

#### request.type : <code>String</code>

The call's type. One of `mali-call-types` enums.

**Kind**: instance property of [<code>Request</code>](#Request)  
**Example**

```js
console.log(ctx.request.type) // 'unary'
```

**Example**

```js
if (ctx.request.type === CallType.DUPLEX) {
  console.log('Duplex stream call')
}
```

<a name="requestgetmetadata" id="requestgetmetadata" data-id="requestgetmetadata"></a>

#### request.getMetadata() ⇒ <code>Object</code>

Gets the requests metadata as a `grpc.Metadata` object instance

**Kind**: instance method of [<code>Request</code>](#Request)  
**Returns**: <code>Object</code> - request metadata  
<a name="requestget" id="requestget" data-id="requestget"></a>

#### request.get(field) ⇒ <code>\*</code>

Gets specific request meatadata field value

**Kind**: instance method of [<code>Request</code>](#Request)  
**Returns**: <code>\*</code> - the metadata value for the field

| Param | Type            | Description             |
| ----- | --------------- | ----------------------- |
| field | <code>\*</code> | the metadata field name |

**Example**

```js
console.log(ctx.request.get('foo')) // 'bar'
```

<a name="response" id="response" data-id="response"></a>

### Response

Mali Response class that encasulates the response of a call.
Clients to not create this. Mali does it for us.

**Kind**: global class

* [Response](#Response)
  * [new Response(call, type)](#new_Response_new)
  * [.call](#Responsecall) : <code>Object</code>
  * [.type](#Responsetype) : <code>String</code>
  * [.metadata](#Responsemetadata) : <code>Object</code>
  * [.status](#Responsestatus) : <code>Object</code>
  * [.res](#Responseres) : <code>Object</code> \| <code>Stream</code>
  * [.set(field, val)](#Responseset)
  * [.get(field)](#Responseget) ⇒ <code>\*</code>
  * [.getMetadata()](#ResponsegetMetadata) ⇒ <code>Object</code>
  * [.sendMetadata(md)](#ResponsesendMetadata)
  * [.getStatus(field)](#ResponsegetStatus) ⇒ <code>\*</code>
  * [.setStatus(field, val)](#ResponsesetStatus)
  * [.getStatusMetadata()](#ResponsegetStatusMetadata) ⇒ <code>Object</code>

<a name="new_response_new" id="new_response_new" data-id="new_response_new"></a>

#### new Response(call, type)

Creates a Mali Response instance

| Param | Type                | Description                                    |
| ----- | ------------------- | ---------------------------------------------- |
| call  | <code>Object</code> | the grpc call instance                         |
| type  | <code>String</code> | the call type. one of `mali-call-types` enums. |

<a name="responsecall" id="responsecall" data-id="responsecall"></a>

#### response.call : <code>Object</code>

The internal gRPC call instance reference.

**Kind**: instance property of [<code>Response</code>](#Response)  
<a name="responsetype" id="responsetype" data-id="responsetype"></a>

#### response.type : <code>String</code>

The call's type. One of `mali-call-types` enums.
This will match Request's type.

**Kind**: instance property of [<code>Response</code>](#Response)  
**Example**

```js
console.log(ctx.response.type) // 'unary'
```

<a name="responsemetadata" id="responsemetadata" data-id="responsemetadata"></a>

#### response.metadata : <code>Object</code>

The call's response header metadata plain object if present.

**Kind**: instance property of [<code>Response</code>](#Response)  
**Example**

```js
ctx.response.set('foo', 'bar')
console.log(ctx.response.metadata) // { 'foo': 'bar' }
```

<a name="responsestatus" id="responsestatus" data-id="responsestatus"></a>

#### response.status : <code>Object</code>

The call's response trailer / status metadata plain object if present.

**Kind**: instance property of [<code>Response</code>](#Response)  
**Example**

```js
ctx.response.setStatus('biz', 'baz')
console.log(ctx.response.status) // { biz: 'baz' }
```

<a name="responseres" id="responseres" data-id="responseres"></a>

#### response.res : <code>Object</code> \| <code>Stream</code>

The call's response actual payload object / stream.
In case of `DUPLEX` call this is automatically set the actual `call` instance.

**Kind**: instance property of [<code>Response</code>](#Response)  
**Example** _(UNARY or REQUEST STREAM calls)_

```js
ctx.response.res = { foo: 'bar' }
```

**Example** _(RESPONSE STREAM calls)_

```js
ctx.response.res = createResponseStream()
```

**Example** _(DUPLEX calls)_

```js
ctx.response.res.write({ foo: 'bar' })
```

<a name="responseset" id="responseset" data-id="responseset"></a>

#### response.set(field, val)

Sets specific response header meatadata field value

**Kind**: instance method of [<code>Response</code>](#Response)

| Param | Type                                       | Description                                    |
| ----- | ------------------------------------------ | ---------------------------------------------- |
| field | <code>String</code> \| <code>Object</code> | the metadata field name or object for metadata |
| val   | <code>\*</code>                            | the value of the field                         |

**Example** _(Using string field name and value)_

```js
ctx.response.set('foo', 'bar')
```

**Example** _(Using object)_

```js
ctx.response.set({
  foo: 'bar',
})
```

<a name="responseget" id="responseget" data-id="responseget"></a>

#### response.get(field) ⇒ <code>\*</code>

Gets the response header metadata value

**Kind**: instance method of [<code>Response</code>](#Response)  
**Returns**: <code>\*</code> - the metadata field value

| Param | Type                | Description    |
| ----- | ------------------- | -------------- |
| field | <code>String</code> | the field name |

**Example**

```js
console.log(ctx.response.get('foo')) // 'bar'
```

<a name="responsegetmetadata" id="responsegetmetadata" data-id="responsegetmetadata"></a>

#### response.getMetadata() ⇒ <code>Object</code>

Gets the response metadata as a `grpc.Metadata` object instance

**Kind**: instance method of [<code>Response</code>](#Response)  
**Returns**: <code>Object</code> - response metadata  
<a name="responsesendmetadata" id="responsesendmetadata" data-id="responsesendmetadata"></a>

#### response.sendMetadata(md)

Sends the response header metadata. Optionally (re)sets the header metadata as well.

**Kind**: instance method of [<code>Response</code>](#Response)

| Param | Type                | Description                                                                                                                                                                                                            |
| ----- | ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| md    | <code>Object</code> | optional header metadata object to set into the request before sending if there is existing metadata in the response it is cleared if param is not provided `sendMetadata` sends the existing metadata in the response |

**Example** _(Set and send)_

```js
ctx.response.sendMetadata({
  foo: 'bar',
})
```

**Example** _(Set and send later)_

```js
ctx.response.set('foo', 'bar')
// ... later
ctx.response.sendMetadata()
```

<a name="responsegetstatus" id="responsegetstatus" data-id="responsegetstatus"></a>

#### response.getStatus(field) ⇒ <code>\*</code>

Gets the response status / trailer metadata value

**Kind**: instance method of [<code>Response</code>](#Response)  
**Returns**: <code>\*</code> - the metadata field value

| Param | Type                | Description    |
| ----- | ------------------- | -------------- |
| field | <code>String</code> | the field name |

**Example**

```js
console.log(ctx.response.getStatus('bar')) // 'baz'
```

<a name="responsesetstatus" id="responsesetstatus" data-id="responsesetstatus"></a>

#### response.setStatus(field, val)

Sets specific response status / trailer meatadata field value

**Kind**: instance method of [<code>Response</code>](#Response)

| Param | Type                                       | Description                                    |
| ----- | ------------------------------------------ | ---------------------------------------------- |
| field | <code>String</code> \| <code>Object</code> | the metadata field name or object for metadata |
| val   | <code>\*</code>                            | the value of the field                         |

**Example** _(Using string field name and value)_

```js
ctx.response.setStatus('foo', 'bar')
```

**Example** _(Using object)_

```js
ctx.response.setStatus({
  foo: 'bar',
})
```

<a name="responsegetstatusmetadata" id="responsegetstatusmetadata" data-id="responsegetstatusmetadata"></a>

#### response.getStatusMetadata() ⇒ <code>Object</code>

Gets the response status / trailer metadata as a `grpc.Metadata` object instance

**Kind**: instance method of [<code>Response</code>](#Response)  
**Returns**: <code>Object</code> - response status / trailer metadata

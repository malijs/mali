## Classes

<dl>
<dt><a href="#Mali">Mali</a> ⇐ <code>Emitter</code></dt>
<dd><p>Represents a gRPC service</p>
</dd>
<dt><a href="#Context">Context</a></dt>
<dd><p>Represents the application and call context. Clients to not create this. Mali does it for us.</p>
</dd>
<dt><a href="#Request">Request</a></dt>
<dd><p>Mali Request class that encapsulates the request of a call.
Clients to not create this. Mali does it for us.</p>
</dd>
<dt><a href="#Response">Response</a></dt>
<dd><p>Mali Response class that encapsulates the response of a call.
Clients to not create this. Mali does it for us.</p>
</dd>
</dl>

<a name="Mali"></a>

## Mali ⇐ <code>Emitter</code>
Represents a gRPC service

**Kind**: global class  
**Extends**: <code>Emitter</code>  

* [Mali](#Mali) ⇐ <code>Emitter</code>
    * [new Mali(proto, name, options)](#new_Mali_new)
    * [.name](#Mali+name) : <code>String</code>
    * [.env](#Mali+env) : <code>String</code>
    * [.ports](#Mali+ports) : <code>Array</code>
    * [.silent](#Mali+silent) : <code>Boolean</code>
    * [.addService(proto, name, options)](#Mali+addService)
    * [.use(service, name, ...fns)](#Mali+use)
    * [.onerror(err)](#Mali+onerror)
    * [.start(port, creds, options)](#Mali+start) ⇒ <code>Object</code>
    * [.close()](#Mali+close)
    * [.toJSON()](#Mali+toJSON) ⇒ <code>Object</code>

<a name="new_Mali_new"></a>

### new Mali(proto, name, options)
Create a gRPC service


| Param | Type | Description |
| --- | --- | --- |
| proto | <code>String</code> \| <code>Object</code> | Path to the protocol buffer definition file                              - Object specifying <code>root</code> directory and <code>file</code> to load                              - Loaded grpc object                              - The static service proto object itself |
| name | <code>Object</code> | Optional name of the service or an array of names. Otherwise all services are used.                      In case of proto path the name of the service as defined in the proto definition.                      In case of proto object the name of the constructor. |
| options | <code>Object</code> | Options to be passed to <code>grpc.load</code> |

**Example** *(Create service dynamically)*  
```js
const PROTO_PATH = path.resolve(__dirname, './protos/helloworld.proto')
const app = new Mali(PROTO_PATH, 'Greeter')
```
**Example** *(Create service from static definition)*  
```js
const services = require('./static/helloworld_grpc_pb')
const app = new Mali(services, 'GreeterService')
```
<a name="Mali+name"></a>

### mali.name : <code>String</code>
The service name.
                      If multiple services are initialized, this will be equal to the first service loaded.

**Kind**: instance property of [<code>Mali</code>](#Mali)  
**Example**  
```js
console.log(app.name) // 'Greeter'
```
<a name="Mali+env"></a>

### mali.env : <code>String</code>
The environment. Taken from <code>process.end.NODE_ENV</code>. Default: <code>development</code>

**Kind**: instance property of [<code>Mali</code>](#Mali)  
**Example**  
```js
console.log(app.env) // 'development'
```
<a name="Mali+ports"></a>

### mali.ports : <code>Array</code>
The ports of the started service(s)

**Kind**: instance property of [<code>Mali</code>](#Mali)  
**Example**  
```js
console.log(app.ports) // [ 52239 ]
```
<a name="Mali+silent"></a>

### mali.silent : <code>Boolean</code>
Whether to log errors in <code>onerror</code>. Default: <code>false</code>

**Kind**: instance property of [<code>Mali</code>](#Mali)  
<a name="Mali+addService"></a>

### mali.addService(proto, name, options)
Add the service and initialize the app with the proto.
Basically this can be used if you don't have the data at app construction time for some reason.
This is different than `grpc.Server.addService()`.

**Kind**: instance method of [<code>Mali</code>](#Mali)  

| Param | Type | Description |
| --- | --- | --- |
| proto | <code>String</code> \| <code>Object</code> | Path to the protocol buffer definition file                              - Object specifying <code>root</code> directory and <code>file</code> to load                              - Loaded grpc object                              - The static service proto object itself |
| name | <code>Object</code> | Optional name of the service or an array of names. Otherwise all services are used.                      In case of proto path the name of the service as defined in the proto definition.                      In case of proto object the name of the constructor. |
| options | <code>Object</code> | Options to be passed to <code>grpc.load</code> |

<a name="Mali+use"></a>

### mali.use(service, name, ...fns)
Define middleware and handlers.

**Kind**: instance method of [<code>Mali</code>](#Mali)  

| Param | Type | Description |
| --- | --- | --- |
| service | <code>String</code> \| <code>Object</code> | Service name |
| name | <code>String</code> \| <code>function</code> | RPC name |
| ...fns | <code>function</code> \| <code>Array</code> | Middleware and/or handler |

**Example** *(Define handler for RPC function &#x27;getUser&#x27; in first service we find that has that call name.)*  
```js
app.use('getUser', getUser)
```
**Example** *(Define handler with middleware for RPC function &#x27;getUser&#x27; in first service we find that has that call name.)*  
```js
app.use('getUser', mw1, mw2, getUser)
```
**Example** *(Define handler with middleware for RPC function &#x27;getUser&#x27; in service &#x27;MyService&#x27;. We pick first service that matches the name.)*  
```js
app.use('MyService', 'getUser', mw1, mw2, getUser)
```
**Example** *(Define handler with middleware for rpc function &#x27;getUser&#x27; in service &#x27;MyService&#x27; with full package name.)*  
```js
app.use('myorg.myapi.v1.MyService', 'getUser', mw1, mw2, getUser)
```
**Example** *(Using destructuring define handlers for rpc functions &#x27;getUser&#x27; and &#x27;deleteUser&#x27;. Here we would match the first service that has a &#x60;getUser&#x60; RPC method.)*  
```js
app.use({ getUser, deleteUser })
```
**Example** *(Apply middleware to all handlers for a given service. We match first service that has the given name.)*  
```js
app.use('MyService', mw1)
```
**Example** *(Apply middleware to all handlers for a given service using full namespaced package name.)*  
```js
app.use('myorg.myapi.v1.MyService', mw1)
```
**Example** *(Using destructuring define handlers for RPC functions &#x27;getUser&#x27; and &#x27;deleteUser&#x27;. We match first service that has the given name.)*  
```js
// deleteUser has middleware mw1 and mw2
app.use({ MyService: { getUser, deleteUser: [mw1, mw2, deleteUser] } })
```
**Example** *(Using destructuring define handlers for RPC functions &#x27;getUser&#x27; and &#x27;deleteUser&#x27;.)*  
```js
// deleteUser has middleware mw1 and mw2
app.use({ 'myorg.myapi.v1.MyService': { getUser, deleteUser: [mw1, mw2, deleteUser] } })
```
**Example** *(Multiple services using object notation.)*  
```js
app.use(mw1) // global for all services
app.use('MyService', mw2) // applies to first matched service named 'MyService'
app.use({
  'myorg.myapi.v1.MyService': { // matches MyService
    sayGoodbye: handler1, // has mw1, mw2
    sayHello: [ mw3, handler2 ] // has mw1, mw2, mw3
  },
  'myorg.myapi.v1.MyOtherService': {
    saySomething: handler3 // only has mw1
  }
})
```
<a name="Mali+onerror"></a>

### mali.onerror(err)
Default error handler.

**Kind**: instance method of [<code>Mali</code>](#Mali)  

| Param | Type |
| --- | --- |
| err | <code>Error</code> | 

<a name="Mali+start"></a>

### mali.start(port, creds, options) ⇒ <code>Object</code>
Start the service. All middleware and handlers have to be set up prior to calling <code>start</code>.
Throws in case we fail to bind to the given port.

**Kind**: instance method of [<code>Mali</code>](#Mali)  
**Returns**: <code>Object</code> - server - The <code>grpc.Server</code> instance  

| Param | Type | Description |
| --- | --- | --- |
| port | <code>String</code> | The hostport for the service. Default: <code>127.0.0.1:0</code> |
| creds | <code>Object</code> | Credentials options. Default: <code>grpc.ServerCredentials.createInsecure()</code> |
| options | <code>Object</code> | The start options to be passed to `grpc.Server` constructor. |

**Example**  
```js
app.start('localhost:50051')
```
**Example** *(Start same app on multiple ports)*  
```js
app.start('127.0.0.1:50050')
app.start('127.0.0.1:50051')
```
<a name="Mali+close"></a>

### mali.close()
Close the service(s).

**Kind**: instance method of [<code>Mali</code>](#Mali)  
**Example**  
```js
app.close()
```
<a name="Mali+toJSON"></a>

### mali.toJSON() ⇒ <code>Object</code>
Return JSON representation.
We only bother showing settings.

**Kind**: instance method of [<code>Mali</code>](#Mali)  
**Api**: public  
<a name="Context"></a>

## Context
Represents the application and call context. Clients to not create this. Mali does it for us.

**Kind**: global class  
**Summary**: Represents a Mali call context  

* [Context](#Context)
    * [.name](#Context+name) : <code>String</code>
    * [.fullName](#Context+fullName) : <code>String</code>
    * [.service](#Context+service) : <code>String</code>
    * [.package](#Context+package) : <code>String</code>
    * [.app](#Context+app) : <code>Object</code>
    * [.call](#Context+call) : <code>Object</code>
    * [.request](#Context+request) : <code>Object</code>
    * [.response](#Context+response) : <code>Object</code>
    * [.req](#Context+req) : <code>Object</code> \| <code>Stream</code>
    * [.type](#Context+type) : <code>String</code>
    * [.metadata](#Context+metadata) : <code>String</code>
    * [.get](#Context+get) ⇒ <code>\*</code>
    * [.res](#Context+res) : <code>Object</code> \| <code>Stream</code>
    * [.set](#Context+set) : <code>function</code>
    * [.sendMetadata](#Context+sendMetadata) : <code>function</code>
    * [.getStatus](#Context+getStatus) ⇒ <code>\*</code>
    * [.setStatus](#Context+setStatus) : <code>function</code>

<a name="Context+name"></a>

### context.name : <code>String</code>
The call function name.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Example**  
```js
console.log(ctx.name) // 'SayHello'
```
<a name="Context+fullName"></a>

### context.fullName : <code>String</code>
The full name of the call.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Example**  
```js
console.log(ctx.fullName) // '/helloworld.Greeter/SayHello'
```
<a name="Context+service"></a>

### context.service : <code>String</code>
The service name of the call.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Example**  
```js
console.log(ctx.service) // 'Greeter'
```
<a name="Context+package"></a>

### context.package : <code>String</code>
The package name of the call.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Example**  
```js
console.log(ctx.package) // 'helloworld'
```
<a name="Context+app"></a>

### context.app : <code>Object</code>
The application instance reference.

**Kind**: instance property of [<code>Context</code>](#Context)  
<a name="Context+call"></a>

### context.call : <code>Object</code>
The internal gRPC call instance reference.
This is an alias to `ctx.request.call`.

**Kind**: instance property of [<code>Context</code>](#Context)  
<a name="Context+request"></a>

### context.request : <code>Object</code>
The call's Mali Request object.

**Kind**: instance property of [<code>Context</code>](#Context)  
<a name="Context+response"></a>

### context.response : <code>Object</code>
The call's Mali Response object.

**Kind**: instance property of [<code>Context</code>](#Context)  
<a name="Context+req"></a>

### context.req : <code>Object</code> \| <code>Stream</code>
The call request object or stream. This is an alias to `ctx.request.res`.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Example**  
```js
console.dir(ctx.req) // { name: 'Bob' }
```
<a name="Context+type"></a>

### context.type : <code>String</code>
The call's type. One of `@malijs/call-types` enums.
This is an alias to `ctx.request.type`.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Example**  
```js
console.log(ctx.type) // 'unary'
```
**Example**  
```js
if(ctx.type === CallType.DUPLEX) {
  console.log('Duplex stream call')
}
```
<a name="Context+metadata"></a>

### context.metadata : <code>String</code>
The call's request metadata plain object.
This is an alias to `ctx.request.metadata`.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Example**  
```js
console.log(ctx.metadata)
// { 'user-agent': 'grpc-node/1.7.1 grpc-c/1.7.1 (osx; chttp2)' }
```
<a name="Context+get"></a>

### context.get ⇒ <code>\*</code>
Get request metadata value
This is an alias to `ctx.request.get()`.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Returns**: <code>\*</code> - the metadata field value  

| Param | Type | Description |
| --- | --- | --- |
| field | <code>String</code> | the field name |

**Example**  
```js
console.log(ctx.get('user-agent'))
// 'grpc-node/1.7.1 grpc-c/1.7.1 (osx; chttp2)'
```
<a name="Context+res"></a>

### context.res : <code>Object</code> \| <code>Stream</code>
The response object or stream. Should be set in handler.
This is an alias to `ctx.response.res`.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Example**  
```js
ctx.res = { message: 'Hello World!' }
```
<a name="Context+set"></a>

### context.set : <code>function</code>
Set response header metadata value.
This is an alias to `ctx.response.set()`.

**Kind**: instance property of [<code>Context</code>](#Context)  

| Param | Type | Description |
| --- | --- | --- |
| field | <code>String</code> \| <code>Object</code> | the metadata field name or object for metadata |
| val | <code>\*</code> | the value of the field |

**Example** *(Using string field name and value)*  
```js
ctx.set('foo', 'bar')
```
**Example** *(Using object)*  
```js
ctx.set({
  foo: 'bar'
})
```
<a name="Context+sendMetadata"></a>

### context.sendMetadata : <code>function</code>
Send response header metadata.
This is an alias to `ctx.response.sendMetadata()`.

**Kind**: instance property of [<code>Context</code>](#Context)  

| Param | Type | Description |
| --- | --- | --- |
| md | <code>Object</code> | optional header metadata object to set into the request before sending                    if there is existing metadata in the response it is cleared                    if param is not provided `sendMetadata` sends the existing metadata in the response |

**Example** *(Set and send)*  
```js
ctx.sendMetadata({
  foo: 'bar'
})
```
**Example** *(Set and send later)*  
```js
ctx.set('foo', 'bar')
// ... later
ctx.response.sendMetadata()
```
<a name="Context+getStatus"></a>

### context.getStatus ⇒ <code>\*</code>
Get response status / trailer metadata value.
This is an alias to `ctx.response.getStatus()`.

**Kind**: instance property of [<code>Context</code>](#Context)  
**Returns**: <code>\*</code> - the metadata field value
console.log(ctx.getStatus('foo')) // 'bar'  

| Param | Type | Description |
| --- | --- | --- |
| field | <code>String</code> | the field name |

<a name="Context+setStatus"></a>

### context.setStatus : <code>function</code>
Set response status / trailer metadata value.
This is an alias to `ctx.response.setStatus()`.

**Kind**: instance property of [<code>Context</code>](#Context)  

| Param | Type | Description |
| --- | --- | --- |
| field | <code>String</code> \| <code>Object</code> | the metadata field name or object for metadata |
| val | <code>\*</code> | the value of the field |

**Example**  
```js
ctx.setStatus('foo', 'bar')
```
**Example** *(Using object)*  
```js
ctx.setStatus({
  foo: 'bar'
})
```
<a name="Request"></a>

## Request
Mali Request class that encapsulates the request of a call.
Clients to not create this. Mali does it for us.

**Kind**: global class  

* [Request](#Request)
    * [new Request(call, type)](#new_Request_new)
    * [.call](#Request+call) : <code>Object</code>
    * [.req](#Request+req) : <code>Object</code> \| <code>Stream</code>
    * [.metadata](#Request+metadata) : <code>Object</code>
    * [.type](#Request+type) : <code>String</code>
    * [.getMetadata()](#Request+getMetadata) ⇒ <code>Object</code>
    * [.get(field)](#Request+get) ⇒ <code>\*</code>

<a name="new_Request_new"></a>

### new Request(call, type)
Creates a Mali Request instance


| Param | Type | Description |
| --- | --- | --- |
| call | <code>Object</code> | the grpc call instance |
| type | <code>String</code> | the call type. one of `@malijs/call-types` enums. |

<a name="Request+call"></a>

### request.call : <code>Object</code>
The internal gRPC call instance reference.

**Kind**: instance property of [<code>Request</code>](#Request)  
<a name="Request+req"></a>

### request.req : <code>Object</code> \| <code>Stream</code>
The call request object or stream.

**Kind**: instance property of [<code>Request</code>](#Request)  
**Example**  
```js
console.log(ctx.request.req) // { name: 'Bob' }
```
<a name="Request+metadata"></a>

### request.metadata : <code>Object</code>
The call's request metadata plain object if present.

**Kind**: instance property of [<code>Request</code>](#Request)  
**Example**  
```js
console.log(ctx.request.metadata)
// { 'user-agent': 'grpc-node/1.7.1 grpc-c/1.7.1 (osx; chttp2)' }
```
<a name="Request+type"></a>

### request.type : <code>String</code>
The call's type. One of `@malijs/call-types` enums.

**Kind**: instance property of [<code>Request</code>](#Request)  
**Example**  
```js
console.log(ctx.request.type) // 'unary'
```
**Example**  
```js
if(ctx.request.type === CallType.DUPLEX) {
  console.log('Duplex stream call')
}
```
<a name="Request+getMetadata"></a>

### request.getMetadata() ⇒ <code>Object</code>
Gets the requests metadata as a `grpc.Metadata` object instance

**Kind**: instance method of [<code>Request</code>](#Request)  
**Returns**: <code>Object</code> - request metadata  
<a name="Request+get"></a>

### request.get(field) ⇒ <code>\*</code>
Gets specific request metadata field value

**Kind**: instance method of [<code>Request</code>](#Request)  
**Returns**: <code>\*</code> - the metadata value for the field  

| Param | Type | Description |
| --- | --- | --- |
| field | <code>\*</code> | the metadata field name |

**Example**  
```js
console.log(ctx.request.get('foo')) // 'bar'
```
<a name="Response"></a>

## Response
Mali Response class that encapsulates the response of a call.
Clients to not create this. Mali does it for us.

**Kind**: global class  

* [Response](#Response)
    * [new Response(call, type)](#new_Response_new)
    * [.call](#Response+call) : <code>Object</code>
    * [.type](#Response+type) : <code>String</code>
    * [.metadata](#Response+metadata) : <code>Object</code>
    * [.status](#Response+status) : <code>Object</code>
    * [.res](#Response+res) : <code>Object</code> \| <code>Stream</code>
    * [.set(field, val)](#Response+set)
    * [.get(field)](#Response+get) ⇒ <code>\*</code>
    * [.getMetadata()](#Response+getMetadata) ⇒ <code>Object</code>
    * [.sendMetadata(md)](#Response+sendMetadata)
    * [.getStatus(field)](#Response+getStatus) ⇒ <code>\*</code>
    * [.setStatus(field, val)](#Response+setStatus)
    * [.getStatusMetadata()](#Response+getStatusMetadata) ⇒ <code>Object</code>

<a name="new_Response_new"></a>

### new Response(call, type)
Creates a Mali Response instance


| Param | Type | Description |
| --- | --- | --- |
| call | <code>Object</code> | the grpc call instance |
| type | <code>String</code> | the call type. one of `@malijs/call-types` enums. |

<a name="Response+call"></a>

### response.call : <code>Object</code>
The internal gRPC call instance reference.

**Kind**: instance property of [<code>Response</code>](#Response)  
<a name="Response+type"></a>

### response.type : <code>String</code>
The call's type. One of `@malijs/call-types` enums.
This will match Request's type.

**Kind**: instance property of [<code>Response</code>](#Response)  
**Example**  
```js
console.log(ctx.response.type) // 'unary'
```
<a name="Response+metadata"></a>

### response.metadata : <code>Object</code>
The call's response header metadata plain object if present.

**Kind**: instance property of [<code>Response</code>](#Response)  
**Example**  
```js
ctx.response.set('foo', 'bar')
console.log(ctx.response.metadata)  // { 'foo': 'bar' }
```
<a name="Response+status"></a>

### response.status : <code>Object</code>
The call's response trailer / status metadata plain object if present.

**Kind**: instance property of [<code>Response</code>](#Response)  
**Example**  
```js
ctx.response.setStatus('biz', 'baz')
console.log(ctx.response.status) // { biz: 'baz' }
```
<a name="Response+res"></a>

### response.res : <code>Object</code> \| <code>Stream</code>
The call's response actual payload object / stream.
In case of `DUPLEX` call this is automatically set the actual `call` instance.

**Kind**: instance property of [<code>Response</code>](#Response)  
**Example** *(UNARY or REQUEST STREAM calls)*  
```js
ctx.response.res = { foo: 'bar' }
```
**Example** *(RESPONSE STREAM calls)*  
```js
ctx.response.res = createResponseStream()
```
**Example** *(DUPLEX calls)*  
```js
ctx.response.res.write({ foo: 'bar' })
```
**Example** *(Custom Response Stream calls)*  
```js
ctx.response.res = new Response({ object: true});
ctx.response.res.push({ data: 'hello 1' });
ctx.response.res.push({ data: 'hello 2' });
ctx.response.res.push({ data: 'hello 3' });
ctx.response.res.push(null);
```
<a name="Response+set"></a>

### response.set(field, val)
Sets specific response header metadata field value

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| field | <code>String</code> \| <code>Object</code> | the metadata field name or object for metadata |
| val | <code>\*</code> | the value of the field |

**Example** *(Using string field name and value)*  
```js
ctx.response.set('foo', 'bar')
```
**Example** *(Using object)*  
```js
ctx.response.set({
  foo: 'bar'
})
```
<a name="Response+get"></a>

### response.get(field) ⇒ <code>\*</code>
Gets the response header metadata value

**Kind**: instance method of [<code>Response</code>](#Response)  
**Returns**: <code>\*</code> - the metadata field value  

| Param | Type | Description |
| --- | --- | --- |
| field | <code>String</code> | the field name |

**Example**  
```js
console.log(ctx.response.get('foo')) // 'bar'
```
<a name="Response+getMetadata"></a>

### response.getMetadata() ⇒ <code>Object</code>
Gets the response metadata as a `grpc.Metadata` object instance

**Kind**: instance method of [<code>Response</code>](#Response)  
**Returns**: <code>Object</code> - response metadata  
<a name="Response+sendMetadata"></a>

### response.sendMetadata(md)
Sends the response header metadata. Optionally (re)sets the header metadata as well.

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| md | <code>Object</code> | optional header metadata object to set into the request before sending                    if there is existing metadata in the response it is cleared                    if param is not provided `sendMetadata` sends the existing metadata in the response |

**Example** *(Set and send)*  
```js
ctx.response.sendMetadata({
  foo: 'bar'
})
```
**Example** *(Set and send later)*  
```js
ctx.response.set('foo', 'bar')
// ... later
ctx.response.sendMetadata()
```
<a name="Response+getStatus"></a>

### response.getStatus(field) ⇒ <code>\*</code>
Gets the response status / trailer metadata value

**Kind**: instance method of [<code>Response</code>](#Response)  
**Returns**: <code>\*</code> - the metadata field value  

| Param | Type | Description |
| --- | --- | --- |
| field | <code>String</code> | the field name |

**Example**  
```js
console.log(ctx.response.getStatus('bar')) // 'baz'
```
<a name="Response+setStatus"></a>

### response.setStatus(field, val)
Sets specific response status / trailer metadata field value

**Kind**: instance method of [<code>Response</code>](#Response)  

| Param | Type | Description |
| --- | --- | --- |
| field | <code>String</code> \| <code>Object</code> | the metadata field name or object for metadata |
| val | <code>\*</code> | the value of the field |

**Example** *(Using string field name and value)*  
```js
ctx.response.setStatus('foo', 'bar')
```
**Example** *(Using object)*  
```js
ctx.response.setStatus({
  foo: 'bar'
})
```
<a name="Response+getStatusMetadata"></a>

### response.getStatusMetadata() ⇒ <code>Object</code>
Gets the response status / trailer metadata as a `grpc.Metadata` object instance

**Kind**: instance method of [<code>Response</code>](#Response)  
**Returns**: <code>Object</code> - response status / trailer metadata  

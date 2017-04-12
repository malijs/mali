### Classes

<dl>
<dt>[Context](#contextclass)</dt>
<dd><p>Represents a RPC call context.</p>
</dd>
<dt>[Mali](#maliclass) ⇐ <code>Emitter</code></dt>
<dd><p>Represents a gRPC service</p>
</dd>
</dl>

<a name="contextclass" id="contextclass" data-id="contextclass"></a>

### Context
Represents a RPC call context.

**Kind**: global class  

* [Context](#contextclass)
    * [new Context()](#newcontextnew)
    * [.name](#contextname) : <code>String</code>
    * [.fullName](#contextfullName) : <code>String</code>
    * [.service](#contextservice) : <code>String</code>
    * [.package](#contextpackage) : <code>String</code>
    * [.type](#contexttype) : <code>String</code>
    * [.req](#contextreq) : <code>Object</code>, <code>Stream</code>
    * [.res](#contextres) : <code>Object</code>, <code>Stream</code>
    * [.metadata](#contextmetadata) : <code>Object</code>
    * [.app](#contextapp) : <code>Object</code>
    * [.call](#contextcall) : <code>Object</code>

<a name="newcontextnew" id="newcontextnew" data-id="newcontextnew"></a>

#### new Context()
Context constructor. Clients do not need to call this.

**Example**  

```js
async function toUpper(ctx) {
  console.log(ctx.type) // logs the type
  ctx.res = { message: ctx.req.message.toUpperCase() }
}
```

<a name="contextname" id="contextname" data-id="contextname"></a>

#### context.name : <code>String</code>
The call function name.

**Kind**: instance property of <code>[Context](#context)</code>  
**Example**  

```js
console.log(ctx.name) // 'SayHello'
```

<a name="contextfullname" id="contextfullname" data-id="contextfullname"></a>

#### context.fullName : <code>String</code>
The full name of the call.

**Kind**: instance property of <code>[Context](#context)</code>  
**Example**  

```js
console.log(ctx.fullName) // '/helloworld.Greeter/SayHello'
```

<a name="contextservice" id="contextservice" data-id="contextservice"></a>

#### context.service : <code>String</code>
The service name of the call.

**Kind**: instance property of <code>[Context](#context)</code>  
**Example**  

```js
console.log(ctx.service) // 'Greeter'
```

<a name="contextpackage" id="contextpackage" data-id="contextpackage"></a>

#### context.package : <code>String</code>
The package name of the call.

**Kind**: instance property of <code>[Context](#context)</code>  
**Example**  

```js
console.log(ctx.package) // 'helloworld'
```

<a name="contexttype" id="contexttype" data-id="contexttype"></a>

#### context.type : <code>String</code>
The call type. One of <code>CallType</code> enums.

**Kind**: instance property of <code>[Context](#context)</code>  
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

<a name="contextreq" id="contextreq" data-id="contextreq"></a>

#### context.req : <code>Object</code>, <code>Stream</code>
The request object or stream.

**Kind**: instance property of <code>[Context](#context)</code>  
**Example**  

```js
console.dir(ctx.req) // { name: 'Bob' }
```

<a name="contextres" id="contextres" data-id="contextres"></a>

#### context.res : <code>Object</code>, <code>Stream</code>
The response object or stream. Should be set in handler.

**Kind**: instance property of <code>[Context](#context)</code>  
**Example**  

```js
ctx.res = { name: 'Bob' }
```

<a name="contextmetadata" id="contextmetadata" data-id="contextmetadata"></a>

#### context.metadata : <code>Object</code>
The call metadata if present.

**Kind**: instance property of <code>[Context](#context)</code>  
**Example**  

```js
console.log(ctx.metadata)
// { 'user-agent': 'grpc-node/1.0.1 grpc-c/1.0.1 (osx; chttp2)' }
```

<a name="contextapp" id="contextapp" data-id="contextapp"></a>

#### context.app : <code>Object</code>
The application instance reference.

**Kind**: instance property of <code>[Context](#context)</code>  
<a name="contextcall" id="contextcall" data-id="contextcall"></a>

#### context.call : <code>Object</code>
The internal gRPC call instance reference.

**Kind**: instance property of <code>[Context](#context)</code>  
<a name="Maliclass" id="Maliclass" data-id="Maliclass"></a>

### Mali ⇐ <code>Emitter</code>
Represents a gRPC service

**Kind**: global class  
**Extends**: <code>Emitter</code>  

* [Mali](#mali) ⇐ <code>Emitter</code>
    * [new Mali(proto, name, options)](#new_Mali_new)
    * [.name](#maliname) : <code>String</code>
    * [.env](#malienv) : <code>String</code>
    * [.silent](#malisilent) : <code>Boolean</code>
    * [.init(proto, name, options)](#maliinit)
    * [.use(service, name, ...fns)](#maliuse)
    * [.onerror(err)](#malionerror)
    * [.start(port, creds)](#malistart) ⇒ <code>Object</code>
    * [.close()](#maliclose)
    * [.toJSON()](#malitoJSON) ⇒ <code>Object</code>
    * [.inspect()](#maliinspect) ⇒ <code>Object</code>

<a name="new_mali_new" id="new_mali_new" data-id="new_mali_new"></a>

#### new Mali(proto, name, options)
Create a gRPC service


| Param | Type | Description |
| --- | --- | --- |
| proto | <code>String</code>, <code>Object</code> | Path to the protocol buffer definition file                              - Object specifying <code>root</code> directory and <code>file</code> to load                              - The static service proto object itself |
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

<a name="maliname" id="maliname" data-id="maliname"></a>

#### mali.name : <code>String</code>
The service name

**Kind**: instance property of <code>[Mali](#mali)</code>  
**Example**  

```js
console.log(app.name) // 'Greeter'
```

<a name="malienv" id="malienv" data-id="malienv"></a>

#### mali.env : <code>String</code>
The environment. Taken from <code>process.end.NODE_ENV</code>. Default: <code>development</code>

**Kind**: instance property of <code>[Mali](#mali)</code>  
**Example**  

```js
console.log(app.env) // 'development'
```

<a name="malisilent" id="malisilent" data-id="malisilent"></a>

#### mali.silent : <code>Boolean</code>
Whether to log errors in <code>onerror</code>. Default: <code>false</code>

**Kind**: instance property of <code>[Mali](#mali)</code>  
<a name="maliinit" id="maliinit" data-id="maliinit"></a>

#### mali.init(proto, name, options)
Init's the app with the proto. Basically this can be used if you don't have the data at
app construction time for some reason.

**Kind**: instance method of <code>[Mali](#mali)</code>  

| Param | Type | Description |
| --- | --- | --- |
| proto | <code>String</code>, <code>Object</code> | Path to the protocol buffer definition file                              - Object specifying <code>root</code> directory and <code>file</code> to load                              - The static service proto object itself |
| name | <code>Object</code> | Optional name of the service or an array of names. Otherwise all services are used.                      In case of proto path the name of the service as defined in the proto definition.                      In case of proto object the name of the constructor. |
| options | <code>Object</code> | Options to be passed to <code>grpc.load</code> |

<a name="maliuse" id="maliuse" data-id="maliuse"></a>

#### mali.use(service, name, ...fns)
Define middleware and handlers.
If <code>service</code> and name are given applies fns for that call under that service.
If <code>service</code> name is provided and matches one of the services defined in proto,
but no </code>name</code> is provided applies the fns as middleware as service level middleware
for all handlers in that service.
If <code>service</code> is provided and no <code>name</code> is provided, and service does not
match any of the service names in the proto, assumes <code>service</code> is actually rpc call
name. Uses <code>0</code>th property in internal services object. Useful for protos with only
one service.
If an <code>object</code> is provided, you can set middleware and handlers for all services.
If <code>object</code> provided but <code>0</code>th key does not match any of the services in
proto, assumes <code>0</code>th service. Useful for protos with only one service.

**Kind**: instance method of <code>[Mali](#mali)</code>  

| Param | Type | Description |
| --- | --- | --- |
| service | <code>String</code>, <code>Object</code> | Service name |
| name | <code>String</code>, <code>function</code> | RPC name |
| ...fns | <code>function</code>, <code>Array</code> | Middleware and/or handler |

**Example** *(Define handler for rpc function &#x27;fn1&#x27;)*  

```js
app.use('fn1', fn1)
```

**Example** *(Define handler with middleware for rpc function &#x27;fn2&#x27;)*  

```js
app.use('fn2', mw1, mw2, fn2)
```

**Example** *(Define handler with middleware for rpc function &#x27;fn2&#x27; in service &#x27;Service2&#x27;)*  

```js
app.use('Service2', 'fn2', mw1, mw2, fn2)
```

**Example** *(Using destructuring define handlers for rpc functions &#x27;fn1&#x27; and &#x27;fn2&#x27;)*  

```js
app.use({ fn1, fn2 })
```

**Example** *(Apply middleware to all handers for a service)*  

```js
app.use('Service1', mw1)
```

**Example** *(Using destructuring define handlers for rpc functions &#x27;fn1&#x27; and &#x27;fn2&#x27;)*  

```js
// fn2 has middleware mw1 and mw2
app.use({ MyService: { fn1, fn2: [mw1, mw2, fn2] } })
```

**Example** *(Multiple services using object notation)*  

```js
app.use(mw1) // global for all services
app.use('Service1', mw2) // applies to all Service1 handers
app.use({
  Service1: {
    sayGoodbye: handler1, // has mw1, mw2
    sayHello: [ mw3, handler2 ] // has mw1, mw2, mw3
  },
  Service2: {
    saySomething: handler3 // only has mw1
  }
})
```

<a name="malionerror" id="malionerror" data-id="malionerror"></a>

#### mali.onerror(err)
Default error handler.

**Kind**: instance method of <code>[Mali](#mali)</code>  

| Param | Type |
| --- | --- |
| err | <code>Error</code> | 

<a name="malistart" id="malistart" data-id="malistart"></a>

#### mali.start(port, creds) ⇒ <code>Object</code>
Start the service. All middleware and handlers have to be set up prior to calling <code>start</code>.

**Kind**: instance method of <code>[Mali](#mali)</code>  
**Returns**: <code>Object</code> - server - The <code>grpc.Server</code> instance  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| port | <code>String</code> |  | The hostport for the service |
| creds | <code>Object</code> | <code></code> | Credentials options. Default: <code>grpc.ServerCredentials.createInsecure()</code> |

**Example**  

```js
app.start('localhost:50051')
```

<a name="maliclose" id="maliclose" data-id="maliclose"></a>

#### mali.close()
Close the service(s).

**Kind**: instance method of <code>[Mali](#mali)</code>  
**Example**  

```js
app.close()
```

<a name="malitojson" id="malitojson" data-id="malitojson"></a>

#### mali.toJSON() ⇒ <code>Object</code>
Return JSON representation.
We only bother showing settings.

**Kind**: instance method of <code>[Mali](#mali)</code>  
**Api**: public  
<a name="maliinspect" id="maliinspect" data-id="maliinspect"></a>

#### mali.inspect() ⇒ <code>Object</code>
Inspect implementation.

**Kind**: instance method of <code>[Mali](#mali)</code>  

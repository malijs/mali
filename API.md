### Classes

<dl>
<dt><a href="#Context">Context</a></dt>
<dd><p>Represents a RPC call context.</p>
</dd>
<dt><a href="#Mali">Mali</a> ⇐ <code>Emitter</code></dt>
<dd><p>Represents a gRPC service</p>
</dd>
</dl>

<a name="Context"></a>

### Context
Represents a RPC call context.

**Kind**: global class  

* [Context](#Context)
    * [new Context()](#new_Context_new)
    * [.name](#Context+name) : <code>String</code>
    * [.type](#Context+type) : <code>String</code>
    * [.req](#Context+req) : <code>Object</code> &#124; <code>Stream</code>
    * [.res](#Context+res) : <code>Object</code> &#124; <code>Stream</code>
    * [.app](#Context+app) : <code>Object</code>
    * [.call](#Context+call) : <code>Object</code>

<a name="new_Context_new"></a>

#### new Context()
Context constructor. Clients do not need to call this.

**Example**  

```js
async function toUpper(ctx) {
  console.log(ctx.type) // logs the type
  ctx.res = { message: ctx.req.message.toUpperCase() }
}
```

<a name="Context+name"></a>

#### context.name : <code>String</code>
The call function name.

**Kind**: instance property of <code>[Context](#Context)</code>  
**Example**  

```js
console.log(ctx.name) // 'SayHello'
```

<a name="Context+type"></a>

#### context.type : <code>String</code>
The call type. One of <code>CallType</code> enums.

**Kind**: instance property of <code>[Context](#Context)</code>  
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

<a name="Context+req"></a>

#### context.req : <code>Object</code> &#124; <code>Stream</code>
The request object or stream.

**Kind**: instance property of <code>[Context](#Context)</code>  
**Example**  

```js
console.dir(ctx.req) // { name: 'Bob' }
```

<a name="Context+res"></a>

#### context.res : <code>Object</code> &#124; <code>Stream</code>
The response object or stream.
                            Should be set in handler.

**Kind**: instance property of <code>[Context](#Context)</code>  
**Example**  

```js
ctx.res = { name: 'Bob' }
```

<a name="Context+app"></a>

#### context.app : <code>Object</code>
The application instance reference.

**Kind**: instance property of <code>[Context](#Context)</code>  
<a name="Context+call"></a>

#### context.call : <code>Object</code>
The internal gRPC call instance reference.

**Kind**: instance property of <code>[Context](#Context)</code>  
<a name="Mali"></a>

### Mali ⇐ <code>Emitter</code>
Represents a gRPC service

**Kind**: global class  
**Extends**: <code>Emitter</code>  

* [Mali](#Mali) ⇐ <code>Emitter</code>
    * [new Mali(proto, name, options)](#new_Mali_new)
    * [.name](#Mali+name) : <code>String</code>
    * [.env](#Mali+env) : <code>String</code>
    * [.silent](#Mali+silent) : <code>Boolean</code>
    * [.init(proto, name, options)](#Mali+init)
    * [.use(service, name, ...fns)](#Mali+use)
    * [.onerror(err)](#Mali+onerror)
    * [.start(port, creds)](#Mali+start) ⇒ <code>Object</code>
    * [.close()](#Mali+close)
    * [.toJSON()](#Mali+toJSON) ⇒ <code>Object</code>
    * [.inspect()](#Mali+inspect) ⇒ <code>Object</code>

<a name="new_Mali_new"></a>

#### new Mali(proto, name, options)
Create a gRPC service


| Param | Type | Description |
| --- | --- | --- |
| proto | <code>String</code> &#124; <code>Object</code> | Path to the protocol buffer definition file                              - Object specifying <code>root</code> directory and <code>file</code> to load                              - The static service proto object itself |
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

#### mali.name : <code>String</code>
The service name

**Kind**: instance property of <code>[Mali](#Mali)</code>  
**Example**  

```js
console.log(app.name) // 'Greeter'
```

<a name="Mali+env"></a>

#### mali.env : <code>String</code>
The environment. Taken from <code>process.end.NODE_ENV</code>. Default: <code>development</code>

**Kind**: instance property of <code>[Mali](#Mali)</code>  
**Example**  

```js
console.log(app.env) // 'development'
```

<a name="Mali+silent"></a>

#### mali.silent : <code>Boolean</code>
Whether to log errors in <code>onerror</code>. Default: <code>false</code>

**Kind**: instance property of <code>[Mali](#Mali)</code>  
<a name="Mali+init"></a>

#### mali.init(proto, name, options)
Init's the app with the proto. Basically this can be used if you don't have the data at
app construction time for some reason.

**Kind**: instance method of <code>[Mali](#Mali)</code>  

| Param | Type | Description |
| --- | --- | --- |
| proto | <code>String</code> &#124; <code>Object</code> | Path to the protocol buffer definition file                              - Object specifying <code>root</code> directory and <code>file</code> to load                              - The static service proto object itself |
| name | <code>Object</code> | Optional name of the service or an array of names. Otherwise all services are used.                      In case of proto path the name of the service as defined in the proto definition.                      In case of proto object the name of the constructor. |
| options | <code>Object</code> | Options to be passed to <code>grpc.load</code> |

<a name="Mali+use"></a>

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

**Kind**: instance method of <code>[Mali](#Mali)</code>  

| Param | Type | Description |
| --- | --- | --- |
| service | <code>String</code> &#124; <code>Object</code> | Service name |
| name | <code>String</code> &#124; <code>function</code> | RPC name |
| ...fns | <code>function</code> &#124; <code>Array</code> | Middleware and/or handler |

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

<a name="Mali+onerror"></a>

#### mali.onerror(err)
Default error handler.

**Kind**: instance method of <code>[Mali](#Mali)</code>  

| Param | Type |
| --- | --- |
| err | <code>Error</code> | 

<a name="Mali+start"></a>

#### mali.start(port, creds) ⇒ <code>Object</code>
Start the service. All middleware and handlers have to be set up prior to calling <code>start</code>.

**Kind**: instance method of <code>[Mali](#Mali)</code>  
**Returns**: <code>Object</code> - server - The <code>grpc.Server</code> instance  

| Param | Type | Default | Description |
| --- | --- | --- | --- |
| port | <code>String</code> |  | The hostport for the service |
| creds | <code>Object</code> | <code></code> | Credentials options. Default: <code>grpc.ServerCredentials.createInsecure()</code> |

**Example**  

```js
app.start('localhost:50051')
```

<a name="Mali+close"></a>

#### mali.close()
Close the service(s).

**Kind**: instance method of <code>[Mali](#Mali)</code>  
**Example**  

```js
app.close()
```

<a name="Mali+toJSON"></a>

#### mali.toJSON() ⇒ <code>Object</code>
Return JSON representation.
We only bother showing settings.

**Kind**: instance method of <code>[Mali](#Mali)</code>  
**Api**: public  
<a name="Mali+inspect"></a>

#### mali.inspect() ⇒ <code>Object</code>
Inspect implementation.

**Kind**: instance method of <code>[Mali](#Mali)</code>  

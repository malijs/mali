<a name="module_mali-call-types"></a>

### mali-call-types
**Example**  
```js
const CallType = require('mali-call-types')
console.log(CallType.DUPLEX)
```
**Example** *(Within Mali call handler)*  
```js
if(ctx.type === CallType.UNARY) {
  console.log('Unary call')
}
```

* [mali-call-types](#module_mali-call-types)
    * [.UNARY](#module_mali-call-types.UNARY)
    * [.REQUEST_STREAM](#module_mali-call-types.REQUEST_STREAM)
    * [.RESPONSE_STREAM](#module_mali-call-types.RESPONSE_STREAM)
    * [.DUPLEX](#module_mali-call-types.DUPLEX)

<a name="module_mali-call-types.UNARY"></a>

#### mali-call-types.UNARY
Unary call

**Kind**: static property of [<code>mali-call-types</code>](#module_mali-call-types)  
<a name="module_mali-call-types.REQUEST_STREAM"></a>

#### mali-call-types.REQUEST\_STREAM
Request is a stream

**Kind**: static property of [<code>mali-call-types</code>](#module_mali-call-types)  
<a name="module_mali-call-types.RESPONSE_STREAM"></a>

#### mali-call-types.RESPONSE\_STREAM
Response is a stream

**Kind**: static property of [<code>mali-call-types</code>](#module_mali-call-types)  
<a name="module_mali-call-types.DUPLEX"></a>

#### mali-call-types.DUPLEX
Duplex call where both request and response are streams

**Kind**: static property of [<code>mali-call-types</code>](#module_mali-call-types)  

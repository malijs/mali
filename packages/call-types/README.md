<a name="module_mali-call-types"></a>

### mali-call-types
**Example**  
```js
const { CallType } = require('@malijs/call-types')
console.log(CallType.DUPLEX)
// "duplex"
```
**Example** *(Within Mali call handler)*  
```js
if (ctx.type === CallType.UNARY) {
  console.log('Unary call')
}
```

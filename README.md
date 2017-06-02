# babel-flow-scope

> Collect Flow bindings in a given scope

```js
import {getFlowBindingsInScope} from 'babel-flow-scope';

getFlowBindingsInScope(path);
// {
//   foo: {
//     kind: 'import',
//     path: (Identifier)
//   },
//   bar: {
//     kind: 'param',
//     path: (TypeParameter)
//   },
//   baz: {
//     kind: 'declaration',
//     path: (Identifier)
//   }
// }
```
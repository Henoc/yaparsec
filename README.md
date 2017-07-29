# yaparsec

Yet another parser combinator for TypeScript.  
The class structure is referenced by [scala-parser-combinators](https://github.com/scala/scala-parser-combinators).

## Installing

```bash
npm install yaparsec
```

## Useage

```typescript
import { literal } from "yaparsec";

// literal parsing
const abcParser = literal("abc");
const parsedResult = abcParser.of("abcdefg");
console.log(parsedResult); // Success { rest: 'defg', result: 'abc' }
```

Implemented functions are based on PEG (Parsing Expression Grammar). You can find more examples in test files.

## License

Yaparsec is available under the MIT license.

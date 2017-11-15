# yaparsec

Yet another parser combinator.  
The class structure is referenced by [scala-parser-combinators](https://github.com/scala/scala-parser-combinators).

## Installing

```bash
npm install yaparsec
```

## Useage

typescript:  

```typescript
import { literal } from "yaparsec";

// literal parsing
const abcParser = literal("abc");
const parsedResult = abcParser.of("abcdefg"); // input: "abcdefg"
console.log(parsedResult); // Success { rest: 'defg', result: 'abc' }
```

Implemented functions are based on PEG (Parsing Expression Grammar). You can find more examples in test files.

## Operators

`p, q: Parser`  

| function | description |
|:---------|:------------|
|p.of(input)|take input for parser `p`|
|p.map(fn)|map the parse result of `p` with `fn`|
|p.then(q)|sequence parser|
|p.or(q)|ordered choice parser (try `q` only if `p` fails)|
|p.rep()|`p*`|
|p.rep1()|`p+`|
|p.rep1sep(q)|`p(qp)*`|
|p.opt()|`p?`|
|p.not()|success if input does **not** start with `p`|
|p.guard()|success if input starts with `p`, without consuming input|
|p.saveR(q)|same as sequence, but discard left result (~>)|
|p.saveL(q)|same as sequence, but discard right result (<~)|
|p.into(fq)|2nd parser depends on the result of the 1st parser (>>)|
|seq(...ps)|sequence parser that has many sub parsers|
|lt(str)|parse specified string `str`|
|r(regexp)|parse any string match `regexp`|
|decimal|decimal number parser|
|integer|integer number parser|
|email|email parser|

## Parser

Type of parsers is `Parser<T>`, `T` means the result type of parsing.

## Input

Input type is string or `Input`. You can manage regex as whitespace when useing `Input`.  If string, the default regex `/^\s+/` is selected.

```typescript
// Space or `,` char sequence is treated as whitespace
someparser.of(new Input(inputString, /^[\s,]+/));
```

## Result

Parse result type is `Success<T>` or `Failure<T>`, `T` is the content type. `Success<T>` has two contents, parse result and rest input. You can get the parse result to use `getResult()` in `Success<T>`. If fail, `Failure<T>` has three contents, rest input, error message and the parser name. There are in order to determine the cause of errors.

## Recursion

Arguments that require another parsers can all be lazy, so you can use right recursion.

```typescript
// a*b parser
const aStarB: Parser<string> = literal("b").or((literal("a").then(() => aStarB).map(ret => ret[0] + ret[1]));
```

## License

Yaparsec is available under the MIT license.

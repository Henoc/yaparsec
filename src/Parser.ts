/**
 * Parser is like a function expect some input to parse.
 */
export class Parser<T> {
  constructor(public of: (input: string) => ParseResult<T>) {}

  map<U>(mapper: (e: T) => U): Parser<U> {
    return new Parser<U>(input => this.of(input).map(mapper));
  }

  then<U>(q: () => Parser<U>) {
    return new Parser<Cons<T, U>>(input => {
      const ret = this.of(input);
      switch (ret.constructor) {
        case Success:
          return q().of(input).map(result2 => new Cons(ret.result, result2));
        case Failure:
          return new Failure<Cons<T, U>>(input, `fail in ${this}`);
      }
      throw matchError;
    });
  }
}

export class Cons<T, U> {
  constructor(public fst: T, public snd: U) {}
}

export interface ParseResult<T> {
  result: T;
  map<U>(fn: (e: T) => U): ParseResult<U>;
}

export class Success<T> implements ParseResult<T> {
  constructor(public rest: string, public result: T) {}
  map<U>(fn: (e: T) => U): Success<U> {
    return new Success(this.rest, fn(this.result));
  }
}

export class Failure<T> implements ParseResult<T> {
  public kind: "failure";
  public result: T;
  constructor(public rest: string, public message: string) {}
  map<U>(fn: (e: T) => U): Failure<U> {
    return new Failure<U>(this.rest, this.message);
  }
}

export function success<T>(v: T): Parser<T> {
  return new Parser<T>(input => new Success(input, v));
}

export function failure<T>(message: string): Parser<T> {
  return new Parser<T>(input => new Failure<T>(input, message));
}

const matchError = new Error("pattern match failed");

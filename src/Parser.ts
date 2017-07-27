import { ParseError } from "./err";
/**
 * Parser is like a function expect some input to parse.
 */
export class Parser<T> {

  /**
   * a character literal parser ignores.
   */
  public whiteSpace: string = " \n";
  private fn: (input: string) => ParseResult<T>;

  constructor(fn: (input: string) => ParseResult<T>) {
    this.fn = inp => {
      // trim white spaces
      while (inp !== "") {
        if (this.whiteSpace.includes(inp.charAt(0))) {
          inp = inp.substr(1);
        } else {
          break;
        }
      }
      return fn(inp);
    };
  }

  /**
   * Parse input!
   */
  of(input: string): ParseResult<T> {
    return this.fn(input);
  }

  map<U>(mapper: (e: T) => U): Parser<U> {
    return new Parser<U>(input => this.of(input).map(mapper));
  }

  /**
   * sequence
   */
  then<U>(q: () => Parser<U>): Parser<[T, U]> {
    return new Parser<[T, U]>(input => {
      const ret = this.of(input);
      if (ret instanceof Success) {
        return q().of(ret.rest).map<[T, U]>(result2 => [ret.result, result2]);
      } else {
        return new Failure<[T, U]>(input, `fail in ${this}`);
      }
    });
  }

  /**
   * ordered choice
   */
  or<U>(q: () => Parser<U>): Parser<T | U> {
    return new Parser<T | U>(input => {
      const ret = this.of(input);
      if (ret instanceof Success) {
        return ret;
      } else {
        return q().of(input);
      }
    });
  }

  /**
   * zero-or-more
   */
  rep(): Parser<T[]> {
    return repeat(() => this);
  }

  /**
   * one-or-more
   */
  rep1(): Parser<T[]> {
    return repeat1(() => this);
  }

  /**
   * optional
   */
  opt(): Parser<T | undefined> {
    return option(() => this);
  }

  /**
   * not-predicate
   */
  not(): Parser<undefined> {
    return notPred(() => this);
  }

  /**
   * and-predicate
   */
  guard(): Parser<undefined> {
    return andPred(() => this);
  }
}

/**
 * Success or Failure.
 */
export interface ParseResult<T> {
  rest: string;
  getResult(): T;
  map<U>(fn: (e: T) => U): ParseResult<U>;
}

export class Success<T> implements ParseResult<T> {
  constructor(public rest: string, public result: T) {}
  getResult(): T {
    return this.result;
  }
  map<U>(fn: (e: T) => U): Success<U> {
    return new Success(this.rest, fn(this.result));
  }
}

export class Failure<T> implements ParseResult<T> {
  constructor(public rest: string, public message: string) {}
  map<U>(fn: (e: T) => U): Failure<U> {
    return new Failure<U>(this.rest, this.message);
  }
  getResult(): T {
    throw new ParseError("no result in failure");
  }
}

export function success<T>(v: T): Parser<T> {
  return new Parser<T>(input => new Success(input, v));
}

export function failure<T>(message: string): Parser<T> {
  return new Parser<T>(input => new Failure<T>(input, message));
}

export function option<T>(p: () => Parser<T>): Parser<T | undefined> {
  return new Parser<T | undefined>(input => {
    const ret = p().of(input);
    if (ret instanceof Success) {
      return ret;
    } else {
      return new Success(input, undefined);
    }
  });
}

export function repeat<T>(p: () => Parser<T>): Parser<T[]> {
  return new Parser<T[]>(input => {
    let rest = input;
    const results: T[] = [];
    while (true) {
      const ret = p().of(rest);
      if (ret instanceof Success) {
        rest = ret.rest;
        results.push(ret.result);
      } else {
        break;
      }
    }
    return new Success(rest, results);
  });
}

export function repeat1<T>(p: () => Parser<T>): Parser<T[]> {
  return p().then(() => p().rep()).map(cons => {
    cons[1].unshift(cons[0]);
    return cons[1];
  });
}

export function notPred<T>(p: () => Parser<T>): Parser<undefined> {
  return new Parser<undefined>(input => {
    const ret = p().of(input);
    if (ret instanceof Success) {
      return new Failure<undefined>(input, `enable to parse input in ${p()}`);
    } else {
      return new Success<undefined>(input, undefined);
    }
  });
}

export function andPred<T>(p: () => Parser<T>): Parser<undefined> {
  return new Parser<undefined>(input => {
    const ret = p().of(input);
    if (ret instanceof Success) {
      return new Success<undefined>(input, undefined);
    } else {
      return new Failure<undefined>(input, `unable to parse input in ${p()}`);
    }
  });
}


import { Input } from "./Input";


/**
 * Parser is like a function expect some input to parse.
 */
export class Parser<T> {

  private fn: (input: Input) => ParseResult<T>;

  constructor(fn: (input: Input) => ParseResult<T>, public name: string) {
    this.fn = input => {
      // trim white spaces
      if (input.whitespace) {
        let execResult = input.whitespace.exec(input.source.substr(input.index));
        if (execResult !== null) {
          input = input.copy(input.source, input.index + execResult[0].length);
        }
      }
      return fn(input);
    };
  }


  /**
   * Set parser name
   */
  named(name: string): Parser<T> {
    this.name = name;
    return this;
  }

  /**
   * Parse input! if `input` is string, skips whitespace `/^\s+/` when parsing.
   */
  of(input: Input | string): ParseResult<T> {
    let src: Input;
    if (typeof input === "string") {
      src = new Input(input, 0, /^\s+/);
    } else {
      src = input;
    }
    return this.fn(src);
  }

  /**
   * Parse input, same as `of`
   */
  parse(input: Input | string): ParseResult<T> {
    return this.of(input);
  }

  map<U>(mapper: (e: T) => U): Parser<U> {
    return new Parser<U>(input => this.of(input).map(mapper), "map");
  }

  /**
   * sequence
   */
  then<U>(q: Parser<U> | (() => Parser<U>) ): Parser<[T, U]> {
    return new Parser<[T, U]>(
      input => {
        const ret = this.of(input);
        if (ret instanceof Success) {
          return force(q).of(ret.rest).map<[T, U]>(result2 => [ret.result, result2]);
        } else {
          return new Failure<[T, U]>(input, (<Failure<T>>ret).message, (<Failure<T>>ret).parserName);
        }
      },
      "then"
    );
  }

  /**
   * ordered choice
   */
  or<U>(q: Parser<U> | (() => Parser<U>)): Parser<T | U> {
    return new Parser<T | U>(
      input => {
        const ret = this.of(input);
        if (ret instanceof Success) {
          return ret;
        } else {
          return force(q).of(input);
        }
      },
      "or"
    );
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

  /**
   * ( ~> )
   * same as sequence, but discard left result
   */
  saveR<U>(q: Parser<U> | (() => Parser<U>)): Parser<U> {
    return this.then(q).map(tpl => tpl[1]).named("saveR");
  }

  /**
   * ( <~ )
   * same as sequence, but discard right result
   */
  saveL<U>(q: Parser<U> | (() => Parser<U>)): Parser<T> {
    return this.then(q).map(tpl => tpl[0]).named("saveL");
  }

  /**
   * 2nd parser depends on the result of the 1st parser.
   */
  into<U>(fq: (t: T) => Parser<U>): Parser<U> {
    return new Parser<U>(
      input => {
        const ret = this.of(input);
        if (ret instanceof Success) {
          return fq(ret.result).of(ret.rest);
        } else {
          return new Failure<U>(input, (<Failure<T>>ret).message, (<Failure<T>>ret).parserName);
        }
      },
      "into"
    );
  }

  /**
   * Repeatedly use one or more `this` parser, separated by `sep`. Accumulate only the results of `this` parser.
   */
  rep1sep(sep: Parser<any> | (() => Parser<any>)): Parser<T[]> {
    return rep1sep(() => this, sep);
  }
}

function force<T>(p: Parser<T> | (() => Parser<T>)): Parser<T> {
  if (p instanceof Parser) {
    return p;
  } else {
    return p();
  }
}

/**
 * `Success` or `Failure`.
 */
export interface ParseResult<T> {
  rest: Input;
  getResult(): T;
  map<U>(fn: (e: T) => U): ParseResult<U>;
}

export class Success<T> implements ParseResult<T> {
  constructor(public rest: Input, public result: T) {}
  getResult(): T {
    return this.result;
  }
  map<U>(fn: (e: T) => U): Success<U> {
    return new Success(this.rest, fn(this.result));
  }
}

export class Failure<T> implements ParseResult<T> {
  constructor(public rest: Input, public message: string, public parserName: string) {}
  map<U>(fn: (e: T) => U): Failure<U> {
    return new Failure<U>(this.rest, this.message, this.parserName);
  }
  getResult(): T {
    throw "no result in failure";
  }
}

/**
 * Always success.
 */
export function success<T>(v: T): Parser<T> {
  return new Parser<T>(input => new Success(input, v), "success");
}

/**
 * Always failure.
 */
export function failure<T>(message: string): Parser<T> {
  return new Parser<T>(input => new Failure<T>(input, message, "failure"), "failure");
}

export function option<T>(p: Parser<T> | (() => Parser<T>)): Parser<T | undefined> {
  return new Parser<T | undefined>(
    input => {
      const ret = force(p).of(input);
      if (ret instanceof Success) {
        return ret;
      } else {
        return new Success(input, undefined);
      }
    },
    "option"
  );
}

export function repeat<T>(p: Parser<T> | (() => Parser<T>)): Parser<T[]> {
  return new Parser<T[]>(
    input => {
      let rest = input;
      const results: T[] = [];
      while (true) {
        const ret = force(p).of(rest);
        if (ret instanceof Success) {
          rest = ret.rest;
          results.push(ret.result);
        } else {
          break;
        }
      }
      return new Success(rest, results);
    },
    "repeat"
  );
}

export function repeat1<T>(p: Parser<T> | (() => Parser<T>)): Parser<T[]> {
  return force(p).then(force(p).rep()).map(cons => {
    cons[1].unshift(cons[0]);
    return cons[1];
  }).named("repeat1");
}

export function notPred<T>(p: Parser<T> | (() => Parser<T>)): Parser<undefined> {
  return new Parser<undefined>(
    input => {
      const ret = force(p).of(input);
      if (ret instanceof Success) {
        return new Failure<undefined>(input, `enable to parse input in ${force(p).name}`, "notPred");
      } else {
        return new Success<undefined>(input, undefined);
      }
    },
    "notPred"
  );
}

export function andPred<T>(p: Parser<T> | (() => Parser<T>)): Parser<undefined> {
  return new Parser<undefined>(
    input => {
      const ret = force(p).of(input);
      if (ret instanceof Success) {
        return new Success<undefined>(input, undefined);
      } else {
        return new Failure<undefined>(input, `unable to parse input in ${force(p).name}`, "andPred");
      }
    },
    "andPred"
  );
}

/**
 * Sequence parser that has many sub parsers.
 */
export function sequence<T>(...ps: (Parser<T> | (() => Parser<T>))[]): Parser<T[]> {
  return new Parser<T[]>(
    input => {
      const result: T[] = [];
      let rest = input;
      for (let p of ps) {
        const ret = force(p).of(rest);
        if (ret instanceof Success) {
          rest = ret.rest;
          result.push(ret.result);
        } else {
          return new Failure<T[]>(rest, (<Failure<T>>ret).message, (<Failure<T>>ret).parserName);
        }
      }
      return new Success<T[]>(rest, result);
    },
    "sequence"
  );
}

/**
 * Same as sequence function
 */
export function seq<T>(...ps: (Parser<T> | (() => Parser<T>))[]): Parser<T[]> {
  return sequence(...ps);
}

export function rep1sep<T>(p: Parser<T> | (() => Parser<T>), sep: Parser<any> | (() => Parser<any>)): Parser<T[]> {
  return force(p).then(() => (force(sep).then(p)).rep()).map(ret => {
    const result: T[] = [ret[0]];
    for (let pair of ret[1]) {
      result.push(pair[1]);
    }
    return result;
  });
}

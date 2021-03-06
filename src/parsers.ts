/**
 * Other useful parsers.
 */

import { Parser, Success, Failure } from "./Parser";

/**
 * Parse specified string literal
 * @param str expect string
 */
export function literal(str: string): Parser<string> {
  return new Parser<string>(
    input => {
      if (input.source.substr(input.index).startsWith(str)) {
        return new Success(input.copy(input.source, input.index + str.length), str);
      } else {
        return new Failure<string>(input, `input does not start with ${str}`, `literal[${str}]`);
      }
    },
    `literal[${str}]`
  );
}

/**
 * Same as literal function
 */
export function lt(str: string): Parser<string> {
  return literal(str);
}

/**
 * Parse string matches the regex
 */
export function regex(regexp: string | RegExp): Parser<string> {
  const r = typeof regexp === "string" ? new RegExp(regexp) : regexp;
  return new Parser<string>(
    input => {
      if (input.source.substr(input.index).search(r) === 0) {
        const result = r.exec(input.source.substr(input.index))![0];
        const rest = input.copy(input.source, input.index + result.length);
        return new Success(rest, result);
      } else {
        return new Failure<string>(input, `input does not match with regex ${regexp}`, `regex[${regexp}]`);
      }
    },
    `regex[${regexp}]`
  );
}

/**
 * Same as regex function
 */
export function r(regexp: string | RegExp): Parser<string> {
  return regex(regexp);
}

/**
 * Decimal number parser (ex 3.14)
 */
export const decimal: Parser<number> = regex(/[+-]?[0-9]+(\.[0-9]*)?([eE][+-]?[0-9]+)?/).map(elem => Number(elem)).named("decimal");

/**
 * Integer number parser
 */
export const integer: Parser<number> = regex(/[+-]?\d+/).map(elem => Number(elem)).named("integer");

/**
 * Email parser. The regex is the same as `input[type=email]` in HTML5.
 */
export const email: Parser<string> = regex(/[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*/).named("email");

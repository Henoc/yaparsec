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
      if (input.source.startsWith(str)) {
        return new Success(input.copy(input.source.substr(str.length)), str);
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
export function lt(str: string): Parser<String> {
  return literal(str);
}

/**
 * Parse string matches the regex
 */
export function regex(regexp: string | RegExp): Parser<string> {
  const r = typeof regexp === "string" ? new RegExp(regexp) : regexp;
  return new Parser<string>(
    input => {
      if (input.source.search(r) === 0) {
        const result = r.exec(input.source)![0];
        const rest = input.copy(input.source.substr(result.length));
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
 * Decimal number parser
 */
export const decimal: Parser<number> = regex("0|([1-9][0-9]*)").map(elem => Number(elem)).named("decimal");


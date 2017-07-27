import { Parser, Success, Failure } from "./Parser";

/**
 * Parse specified string literal
 * @param str expect string
 */
export function literal(str: string): Parser<string> {
  return new Parser<string>(input => {
    if (input.startsWith(str)) {
      return new Success(input.substr(str.length), str);
    } else {
      return new Failure(input, `input does not start with ${str}`);
    }
  });
}

/**
 * Parse string matches the regex
 */
export function regex(regex: string): Parser<string> {
  const r = new RegExp(regex);
  return new Parser<string>(input => {
    if (input.search(r) === 0) {
      const result = r.exec(input)![0];
      const rest = input.replace(r, "");
      return new Success(rest, result);
    } else {
      return new Failure(input, `input does not match with regex ${regex}`);
    }
  });
}

/**
 * Decimal number parser
 */
export const decimal = regex("0|([1-9][0-9]*)");

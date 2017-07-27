
export class ParseError implements Error {
  public name: string = "ParserError";

  constructor(public message: string) {}

  toString() {
    return this.name + ": " + this.message;
  }
}

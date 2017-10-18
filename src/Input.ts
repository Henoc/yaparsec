/**
 * Input for parsers.
 */
export class Input {

  /**
   * Make Input class instances.
   * @param source input source for parsers
   * @param whitespace regex that parsers should skip
   */
  constructor(public source: string, public whitespace: RegExp | undefined) {
  }

  copy(source: string): Input {
    return new Input(source, this.whitespace);
  }
}

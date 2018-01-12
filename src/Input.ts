/**
 * Input for parsers.
 */
export class Input {

  /**
   * Make Input class instances.
   * @param source input source for parsers
   * @param index index of the source offset
   * @param whitespace regex that parsers should skip
   */
  constructor(public source: string, public index: number, public whitespace: RegExp | undefined) {
  }

  copy(source: string, index: number): Input {
    return new Input(source, index, this.whitespace);
  }
}

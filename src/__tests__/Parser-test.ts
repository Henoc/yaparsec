import * as ps from "../parsers";

test("literal", () => {
    const abcParser = ps.literal("abc");
    const parsed = abcParser.of("abcdefg");
    expect(parsed.getResult()).toBe("abc");
    expect(parsed.rest).toBe("defg");
});

test("regex", () => {
    const numberParser = ps.regex("[0-9]+");
    const parsed = numberParser.of("003000abcd");
    expect(parsed.getResult()).toBe("003000");
    expect(parsed.rest).toBe("abcd");
});

test("white spaces & then & rep", () => {
    const digitParser = ps.regex("[0-9]");
    const digit3Parser = digitParser.then(() => digitParser).then(() => digitParser);
    const parsed = digit3Parser.of("1 2 3 4");
    expect(parsed.getResult()).toEqual([["1", "2"], "3"]);
    expect(parsed.rest).toBe(" 4");

    const digitStarParser = digitParser.rep();
    const parsed2 = digitStarParser.of("1 2 3 4 a");
    expect(parsed2.getResult()).toEqual(["1", "2", "3", "4"]);
    expect(parsed2.rest).toBe(" a");
});

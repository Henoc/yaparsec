import { Parser, seq } from "./../Parser";
import { literal, regex, decimal } from "./../parsers";

test("literal", () => {
    const abcParser = literal("abc");
    const parsed = abcParser.of("abcdefg");
    expect(parsed.getResult()).toBe("abc");
    expect(parsed.rest).toBe("defg");
});

test("regex", () => {
    const numberParser = regex(/[0-9]+/);
    const parsed = numberParser.of("003000abcd");
    expect(parsed.getResult()).toBe("003000");
    expect(parsed.rest).toBe("abcd");
});

test("white spaces & then & rep", () => {
    const digitParser = regex(/[0-9]/);
    const digit3Parser = digitParser.then(() => digitParser).then(() => digitParser);
    const parsed = digit3Parser.of("1   2  3 4");
    expect(parsed.getResult()).toEqual([["1", "2"], "3"]);
    expect(parsed.rest).toBe(" 4");

    const digitStarParser = digitParser.rep();
    const parsed2 = digitStarParser.of("1 2 3 4 a");
    expect(parsed2.getResult()).toEqual(["1", "2", "3", "4"]);
    expect(parsed2.rest).toBe(" a");
});

test("calc", () => {
    function factor(): Parser<number> {
        return decimal.or(() => literal("(").saveR(() => expr()).saveL(() => literal(")")));
    }
    function term(): Parser<number> {
        return factor().into(n => (literal("*").or(() => literal("/"))).then(() => factor()).rep().map(lst => {
            let ret = n;
            for (let elem of lst) {
                if (elem[0] === "*") ret *= elem[1];
                else ret /= elem[1];
            }
            return ret;
        }));
    }
    function expr(): Parser<number> {
        return term().into(n => (literal("+").or(() => literal("-"))).then(() => term()).rep().map(lst => {
            let ret = n;
            for (let elem of lst) {
                if (elem[0] === "+") ret += elem[1];
                else ret -= elem[1];
            }
            return ret;
        }));
    }

    expect(expr().of("(1 + 2) * 3").getResult()).toBe(9);
    expect(expr().of("(7 - 1) / (1 + 2)").getResult()).toBe(2);

});

test("seq", () => {
    const seqParser = seq(() => literal("apple"), () => literal("banana"), () => literal("orange"));
    const parsed = seqParser.of("applebananaorangelemon");
    expect(parsed.getResult()).toEqual(["apple", "banana", "orange"]);
    expect(parsed.rest).toBe("lemon");
});

test("rep1sep", () => {
    const r1sParser = decimal.rep1sep(() => literal(","));
    const parsed = r1sParser.of("1,2,3,5,8,13");
    expect(parsed.getResult()).toEqual([1, 2, 3, 5, 8, 13]);
    expect(parsed.rest).toBe("");
});



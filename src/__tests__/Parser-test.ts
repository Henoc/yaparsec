import { Input } from "./../Input";
import { Parser, seq } from "./../Parser";
import { literal, regex, decimal } from "./../parsers";
import { integer } from "../index";

test("literal", () => {
    const abcParser = literal("abc");
    const parsed = abcParser.of("abcdefg");
    expect(parsed.getResult()).toBe("abc");
    expect(parsed.rest.source).toBe("defg");
});

test("regex", () => {
    const numberParser = regex(/[0-9]+/);
    const parsed = numberParser.of("003000abcd100");
    expect(parsed.getResult()).toBe("003000");
    expect(parsed.rest.source).toBe("abcd100");
});

test("skip whitespaces & then & rep", () => {
    const digitParser = regex(/[0-9]/);
    const digit3Parser = digitParser.then(() => digitParser).then(() => digitParser);
    const parsed = digit3Parser.of("1   2  3 4");
    expect(parsed.getResult()).toEqual([["1", "2"], "3"]);
    expect(parsed.rest.source).toBe(" 4");

    const digitStarParser = digitParser.rep();
    const parsed2 = digitStarParser.of("1 2 3 4 a");
    expect(parsed2.getResult()).toEqual(["1", "2", "3", "4"]);
    expect(parsed2.rest.source).toBe(" a");
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
    expect(parsed.rest.source).toBe("lemon");
});

test("rep1sep", () => {
    const r1sParser = decimal.rep1sep(() => literal(","));
    const parsed = r1sParser.of("1,2,3,5,8,13");
    expect(parsed.getResult()).toEqual([1, 2, 3, 5, 8, 13]);
    expect(parsed.rest.source).toBe("");
});

test("control whitespaces", () => {
    const begin = regex(/<\s*[a-zA-Z][0-9a-zA-Z]*\s*>/);
    const end = regex(/<\s*\/\s*[a-zA-Z][0-9a-zA-Z]*\s*>/);
    const text = regex(/[^<>]+/);
    const basicXml = begin.then(() => text).then(() => end);
    const parsed1 = basicXml.of(new Input("<a>  hello</a>", undefined));        // no skip
    expect(parsed1.getResult()[0][1]).toBe("  hello");
    const parsed2 = basicXml.of(new Input("<a>xxxhello</a>", /^x+/));
    expect(parsed2.getResult()[0][1]).toBe("hello");
});

test("decimal, integer", () => {
    const decimals = ["123.45", "0.61902E+04", "5"];
    decimals.forEach(sample => {
        expect(decimal.of(sample).getResult()).toBe(parseFloat(sample));
    });
    const integers = ["20", "-437", "+823"];
    integers.forEach(sample => {
        expect(integer.of(sample).getResult()).toBe(parseInt(sample, 10));
    });
});


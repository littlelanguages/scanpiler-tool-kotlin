import { assertEquals } from "https://deno.land/std@0.63.0/testing/asserts.ts";
import { mkScanner, Token, TToken } from "./scanner.ts";
import {
  mkCoordinate,
  range,
} from "https://raw.githubusercontent.com/littlelanguages/scanpiler-deno-lib/0.0.1/location.ts";

Deno.test("ll-scanner test - empty stream returns an EOS as token", () => {
  assertEquals(
    mkScanner("").current(),
    [TToken.EOS, mkCoordinate(0, 1, 1), ""],
  );
});

Deno.test("ll-scanner test - empty stream consisting of blanks returns an EOS as token", () => {
  assertEquals(
    mkScanner("     ").current(),
    [TToken.EOS, mkCoordinate(5, 1, 6), ""],
  );
});

Deno.test("ll-scanner test - chr comments extend fragments nested to tokens", () => {
  const ts = tokens("chr comments extend fragments nested to tokens");

  assertEquals(ts, [
    [TToken.Chr, range(0, 1, 1, 2, 1, 3), "chr"],
    [TToken.Comments, range(4, 1, 5, 11, 1, 12), "comments"],
    [TToken.Extend, range(13, 1, 14, 18, 1, 19), "extend"],
    [TToken.Fragments, range(20, 1, 21, 28, 1, 29), "fragments"],
    [TToken.Nested, range(30, 1, 31, 35, 1, 36), "nested"],
    [TToken.To, range(37, 1, 38, 38, 1, 39), "to"],
    [TToken.Tokens, range(40, 1, 41, 45, 1, 46), "tokens"],
  ]);
});

Deno.test("ll-scanner test - \\ ! | = [ { ( - + ] } ) ;", () => {
  const ts = tokens("\\ ! | = [ { ( - + ] } ) ;");

  assertEquals(ts, [
    [TToken.Backslash, mkCoordinate(0, 1, 1), "\\"],
    [TToken.Bang, mkCoordinate(2, 1, 3), "!"],
    [TToken.Bar, mkCoordinate(4, 1, 5), "|"],
    [TToken.Equal, mkCoordinate(6, 1, 7), "="],
    [TToken.LBracket, mkCoordinate(8, 1, 9), "["],
    [TToken.LCurly, mkCoordinate(10, 1, 11), "{"],
    [TToken.LParen, mkCoordinate(12, 1, 13), "("],
    [TToken.Minus, mkCoordinate(14, 1, 15), "-"],
    [TToken.Plus, mkCoordinate(16, 1, 17), "+"],
    [TToken.RBracket, mkCoordinate(18, 1, 19), "]"],
    [TToken.RCurly, mkCoordinate(20, 1, 21), "}"],
    [TToken.RParen, mkCoordinate(22, 1, 23), ")"],
    [TToken.Semicolon, mkCoordinate(24, 1, 25), ";"],
  ]);
});

Deno.test("ll-scanner test - Literal values", () => {
  const ts = tokens('\'x\' 0 123 "" "hello world"');

  assertEquals(ts, [
    [TToken.LiteralCharacter, range(0, 1, 1, 2, 1, 3), "'x'"],
    [TToken.LiteralInt, mkCoordinate(4, 1, 5), "0"],
    [TToken.LiteralInt, range(6, 1, 7, 8, 1, 9), "123"],
    [TToken.LiteralString, range(10, 1, 11, 11, 1, 12), '""'],
    [TToken.LiteralString, range(13, 1, 14, 25, 1, 26), '"hello world"'],
  ]);
});

Deno.test("ll-scanner test - Comments", () => {
  const ts = tokens(
    "ab // This is a line comments\ncd /* This is a \nmulti-line comment */ ef /* This is a \n/* nested */ multi-line comment */ gh",
  );

  assertEquals(ts, [
    [TToken.Identifier, range(0, 1, 1, 1, 1, 2), "ab"],
    [TToken.Identifier, range(30, 2, 1, 31, 2, 2), "cd"],
    [TToken.Identifier, range(69, 3, 23, 70, 3, 24), "ef"],
    [TToken.Identifier, range(121, 4, 36, 122, 4, 37), "gh"],
  ]);
});

function tokens(input: string): Array<Token> {
  const scanner = mkScanner(input);
  const result = [];

  do {
    result.push(scanner.current());
    scanner.next();
  } while (scanner.current()[0] != TToken.EOS);

  return result;
}

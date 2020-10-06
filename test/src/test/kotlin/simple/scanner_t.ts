import * as Assert from "https://deno.land/std@0.63.0/testing/asserts.ts";

import { mkScanner, Token, TToken } from "./scanner.ts";
import {
  mkCoordinate,
  range,
} from "https://raw.githubusercontent.com/littlelanguages/scanpiler-deno-lib/0.0.1/location.ts";

Deno.test("simple test - empty stream returns an EOS as token", () => {
  const v = mkScanner("").current();

  Assert.assertEquals(
    v,
    [TToken.EOS, mkCoordinate(0, 1, 1), ""],
  );
});

Deno.test("simple test - empty stream consisting of blanks returns an EOS as token", () => {
  Assert.assertEquals(
    mkScanner("     ").current(),
    [TToken.EOS, mkCoordinate(5, 1, 6), ""],
  );
});

Deno.test("simple test - chr comments extend fragments nested to tokens", () => {
  const ts = tokens("chr comments extend fragments nested to tokens");

  Assert.assertEquals(ts, [
    [TToken.Identifier, range(0, 1, 1, 2, 1, 3), "chr"],
    [TToken.Identifier, range(4, 1, 5, 11, 1, 12), "comments"],
    [TToken.Identifier, range(13, 1, 14, 18, 1, 19), "extend"],
    [TToken.Identifier, range(20, 1, 21, 28, 1, 29), "fragments"],
    [TToken.Identifier, range(30, 1, 31, 35, 1, 36), "nested"],
    [TToken.Identifier, range(37, 1, 38, 38, 1, 39), "to"],
    [TToken.Identifier, range(40, 1, 41, 45, 1, 46), "tokens"],
  ]);
});

Deno.test("simple test - 0 1 2 3 4 5 6 7 8 9 123 5678", () => {
  const ts = tokens("0 1 2 3 4 5 6 7 8 9 123 5678");

  Assert.assertEquals(ts, [
    [TToken.LiteralInt, mkCoordinate(0, 1, 1), "0"],
    [TToken.LiteralInt, mkCoordinate(2, 1, 3), "1"],
    [TToken.LiteralInt, mkCoordinate(4, 1, 5), "2"],
    [TToken.LiteralInt, mkCoordinate(6, 1, 7), "3"],
    [TToken.LiteralInt, mkCoordinate(8, 1, 9), "4"],
    [TToken.LiteralInt, mkCoordinate(10, 1, 11), "5"],
    [TToken.LiteralInt, mkCoordinate(12, 1, 13), "6"],
    [TToken.LiteralInt, mkCoordinate(14, 1, 15), "7"],
    [TToken.LiteralInt, mkCoordinate(16, 1, 17), "8"],
    [TToken.LiteralInt, mkCoordinate(18, 1, 19), "9"],
    [TToken.LiteralInt, range(20, 1, 21, 22, 1, 23), "123"],
    [TToken.LiteralInt, range(24, 1, 25, 27, 1, 28), "5678"],
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

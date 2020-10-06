import * as Assert from "https://deno.land/std@0.63.0/testing/asserts.ts";

import { mkScanner, Token, TToken } from "./scanner.ts";
import {
  mkCoordinate,
  range,
} from "https://raw.githubusercontent.com/littlelanguages/scanpiler-deno-lib/0.0.1/location.ts";

Deno.test("backtrackingtest - matching literal float", () => {
  Assert.assertEquals(
    tokens("123.456"),
    [
      [TToken.LiteralFloat, range(0, 1, 1, 6, 1, 7), "123.456"],
    ],
  );
});

Deno.test("backtrackingtest - matching literal int", () => {
  Assert.assertEquals(
    tokens("123..4"),
    [
      [TToken.LiteralInt, range(0, 1, 1, 2, 1, 3), "123"],
      [TToken.DotDot, range(3, 1, 4, 4, 1, 5), ".."],
      [TToken.LiteralInt, mkCoordinate(5, 1, 6), "4"],
    ],
  );
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

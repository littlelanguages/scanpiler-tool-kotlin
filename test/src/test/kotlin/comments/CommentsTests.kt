package comments

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import scanner.Location
import scanner.LocationCoordinate
import scanner.LocationRange
import java.io.StringReader

class CommentsTests : StringSpec({
    "empty stream returns an EOS as token" {
        tokens(Scanner(StringReader(""))) shouldBe listOf(
                Token(TToken.TEOS, LocationCoordinate(0, 1, 1), "")
        )
    }

    "empty stream consisting of blanks returns an EOS as token" {
        tokens(Scanner(StringReader("     "))) shouldBe listOf(
                Token(TToken.TEOS, LocationCoordinate(5, 1, 6), "")
        )
    }

    "chr comments extend fragments nested to tokens" {
        tokens(Scanner(StringReader("chr comments extend fragments nested to tokens"))) shouldBe listOf(
                Token(TToken.TIdentifier, range(0, 1, 1, 2, 1, 3), "chr"),
                Token(TToken.TIdentifier, range(4, 1, 5, 11, 1, 12), "comments"),
                Token(TToken.TIdentifier, range(13, 1, 14, 18, 1, 19), "extend"),
                Token(TToken.TIdentifier, range(20, 1, 21, 28, 1, 29), "fragments"),
                Token(TToken.TIdentifier, range(30, 1, 31, 35, 1, 36), "nested"),
                Token(TToken.TIdentifier, range(37, 1, 38, 38, 1, 39), "to"),
                Token(TToken.TIdentifier, range(40, 1, 41, 45, 1, 46), "tokens")
        )
    }

    "0 1 2 3 4 5 6 7 8 9 123 5678" {
        tokens(Scanner(StringReader("0 1 2 3 4 5 6 7 8 9 123 5678"))) shouldBe listOf(
                Token(TToken.TLiteralInt, LocationCoordinate(0, 1, 1), "0"),
                Token(TToken.TLiteralInt, LocationCoordinate(2, 1, 3), "1"),
                Token(TToken.TLiteralInt, LocationCoordinate(4, 1, 5), "2"),
                Token(TToken.TLiteralInt, LocationCoordinate(6, 1, 7), "3"),
                Token(TToken.TLiteralInt, LocationCoordinate(8, 1, 9), "4"),
                Token(TToken.TLiteralInt, LocationCoordinate(10, 1, 11), "5"),
                Token(TToken.TLiteralInt, LocationCoordinate(12, 1, 13), "6"),
                Token(TToken.TLiteralInt, LocationCoordinate(14, 1, 15), "7"),
                Token(TToken.TLiteralInt, LocationCoordinate(16, 1, 17), "8"),
                Token(TToken.TLiteralInt, LocationCoordinate(18, 1, 19), "9"),
                Token(TToken.TLiteralInt, range(20, 1, 21, 22, 1, 23), "123"),
                Token(TToken.TLiteralInt, range(24, 1, 25, 27, 1, 28), "5678")
        )
    }

    "line comment" {
        tokens(Scanner(StringReader("hello // klajhdsf lkajhdsf lkajhdf lkaf \n123"))) shouldBe listOf(
                Token(TToken.TIdentifier, range(0, 1, 1, 4, 1, 5), "hello"),
                Token(TToken.TLiteralInt, range(41, 2, 1, 43, 2, 3), "123")
        )
    }

    "non-nested block comment" {
        tokens(Scanner(StringReader("hello /* klajhdsf\n" +
                "lkajhdsf*/ /*lkajhdf lkaf*/ 123 /* some more */"))) shouldBe listOf(
                Token(TToken.TIdentifier, range(0, 1, 1, 4, 1, 5), "hello"),
                Token(TToken.TLiteralInt, range(46, 2, 29, 48, 2, 31), "123")
        )
    }

    "nested block comment" {
        tokens(Scanner(StringReader("hello (* klajhdsf\n" +
                "lkajhdsf //   /* (*lkajhdf*) lkaf*) 123 (* some more *)"))) shouldBe listOf(
                Token(TToken.TIdentifier, range(0, 1, 1, 4, 1, 5), "hello"),
                Token(TToken.TLiteralInt, range(54, 2, 37, 56, 2, 39), "123")
        )
    }
})

fun tokens(scanner: Scanner): List<Token> {
    val result = mutableListOf<Token>()

    do {
        result.add(scanner.current())
        scanner.next()
    } while (scanner.current().tToken != TToken.TEOS);

    return result
}

fun range(o1: Int, l1: Int, c1: Int, o2: Int, l2: Int, c2: Int): Location =
        LocationRange(LocationCoordinate(o1, l1, c1), LocationCoordinate(o2, l2, c2))
package backtracking

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import scanner.Location
import scanner.LocationCoordinate
import scanner.LocationRange
import java.io.StringReader

class BacktrackingTests : StringSpec({
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

    "matching literal float" {
        tokens(Scanner(StringReader("123.456"))) shouldBe listOf(
                Token(TToken.TLiteralFloat, range(0, 1, 1, 6, 1, 7), "123.456")
        )
    }

    "matching literal int" {
        tokens(Scanner(StringReader("123..4"))) shouldBe listOf(
                Token(TToken.TLiteralInt, range(0, 1, 1, 2, 1, 3), "123"),
                Token(TToken.TDotDot, range(3, 1, 4, 4, 1, 5), ".."),
                Token(TToken.TLiteralInt, LocationCoordinate(5, 1, 6), "4")
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
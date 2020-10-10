package backtracking

import abstractTokens
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import range
import io.littlelanguages.scanpiler.LocationCoordinate
import java.io.StringReader

class BacktrackingTests : StringSpec({
    "empty stream returns an EOS as token" {
        tokens("") shouldBe listOf(
                Token(TToken.TEOS, LocationCoordinate(0, 1, 1), "")
        )
    }

    "empty stream consisting of blanks returns an EOS as token" {
        tokens("     ") shouldBe listOf(
                Token(TToken.TEOS, LocationCoordinate(5, 1, 6), "")
        )
    }

    "matching literal float" {
        tokens("123.456") shouldBe listOf(
                Token(TToken.TLiteralFloat, range(0, 1, 1, 6, 1, 7), "123.456")
        )
    }

    "matching literal int" {
        tokens("123..4") shouldBe listOf(
                Token(TToken.TLiteralInt, range(0, 1, 1, 2, 1, 3), "123"),
                Token(TToken.TDotDot, range(3, 1, 4, 4, 1, 5), ".."),
                Token(TToken.TLiteralInt, LocationCoordinate(5, 1, 6), "4")
        )
    }
})

fun tokens(s: String) = abstractTokens(Scanner(StringReader(s)), TToken.TEOS)

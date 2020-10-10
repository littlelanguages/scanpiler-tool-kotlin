package scanpiler

import abstractTokens
import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe
import range
import io.littlelanguages.scanpiler.LocationCoordinate
import java.io.StringReader

class ScanpilerTests : StringSpec({
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

    "chr comments extend fragments nested to tokens" {
        tokens("chr comments extend fragments nested to tokens") shouldBe listOf(
                Token(TToken.TChr, range(0, 1, 1, 2, 1, 3), "chr"),
                Token(TToken.TComments, range(4, 1, 5, 11, 1, 12), "comments"),
                Token(TToken.TExtend, range(13, 1, 14, 18, 1, 19), "extend"),
                Token(TToken.TFragments, range(20, 1, 21, 28, 1, 29), "fragments"),
                Token(TToken.TNested, range(30, 1, 31, 35, 1, 36), "nested"),
                Token(TToken.TTo, range(37, 1, 38, 38, 1, 39), "to"),
                Token(TToken.TTokens, range(40, 1, 41, 45, 1, 46), "tokens")
        )
    }

    "\\ ! | = [ { ( - + ] } ) ;" {
        tokens("\\ ! | = [ { ( - + ] } ) ;") shouldBe listOf(
                Token(TToken.TBackslash, LocationCoordinate(0, 1, 1), "\\"),
                Token(TToken.TBang, LocationCoordinate(2, 1, 3), "!"),
                Token(TToken.TBar, LocationCoordinate(4, 1, 5), "|"),
                Token(TToken.TEqual, LocationCoordinate(6, 1, 7), "="),
                Token(TToken.TLBracket, LocationCoordinate(8, 1, 9), "["),
                Token(TToken.TLCurly, LocationCoordinate(10, 1, 11), "{"),
                Token(TToken.TLParen, LocationCoordinate(12, 1, 13), "("),
                Token(TToken.TMinus, LocationCoordinate(14, 1, 15), "-"),
                Token(TToken.TPlus, LocationCoordinate(16, 1, 17), "+"),
                Token(TToken.TRBracket, LocationCoordinate(18, 1, 19), "]"),
                Token(TToken.TRCurly, LocationCoordinate(20, 1, 21), "}"),
                Token(TToken.TRParen, LocationCoordinate(22, 1, 23), ")"),
                Token(TToken.TSemicolon, LocationCoordinate(24, 1, 25), ";")
        )
    }

    "Literal values" {
        tokens("'x' 0 123 \"\" \"hello world\"") shouldBe listOf(
                Token(TToken.TLiteralCharacter, range(0, 1, 1, 2, 1, 3), "'x'"),
                Token(TToken.TLiteralInt, LocationCoordinate(4, 1, 5), "0"),
                Token(TToken.TLiteralInt, range(6, 1, 7, 8, 1, 9), "123"),
                Token(TToken.TLiteralString, range(10, 1, 11, 11, 1, 12), "\"\""),
                Token(TToken.TLiteralString, range(13, 1, 14, 25, 1, 26), "\"hello world\"")
        )
    }

    "Comments" {
        tokens("ab // This is a line comments\ncd /* This is a \nmulti-line comment */ ef /* This is a \n/* nested */ multi-line comment */ gh") shouldBe listOf(
                Token(TToken.TIdentifier, range(0, 1, 1, 1, 1, 2), "ab"),
                Token(TToken.TIdentifier, range(30, 2, 1, 31, 2, 2), "cd"),
                Token(TToken.TIdentifier, range(69, 3, 23, 70, 3, 24), "ef"),
                Token(TToken.TIdentifier, range(121, 4, 36, 122, 4, 37), "gh")
        )
    }
})

fun tokens(s: String) = abstractTokens(Scanner(StringReader(s)), TToken.TEOS)
package scanner

import java.io.Reader

abstract class AbstractScanner<T>(private val input: Reader, errorToken: T) {
    private var offset = -1
    private var line = 1
    private var column = 0
    protected var nextCh = -1

    private var startOffset = 0
    private var startLine = 0
    private var startColumn = 0

    protected var currentToken: AbstractToken<T>
    private var lexeme: StringBuilder? = null

    private var backtrack: Backtrack<T>? = null

    init {
        nextCh = input.read()

        currentToken = newToken(errorToken, LocationCoordinate(0, 0, 0), "")

        next()
    }

    abstract fun newToken(ttoken: T, location: Location, lexeme: String): AbstractToken<T>

    abstract fun next()

    fun current(): AbstractToken<T> =
            currentToken

    protected fun markAndNextChar() {
        val c = nextCh

        nextChar()
        lexeme = StringBuilder()
        if (c != -1) {
            lexeme?.append(c.toChar())
        }
        markStart()
    }

    private fun markStart() {
        startOffset = offset
        startLine = line
        startColumn = column
    }

    protected fun markBacktrackPoint(ttoken: T) {
        backtrack = Backtrack(ttoken, offset, line, column, nextCh)
    }

    protected fun attemptBacktrackOtherwise(ttoken: T) {
        val b = backtrack

        if (b == null) {
            setToken(ttoken)
        } else {
            offset = b.offset
            line = b.line
            column = b.column
            nextCh = b.nextCh

            setToken(b.token)
        }
    }

    protected fun setToken(ttoken: T, lexeme: String? = null) {
        backtrack = null
        val loc =
                if (startOffset == offset)
                    LocationCoordinate(startOffset, startLine, startColumn)
                else
                    LocationRange(
                            LocationCoordinate(startOffset, startLine, startColumn),
                            LocationCoordinate(offset, line, column))

        currentToken = newToken(ttoken, loc, lexeme ?: sliceLexeme())
    }

    private fun sliceLexeme(): String = lexeme?.toString() ?: ""

    protected fun nextChar() {
        lexeme?.append(nextCh.toChar())

        offset += 1

        if (nextCh == 10) {
            column = 0
            line += 1
        } else {
            column += 1
        }

        nextCh = input.read()
    }
}

data class AbstractToken<T>(
        val tToken: T,
        val location: Location,
        val lexeme: String) {
    override fun toString(): String {
        fun pp(location: Location): String =
                when (location) {
                    is LocationCoordinate -> "${location.offset}:${location.line}:${location.column}"
                    is LocationRange -> pp(location.start) + "-" + pp(location.end)
                }

        return tToken.toString().drop(1) + " " + pp(location) + " [" + lexeme + "]"
    }
}

data class Backtrack<T>(
        val token: T,
        val offset: Int,
        val line: Int,
        val column: Int,
        val nextCh: Int)
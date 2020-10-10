package io.littlelanguages.scanpiler

class ScannerReader(private val reader: java.io.Reader) {
    private var restoreBuffer: List<Int>? = null
    private var restoreBufferIdx = 0

    private var markBuffer: MutableList<Int>? = null

    fun read(): Int {
        val b = restoreBuffer

        val result = if (b != null) {
            val v = b[restoreBufferIdx]

            restoreBufferIdx += 1
            if (restoreBufferIdx == b.size) {
                restoreBuffer = null
            }

            v
        } else {
            reader.read()
        }

        markBuffer?.add(result)

        return result
    }


    fun close() {
        reader.close()
    }


    fun mark() {
        markBuffer = mutableListOf()
    }

    fun cancelMark() {
        markBuffer = null
    }

    fun restoreToMark() {
        val mb = markBuffer

        if (mb == null) {
            throw IllegalArgumentException("markBuffer == null")
        } else {
            if (mb.isNotEmpty()) {
                restoreBuffer = markBuffer
                restoreBufferIdx = 0
            }
        }

        markBuffer = null
    }
}
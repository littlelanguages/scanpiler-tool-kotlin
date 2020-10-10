package io.littlelanguages.scanpiler

import io.littlelanguages.data.Yamlable

interface Locationable {
    fun position(): Location
}

sealed class Location : Yamlable {
    abstract operator fun plus(location: Location): Location
}


data class LocationCoordinate(val offset: Int, val line: Int, val column: Int) : Location() {
    override operator fun plus(location: Location): Location =
            when (location) {
                is LocationCoordinate ->
                    if (location == this)
                        this
                    else
                        LocationRange(
                                LocationCoordinate(Integer.min(offset, location.offset), Integer.min(line, location.line), Integer.min(column, location.column)),
                                LocationCoordinate(Integer.max(offset, location.offset), Integer.max(line, location.line), Integer.max(column, location.column)))

                is LocationRange ->
                    LocationRange(
                            LocationCoordinate(Integer.min(offset, location.start.offset), Integer.min(line, location.start.line), Integer.min(column, location.start.column)),
                            LocationCoordinate(Integer.max(offset, location.end.offset), Integer.max(line, location.end.line), Integer.max(column, location.end.column)))
            }

    override fun toString(): String =
            "$offset:$line:$column"

    override fun yaml(): Any =
            toString()
}

data class LocationRange(val start: LocationCoordinate, val end: LocationCoordinate) : Location() {
    override operator fun plus(location: Location): Location =
            when (location) {
                is LocationCoordinate ->
                    location + this

                is LocationRange -> {
                    val startIndex =
                            Integer.min(start.offset, location.start.offset)

                    val endIndex =
                            Integer.max(end.offset, location.end.offset)

                    val startLocation =
                            LocationCoordinate(startIndex, Integer.min(start.line, location.start.line), Integer.min(start.column, location.start.column))

                    val endLocation =
                            LocationCoordinate(endIndex, Integer.max(end.line, location.end.line), Integer.max(end.column, location.end.column))

                    LocationRange(startLocation, endLocation)
                }
            }

    override fun toString(): String =
            "$start-$end"

    override fun yaml(): Any =
            toString()
}

package scanner

interface Yamlable {
    fun singletonMap(key: String, value: Any): Map<String, Any> =
            mapOf(Pair(key, value))

    fun yaml(): Any
}

package backtracking

import io.kotest.core.spec.style.StringSpec
import io.kotest.matchers.shouldBe

class SimpleTests : StringSpec({
    "underTest 10" {
        underTest(10) shouldBe 20
    }
})

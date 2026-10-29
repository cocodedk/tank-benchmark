"""The page opens clean, fills the viewport and shows the HUD."""
import unittest

from test_common import Base


class SmokeTest(Base):
    def test_the_page_opens_clean_and_lists_describe(self):
        self.assertIn("describe", self.g.tools())
        self.assertEqual([], self.g.errors)

    def test_a_canvas_fills_the_viewport(self):
        box = self.g.page.evaluate(
            "() => { const c = document.querySelector('canvas'); if (!c) return null;"
            " const r = c.getBoundingClientRect(); return [r.width, r.height]; }")
        self.assertIsNotNone(box, "no canvas")
        self.assertAlmostEqual(box[0], 1280, delta=2)
        self.assertAlmostEqual(box[1], 800, delta=2)

    def test_the_hud_names_both_sides_and_the_round(self):
        text = self.g.page.inner_text("body")
        for word in ("You", "Computer", "Round"):
            self.assertIn(word, text)


if __name__ == "__main__":
    unittest.main()

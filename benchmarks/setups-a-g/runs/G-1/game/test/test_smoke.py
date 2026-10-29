"""The page opens clean and lists its tools."""
import unittest

from page import game


class SmokeTest(unittest.TestCase):
    def test_the_page_opens_clean_and_lists_describe(self):
        with game() as g:
            self.assertIn("describe", g.tools())
            self.assertEqual({"x": 0, "y": 0, "width": 1280, "height": 800}, g.page.locator("#game").bounding_box())
            hud = g.page.inner_text("#hud")
            for text in ("You", "Computer", "Round 1", "Space"):
                self.assertIn(text, hud)
            self.assertEqual([], g.errors)


if __name__ == "__main__":
    unittest.main()

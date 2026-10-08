"""The page opens clean and lists its tools."""
import unittest

from page import game


class SmokeTest(unittest.TestCase):
    def test_the_page_opens_clean_and_lists_describe(self):
        with game() as g:
            self.assertIn("describe", g.tools())
            self.assertEqual([], g.errors)
            llms = g.page.request.get(g.page.url.replace("index.html", "llms.txt")).text()
            for name in ("describe", "pause", "step", "place", "fire", "set_ai", "reset"):
                self.assertIn(f"`{name}`", llms)


if __name__ == "__main__":
    unittest.main()

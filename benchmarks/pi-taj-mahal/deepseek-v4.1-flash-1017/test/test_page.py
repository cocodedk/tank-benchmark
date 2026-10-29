"""The page contract: tools, credit, no images, and a canvas that actually draws."""
import unittest

from page import game


class PageTest(unittest.TestCase):
    def test_tools_credit_and_painting(self):
        with game() as g:
            self.assertEqual(["describe", "pan", "reset", "zoom_by"], sorted(g.tools()))
            credit = g.page.locator(".credit").inner_text()
            self.assertIn("Built by", credit)
            self.assertIn("deepseek/deepseek-v4.1-flash-1017", credit)
            self.assertIn("pi on OpenRouter", credit)

            self.assertEqual(0, g.page.evaluate("document.images.length"))
            self.assertIsNotNone(g.page.locator("canvas#art"))

            pixels = g.page.evaluate("""() => {
              const c = document.getElementById('art');
              const ctx = c.getContext('2d');
              const pts = [[0.5, 0.18], [0.5, 0.55], [0.25, 0.45], [0.75, 0.75]];
              return pts.map(([x, y]) => Array.from(
                ctx.getImageData(Math.floor(c.width * x), Math.floor(c.height * y), 1, 1).data));
            }""")
            self.assertTrue(all(p[3] == 255 for p in pixels), pixels)
            self.assertGreater(len({tuple(p[:3]) for p in pixels}), 2, pixels)
            self.assertEqual([], g.errors)


if __name__ == "__main__":
    unittest.main()

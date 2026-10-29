"""The page opens clean, lists its tools, draws in code only, and credits its builder."""
import unittest

from page import game


class SmokeTest(unittest.TestCase):
    def test_the_page_opens_clean_and_lists_describe(self):
        with game() as g:
            self.assertIn("describe", g.tools())
            self.assertEqual([], g.errors)

    def test_it_answers_like_a_tool(self):
        with game() as g:
            for name in ("describe", "zoom_by", "pan", "reset"):
                answer = g.call(name, {"factor": 2, "dx": 1, "dy": 1})
                self.assertTrue(answer["ok"], (name, answer))
                self.assertIsInstance(answer["parts"], list)
            self.assertEqual([], g.errors)

    def test_the_drawing_is_code_not_a_picture(self):
        with game() as g:
            self.assertEqual(0, g.page.evaluate("document.images.length"))
            html = g.page.evaluate("document.documentElement.outerHTML")
            self.assertNotIn("data:image", html)
            self.assertNotIn("<img", html)
            # nothing fetched from anywhere but this checkout
            hosts = g.page.evaluate(
                "() => performance.getEntriesByType('resource').map(r => new URL(r.name).host)")
            self.assertEqual([], [h for h in hosts if not h.startswith("127.0.0.1")])
            self.assertGreater(g.page.evaluate("document.querySelectorAll('#scene path').length"), 200)

    def test_the_credit_line_is_on_the_page(self):
        with game() as g:
            credit = g.page.inner_text("#credit")
            self.assertEqual("Built by Particle-1 · particle-ai/particle-1 · pi on OpenRouter", credit)


if __name__ == "__main__":
    unittest.main()

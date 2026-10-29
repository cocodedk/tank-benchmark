"""The page opens clean, shows the arena's head-up display, and the suite has every test."""
import pathlib
import unittest

from helpers import game

TESTS = 34


class SmokeTest(unittest.TestCase):
    def test_the_page_opens_clean_and_lists_describe(self):
        with game() as g:  # the shared page: its errors cover every test that ran before
            self.assertIn("describe", g.tools())
            self.assertEqual([], g.errors)

    def test_the_hud_shows_both_bars_the_score_the_round_and_the_controls(self):
        with game() as g:
            g.call("pause", {"paused": True})
            g.page.wait_for_timeout(200)
            text = g.page.inner_text("body")
            for part in ["You", "Computer", "Score", "Round", "Space"]:
                self.assertIn(part, text)
            self.assertEqual(g.page.evaluate("[innerWidth, innerHeight]"), g.page.evaluate(
                "(() => { const c = document.querySelector('canvas'); return [c.clientWidth, c.clientHeight]; })()"))
            self.assertEqual([], g.errors)

    def test_the_suite_has_the_expected_number_of_tests(self):
        found = unittest.defaultTestLoader.discover(str(pathlib.Path(__file__).parent), pattern="test_*.py")
        self.assertEqual(TESTS, found.countTestCases())


if __name__ == "__main__":
    unittest.main()

"""The page: canvas, head-up display, and a clean console."""
import unittest

from tank import GameTest, text

FILL = "document.getElementById('hp-player').style.width"


class PageTest(GameTest):
    def test_the_hud_shows_bars_score_round_and_controls(self):
        hud = text(self.g, "#hud")
        for label in ("You", "Computer", "Round 1", "0 : 0", "Space"):
            self.assertIn(label, hud)
        self.assertEqual("100%", self.g.page.evaluate(FILL))

    def test_the_health_bar_follows_the_health(self):
        self.g.call("fire", {"tank": "computer"})
        self.g.call("step", {"seconds": 2})
        text(self.g, "#hud")
        self.assertEqual("75%", self.g.page.evaluate(FILL))

    def test_the_canvas_fills_the_window_and_follows_its_size(self):
        page = self.g.page
        for size in ({"width": 600, "height": 900}, {"width": 1280, "height": 800}):
            page.set_viewport_size(size)
            text(self.g, "#hud")
            box = page.evaluate("(() => { const c = document.getElementById('view'); return [c.clientWidth, c.clientHeight, c.width, c.height]; })()")
            self.assertEqual([size["width"], size["height"]] * 2, box)

    def test_it_draws_and_plays_without_errors(self):
        self.g.call("set_ai", {"enabled": True})
        self.g.call("step", {"seconds": 10})
        text(self.g, "#hud")
        self.assertEqual([], self.g.errors)


if __name__ == "__main__":
    unittest.main()

"""Four hits end a round; the banner, the score and the next round."""
import unittest

from common import fresh, place, state, step
from page import game

BANNER = {"player": "You win the round", "computer": "The computer wins the round"}


def four_hits(g, shooter):
    """Both tanks 10 apart in the open; the shooter fires four times, each shell landing before the next shot."""
    place(g, "player", 0, 0, 0)
    place(g, "computer", 10, 0, 180)
    for _ in range(4):
        g.call("fire", {"tank": shooter})
        step(g, 0.5)


class RoundsTest(unittest.TestCase):
    def test_four_hits_end_the_round_and_two_seconds_later_the_next_begins(self):
        with game() as g:
            fresh(g)
            for round_no, (shooter, target) in enumerate([("player", "computer"), ("computer", "player")], 1):
                four_hits(g, shooter)
                s = state(g)
                self.assertEqual(("round_over", 0, round_no), (s["state"], s["tanks"][target]["health"], s["round"]))
                self.assertEqual(round_no, s["score"][shooter] + s["score"][target])
                self.assertEqual(1, s["score"][shooter])
                g.page.wait_for_timeout(100)                   # the HUD redraws on the next frame
                self.assertIn(BANNER[shooter], g.page.inner_text("body"))
                step(g, 1.5)
                self.assertEqual("round_over", state(g)["state"])
                step(g, 1)
                s = state(g)
                self.assertEqual(("playing", round_no + 1, 100, 100, [], -15, 15),
                                 (s["state"], s["round"], s["tanks"]["player"]["health"], s["tanks"]["computer"]["health"],
                                  s["shells"], s["tanks"]["player"]["x"], s["tanks"]["computer"]["x"]))
                g.page.wait_for_timeout(100)
                self.assertNotIn(BANNER[shooter], g.page.inner_text("body"))
            self.assertEqual({"player": 1, "computer": 1}, state(g)["score"])

    def test_nothing_fires_while_the_banner_shows(self):
        with game() as g:
            fresh(g)
            four_hits(g, "player")
            self.assertEqual({"ok": True, "fired": False}, g.call("fire", {"tank": "player"}))


if __name__ == "__main__":
    unittest.main()

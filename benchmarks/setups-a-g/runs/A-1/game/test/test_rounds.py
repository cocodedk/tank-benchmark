"""Four hits end a round; the banner shows for 2 s; then the next round starts."""
import unittest

from helpers import game, quiet, win_round


class RoundsTest(unittest.TestCase):
    def test_four_hits_end_the_round_and_two_seconds_later_the_next_begins(self):
        with game() as g:
            quiet(g)
            state = win_round(g, "player")
            self.assertEqual({"player": 1, "computer": 0}, state["score"])
            self.assertEqual(0, state["tanks"]["computer"]["health"])
            self.assertIn("You win the round", g.page.inner_text("body"))
            state = g.call("step", {"seconds": 1.9})
            self.assertEqual(("round_over", 1), (state["state"], state["round"]))
            state = g.call("step", {"seconds": 0.1})
            self.assertEqual(("playing", 2), (state["state"], state["round"]))
            self.assertEqual({"x": -15, "z": 0, "heading": 0, "health": 100, "shots": 4}, state["tanks"]["player"])
            self.assertEqual({"x": 15, "z": 0, "heading": 180, "health": 100, "shots": 0}, state["tanks"]["computer"])
            self.assertEqual([], state["shells"])
            self.assertEqual({"player": 1, "computer": 0}, state["score"])
            self.assertNotIn("wins the round", g.page.inner_text("body"))

    def test_the_computer_can_win_a_round(self):
        with game() as g:
            quiet(g)
            state = win_round(g, "computer")
            self.assertEqual({"player": 0, "computer": 1}, state["score"])
            self.assertIn("The computer wins the round", g.page.inner_text("body"))

    def test_nothing_fires_while_the_banner_shows(self):
        with game() as g:
            quiet(g)
            win_round(g, "player")
            self.assertFalse(g.call("fire", {"tank": "player"})["fired"])

    def test_reset_starts_a_new_game_and_keeps_pause_and_ai(self):
        with game() as g:
            quiet(g)
            win_round(g, "player")
            state = g.call("reset")
            self.assertEqual((1, "playing", {"player": 0, "computer": 0}), (state["round"], state["state"], state["score"]))
            self.assertEqual((True, False), (state["paused"], state["ai"]))
            self.assertEqual(0, state["tanks"]["player"]["shots"])
            self.assertEqual(100, state["tanks"]["computer"]["health"])


if __name__ == "__main__":
    unittest.main()

"""Four hits end a round; the next starts after 2 s; reset restarts the match."""
import unittest

from base import GameCase


class RoundsTest(GameCase):
    def win_round(self):
        self.place("player", -5, 0, 0)
        self.place("computer", 5, 0, 180)
        for _ in range(4):
            self.assertTrue(self.call("fire", {"tank": "player"})["fired"])
            s = self.call("step", {"seconds": 0.6})
        return s

    def test_four_hits_win_the_round_and_a_new_one_starts(self):
        s = self.win_round()
        self.assertEqual(("round_over", 1, {"player": 1, "computer": 0}), (s["state"], s["round"], s["score"]))
        self.assertEqual(0, s["tanks"]["computer"]["health"])
        self.g.page.wait_for_function("document.body.innerText.includes('You win the round')", timeout=5000)
        self.assertFalse(self.call("fire", {"tank": "player"})["fired"])
        self.assertEqual("round_over", self.call("step", {"seconds": 1.8})["state"])  # ended ~0.13 s ago
        s = self.call("step", {"seconds": 0.1})
        self.assertEqual(("playing", 2, {"player": 1, "computer": 0}), (s["state"], s["round"], s["score"]))
        self.assertEqual([], s["shells"])
        keys = ("x", "z", "heading", "health")
        self.assertEqual({"x": -15, "z": 0, "heading": 0, "health": 100}, {k: s["tanks"]["player"][k] for k in keys})
        self.assertEqual({"x": 15, "z": 0, "heading": 180, "health": 100}, {k: s["tanks"]["computer"][k] for k in keys})

    def test_reset_restarts_the_match(self):
        self.win_round()
        self.call("set_ai", {"enabled": True})
        s = self.call("reset")
        self.assertEqual(("playing", 1, {"player": 0, "computer": 0}), (s["state"], s["round"], s["score"]))
        self.assertEqual((True, True), (s["paused"], s["ai"]))
        self.assertEqual(-15, s["tanks"]["player"]["x"])
        self.assertEqual(0, s["tanks"]["player"]["shots"])


if __name__ == "__main__":
    unittest.main()

"""Four hits win a round, the banner shows, and the next round starts fresh."""
from base import PageTest


class RoundTest(PageTest):
    def test_four_hits_end_the_round_and_the_next_round_starts(self):
        self.g.call("place", {"tank": "player", "x": -15, "z": 0, "heading": 0})
        self.g.call("place", {"tank": "computer", "x": 0, "z": 0, "heading": 90})
        for _ in range(4):
            self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
            state = self.step(1.0)

        self.assertEqual(0, state["tanks"]["computer"]["health"])
        self.assertEqual("round_over", state["state"])
        self.assertEqual({"player": 1, "computer": 0}, state["score"])
        self.assertEqual("You win the round", self.g.page.locator("#banner").text_content())

        state = self.step(2.1)
        self.assertEqual("playing", state["state"])
        self.assertEqual(2, state["round"])
        self.assertEqual({"player": 1, "computer": 0}, state["score"])
        self.assertEqual(100, state["tanks"]["player"]["health"])
        self.assertEqual(100, state["tanks"]["computer"]["health"])
        self.assertEqual(-15, state["tanks"]["player"]["x"])
        self.assertEqual(15, state["tanks"]["computer"]["x"])
        self.assertEqual([], state["shells"])

    def test_reset_starts_a_new_game(self):
        self.g.call("place", {"tank": "player", "x": 0, "z": 0, "heading": 0})
        self.g.call("fire", {"tank": "player"})
        state = self.g.call("reset", {})
        self.assertEqual(1, state["round"])
        self.assertEqual({"player": 0, "computer": 0}, state["score"])
        self.assertEqual([], state["shells"])
        self.assertEqual(-15, state["tanks"]["player"]["x"])
        self.assertEqual(15, state["tanks"]["computer"]["x"])


if __name__ == "__main__":
    import unittest
    unittest.main()

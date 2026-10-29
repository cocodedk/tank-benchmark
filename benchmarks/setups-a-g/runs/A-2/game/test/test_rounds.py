"""Four hits end a round; the banner shows for 2 s of game time; the next round starts fresh."""
import unittest

from tank import GameTest, shoot, text


class RoundsTest(GameTest):
    def banner(self):
        return text(self.g, "#banner")

    def test_four_hits_end_the_round_and_two_seconds_later_the_next_starts(self):
        g = self.g
        for health in (75, 50, 25):
            self.assertEqual(health, shoot(g)["tanks"]["computer"]["health"])
        s = shoot(g)
        self.assertEqual(("round_over", {"player": 1, "computer": 0}, 0), (s["state"], s["score"], s["tanks"]["computer"]["health"]))
        self.assertEqual("You win the round", self.banner())
        s = g.call("step", {"seconds": 1.5})
        self.assertEqual(("round_over", 1), (s["state"], s["round"]))
        s = g.call("step", {"seconds": 0.5})
        self.assertEqual(("playing", 2, {"player": 1, "computer": 0}), (s["state"], s["round"], s["score"]))
        self.assertEqual((-15, 0, 0, 100), tuple(s["tanks"]["player"][k] for k in ("x", "z", "heading", "health")))
        self.assertEqual((15, 0, 180, 100), tuple(s["tanks"]["computer"][k] for k in ("x", "z", "heading", "health")))
        self.assertEqual([], s["shells"])

    def test_the_computer_wins_a_round(self):
        for _ in range(4):
            s = shoot(self.g, "computer")
        self.assertEqual(("round_over", {"player": 0, "computer": 1}), (s["state"], s["score"]))
        self.assertEqual("The computer wins the round", self.banner())

    def test_the_banner_clears_and_the_hud_shows_the_new_round(self):
        for _ in range(4):
            shoot(self.g)
        self.g.call("step", {"seconds": 2})
        self.assertEqual("", self.banner())
        self.assertEqual("Round 2", text(self.g, "#round"))

    def test_nobody_fires_while_the_banner_shows(self):
        for _ in range(4):
            shoot(self.g)
        self.assertFalse(self.g.call("fire", {"tank": "player"})["fired"])

    def test_reset_returns_to_round_one(self):
        for _ in range(4):
            shoot(self.g)
        s = self.g.call("reset")
        self.assertEqual(("playing", 1, {"player": 0, "computer": 0}), (s["state"], s["round"], s["score"]))
        self.assertEqual(100, s["tanks"]["computer"]["health"])
        self.assertEqual("", self.banner())


if __name__ == "__main__":
    unittest.main()

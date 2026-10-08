"""Four hits end the round; two seconds later the next one starts."""
import unittest

from test_common import Base


class RoundsTest(Base):
    def test_four_hits_win_the_round_and_a_new_one_follows(self):
        self.place("player", -5, 0, 0)
        self.place("computer", 5, 0, 180)
        for _ in range(4):
            self.assertTrue(self.fire())
            s = self.step(0.6)
        self.assertEqual("round_over", s["state"])
        self.assertEqual({"player": 1, "computer": 0}, s["score"])
        self.assertIn("You win the round", self.g.page.inner_text("body"))
        s = self.step(2.1)
        self.assertEqual(("playing", 2, {"player": 1, "computer": 0}), (s["state"], s["round"], s["score"]))
        self.assertEqual([], s["shells"])
        for name, (x, z, h) in {"player": (-15, 0, 0), "computer": (15, 0, 180)}.items():
            t = s["tanks"][name]
            self.assertEqual(100, t["health"])
            self.assertAlmostEqual(t["x"], x, delta=0.05)
            self.assertAlmostEqual(t["z"], z, delta=0.05)
            self.assertHeading(t["heading"], h)

    def test_the_next_round_starts_exactly_two_seconds_later(self):
        self.place("player", -5, 0, 0)
        self.place("computer", 5, 0, 180)
        for _ in range(3):
            self.assertTrue(self.fire())
            self.step(0.6)
        self.assertTrue(self.fire())
        s = self.step(0.4)
        while s["state"] == "playing":
            s = self.step(1 / 60)
        self.assertEqual("round_over", self.step(2 - 1 / 60)["state"])
        self.assertEqual("playing", self.step(1 / 60)["state"])


if __name__ == "__main__":
    unittest.main()

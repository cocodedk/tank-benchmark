"""The computer AI: it shoots a player who stands still, and drives round a wall without clipping it."""
import math
import unittest

from page import game

RADIUS = 1.2


def wall_rect(w):
    """One wall as (x0, z0, x1, z1), from its centre and size (assumed keys x, z, w, d)."""
    return (w["x"] - w["width"] / 2, w["z"] - w["depth"] / 2,
            w["x"] + w["width"] / 2, w["z"] + w["depth"] / 2)


def gap(x, z, rect):
    """Distance from a point to a rectangle, 0 when the point is inside it."""
    x0, z0, x1, z1 = rect
    dx = max(x0 - x, 0, x - x1)
    dz = max(z0 - z, 0, z - z1)
    return math.hypot(dx, dz)


class AiTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._ctx = game()
        cls.g = cls._ctx.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls._ctx.__exit__(None, None, None)

    def setUp(self):
        self.g.call("pause", {"paused": True})
        self.g.call("set_ai", {"enabled": False})
        self.g.call("reset", {})

    def place(self, tank, x, z, heading):
        s = self.g.call("place", {"tank": tank, "x": x, "z": z, "heading": heading})
        self.assertTrue(s["ok"], s)

    def step(self, seconds):
        return self.g.call("step", {"seconds": seconds})

    def test_a_computer_shoots_a_player_who_stands_still(self):
        self.g.call("set_ai", {"enabled": True})
        for _ in range(6):  # up to 30 s, in 5 s steps; stop at the first hit
            s = self.step(5)
            if s["tanks"]["player"]["health"] < 100:
                break
        self.assertLess(s["tanks"]["player"]["health"], 100)
        self.assertGreaterEqual(s["tanks"]["computer"]["shots"], 1)

    def test_the_computer_turns_and_moves_to_hit_a_player_off_its_line(self):
        self.place("computer", 15, 10, 180)  # the wall at (8, 8) blocks its line to (-15, 0)
        self.g.call("set_ai", {"enabled": True})
        for _ in range(6):
            s = self.step(5)
            if s["tanks"]["player"]["health"] < 100:
                break
        self.assertLess(s["tanks"]["player"]["health"], 100)
        self.assertNotEqual(180, s["tanks"]["computer"]["heading"])

    def test_the_computer_goes_round_the_wall_and_never_clips_it(self):
        self.place("player", -11, 8, 0)  # west of the wall at (-8, 8)
        self.place("computer", 11, 8, 180)  # east of the wall at (8, 8)
        self.g.call("set_ai", {"enabled": True})
        farthest, hit_or_fired = 0.0, False
        for _ in range(80):  # 20 s, in 0.25 s steps
            s = self.step(0.25)
            c = s["tanks"]["computer"]
            for w in s["walls"]:
                self.assertGreaterEqual(gap(c["x"], c["z"], wall_rect(w)), RADIUS - 0.01)
            self.assertLessEqual(abs(c["x"]), 18.8 + 0.01)
            self.assertLessEqual(abs(c["z"]), 13.8 + 0.01)
            farthest = max(farthest, math.hypot(c["x"] - 11, c["z"] - 8))
            hit_or_fired = hit_or_fired or s["tanks"]["player"]["health"] < 100 or c["shots"] >= 1
        self.assertGreater(farthest, 2)
        self.assertTrue(hit_or_fired)


if __name__ == "__main__":
    unittest.main()

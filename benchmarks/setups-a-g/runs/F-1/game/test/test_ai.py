"""The computer tank: it shoots a standing player, and it respects walls while hunting."""
import contextlib
import math
import unittest

from page import game

R = 1.2 - 0.05


class AiTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.stack = contextlib.ExitStack()
        cls.g = cls.stack.enter_context(game())

    @classmethod
    def tearDownClass(cls):
        cls.stack.close()

    def setUp(self):
        self.g.call("pause", {"paused": True})
        self.g.call("set_ai", {"enabled": False})
        self.g.call("reset", {})

    def test_computer_shoots_a_standing_player(self):
        self.g.call("set_ai", {"enabled": True})
        s = self.g.call("describe", {})
        for _ in range(30):
            if s["tanks"]["player"]["health"] < 100:
                break
            s = self.g.call("step", {"seconds": 1})
        self.assertLess(s["tanks"]["player"]["health"], 100)
        self.assertGreaterEqual(s["tanks"]["computer"]["shots"], 1)

    def test_computer_goes_around_walls(self):
        for tank, x, heading in (("player", -15, 0), ("computer", 15, 180)):
            self.assertTrue(self.g.call("place", {"tank": tank, "x": x, "z": 8, "heading": heading})["ok"])
        self.g.call("set_ai", {"enabled": True})
        s = self.g.call("describe", {})
        farthest = 0
        for _ in range(120):
            s = self.g.call("step", {"seconds": 0.25})
            c = s["tanks"]["computer"]
            farthest = max(farthest, math.hypot(c["x"] - 15, c["z"] - 8))
            self.assertLessEqual(abs(c["x"]), 20 - R, c)
            self.assertLessEqual(abs(c["z"]), 15 - R, c)
            for w in s["walls"]:
                nx = min(max(c["x"], w["x"] - w["width"] / 2), w["x"] + w["width"] / 2)
                nz = min(max(c["z"], w["z"] - w["depth"] / 2), w["z"] + w["depth"] / 2)
                self.assertGreaterEqual(math.hypot(c["x"] - nx, c["z"] - nz), R, (c, w))
            if s["tanks"]["player"]["health"] < 100:
                break
        self.assertLess(s["tanks"]["player"]["health"], 100)
        self.assertGreater(farthest, 1)


if __name__ == "__main__":
    unittest.main()

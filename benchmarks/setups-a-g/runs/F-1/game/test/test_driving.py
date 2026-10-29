"""Keyboard driving: speeds, turning, firing, and what stops a tank."""
import contextlib
import math
import unittest

from page import game


class DrivingTest(unittest.TestCase):
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

    def hold(self, key, seconds):
        """Hold key while stepping; return the whole state."""
        self.g.page.keyboard.down(key)
        try:
            return self.g.call("step", {"seconds": seconds})
        finally:
            self.g.page.keyboard.up(key)

    def place(self, x, z, heading):
        self.assertTrue(self.g.call("place", {"tank": "player", "x": x, "z": z, "heading": heading})["ok"])

    def player(self, state):
        return state["tanks"]["player"]

    def test_forward_speed(self):
        for key in ("w", "ArrowUp"):
            with self.subTest(key=key):
                self.g.call("reset", {})
                self.assertAlmostEqual(-9, self.player(self.hold(key, 1))["x"], delta=0.15)

    def test_reverse_speed(self):
        self.place(0, 0, 0)
        self.assertAlmostEqual(-2, self.player(self.hold("s", 0.5))["x"], delta=0.15)

    def test_turning_in_opposite_directions(self):
        headings = []
        for key in ("d", "a"):
            self.place(0, 0, 0)
            headings.append(self.player(self.hold(key, 1))["heading"])
        for h in headings:
            self.assertLess(min(abs(h - 120), abs(h - 240)), 0.5, headings)
        self.assertGreater(abs(headings[0] - headings[1]), 100, headings)

    def test_space_fires_one_shell(self):
        self.assertEqual(1, self.player(self.hold("Space", 1))["shots"])

    def test_outer_wall_stops_tank(self):
        self.place(14, -12, 0)
        self.g.page.keyboard.down("w")
        try:
            first = self.player(self.g.call("step", {"seconds": 2}))["x"]
            later = self.player(self.g.call("step", {"seconds": 1}))["x"]
        finally:
            self.g.page.keyboard.up("w")
        self.assertAlmostEqual(18.8, first, delta=0.15)
        self.assertAlmostEqual(18.8, later, delta=0.15)

    def test_inner_wall_stops_tank(self):
        self.place(2, 8, 0)
        self.assertAlmostEqual(5.8, self.player(self.hold("w", 2))["x"], delta=0.15)

    def test_tanks_do_not_overlap(self):
        self.place(8, 0, 0)
        tanks = self.hold("w", 2)["tanks"]
        p, c = tanks["player"], tanks["computer"]
        dist = math.hypot(p["x"] - c["x"], p["z"] - c["z"])
        self.assertGreaterEqual(dist, 2.4 - 0.05)
        self.assertLess(dist, 2.4 + 0.3)

    def test_tanks_do_not_overlap_by_a_wall(self):
        self.assertTrue(self.g.call("place", {"tank": "computer", "x": 17, "z": 0, "heading": 180})["ok"])
        self.place(18.8, -1.6, 90)
        tanks = self.hold("w", 2)["tanks"]
        p, c = tanks["player"], tanks["computer"]
        self.assertGreaterEqual(math.hypot(p["x"] - c["x"], p["z"] - c["z"]), 2.4 - 1e-6)


if __name__ == "__main__":
    unittest.main()

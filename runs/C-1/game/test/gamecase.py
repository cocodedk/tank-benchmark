"""Shared base: one browser per TestCase class, every test starts paused, AI off, reset."""
import contextlib
import unittest

from page import game


def wall_gap(x, z, wall):
    """Distance from a point to a wall rectangle (0 inside)."""
    dx = max(abs(x - wall["x"]) - wall["width"] / 2, 0)
    dz = max(abs(z - wall["z"]) - wall["depth"] / 2, 0)
    return (dx * dx + dz * dz) ** 0.5


class GameCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._stack = contextlib.ExitStack()
        cls.g = cls._stack.enter_context(game())

    @classmethod
    def tearDownClass(cls):
        cls._stack.close()

    def setUp(self):
        self.g.call("pause", {"paused": True})
        self.g.call("set_ai", {"enabled": False})
        self.g.call("reset", {})

    def tearDown(self):
        self.assertEqual([], self.g.errors)

    def state(self):
        return self.g.call("describe")

    def tank(self, name):
        return self.state()["tanks"][name]

    def put(self, name, x, z, heading=0):
        out = self.g.call("place", {"tank": name, "x": x, "z": z, "heading": heading})
        self.assertTrue(out["ok"], out)
        return out

    def run_for(self, seconds):
        out = self.g.call("step", {"seconds": seconds})
        self.assertTrue(out["ok"], out)
        return out

    def hold(self, key, seconds):
        self.g.page.keyboard.down(key)
        try:
            return self.run_for(seconds)
        finally:
            self.g.page.keyboard.up(key)

    def fire(self, name="player"):
        out = self.g.call("fire", {"tank": name})
        self.assertTrue(out["ok"], out)
        return out["fired"]

    def assertRefused(self, out):
        self.assertIs(out.get("ok"), False, out)
        self.assertIsInstance(out.get("error"), str)
        self.assertTrue(out["error"])

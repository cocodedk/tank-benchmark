"""A test case sharing one page per class; each test starts paused, AI off, from a new game."""
import unittest

from page import game


class GameCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.ctx = game()
        cls.g = cls.ctx.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.ctx.__exit__(None, None, None)

    def setUp(self):
        self.g.call("pause", {"paused": True})
        self.g.call("set_ai", {"enabled": False})
        self.g.call("reset")

    def step(self, seconds):
        return self.g.call("step", {"seconds": seconds})

    def place(self, tank, x, z, heading):
        out = self.g.call("place", {"tank": tank, "x": x, "z": z, "heading": heading})
        self.assertTrue(out["ok"], out)
        return out

    def hold(self, key, seconds):
        self.g.page.keyboard.down(key)
        try:
            return self.step(seconds)
        finally:
            self.g.page.keyboard.up(key)

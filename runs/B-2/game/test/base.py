"""Shared fixture: one browser per test class; paused, AI off, reset before each test."""
import contextlib
import math
import unittest

from page import game

KEYS = ["w", "a", "s", "d", " "]


class GameCase(unittest.TestCase):
    ai = False

    @classmethod
    def setUpClass(cls):
        cls.stack = contextlib.ExitStack()
        cls.g = cls.stack.enter_context(game())

    @classmethod
    def tearDownClass(cls):
        cls.stack.close()

    def release(self):
        for k in KEYS:
            self.g.page.keyboard.up(k)

    def setUp(self):
        self.release()
        self.g.call("pause", {"paused": True})
        self.g.call("set_ai", {"enabled": self.ai})
        self.g.call("reset", {})

    def tearDown(self):
        self.release()

    def step(self, s):
        return self.g.call("step", {"seconds": s})

    def place(self, tank, x, z, heading=None):
        p = {"tank": tank, "x": x, "z": z}
        if heading is not None:
            p["heading"] = heading
        return self.g.call("place", p)

    def fire(self, tank="player"):
        return self.g.call("fire", {"tank": tank})

    def hold(self, key, s):
        self.g.page.keyboard.down(key)
        try:
            return self.step(s)
        finally:
            self.g.page.keyboard.up(key)

    def tank(self, st, who="player"):
        return st["tanks"][who]


def dist(a, b):
    return math.hypot(a["x"] - b["x"], a["z"] - b["z"])

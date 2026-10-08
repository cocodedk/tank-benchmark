"""A test case sharing one page per class, starting each test paused, AI off, on a fresh game."""
import contextlib
import unittest

from page import game


class GameCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.stack = contextlib.ExitStack()
        cls.g = cls.stack.enter_context(game())

    @classmethod
    def tearDownClass(cls):
        cls.stack.close()

    def setUp(self):
        self.call("pause", {"paused": True})
        self.call("set_ai", {"enabled": False})
        self.call("reset")

    def call(self, name, payload=None):
        return self.g.call(name, payload)

    def place(self, tank, x, z, heading):
        self.assertTrue(self.call("place", {"tank": tank, "x": x, "z": z, "heading": heading})["ok"])

    def step(self, seconds):
        return self.call("step", {"seconds": seconds})

    def hold(self, key, seconds):
        self.g.page.keyboard.down(key)
        try:
            return self.step(seconds)
        finally:
            self.g.page.keyboard.up(key)

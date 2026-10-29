"""One shared page per test class, paused, with the AI off, before every test."""
import contextlib
import unittest

from page import game


class GameCase(unittest.TestCase):
    ai = False

    @classmethod
    def setUpClass(cls):
        stack = contextlib.ExitStack()
        cls.addClassCleanup(stack.close)
        cls.g = stack.enter_context(game())

    def setUp(self):
        self.call("pause", {"paused": True})
        self.call("set_ai", {"enabled": self.ai})
        self.call("reset")

    def tearDown(self):
        self.assertEqual([], self.g.errors)

    def call(self, name, payload=None):
        return self.g.call(name, payload)

    def step(self, seconds):
        return self.call("step", {"seconds": seconds})

    def place(self, tank, x, z, heading=0):
        answer = self.call("place", {"tank": tank, "x": x, "z": z, "heading": heading})
        self.assertTrue(answer["ok"], answer)
        return answer

    def see(self, selector, text):
        """Wait for the next frame to show `text` in the element: the page draws on animation frames."""
        self.g.page.wait_for_function("([s, t]) => document.querySelector(s).textContent === t", arg=[selector, text], timeout=3000)

    def hold(self, key, seconds):
        """The state after holding `key` for `seconds` of game time."""
        self.g.page.keyboard.down(key)
        try:
            return self.step(seconds)
        finally:
            self.g.page.keyboard.up(key)

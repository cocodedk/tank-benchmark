"""Shared base for the suite: one page for the whole run, reset before each test (no tests here)."""
import atexit
import contextlib
import unittest

from page import game

_stack = contextlib.ExitStack()
atexit.register(_stack.close)
_page = []


class Base(unittest.TestCase):
    AI = False

    @classmethod
    def setUpClass(cls):
        if not _page:
            _page.append(_stack.enter_context(game()))
        cls.g = _page[0]

    def setUp(self):
        self.held = []
        self.ok(self.g.call("pause", {"paused": True}))
        self.ok(self.g.call("set_ai", {"enabled": self.AI}))
        self.ok(self.g.call("reset"))

    def tearDown(self):
        for key in self.held:
            self.g.page.keyboard.up(key)

    def ok(self, answer):
        self.assertIs(answer.get("ok"), True, answer)
        return answer

    def state(self):
        return self.ok(self.g.call("describe"))

    def step(self, seconds):
        return self.ok(self.g.call("step", {"seconds": seconds}))

    def place(self, tank, x, z, heading=0):
        return self.ok(self.g.call("place", {"tank": tank, "x": x, "z": z, "heading": heading}))

    def tank(self, name):
        return self.state()["tanks"][name]

    def fire(self, tank="player"):
        return self.ok(self.g.call("fire", {"tank": tank}))["fired"]

    def hold(self, key, seconds, chunk=None):
        """Hold a key while stepping; returns the state after each chunk."""
        chunk = chunk or seconds
        states = []
        self.g.page.keyboard.down(key)
        self.held.append(key)
        try:
            for _ in range(round(seconds / chunk)):
                states.append(self.step(chunk))
        finally:
            self.g.page.keyboard.up(key)
            self.held.remove(key)
        return states

    def assertHeading(self, actual, expected, delta=1.0):
        diff = (actual - expected + 180) % 360 - 180
        self.assertLessEqual(abs(diff), delta, f"heading {actual} != {expected}")

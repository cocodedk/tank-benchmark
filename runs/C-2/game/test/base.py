"""Shared fixture: one browser per test file, a known paused state before each test."""
import unittest

from page import game


class GameCase(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._cm = game()
        cls.g = cls._cm.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls._cm.__exit__(None, None, None)

    def setUp(self):
        for key in ("w", "s", "a", "d", "Space"):
            self.g.page.keyboard.up(key)
        self.call("pause", {"paused": True})
        self.call("set_ai", {"enabled": False})
        self.call("reset")

    def call(self, name, payload=None):
        return self.g.call(name, payload)

    def hold(self, keys, seconds):
        """Hold keys while stepping `seconds`; returns the state."""
        kb = self.g.page.keyboard
        for k in keys:
            kb.down(k)
        try:
            return self.call("step", {"seconds": seconds})
        finally:
            for k in keys:
                kb.up(k)

    def place(self, tank, x, z, heading=None):
        payload = {"tank": tank, "x": x, "z": z}
        if heading is not None:
            payload["heading"] = heading
        out = self.call("place", payload)
        self.assertTrue(out["ok"], out)
        return out

    def state(self):
        return self.call("describe")

    def player(self):
        return self.state()["tanks"]["player"]

    def computer(self):
        return self.state()["tanks"]["computer"]

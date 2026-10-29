"""Shared by the test classes: one browser per class, a fresh paused round per test."""
import contextlib

from page import game

START = {"ok": True, "arena": {"width": 40, "depth": 30},
         "walls": [{"x": -8, "z": -8, "width": 2, "depth": 6}, {"x": -8, "z": 8, "width": 2, "depth": 6},
                   {"x": 8, "z": -8, "width": 2, "depth": 6}, {"x": 8, "z": 8, "width": 2, "depth": 6}],
         "tanks": {"player": {"x": -15, "z": 0, "heading": 0, "health": 100, "shots": 0},
                   "computer": {"x": 15, "z": 0, "heading": 180, "health": 100, "shots": 0}},
         "shells": [], "score": {"player": 0, "computer": 0}, "round": 1, "state": "playing"}


class GameCase:
    """Mix in before unittest.TestCase. Set `ai = True` on a class to test the computer."""
    ai = False

    @classmethod
    def setUpClass(cls):
        cls.stack = contextlib.ExitStack()
        cls.g = cls.stack.enter_context(game())

    @classmethod
    def tearDownClass(cls):
        cls.stack.close()

    def setUp(self):
        self.g.call("pause", {"paused": True})
        self.g.call("set_ai", {"enabled": self.ai})
        self.g.call("reset")

    def test_zz_no_page_errors(self):
        self.assertEqual([], self.g.errors)

    def state(self):
        return self.g.call("describe")

    def tank(self, name):
        return self.state()["tanks"][name]

    def step(self, seconds):
        state = self.g.call("step", {"seconds": seconds})
        self.assertTrue(state["ok"])
        return state

    def hold(self, key, seconds):
        self.g.page.keyboard.down(key)
        try:
            self.step(seconds)
        finally:
            self.g.page.keyboard.up(key)

    def place(self, tank, x, z, heading=None):
        payload = {"tank": tank, "x": x, "z": z}
        if heading is not None:
            payload["heading"] = heading
        self.assertTrue(self.g.call("place", payload)["ok"])

    def step_until(self, done, limit=15, chunk=0.25):
        """Step in chunks until done(state) is true; fail after `limit` seconds."""
        for _ in range(round(limit / chunk)):
            if done(self.step(chunk)):
                return
        self.fail(f"not reached within {limit} s: {self.state()}")

"""Helpers shared by the tests."""
import contextlib
import unittest

from page import game


def paused(g, ai=False):
    """Pause the game, switch the computer's AI to `ai` and start a fresh game (real time ran before the pause); returns the state."""
    g.call("pause", {"paused": True})
    g.call("set_ai", {"enabled": ai})
    return g.call("reset")


class GameTest(unittest.TestCase):
    """One browser per class (starting Chrome is slow); every test starts from a fresh paused game as `self.g`."""

    ai = False

    @classmethod
    def setUpClass(cls):
        cls._browser = contextlib.ExitStack()
        cls.g = cls._browser.enter_context(game())

    @classmethod
    def tearDownClass(cls):
        cls._browser.close()

    def setUp(self):
        paused(self.g, self.ai)


def text(g, selector):
    """The page's text at `selector`, after the HUD has had a frame to redraw."""
    g.page.evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")
    return g.page.inner_text(selector).strip()


def hold(g, keys, seconds):
    """Hold the keys for that many game seconds (the game must be paused); returns the state."""
    for key in keys:
        g.page.keyboard.down(key)
    state = g.call("step", {"seconds": seconds})
    for key in keys:
        g.page.keyboard.up(key)
    return state


def place(g, tank, x, z, heading=0):
    state = g.call("place", {"tank": tank, "x": x, "z": z, "heading": heading})
    assert state["ok"], state
    return state


def shoot(g, tank="player", seconds=2):
    """Fire, then let the shell fly for `seconds`; returns the state."""
    assert g.call("fire", {"tank": tank})["fired"]
    return g.call("step", {"seconds": seconds})

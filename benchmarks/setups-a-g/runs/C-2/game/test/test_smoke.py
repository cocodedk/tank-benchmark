"""The page opens clean, lists its seven tools, and describes the start state after reset."""
import unittest

from page import game

WALLS = [{"x": x, "z": z, "width": 2, "depth": 6} for x, z in ((-8, -8), (-8, 8), (8, -8), (8, 8))]


class SmokeTest(unittest.TestCase):
    def test_the_page_opens_clean_with_all_tools_and_initial_state(self):
        with game() as g:
            self.assertEqual({"describe", "pause", "step", "place", "fire", "set_ai", "reset"}, set(g.tools()))
            g.call("pause", {"paused": True})  # the AI plays in real time until paused
            g.call("reset")
            state = g.call("describe")
            self.assertTrue(state.pop("paused"))
            self.assertEqual({
                "ok": True, "arena": {"width": 40, "depth": 30}, "walls": WALLS,
                "tanks": {"player": {"x": -15, "z": 0, "heading": 0, "health": 100, "shots": 0},
                          "computer": {"x": 15, "z": 0, "heading": 180, "health": 100, "shots": 0}},
                "shells": [], "score": {"player": 0, "computer": 0}, "round": 1, "state": "playing", "ai": True,
            }, state)
            self.assertEqual([], g.errors)


if __name__ == "__main__":
    unittest.main()

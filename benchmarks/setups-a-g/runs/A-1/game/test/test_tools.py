"""All seven WebMCP tools are listed and answer as the spec says, and bad input never throws."""
import unittest

from helpers import game, quiet

WALLS = [{"x": x, "z": z, "width": 2, "depth": 6} for x, z in [(-8, -8), (-8, 8), (8, -8), (8, 8)]]
START = {
    "ok": True, "arena": {"width": 40, "depth": 30}, "walls": WALLS,
    "tanks": {"player": {"x": -15, "z": 0, "heading": 0, "health": 100, "shots": 0},
              "computer": {"x": 15, "z": 0, "heading": 180, "health": 100, "shots": 0}},
    "shells": [], "score": {"player": 0, "computer": 0}, "round": 1, "state": "playing", "paused": True, "ai": False,
}


class ToolsTest(unittest.TestCase):
    def test_all_seven_tools_are_listed(self):
        with game() as g:
            self.assertEqual(["describe", "fire", "pause", "place", "reset", "set_ai", "step"], g.tools())

    def test_describe_reads_the_start_state(self):
        with game() as g:
            self.assertEqual(START, quiet(g))
            self.assertEqual(START, g.call("describe"))

    def test_pause_and_set_ai_answer_with_their_setting(self):
        with game() as g:
            self.assertEqual({"ok": True, "paused": True}, g.call("pause", {"paused": True}))
            self.assertEqual({"ok": True, "paused": False}, g.call("pause", {"paused": False}))
            self.assertEqual({"ok": True, "ai": False}, g.call("set_ai", {"enabled": False}))

    def test_place_moves_a_tank_and_wraps_the_heading(self):
        with game() as g:
            quiet(g)
            state = g.call("place", {"tank": "computer", "x": 0, "z": 0, "heading": -90})
            self.assertEqual({"x": 0, "z": 0, "heading": 270, "health": 100, "shots": 0}, state["tanks"]["computer"])

    def test_place_refuses_walls_the_other_tank_and_the_outside(self):
        with game() as g:
            quiet(g)
            for x, z in [(-8, 8), (-8, 5), (15, 0), (30, 0), (0, 14.5), (-19.5, 0)]:
                answer = g.call("place", {"tank": "player", "x": x, "z": z, "heading": 0})
                self.assertFalse(answer["ok"], (x, z))
                self.assertIn("error", answer)
            self.assertEqual(-15, g.call("describe")["tanks"]["player"]["x"])
            self.assertTrue(g.call("place", {"tank": "player", "x": -8, "z": 0, "heading": 0})["ok"])

    def test_bad_input_answers_an_error_and_never_throws(self):
        with game() as g:
            quiet(g)
            bad = [("place", {"tank": "enemy", "x": 0, "z": 0, "heading": 0}), ("place", {"tank": "player", "x": "0", "z": 0, "heading": 0}),
                   ("place", {}), ("fire", {}), ("fire", {"tank": 3}), ("pause", {"paused": "yes"}), ("set_ai", {}),
                   ("step", {"seconds": 0}), ("step", {"seconds": 31}), ("step", {"seconds": "1"}), ("step", {})]
            for name, payload in bad:
                answer = g.call(name, payload)
                self.assertFalse(answer["ok"], (name, payload))
                self.assertIsInstance(answer["error"], str)
            g.call("pause", {"paused": False})
            self.assertFalse(g.call("step", {"seconds": 1})["ok"])
            self.assertEqual([], g.errors)

    def test_step_advances_exactly_the_seconds_given(self):
        with game() as g:
            quiet(g)
            g.call("fire", {"tank": "player"})
            g.call("step", {"seconds": 1})
            self.assertAlmostEqual(-13.4 + 15, g.call("describe")["shells"][0]["x"], places=3)


if __name__ == "__main__":
    unittest.main()

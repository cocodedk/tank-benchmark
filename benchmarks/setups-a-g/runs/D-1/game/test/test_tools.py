"""The seven WebMCP tools list, answer in the documented shapes and refuse bad input without throwing."""
import unittest

from helpers import GameCase

TOOLS = ["describe", "fire", "pause", "place", "reset", "set_ai", "step"]


class ToolsTest(GameCase):
    def test_all_seven_tools_are_listed(self):
        self.assertEqual(TOOLS, sorted(self.g.tools()))

    def test_describe_answers_the_state(self):
        s = self.call("describe")
        self.assertEqual({"width": 40, "depth": 30}, s["arena"])
        self.assertEqual([(-8, -8), (-8, 8), (8, -8), (8, 8)], [(w["x"], w["z"]) for w in s["walls"]])
        self.assertTrue(all((w["width"], w["depth"]) == (2, 6) for w in s["walls"]))
        self.assertEqual({"x": -15, "z": 0, "heading": 0, "health": 100, "shots": 0}, s["tanks"]["player"])
        self.assertEqual({"x": 15, "z": 0, "heading": 180, "health": 100, "shots": 0}, s["tanks"]["computer"])
        self.assertEqual(([], {"player": 0, "computer": 0}, 1, "playing"), (s["shells"], s["score"], s["round"], s["state"]))
        self.assertEqual((True, False), (s["paused"], s["ai"]))

    def test_simple_answers(self):
        self.assertEqual({"ok": True, "paused": False}, self.call("pause", {"paused": False}))
        self.assertEqual({"ok": True, "paused": True}, self.call("pause", {"paused": True}))
        self.assertEqual({"ok": True, "ai": True}, self.call("set_ai", {"enabled": True}))
        self.assertEqual({"ok": True, "fired": True}, self.call("fire", {"tank": "player"}))
        self.assertEqual({"ok": True, "fired": False}, self.call("fire", {"tank": "player"}))

    def test_bad_input_answers_ok_false_with_an_error(self):
        bad = [
            ("pause", {}), ("pause", {"paused": "yes"}), ("set_ai", {}), ("fire", {}), ("fire", {"tank": "ghost"}),
            ("step", {}), ("step", {"seconds": 0}), ("step", {"seconds": 31}), ("step", {"seconds": "1"}),
            ("place", {}), ("place", {"tank": "ghost", "x": 0, "z": 0, "heading": 0}),
            ("place", {"tank": "player", "x": "0", "z": 0, "heading": 0}),
            ("place", {"tank": "player", "x": -8, "z": -8, "heading": 0}),    # inside a wall
            ("place", {"tank": "player", "x": 19.5, "z": 0, "heading": 0}),   # too near the outer wall
            ("place", {"tank": "player", "x": 15, "z": 0, "heading": 0}),     # on the other tank
        ]
        for name, payload in bad:
            answer = self.call(name, payload)
            self.assertFalse(answer["ok"], (name, payload))
            self.assertIsInstance(answer["error"], str)

    def test_step_refuses_while_running(self):
        self.call("pause", {"paused": False})
        self.assertFalse(self.step(1)["ok"])

    def test_place_moves_a_tank_and_wraps_the_heading(self):
        t = self.place("player", 0, 0, -90)["tanks"]["player"]
        self.assertEqual((0, 0, 270), (t["x"], t["z"], t["heading"]))
        self.place("computer", 18.8, 0, 360)  # touching the outer wall is allowed

    def test_reset_keeps_pause_and_ai(self):
        self.place("player", 0, 0, 90)
        self.call("fire", {"tank": "player"})
        s = self.call("reset")
        self.assertEqual((-15, 0, 0, []), (s["tanks"]["player"]["x"], s["tanks"]["player"]["z"], s["tanks"]["player"]["shots"], s["shells"]))
        self.assertEqual((True, False), (s["paused"], s["ai"]))


if __name__ == "__main__":
    unittest.main()

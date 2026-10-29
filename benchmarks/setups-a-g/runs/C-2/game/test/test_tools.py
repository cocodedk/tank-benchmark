"""Each tool answers as specified, bad input included."""
import unittest

from base import GameCase


class ToolsTest(GameCase):
    def assertRefused(self, out):
        self.assertIs(False, out["ok"], out)
        self.assertIsInstance(out["error"], str)

    def test_pause_and_set_ai_answer_and_refuse_non_bool(self):
        self.assertEqual({"ok": True, "paused": False}, self.call("pause", {"paused": False}))
        self.assertEqual({"ok": True, "paused": True}, self.call("pause", {"paused": True}))
        self.assertEqual({"ok": True, "ai": True}, self.call("set_ai", {"enabled": True}))
        self.assertEqual({"ok": True, "ai": False}, self.call("set_ai", {"enabled": False}))
        for tool, key in (("pause", "paused"), ("set_ai", "enabled")):
            self.assertRefused(self.call(tool, {key: "yes"}))
            self.assertRefused(self.call(tool, {}))
        self.assertTrue(self.state()["paused"])

    def test_step_refuses_bad_seconds_and_running_game(self):
        for bad in (0, 31, "x", -1):
            self.assertRefused(self.call("step", {"seconds": bad}))
        self.assertRefused(self.call("step", {}))
        out = self.call("step", {"seconds": 1})
        self.assertTrue(out["ok"])
        self.assertIn("tanks", out)
        self.call("pause", {"paused": False})
        self.assertRefused(self.call("step", {"seconds": 1}))

    def test_place_moves_a_tank_and_refuses_bad_spots(self):
        out = self.call("place", {"tank": "player", "x": 0, "z": 10, "heading": 90})
        self.assertEqual({"x": 0, "z": 10, "heading": 90}, {k: out["tanks"]["player"][k] for k in ("x", "z", "heading")})
        before = self.state()
        for bad in ({"tank": "bogus", "x": 0, "z": 0}, {"tank": "player", "x": -8, "z": 8},
                    {"tank": "player", "x": 14, "z": 0}, {"tank": "player", "x": 25, "z": 0},
                    {"tank": "player", "x": 0, "z": -20}, {"tank": "player", "x": "a", "z": 0}):
            self.assertRefused(self.call("place", bad))
        self.assertEqual(before, self.state())

    def test_fire_answers_and_refuses_bad_tank(self):
        self.assertRefused(self.call("fire", {"tank": "bogus"}))
        self.assertRefused(self.call("fire", {}))
        self.assertEqual({"ok": True, "fired": True}, self.call("fire", {"tank": "computer"}))
        s = self.state()
        self.assertEqual(1, s["tanks"]["computer"]["shots"])
        self.assertEqual("computer", s["shells"][0]["owner"])


if __name__ == "__main__":
    unittest.main()

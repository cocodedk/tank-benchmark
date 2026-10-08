"""Tool list, answer shapes, bad input, reset."""
import unittest

from base import GameCase

TANK_KEYS = {"x", "z", "heading", "health", "shots"}


class ToolsTest(GameCase):
    def test_exactly_seven_tools_and_clean_page(self):
        self.assertEqual({"describe", "pause", "step", "place", "fire", "set_ai", "reset"}, set(self.g.tools()))
        self.assertEqual(7, len(self.g.tools()))
        self.assertEqual([], self.g.errors)

    def test_describe_is_the_start_state(self):
        s = self.g.call("describe")
        self.assertTrue(s["ok"])
        self.assertEqual({"width": 40, "depth": 30}, s["arena"])
        got = sorted((w["x"], w["z"], w["width"], w["depth"]) for w in s["walls"])
        self.assertEqual([(-8, -8, 2, 6), (-8, 8, 2, 6), (8, -8, 2, 6), (8, 8, 2, 6)], got)
        for who, x, h in (("player", -15, 0), ("computer", 15, 180)):
            t = s["tanks"][who]
            self.assertEqual(TANK_KEYS, set(t))
            self.assertEqual((x, 0, h, 100, 0), (t["x"], t["z"], t["heading"], t["health"], t["shots"]))
        self.assertEqual([], s["shells"])
        self.assertEqual({"player": 0, "computer": 0}, s["score"])
        self.assertEqual((1, "playing", True, False), (s["round"], s["state"], s["paused"], s["ai"]))

    def test_simple_answers(self):
        self.assertEqual({"ok": True, "paused": True}, self.g.call("pause", {"paused": True}))
        self.assertEqual({"ok": True, "ai": False}, self.g.call("set_ai", {"enabled": False}))
        self.assertEqual({"ok": True, "ai": True}, self.g.call("set_ai", {"enabled": True}))
        self.g.call("set_ai", {"enabled": False})
        self.assertEqual({"ok": True, "fired": True}, self.fire())
        self.assertEqual({"ok": True, "fired": False}, self.fire())

    def test_state_answers_share_describe_shape(self):
        keys = set(self.g.call("describe"))
        for s in (self.step(0.1), self.place("player", -10, 0), self.g.call("reset")):
            self.assertTrue(s["ok"])
            self.assertEqual(keys, set(s))

    def test_bad_input(self):
        bad = [("step", {"seconds": 0}), ("step", {"seconds": 31}), ("step", {"seconds": "x"}),
               ("place", {"tank": "player", "x": -8, "z": -8}),
               ("place", {"tank": "player", "x": 14, "z": 0}),
               ("place", {"tank": "player", "x": 25, "z": 0}),
               ("place", {"tank": "bob", "x": 0, "z": 0})]
        for name, p in bad:
            r = self.g.call(name, p)
            self.assertFalse(r["ok"], (name, p))
            self.assertIsInstance(r["error"], str)
        self.g.call("pause", {"paused": False})
        r = self.g.call("step", {"seconds": 1})
        self.assertFalse(r["ok"])
        self.assertIsInstance(r["error"], str)

    def test_reset_restores_and_keeps_pause_and_ai(self):
        self.g.call("set_ai", {"enabled": True})
        self.place("player", -10, 5, 90)
        self.fire()
        self.step(0.2)
        s = self.g.call("reset")
        self.assertEqual((1, True, True), (s["round"], s["paused"], s["ai"]))
        self.assertEqual({"player": 0, "computer": 0}, s["score"])
        self.assertEqual([], s["shells"])
        self.assertEqual((-15, 0, 0, 0), tuple(s["tanks"]["player"][k] for k in ("x", "z", "heading", "shots")))
        self.assertEqual((15, 0, 180), tuple(s["tanks"]["computer"][k] for k in ("x", "z", "heading")))


if __name__ == "__main__":
    unittest.main()

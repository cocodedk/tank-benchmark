"""The seven WebMCP tools: listing, state shape, refusals, reset."""
import contextlib
import unittest

from page import game

TOOLS = {"describe", "pause", "step", "place", "fire", "set_ai", "reset"}


class ToolsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.stack = contextlib.ExitStack()
        cls.g = cls.stack.enter_context(game())

    @classmethod
    def tearDownClass(cls):
        cls.stack.close()

    def setUp(self):
        self.g.call("pause", {"paused": True})
        self.g.call("set_ai", {"enabled": False})
        self.g.call("reset", {})

    def refused(self, name, payload):
        out = self.g.call(name, payload)
        self.assertIs(out.get("ok"), False, (name, payload, out))
        self.assertIsInstance(out.get("error"), str)

    def test_all_seven_tools_listed(self):
        self.assertTrue(TOOLS <= set(self.g.tools()), self.g.tools())

    def test_no_console_errors(self):
        self.assertEqual([], self.g.errors)

    def test_describe_after_reset(self):
        s = self.g.call("describe", {})
        self.assertIs(s["ok"], True)
        self.assertEqual({"width": 40, "depth": 30}, s["arena"])
        self.assertEqual(4, len(s["walls"]))
        self.assertEqual({(-8, -8), (-8, 8), (8, -8), (8, 8)}, {(w["x"], w["z"]) for w in s["walls"]})
        for w in s["walls"]:
            self.assertEqual((2, 6), (w["width"], w["depth"]))
        p, c = s["tanks"]["player"], s["tanks"]["computer"]
        self.assertEqual((-15, 0, 0, 100, 0), (p["x"], p["z"], p["heading"], p["health"], p["shots"]))
        self.assertEqual((15, 0, 180, 100, 0), (c["x"], c["z"], c["heading"], c["health"], c["shots"]))
        self.assertEqual([], s["shells"])
        self.assertEqual({"player": 0, "computer": 0}, s["score"])
        self.assertEqual((1, "playing", True, False), (s["round"], s["state"], s["paused"], s["ai"]))

    def test_pause_and_set_ai_answer(self):
        self.assertEqual({"ok": True, "paused": False}, self.g.call("pause", {"paused": False}))
        self.assertEqual({"ok": True, "paused": True}, self.g.call("pause", {"paused": True}))
        self.assertEqual({"ok": True, "ai": True}, self.g.call("set_ai", {"enabled": True}))
        self.assertEqual({"ok": True, "ai": False}, self.g.call("set_ai", {"enabled": False}))

    def test_step_refused_when_not_paused(self):
        self.g.call("pause", {"paused": False})
        try:
            self.refused("step", {"seconds": 1})
        finally:
            self.g.call("pause", {"paused": True})

    def test_step_refused_for_bad_seconds(self):
        for bad in (0, -1, 31, "x"):
            with self.subTest(seconds=bad):
                self.refused("step", {"seconds": bad})

    def test_place_refusals(self):
        cases = [
            {"tank": "player", "x": 8, "z": 8, "heading": 0},
            {"tank": "player", "x": 14, "z": 0, "heading": 0},
            {"tank": "player", "x": 25, "z": 0, "heading": 0},
            {"tank": "banana", "x": 0, "z": 0, "heading": 0},
        ]
        for payload in cases:
            with self.subTest(payload=payload):
                self.refused("place", payload)
        p = self.g.call("describe", {})["tanks"]["player"]
        self.assertEqual((-15, 0), (p["x"], p["z"]))

    def test_place_accepts_valid_spot(self):
        s = self.g.call("place", {"tank": "computer", "x": 5, "z": 4, "heading": 90})
        self.assertIs(s["ok"], True)
        for state in (s, self.g.call("describe", {})):
            c = state["tanks"]["computer"]
            self.assertAlmostEqual(5, c["x"], delta=0.01)
            self.assertAlmostEqual(4, c["z"], delta=0.01)
            self.assertAlmostEqual(90, c["heading"], delta=0.01)

    def test_fire_unknown_tank(self):
        self.refused("fire", {"tank": "banana"})

    def test_reset_restores_start(self):
        self.g.call("place", {"tank": "player", "x": 0, "z": 0, "heading": 90})
        self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
        self.g.call("step", {"seconds": 0.2})
        s = self.g.call("reset", {})
        self.assertEqual((1, "playing", True, False), (s["round"], s["state"], s["paused"], s["ai"]))
        self.assertEqual({"player": 0, "computer": 0}, s["score"])
        self.assertEqual([], s["shells"])
        p = s["tanks"]["player"]
        self.assertEqual((-15, 0, 0, 100, 0), (p["x"], p["z"], p["heading"], p["health"], p["shots"]))


if __name__ == "__main__":
    unittest.main()

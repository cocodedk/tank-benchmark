"""The page's seven WebMCP tools answer as specified: shape, bad input, placement, reset."""
import unittest

from page import game

START = {
    "ok": True,
    "arena": {"width": 40, "depth": 30},
    "walls": [
        {"x": -8, "z": -8, "width": 2, "depth": 6},
        {"x": -8, "z": 8, "width": 2, "depth": 6},
        {"x": 8, "z": -8, "width": 2, "depth": 6},
        {"x": 8, "z": 8, "width": 2, "depth": 6},
    ],
    "tanks": {
        "player": {"x": -15, "z": 0, "heading": 0, "health": 100, "shots": 0},
        "computer": {"x": 15, "z": 0, "heading": 180, "health": 100, "shots": 0},
    },
    "shells": [],
    "score": {"player": 0, "computer": 0},
    "round": 1,
    "state": "playing",
    "paused": True,
    "ai": False,
}


class ToolsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._ctx = game()
        cls.g = cls._ctx.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls._ctx.__exit__(None, None, None)

    def setUp(self):
        self.g.call("pause", {"paused": True})
        self.g.call("set_ai", {"enabled": False})
        self.g.call("reset", {})

    def refused(self, name, payload):
        with self.subTest(name=name, payload=payload):
            r = self.g.call(name, payload)
            self.assertIs(r.get("ok"), False, r)
            self.assertIsInstance(r.get("error"), str, r)

    def test_seven_tools_are_listed_page_is_clean_and_hud_shows_both_tanks(self):
        self.assertEqual(
            sorted(self.g.tools()),
            sorted(["describe", "pause", "step", "place", "fire", "set_ai", "reset"]),
        )
        self.assertEqual([], self.g.errors)
        canvas = self.g.page.locator("canvas").first
        self.assertTrue(canvas.is_visible())
        box = canvas.bounding_box()
        self.assertEqual((1280, 800), (box["width"], box["height"]))
        hud = self.g.page.inner_text("#hud")
        self.assertIn("You", hud)
        self.assertIn("Computer", hud)

    def test_describe_after_reset_equals_the_start_state(self):
        self.assertEqual(START, self.g.call("describe"))

    def test_pause_and_set_ai_answer_their_flags(self):
        self.assertEqual({"ok": True, "paused": True}, self.g.call("pause", {"paused": True}))
        self.assertEqual({"ok": True, "paused": False}, self.g.call("pause", {"paused": False}))
        self.assertEqual({"ok": True, "ai": True}, self.g.call("set_ai", {"enabled": True}))
        self.assertEqual({"ok": True, "ai": False}, self.g.call("set_ai", {"enabled": False}))

    def test_bad_inputs_answer_ok_false_with_an_error(self):
        for seconds in (0, -1, 31, "x"):
            self.refused("step", {"seconds": seconds})
        self.refused("place", {"tank": "bob", "x": 0, "z": 0, "heading": 0})
        self.refused("place", {"tank": "player", "x": -8, "z": 8, "heading": 0})  # inside a wall
        self.refused("place", {"tank": "player", "x": 14, "z": 0, "heading": 0})  # on the computer
        self.refused("place", {"tank": "player", "x": 25, "z": 0, "heading": 0})  # outside the arena
        self.refused("place", {"tank": "player", "x": 19.5, "z": 0, "heading": 0})  # touches outer wall
        self.refused("fire", {"tank": "bob"})
        self.refused("pause", {"paused": "yes"})
        self.refused("set_ai", {"enabled": 1})
        self.g.call("pause", {"paused": False})
        self.refused("step", {"seconds": 1.5})  # step only while paused
        self.g.call("pause", {"paused": True})

    def test_place_sets_the_pose_and_wraps_heading(self):
        def pose(heading):
            r = self.g.call("place", {"tank": "player", "x": 0, "z": 0, "heading": heading})
            return {k: r["tanks"]["player"][k] for k in ("x", "z", "heading")}

        self.assertEqual({"x": 0, "z": 0, "heading": 90}, pose(90))
        self.assertEqual({"x": 0, "z": 0, "heading": 90}, pose(450))
        self.assertEqual({"x": 0, "z": 0, "heading": 270}, pose(-90))

    def test_reset_after_step_and_fire_restores_everything(self):
        self.g.call("place", {"tank": "player", "x": 0, "z": 0, "heading": 90})
        fired = self.g.call("fire", {"tank": "player"})
        self.assertIs(fired["ok"], True)
        self.assertIsInstance(fired["fired"], bool)
        before = self.g.call("step", {"seconds": 1.5})
        self.assertNotEqual(START, before)
        after = self.g.call("reset", {})
        self.assertEqual(START, after)
        self.assertTrue(after["paused"])
        self.assertFalse(after["ai"])


if __name__ == "__main__":
    unittest.main()

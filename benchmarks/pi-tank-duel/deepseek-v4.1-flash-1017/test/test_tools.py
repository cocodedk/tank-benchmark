"""The page, its HUD, and every WebMCP tool with valid and hostile input."""
import unittest

from page import game
from helpers import fresh, held, place, step, tank


class ToolsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._context = game()
        cls.g = cls._context.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls._context.__exit__(None, None, None)

    def setUp(self):
        fresh(self.g)

    def test_lists_all_seven_tools(self):
        self.assertEqual(
            {"describe", "pause", "step", "place", "fire", "set_ai", "reset"},
            set(self.g.tools()),
        )

    def test_page_has_canvas_hud_and_no_errors(self):
        self.assertTrue(self.g.page.evaluate(
            "() => { const c = document.querySelector('canvas');"
            " return c && c.width > 0 && c.height > 0; }"
        ))
        health = self.g.page.evaluate(
            "() => [...document.querySelectorAll('.bar')].length"
        )
        self.assertEqual(2, health)
        text = self.g.page.evaluate("() => document.body.innerText")
        for label in ("You", "Computer", "Round", "forward", "Space fire"):
            self.assertIn(label, text)
        self.assertEqual([], self.g.errors)

    def test_canvas_follows_the_window_size(self):
        try:
            self.g.page.set_viewport_size({"width": 820, "height": 610})
            self.g.page.wait_for_timeout(100)
            size = self.g.page.evaluate(
                "() => { const c = document.querySelector('canvas');"
                " return [c.clientWidth, c.clientHeight, innerWidth, innerHeight]; }"
            )
            self.assertEqual([820, 610, 820, 610], size)
        finally:
            self.g.page.set_viewport_size({"width": 1280, "height": 800})

    def test_describe_reports_the_spec_state(self):
        state = self.g.call("describe")
        self.assertTrue(state["ok"])
        self.assertEqual({"width": 40, "depth": 30}, state["arena"])
        self.assertEqual(
            [{"x": -8, "z": -8, "width": 2, "depth": 6},
             {"x": -8, "z": 8, "width": 2, "depth": 6},
             {"x": 8, "z": -8, "width": 2, "depth": 6},
             {"x": 8, "z": 8, "width": 2, "depth": 6}],
            state["walls"],
        )
        self.assertEqual({"x": -15, "z": 0, "heading": 0, "health": 100, "shots": 0},
                         state["tanks"]["player"])
        self.assertEqual({"x": 15, "z": 0, "heading": 180, "health": 100, "shots": 0},
                         state["tanks"]["computer"])
        self.assertEqual([], state["shells"])
        self.assertEqual({"player": 0, "computer": 0}, state["score"])
        self.assertEqual(1, state["round"])
        self.assertEqual("playing", state["state"])
        self.assertTrue(state["paused"])
        self.assertFalse(state["ai"])

    def test_pause_and_ai_survive_reset(self):
        self.assertEqual({"ok": True, "paused": False}, self.g.call("pause", {"paused": False}))
        self.assertEqual({"ok": True, "ai": True}, self.g.call("set_ai", {"enabled": True}))
        state = self.g.call("reset")
        self.assertFalse(state["paused"])
        self.assertTrue(state["ai"])
        self.assertEqual({"ok": True, "paused": True}, self.g.call("pause", {"paused": True}))

    def test_step_only_works_while_paused_and_validates_seconds(self):
        self.g.call("pause", {"paused": False})
        answer = self.g.call("step", {"seconds": 1})
        self.assertFalse(answer["ok"])
        self.g.call("pause", {"paused": True})
        for seconds in (0, -1, 30.01, 31):
            self.assertFalse(self.g.call("step", {"seconds": seconds})["ok"])
        self.assertFalse(self.g.call("step", {"seconds": "1"})["ok"])
        before = tank(self.g.call("describe"))
        with held(self.g.page, "w"):
            after = step(self.g, 1)
        self.assertEqual(6, round(after["tanks"]["player"]["x"] - before["x"], 6))

    def test_place_accepts_legal_spots_and_refuses_illegal_ones(self):
        state = place(self.g, "player", 0, 0, 90)
        self.assertEqual({"x": 0, "z": 0, "heading": 90, "health": 100, "shots": 0},
                         state["tanks"]["player"])

        for name, x, z, heading in (
            ("player", 21, 0, 0),          # outside
            ("player", 0, 16, 0),          # outside
            ("player", -8, -8, 0),         # centre of a wall
            ("player", -8, -6, 0),         # touching a wall
            ("player", 15, 0, 0),          # on the other tank
            ("nobody", 0, 0, 0),           # unknown tank
        ):
            answer = self.g.call("place", {"tank": name, "x": x, "z": z, "heading": heading})
            self.assertFalse(answer["ok"], (name, x, z, heading))
            self.assertIn("error", answer)

        missing = self.g.call("place", {"tank": "player", "x": 0, "z": 0})
        self.assertFalse(missing["ok"])
        bad = self.g.call("place", {"tank": "player", "x": "0", "z": 0, "heading": 0})
        self.assertFalse(bad["ok"])

    def test_place_normalises_heading(self):
        self.assertEqual(90, place(self.g, "player", 0, 0, 450)["tanks"]["player"]["heading"])
        self.assertEqual(270, place(self.g, "player", 0, 0, -90)["tanks"]["player"]["heading"])

    def test_bad_input_returns_an_error_and_never_throws(self):
        cases = [
            ("pause", {}),
            ("pause", {"paused": "yes"}),
            ("step", {}),
            ("step", {"seconds": None}),
            ("place", {}),
            ("place", []),
            ("fire", {}),
            ("fire", {"tank": "green"}),
            ("set_ai", {}),
            ("set_ai", {"enabled": 1}),
        ]
        for name, payload in cases:
            answer = self.g.call(name, payload)
            self.assertFalse(answer["ok"], (name, payload))
            self.assertIn("error", answer)
        self.assertEqual([], self.g.errors)


if __name__ == "__main__":
    unittest.main()

"""The seven tools exist and answer bad input without throwing."""
from base import PageTest


class ToolsTest(PageTest):
    def test_all_seven_tools_are_listed(self):
        tools = set(self.g.tools())
        self.assertLessEqual(
            {"describe", "pause", "step", "place", "fire", "set_ai", "reset"}, tools,
        )

    def test_state_has_the_documented_shape(self):
        state = self.g.call("describe")
        self.assertTrue(state["ok"])
        self.assertEqual({"width": 40, "depth": 30}, state["arena"])
        self.assertEqual(4, len(state["walls"]))
        self.assertEqual({"player", "computer"}, set(state["tanks"]))
        self.assertEqual(100, state["tanks"]["player"]["health"])
        self.assertEqual(-15, state["tanks"]["player"]["x"])
        self.assertEqual(15, state["tanks"]["computer"]["x"])
        self.assertEqual(0, state["tanks"]["player"]["heading"])
        self.assertEqual(180, state["tanks"]["computer"]["heading"])
        self.assertEqual({"player": 0, "computer": 0}, state["score"])
        self.assertEqual(1, state["round"])
        self.assertEqual("playing", state["state"])
        self.assertEqual([], state["shells"])
        self.assertTrue(state["paused"])
        self.assertFalse(state["ai"])

    def test_the_hud_is_on_the_page(self):
        page = self.g.page
        self.assertIn("You", page.locator(".panel.you").text_content())
        self.assertIn("Computer", page.locator(".panel.computer").text_content())
        self.assertEqual("0 : 0", page.locator("#score").text_content())
        self.assertIn("Round 1", page.locator("#round").text_content())
        self.assertIn("Space", page.locator(".controls").text_content())

    def test_bad_input_is_a_refusal_not_an_error(self):
        cases = [
            ("pause", {"paused": "yes"}),
            ("step", {"seconds": 0}),
            ("step", {"seconds": 31}),
            ("step", {"seconds": "a"}),
            ("place", {"tank": "nobody", "x": 0, "z": 0, "heading": 0}),
            ("place", {"tank": "player", "x": "0", "z": 0, "heading": 0}),
            ("place", {"tank": "player", "x": -8, "z": -8, "heading": 0}),
            ("place", {"tank": "player", "x": 50, "z": 0, "heading": 0}),
            ("place", {"tank": "player", "x": 15, "z": 0, "heading": 0}),
            ("fire", {"tank": "nobody"}),
            ("set_ai", {"enabled": 1}),
        ]
        for name, payload in cases:
            answer = self.g.call(name, payload)
            self.assertFalse(answer["ok"], f"{name} {payload}")
            self.assertIn("error", answer)
        self.assertEqual([], self.g.errors)

    def test_pause_ai_and_reset_stay_put(self):
        self.assertEqual({"ok": True, "paused": False}, self.g.call("pause", {"paused": False}))
        self.assertEqual({"ok": True, "ai": True}, self.g.call("set_ai", {"enabled": True}))
        self.g.call("fire", {"tank": "player"})
        state = self.g.call("reset", {})
        self.assertEqual(1, state["round"])
        self.assertEqual({"player": 0, "computer": 0}, state["score"])
        self.assertEqual([], state["shells"])
        self.assertFalse(state["paused"])
        self.assertTrue(state["ai"])

    def test_step_only_works_while_paused(self):
        self.g.call("pause", {"paused": False})
        answer = self.g.call("step", {"seconds": 0.5})
        self.assertFalse(answer["ok"])


if __name__ == "__main__":
    import unittest
    unittest.main()

"""The page shows the game cleanly and its seven tools answer as specified."""
import unittest

from base import GameCase

TOOLS = ["describe", "fire", "pause", "place", "reset", "set_ai", "step"]


class PageTest(GameCase):
    def test_page_shows_arena_tanks_and_hud_without_errors(self):
        page = self.g.page
        self.assertEqual([1280, 800], page.evaluate("[document.querySelector('canvas').clientWidth, "
                                                    "document.querySelector('canvas').clientHeight]"))
        page.set_viewport_size({"width": 900, "height": 600})
        page.wait_for_function("document.querySelector('canvas').clientWidth === 900")
        page.set_viewport_size({"width": 1280, "height": 800})
        hud = page.inner_text("#hud") + page.inner_text("#controls")
        for text in ["You", "Computer", "0 : 0", "Round 1", "Space"]:
            self.assertIn(text, hud)
        self.assertEqual([], self.g.errors)

    def test_all_seven_tools_are_listed(self):
        self.assertEqual(TOOLS, sorted(self.g.tools()))

    def test_describe_and_reset_answer_the_start_state(self):
        self.place("player", 0, 0, 90)
        state = self.call("reset")
        self.assertEqual(state, self.call("describe"))
        self.assertEqual({"width": 40, "depth": 30}, state["arena"])
        self.assertEqual([{"x": -8, "z": -8, "width": 2, "depth": 6}, {"x": -8, "z": 8, "width": 2, "depth": 6},
                          {"x": 8, "z": -8, "width": 2, "depth": 6}, {"x": 8, "z": 8, "width": 2, "depth": 6}],
                         state["walls"])
        self.assertEqual({"player": {"x": -15, "z": 0, "heading": 0, "health": 100, "shots": 0},
                          "computer": {"x": 15, "z": 0, "heading": 180, "health": 100, "shots": 0}}, state["tanks"])
        self.assertEqual(([], {"player": 0, "computer": 0}, 1, "playing", True, False),
                         (state["shells"], state["score"], state["round"], state["state"], state["paused"],
                          state["ai"]))

    def test_pause_set_ai_and_fire_answer_their_shapes(self):
        self.assertEqual({"ok": True, "paused": False}, self.call("pause", {"paused": False}))
        self.assertEqual({"ok": True, "paused": True}, self.call("pause", {"paused": True}))
        self.assertEqual({"ok": True, "ai": True}, self.call("set_ai", {"enabled": True}))
        self.assertEqual({"ok": True, "ai": False}, self.call("set_ai", {"enabled": False}))
        self.assertEqual({"ok": True, "fired": True}, self.call("fire", {"tank": "computer"}))

    def test_place_moves_a_tank_and_normalises_heading(self):
        state = self.call("place", {"tank": "computer", "x": 0, "z": 5, "heading": -90})
        self.assertEqual({"x": 0, "z": 5, "heading": 270, "health": 100, "shots": 0}, state["tanks"]["computer"])

    def test_bad_inputs_answer_ok_false(self):
        bad = [("pause", {}), ("pause", {"paused": "yes"}), ("set_ai", {"enabled": 1}), ("fire", {"tank": "blue"}),
               ("step", {"seconds": 0}), ("step", {"seconds": 31}), ("step", {"seconds": "1"}),
               ("place", {"tank": "player", "x": -8, "z": 8, "heading": 0}),     # inside a wall
               ("place", {"tank": "player", "x": 14, "z": 0, "heading": 0}),     # on the computer
               ("place", {"tank": "player", "x": 25, "z": 0, "heading": 0}),     # outside the arena
               ("place", {"tank": "player", "x": 19.5, "z": 0, "heading": 0}),   # into the outer wall
               ("place", {"tank": "tank", "x": 0, "z": 0, "heading": 0}),
               ("place", {"tank": "player", "x": "0", "z": 0, "heading": 0})]
        for name, payload in bad:
            answer = self.call(name, payload)
            self.assertIs(False, answer["ok"], (name, payload))
            self.assertIsInstance(answer["error"], str)
        self.call("pause", {"paused": False})
        self.assertIs(False, self.call("step", {"seconds": 1})["ok"])
        self.assertEqual([], self.g.errors)


if __name__ == "__main__":
    unittest.main()

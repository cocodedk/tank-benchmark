"""The seven WebMCP tools: listing, answers, refusals."""
import unittest

from common import fresh, place, state, tank
from page import game

TOOLS = ["describe", "fire", "pause", "place", "reset", "set_ai", "step"]
WALLS = [{"x": x, "z": z, "width": 2, "depth": 6} for x, z in [(-8, -8), (-8, 8), (8, -8), (8, 8)]]


class ToolsTest(unittest.TestCase):
    def test_all_seven_tools_are_listed_and_describe_gives_the_start_state(self):
        with game() as g:
            self.assertEqual(TOOLS, sorted(g.tools()))
            self.assertEqual({"ok": True, "paused": True}, g.call("pause", {"paused": True}))
            self.assertEqual({"ok": True, "ai": True}, g.call("set_ai", {"enabled": True}))
            self.assertEqual({
                "ok": True, "arena": {"width": 40, "depth": 30}, "walls": WALLS,
                "tanks": {"player": {"x": -15, "z": 0, "heading": 0, "health": 100, "shots": 0},
                          "computer": {"x": 15, "z": 0, "heading": 180, "health": 100, "shots": 0}},
                "shells": [], "score": {"player": 0, "computer": 0}, "round": 1, "state": "playing",
                "paused": True, "ai": True,
            }, g.call("reset"))
            self.assertEqual([], g.errors)

    def test_bad_input_answers_an_error_and_never_throws(self):
        with game() as g:
            fresh(g)
            bad = [
                ("step", {"seconds": 0}), ("step", {"seconds": 31}), ("step", {"seconds": "1"}), ("step", {}),
                ("place", {"tank": "ghost", "x": 0, "z": 0, "heading": 0}),
                ("place", {"tank": "player", "x": "a", "z": 0, "heading": 0}),
                ("place", {"tank": "player", "x": -8, "z": 8, "heading": 0}),      # inside a wall
                ("place", {"tank": "player", "x": 14, "z": 0, "heading": 0}),      # on the computer
                ("place", {"tank": "player", "x": 19.5, "z": 0, "heading": 0}),    # through the outer wall
                ("fire", {"tank": "ghost"}), ("fire", {}), ("set_ai", {"enabled": "yes"}), ("pause", {}),
            ]
            for name, payload in bad:
                answer = g.call(name, payload)
                self.assertIs(False, answer["ok"], (name, payload))
                self.assertIsInstance(answer["error"], str)
            g.call("pause", {"paused": False})
            self.assertIs(False, g.call("step", {"seconds": 1})["ok"])
            self.assertEqual([], g.errors)

    def test_place_moves_a_tank_and_normalises_the_heading(self):
        with game() as g:
            fresh(g)
            self.assertEqual(270, place(g, "player", 0, 0, -90)["tanks"]["player"]["heading"])
            self.assertEqual(90, place(g, "player", 0, 0, 450)["tanks"]["player"]["heading"])
            self.assertEqual({"x": 14, "z": 3}, {k: place(g, "computer", 14, 3)["tanks"]["computer"][k] for k in "xz"})
            self.assertTrue(place(g, "player", -10.2, 8)["ok"])                    # touching a wall is fine

    def test_reset_starts_over_but_keeps_pause_and_ai(self):
        with game() as g:
            fresh(g)
            place(g, "player", 0, 0)
            g.call("fire", {"tank": "player"})
            after = g.call("reset")
            self.assertEqual((-15, 100, 0, [], 1), (tank(g, "player")["x"], tank(g, "player")["health"],
                                                    tank(g, "player")["shots"], after["shells"], after["round"]))
            self.assertEqual((True, False), (state(g)["paused"], state(g)["ai"]))


if __name__ == "__main__":
    unittest.main()

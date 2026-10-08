"""The seven WebMCP tools are listed and answer as the spec says."""
import unittest

from tank import GameTest, place

TOOLS = ["describe", "fire", "pause", "place", "reset", "set_ai", "step"]


class ToolsTest(GameTest):
    ai = True

    def test_all_seven_tools_are_listed(self):
        self.assertEqual(TOOLS, sorted(self.g.tools()))
        self.assertEqual([], self.g.errors)

    def test_describe_reads_the_start_state(self):
        s = self.g.call("describe")
        self.assertEqual({"width": 40, "depth": 30}, s["arena"])
        self.assertEqual([{"x": x, "z": z, "width": 2, "depth": 6} for x, z in [(-8, -8), (-8, 8), (8, -8), (8, 8)]], s["walls"])
        self.assertEqual({"x": -15, "z": 0, "heading": 0, "health": 100, "shots": 0}, s["tanks"]["player"])
        self.assertEqual({"x": 15, "z": 0, "heading": 180, "health": 100, "shots": 0}, s["tanks"]["computer"])
        self.assertEqual(([], {"player": 0, "computer": 0}, 1, "playing", True, True),
                         (s["shells"], s["score"], s["round"], s["state"], s["paused"], s["ai"]))

    def test_pause_set_ai_and_fire_answer(self):
        g = self.g
        self.assertEqual({"ok": True, "paused": False}, g.call("pause", {"paused": False}))
        self.assertEqual({"ok": True, "paused": True}, g.call("pause", {"paused": True}))
        self.assertEqual({"ok": True, "ai": False}, g.call("set_ai", {"enabled": False}))
        self.assertEqual({"ok": True, "fired": True}, g.call("fire", {"tank": "player"}))
        self.assertEqual({"ok": True, "fired": False}, g.call("fire", {"tank": "player"}))

    def test_step_advances_only_while_paused(self):
        g = self.g
        g.call("pause", {"paused": False})
        self.assertFalse(g.call("step", {"seconds": 1})["ok"])
        g.call("pause", {"paused": True})
        self.assertTrue(g.call("step", {"seconds": 1.5})["ok"])
        for seconds in (0, -1, 30.5, "1", None):
            self.assertFalse(g.call("step", {"seconds": seconds})["ok"], seconds)
        self.assertTrue(g.call("step", {"seconds": 30})["ok"])

    def test_bad_input_answers_an_error(self):
        g = self.g
        bad = [("pause", {"paused": "yes"}), ("set_ai", {}), ("fire", {"tank": "enemy"}), ("fire", {}),
               ("fire", {"tank": "__proto__"}), ("place", {"tank": "constructor", "x": 0, "z": 0}),
               ("place", {"tank": "enemy", "x": 0, "z": 0}), ("place", {"tank": "player", "x": "0", "z": 0}),
               ("place", {"tank": "player", "x": 0, "z": 0, "heading": "up"})]
        for name, payload in bad:
            answer = g.call(name, payload)
            self.assertFalse(answer["ok"], (name, payload))
            self.assertIsInstance(answer["error"], str)
        self.assertEqual([], g.errors)

    def test_place_moves_and_refuses_bad_spots(self):
        g = self.g
        t = place(g, "player", 0, 5, 450)["tanks"]["player"]
        self.assertEqual((0, 5, 90), (t["x"], t["z"], t["heading"]))
        place(g, "player", -10.2, -8)  # touching the wall is allowed
        for x, z in [(-8, -8), (-8, 5.5), (25, 0), (0, -16), (-19.5, 0), (15, 0), (14, 1)]:
            self.assertFalse(g.call("place", {"tank": "player", "x": x, "z": z, "heading": 0})["ok"], (x, z))
        self.assertEqual(-10.2, g.call("describe")["tanks"]["player"]["x"])

    def test_reset_starts_a_new_game_and_keeps_pause_and_ai(self):
        g = self.g
        place(g, "player", 0, 5)
        g.call("fire", {"tank": "player"})
        s = g.call("reset")
        self.assertEqual((-15, 0, 1, [], True, True), (s["tanks"]["player"]["x"], s["tanks"]["player"]["shots"], s["round"], s["shells"], s["paused"], s["ai"]))


if __name__ == "__main__":
    unittest.main()

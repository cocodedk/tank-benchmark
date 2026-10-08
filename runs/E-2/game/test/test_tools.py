"""The page shows the game and its seven tools answer as the spec says."""
import unittest

from game_case import GameCase

START = {"player": {"x": -15, "z": 0, "heading": 0, "health": 100, "shots": 0},
         "computer": {"x": 15, "z": 0, "heading": 180, "health": 100, "shots": 0}}


class ToolsTest(GameCase):
    def test_page_shows_canvas_and_hud_without_errors(self):
        self.assertEqual(1, self.g.page.locator("canvas").count())
        text = self.g.page.inner_text("body")
        for label in ["You", "Computer", "Score 0 : 0", "Round 1", "Space fire"]:
            self.assertIn(label, text)
        self.assertEqual([], self.g.errors)

    def test_camera_shows_the_whole_arena_at_any_window_shape(self):
        corners = """async () => {
          const THREE = await import('three'), {camera} = await import('./src/render.js');
          return [[-20, -15], [20, -15], [-20, 15], [20, 15]].map(([x, z]) => {
            const p = new THREE.Vector3(x, 0, z).project(camera);
            return Math.max(Math.abs(p.x), Math.abs(p.y));
          });
        }"""
        try:
            for width, height in [(1280, 800), (600, 800), (400, 900), (1600, 500)]:
                self.g.page.set_viewport_size({"width": width, "height": height})
                self.g.page.wait_for_function(f"innerWidth === {width} && innerHeight === {height}")
                for extent in self.g.page.evaluate(corners):
                    self.assertLessEqual(extent, 1, (width, height))
        finally:
            self.g.page.set_viewport_size({"width": 1280, "height": 800})

    def test_seven_tools_listed(self):
        self.assertEqual(sorted(["describe", "pause", "step", "place", "fire", "set_ai", "reset"]), sorted(self.g.tools()))

    def test_describe_is_the_start_state(self):
        s = self.g.call("describe")
        self.assertEqual(START, s["tanks"])
        self.assertEqual({"width": 40, "depth": 30}, s["arena"])
        self.assertEqual([{"x": -8, "z": -8, "width": 2, "depth": 6}, {"x": -8, "z": 8, "width": 2, "depth": 6},
                          {"x": 8, "z": -8, "width": 2, "depth": 6}, {"x": 8, "z": 8, "width": 2, "depth": 6}], s["walls"])
        self.assertEqual(([], {"player": 0, "computer": 0}, 1, "playing", True, False),
                         (s["shells"], s["score"], s["round"], s["state"], s["paused"], s["ai"]))

    def test_pause_and_set_ai_answer(self):
        self.assertEqual({"ok": True, "paused": False}, self.g.call("pause", {"paused": False}))
        self.assertEqual({"ok": True, "paused": True}, self.g.call("pause", {"paused": True}))
        self.assertEqual({"ok": True, "ai": True}, self.g.call("set_ai", {"enabled": True}))
        self.assertTrue(self.g.call("describe")["ai"])

    def test_bad_input_answers_not_ok(self):
        for name, payload in [("pause", {}), ("pause", {"paused": "yes"}), ("set_ai", {"enabled": 1}),
                              ("step", {"seconds": 0}), ("step", {"seconds": 31}), ("step", {"seconds": "1"}),
                              ("place", {"tank": "blue", "x": 0, "z": 0, "heading": 0}),
                              ("place", {"tank": "player", "x": "0", "z": 0, "heading": 0}),
                              ("fire", {}), ("fire", {"tank": "nobody"})]:
            out = self.g.call(name, payload)
            self.assertIs(False, out["ok"], (name, payload))
            self.assertIsInstance(out["error"], str)
        self.assertEqual([], self.g.errors)

    def test_step_only_while_paused(self):
        self.g.call("pause", {"paused": False})
        self.assertIs(False, self.g.call("step", {"seconds": 1})["ok"])
        self.g.call("pause", {"paused": True})
        self.assertIs(True, self.g.call("step", {"seconds": 1})["ok"])

    def test_place_moves_and_refuses_bad_spots(self):
        s = self.g.call("place", {"tank": "player", "x": 0, "z": 3, "heading": 450})
        self.assertEqual((0, 3, 90), tuple(s["tanks"]["player"][k] for k in ("x", "z", "heading")))
        for x, z in [(-8, 8), (-8, 4.5), (14, 0), (19.5, 0), (0, -14.5), (30, 0)]:
            self.assertIs(False, self.g.call("place", {"tank": "player", "x": x, "z": z, "heading": 0})["ok"], (x, z))
        self.assertEqual(0, self.g.call("describe")["tanks"]["player"]["x"])

    def test_reset_keeps_pause_and_ai(self):
        self.g.call("set_ai", {"enabled": True})
        self.g.call("fire", {"tank": "player"})
        self.g.call("place", {"tank": "computer", "x": 0, "z": 10, "heading": 0})
        s = self.g.call("reset")
        self.assertEqual(START, s["tanks"])
        self.assertEqual(([], True, True, 1), (s["shells"], s["paused"], s["ai"], s["round"]))


if __name__ == "__main__":
    unittest.main()

"""Start state, the seven tools, and bad input."""
import unittest

from gamecase import GameCase

WALLS = [{"x": x, "z": z, "width": 2, "depth": 6} for x, z in ((-8, -8), (-8, 8), (8, -8), (8, 8))]
TOOLS = {"describe", "pause", "step", "place", "fire", "set_ai", "reset"}


class ToolsTest(GameCase):
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        cls.first = cls.g.call("describe")  # before any setUp touches it
        cls.first_errors = list(cls.g.errors)

    def test_page_opens_clean_with_the_start_state(self):
        s = self.first
        self.assertEqual([], self.first_errors)
        self.assertIs(s["ok"], True)
        self.assertEqual({"width": 40, "depth": 30}, s["arena"])
        self.assertEqual(WALLS, s["walls"])
        self.assertEqual({"player": 0, "computer": 0}, s["score"])
        self.assertEqual((1, "playing", True), (s["round"], s["state"], s["ai"]))
        self.assertEqual({"player", "computer"}, set(s["tanks"]))

    def test_exactly_the_seven_tools(self):
        self.assertEqual(TOOLS, set(self.g.tools()))
        self.assertEqual(7, len(self.g.tools()))

    def test_reset_state_shape(self):
        s = self.state()
        self.assertEqual({"ok", "arena", "walls", "tanks", "shells", "score", "round", "state", "paused", "ai"},
                         set(s))
        self.assertEqual([], s["shells"])
        self.assertEqual((True, False), (s["paused"], s["ai"]))
        for name, (x, z, h) in {"player": (-15, 0, 0), "computer": (15, 0, 180)}.items():
            t = s["tanks"][name]
            self.assertEqual({"x", "z", "heading", "health", "shots"}, set(t))
            self.assertEqual((x, z, h, 100, 0), (t["x"], t["z"], t["heading"], t["health"], t["shots"]))

    def test_pause_and_set_ai_answer(self):
        self.assertEqual({"ok": True, "paused": False}, self.g.call("pause", {"paused": False}))
        self.assertEqual({"ok": True, "paused": True}, self.g.call("pause", {"paused": True}))
        self.assertEqual({"ok": True, "ai": True}, self.g.call("set_ai", {"enabled": True}))
        self.assertEqual({"ok": True, "ai": False}, self.g.call("set_ai", {"enabled": False}))

    def test_step_returns_state_and_no_key_means_no_move(self):
        out = self.run_for(0.5)
        self.assertEqual("playing", out["state"])
        self.assertEqual(-15, self.tank("player")["x"])

    def test_place_returns_state_and_moves(self):
        out = self.put("player", 0, 0, 450)
        t = out["tanks"]["player"]
        self.assertEqual((0, 0, 90), (t["x"], t["z"], t["heading"]))
        self.put("computer", 12, -10, -90)
        c = self.tank("computer")
        self.assertEqual((12, -10, 270), (c["x"], c["z"], c["heading"]))

    def test_fire_spawns_a_shell_in_front(self):
        self.assertIs(True, self.fire("player"))
        s = self.state()
        self.assertEqual(1, len(s["shells"]))
        sh = s["shells"][0]
        self.assertEqual(("player", 0), (sh["owner"], sh["bounces"]))
        self.assertAlmostEqual(-13.4, sh["x"], delta=0.05)
        self.assertAlmostEqual(0, sh["z"], delta=0.05)
        self.assertEqual(1, s["tanks"]["player"]["shots"])
        self.assertIs(True, self.fire("computer"))
        self.assertEqual(1, self.tank("computer")["shots"])

    def test_reset_keeps_pause_and_ai_and_clears_everything(self):
        self.put("player", 0, 0, 90)
        self.fire()
        self.g.call("set_ai", {"enabled": True})
        s = self.g.call("reset", {})
        self.assertEqual((True, True, 1, []), (s["paused"], s["ai"], s["round"], s["shells"]))
        self.assertEqual((-15, 0, 0, 0), tuple(s["tanks"]["player"][k] for k in ("x", "z", "heading", "shots")))
        self.assertEqual({"player": 0, "computer": 0}, s["score"])

    def test_bad_input_is_refused_without_errors(self):
        bad = [
            ("step", {"seconds": 0}), ("step", {"seconds": 31}), ("step", {"seconds": "x"}),
            ("step", {"seconds": -1}), ("step", {}),
            ("place", {"tank": "enemy", "x": 0, "z": 0, "heading": 0}),
            ("place", {"tank": "player", "x": 8, "z": 8, "heading": 0}),
            ("place", {"tank": "player", "x": 25, "z": 0, "heading": 0}),
            ("place", {"tank": "player", "x": 0, "z": -15, "heading": 0}),
            ("place", {"tank": "player", "x": 15, "z": 0, "heading": 0}),
            ("place", {"tank": "player", "x": "a", "z": 0, "heading": 0}),
            ("place", {"tank": "player", "x": 0, "z": 0}),
            ("pause", {"paused": "yes"}), ("pause", {}),
            ("set_ai", {"enabled": 1}), ("fire", {"tank": "enemy"}), ("fire", {}),
        ]
        for name, payload in bad:
            with self.subTest(name=name, payload=payload):
                self.assertRefused(self.g.call(name, payload))
        s = self.state()
        self.assertEqual((-15, True, False), (s["tanks"]["player"]["x"], s["paused"], s["ai"]))

    def test_step_while_running_is_refused(self):
        self.g.call("pause", {"paused": False})
        self.assertRefused(self.g.call("step", {"seconds": 1}))
        self.g.call("pause", {"paused": True})


if __name__ == "__main__":
    unittest.main()

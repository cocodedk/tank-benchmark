"""The seven tools: their shapes, their answers and their refusals."""
import unittest

from test_common import Base

TOOLS = {"describe", "pause", "step", "place", "fire", "set_ai", "reset"}
STATE_KEYS = {"ok", "arena", "walls", "tanks", "shells", "score", "round", "state", "paused", "ai"}
TANK_KEYS = {"x", "z", "heading", "health", "shots"}


class ToolsTest(Base):
    def test_exactly_the_seven_tools_are_listed(self):
        self.assertEqual(TOOLS, set(self.g.tools()))
        self.assertEqual(7, len(self.g.tools()))

    def test_describe_has_the_exact_state_shape(self):
        s = self.state()
        self.assertEqual(STATE_KEYS, set(s))
        self.assertEqual({"width": 40, "depth": 30}, s["arena"])
        self.assertEqual({"player", "computer"}, set(s["tanks"]))
        for t in s["tanks"].values():
            self.assertEqual(TANK_KEYS, set(t))
        walls = {(w["x"], w["z"], w["width"], w["depth"]) for w in s["walls"]}
        self.assertEqual({(x, z, 2, 6) for x in (-8, 8) for z in (-8, 8)}, walls)
        self.assertEqual({"player": 0, "computer": 0}, s["score"])
        self.assertEqual((1, "playing", []), (s["round"], s["state"], s["shells"]))

    def test_good_calls_answer_as_specified(self):
        self.assertEqual({"ok": True, "paused": True}, self.g.call("pause", {"paused": True}))
        self.assertEqual({"ok": True, "ai": False}, self.g.call("set_ai", {"enabled": False}))
        self.assertEqual({"ok": True, "ai": True}, self.g.call("set_ai", {"enabled": True}))
        self.assertEqual({"ok": True, "ai": False}, self.g.call("set_ai", {"enabled": False}))
        self.assertEqual(STATE_KEYS, set(self.step(0.5)))
        self.assertEqual(STATE_KEYS, set(self.place("player", 0, 0, 90)))
        answer = self.g.call("fire", {"tank": "player"})
        self.assertEqual({"ok", "fired"}, set(answer))
        self.assertIs(answer["fired"], True)

    def test_bad_input_is_refused_with_an_error(self):
        bad = [("step", {"seconds": 0}), ("step", {"seconds": 31}), ("step", {"seconds": "x"}),
               ("step", {}), ("place", {"tank": "foo", "x": 0, "z": 0, "heading": 0}),
               ("place", {"tank": "player", "x": -8, "z": -8, "heading": 0}),
               ("place", {"tank": "player", "x": 15, "z": 0, "heading": 0}),
               ("place", {"tank": "player", "x": 25, "z": 0, "heading": 0}),
               ("fire", {"tank": "foo"}), ("pause", {"paused": "yes"}), ("set_ai", {})]
        for name, payload in bad:
            answer = self.g.call(name, payload)
            self.assertIs(answer.get("ok"), False, (name, payload, answer))
            self.assertIsInstance(answer.get("error"), str, (name, payload, answer))
        self.assertEqual(self.state()["tanks"]["player"]["x"], -15)

    def test_step_is_refused_while_running(self):
        self.ok(self.g.call("pause", {"paused": False}))
        try:
            self.assertIs(self.g.call("step", {"seconds": 1})["ok"], False)
        finally:
            self.g.call("pause", {"paused": True})

    def test_reset_restores_the_start_and_keeps_pause_and_ai(self):
        self.place("player", 0, 5, 90)
        self.place("computer", 11, -3, 10)
        self.fire()
        self.step(0.1)
        s = self.ok(self.g.call("reset"))
        self.assertEqual((1, 0, 0, "playing", []), (s["round"], s["score"]["player"], s["score"]["computer"],
                                                    s["state"], s["shells"]))
        for name, (x, z, h) in {"player": (-15, 0, 0), "computer": (15, 0, 180)}.items():
            t = s["tanks"][name]
            self.assertEqual((x, z, h, 100, 0), (round(t["x"], 6), round(t["z"], 6), t["heading"], t["health"],
                                                 t["shots"]))
        self.assertEqual((True, False), (s["paused"], s["ai"]))


if __name__ == "__main__":
    unittest.main()

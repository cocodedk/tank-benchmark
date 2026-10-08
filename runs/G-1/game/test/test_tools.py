"""The seven WebMCP tools answer their contracts: what they return and what they refuse."""
import contextlib
import unittest

from page import game

TOOLS = ["describe", "fire", "pause", "place", "reset", "set_ai", "step"]
START = {
    "arena": {"width": 40, "depth": 30},
    "walls": [{"x": x, "z": z, "width": 2, "depth": 6} for x in (-8, 8) for z in (-8, 8)],
    "tanks": {
        "player": {"x": -15, "z": 0, "heading": 0, "health": 100, "shots": 0},
        "computer": {"x": 15, "z": 0, "heading": 180, "health": 100, "shots": 0},
    },
    "shells": [],
    "score": {"player": 0, "computer": 0},
    "round": 1,
    "state": "playing",
}


def start_state(paused: bool, ai: bool) -> dict:
    return {"ok": True, **START, "paused": paused, "ai": ai}


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
        self.g.call("reset")

    def assertRefused(self, answer):
        self.assertIsInstance(answer, dict, answer)
        self.assertIs(answer.get("ok"), False, answer)
        self.assertIsInstance(answer.get("error"), str, answer)

    def test_all_seven_tools_are_listed(self):
        self.assertEqual(len(TOOLS), 7)
        self.assertCountEqual(self.g.tools(), TOOLS)

    def test_describe_answers_the_start_state(self):
        self.assertEqual(self.g.call("describe"), start_state(paused=True, ai=False))

    def test_pause_answers_with_the_paused_flag(self):
        self.assertEqual(self.g.call("pause", {"paused": False}), {"ok": True, "paused": False})
        self.assertEqual(self.g.call("pause", {"paused": True}), {"ok": True, "paused": True})

    def test_set_ai_answers_with_the_ai_flag(self):
        self.assertEqual(self.g.call("set_ai", {"enabled": True}), {"ok": True, "ai": True})
        self.assertEqual(self.g.call("set_ai", {"enabled": False}), {"ok": True, "ai": False})

    def test_reset_restores_the_start_but_keeps_paused_and_ai(self):
        self.g.call("set_ai", {"enabled": True})
        self.assertIs(self.g.call("place", {"tank": "player", "x": 0, "z": 0, "heading": 90})["ok"], True)
        self.assertIs(self.g.call("fire", {"tank": "player"})["fired"], True)
        self.assertEqual(len(self.g.call("describe")["shells"]), 1)
        self.assertEqual(self.g.call("reset"), start_state(paused=True, ai=True))

    def test_place_moves_a_tank_and_normalises_the_heading(self):
        s = self.g.call("place", {"tank": "player", "x": 0, "z": 0, "heading": 90})
        self.assertIs(s["ok"], True)
        p = s["tanks"]["player"]
        self.assertEqual((p["x"], p["z"], p["heading"]), (0, 0, 90))
        for given, want in ((-90, 270), (450, 90)):
            p = self.g.call("place", {"tank": "player", "x": 3, "z": 2, "heading": given})["tanks"]["player"]
            self.assertEqual((p["x"], p["z"], p["heading"]), (3, 2, want))

    def test_place_refuses_a_bad_spot_and_leaves_the_tank_where_it_was(self):
        cases = {
            "inside an inner wall": {"tank": "player", "x": -8, "z": -8, "heading": 0},
            "touching an inner wall": {"tank": "player", "x": -9.5, "z": -8, "heading": 0},
            "overlapping the other tank": {"tank": "player", "x": 14, "z": 0, "heading": 0},
            "outside the arena": {"tank": "player", "x": 25, "z": 0, "heading": 0},
            "crossing the outer wall": {"tank": "player", "x": 19.5, "z": 0, "heading": 0},
            "an unknown tank": {"tank": "blue", "x": 0, "z": 0, "heading": 0},
            "a non-numeric x": {"tank": "player", "x": "abc", "z": 0, "heading": 0},
            "a missing heading": {"tank": "player", "x": 0, "z": 0},
        }
        for why, payload in cases.items():
            with self.subTest(why):
                self.assertRefused(self.g.call("place", payload))
        self.assertEqual(self.g.call("describe")["tanks"]["player"], START["tanks"]["player"])

    def test_step_answers_the_state_when_paused(self):
        s = self.g.call("step", {"seconds": 1.5})
        self.assertIs(s["ok"], True)
        self.assertIs(s["paused"], True)

    def test_short_steps_add_up_like_one_long_step(self):
        self.g.call("place", {"tank": "player", "x": 0, "z": 0, "heading": 0})
        self.g.call("fire", {"tank": "player"})
        for _ in range(60):
            s = self.g.call("step", {"seconds": 0.01})
        self.assertAlmostEqual(s["shells"][0]["x"], 10.6, delta=1e-6)

    def test_step_refuses_when_not_paused(self):
        self.g.call("pause", {"paused": False})
        self.assertRefused(self.g.call("step", {"seconds": 1}))

    def test_step_refuses_a_bad_duration(self):
        for seconds in (0, -1, 31, "abc"):
            with self.subTest(seconds=seconds):
                self.assertRefused(self.g.call("step", {"seconds": seconds}))

    def test_fire_refuses_an_unknown_tank(self):
        self.assertRefused(self.g.call("fire", {"tank": "blue"}))

    def test_zz_the_page_has_no_console_errors(self):
        # Named to sort last, so it sees the errors from every other test.
        self.assertEqual([], self.g.errors)


if __name__ == "__main__":
    unittest.main()

"""Shells: hits, bounces, cooldown, the three-shell limit, and the round end."""
import contextlib
import unittest

from page import game

START = {"player": (-15, 0, 0), "computer": (15, 0, 180)}


class ShellsTest(unittest.TestCase):
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
        self.g.call("reset", {})

    def step(self, seconds):
        return self.g.call("step", {"seconds": seconds})

    def fire(self):
        out = self.g.call("fire", {"tank": "player"})
        self.assertIs(out["ok"], True)
        return out["fired"]

    def place(self, x, z, heading):
        self.assertTrue(self.g.call("place", {"tank": "player", "x": x, "z": z, "heading": heading})["ok"])

    def test_shell_hits_computer(self):
        self.assertTrue(self.fire())
        s = self.step(3)
        self.assertEqual(75, s["tanks"]["computer"]["health"])
        self.assertEqual(100, s["tanks"]["player"]["health"])
        self.assertEqual([], s["shells"])

    def test_bounce_once_then_removed(self):
        self.place(-15, -12, 0)
        self.assertTrue(self.fire())
        self.place(-15, 12, 0)
        s = self.step(1)
        self.assertEqual(1, len(s["shells"]))
        self.assertEqual(0, s["shells"][0]["bounces"])
        s = self.step(2)
        self.assertEqual(1, len(s["shells"]))
        self.assertEqual(1, s["shells"][0]["bounces"])
        x = s["shells"][0]["x"]
        self.assertLess(self.step(0.1)["shells"][0]["x"], x)
        s = self.step(3)
        self.assertEqual([], s["shells"])
        self.assertEqual((100, 100), (s["tanks"]["player"]["health"], s["tanks"]["computer"]["health"]))

    def test_bounce_off_inner_wall_corner_edge(self):
        self.place(6.8, 1, 90)
        self.assertTrue(self.fire())
        s = self.step(0.25)
        self.assertEqual((1, 1), (len(s["shells"]), s["shells"][0]["bounces"]))
        z = s["shells"][0]["z"]
        s = self.step(0.05)
        self.assertEqual(1, len(s["shells"]))
        self.assertLess(s["shells"][0]["z"], z)

    def test_fired_into_touching_wall_reflects_back(self):
        self.place(5.8, 8, 0)
        self.assertTrue(self.fire())
        s = self.step(0.5)
        self.assertEqual(75, s["tanks"]["player"]["health"])
        self.assertEqual([], s["shells"])

    def test_grazing_shell_hits(self):
        self.place(0, 0, 0)
        self.assertTrue(self.g.call("place", {"tank": "computer", "x": 5.225, "z": 1.449, "heading": 180})["ok"])
        self.assertTrue(self.fire())
        s = self.step(1)
        self.assertEqual(75, s["tanks"]["computer"]["health"])

    def test_own_shell_hurts(self):
        self.place(-15, 0, 180)
        self.assertTrue(self.fire())
        s = self.step(2)
        self.assertEqual(75, s["tanks"]["player"]["health"])
        self.assertEqual([], s["shells"])

    def test_cooldown(self):
        self.assertTrue(self.fire())
        self.assertFalse(self.fire())
        self.step(0.4)
        self.assertFalse(self.fire())
        self.step(0.2)
        self.assertTrue(self.fire())

    def test_max_three_shells_in_flight(self):
        self.place(-15, -12, 0)
        for _ in range(3):
            self.assertTrue(self.fire())
            self.step(0.6)
        self.assertFalse(self.fire())
        self.assertEqual(3, len(self.g.call("describe", {})["shells"]))

    def test_round_end_and_next_round(self):
        for _ in range(4):  # 0.7 s apart: the first shell has landed before the fourth is fired
            self.assertTrue(self.fire())
            self.step(0.7)
        s = self.g.call("describe", {})
        for _ in range(50):
            if s["state"] == "round_over":
                break
            s = self.step(0.1)
        self.assertEqual("round_over", s["state"])
        self.assertEqual({"player": 1, "computer": 0}, s["score"])
        self.assertEqual(0, s["tanks"]["computer"]["health"])
        banner = self.g.page.locator("#banner")
        self.assertTrue(banner.is_visible())
        self.assertIn("You win the round", banner.inner_text())
        self.assertEqual("round_over", self.step(1.8)["state"])
        s = self.step(0.4)
        self.assertEqual(("playing", 2), (s["state"], s["round"]))
        self.assertEqual({"player": 1, "computer": 0}, s["score"])
        self.assertEqual([], s["shells"])
        for name, (x, z, heading) in START.items():
            t = s["tanks"][name]
            self.assertAlmostEqual(x, t["x"], delta=0.15)
            self.assertAlmostEqual(z, t["z"], delta=0.15)
            self.assertAlmostEqual(heading, t["heading"], delta=0.15)
            self.assertEqual(100, t["health"])


if __name__ == "__main__":
    unittest.main()

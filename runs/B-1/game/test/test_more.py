"""Reverse, arrow keys, tank contact, inner-wall bounces, shells passing each other."""
import unittest

from common import GameCase


class ControlsTest(GameCase, unittest.TestCase):
    def test_reverse_is_four_units_a_second(self):
        self.place("player", 0, 0, 0)
        self.hold("s", 1)
        self.assertAlmostEqual(-4, self.tank("player")["x"], delta=0.05)

    def test_arrow_keys_drive_and_turn(self):
        self.hold("ArrowUp", 1)
        self.assertAlmostEqual(-9, self.tank("player")["x"], delta=0.05)
        self.hold("ArrowLeft", 0.5)
        self.assertAlmostEqual(300, self.tank("player")["heading"], delta=0.05)
        self.hold("ArrowRight", 1)
        self.assertAlmostEqual(60, self.tank("player")["heading"], delta=0.05)
        self.g.call("reset")
        self.place("player", 0, 0, 0)
        self.hold("ArrowDown", 1)
        self.assertAlmostEqual(-4, self.tank("player")["x"], delta=0.05)

    def test_a_key_and_its_arrow_alias_release_independently(self):
        kb = self.g.page.keyboard
        kb.down("w")
        kb.down("ArrowUp")
        kb.up("w")
        try:
            self.step(1)
        finally:
            kb.up("ArrowUp")
        self.assertAlmostEqual(-9, self.tank("player")["x"], delta=0.05)

    def test_a_tank_stops_at_the_other_tank(self):
        self.place("player", 0, 0, 0)
        self.place("computer", 3, 0, 180)
        self.hold("w", 1)
        self.assertAlmostEqual(0.6, self.tank("player")["x"], delta=0.05)
        self.assertEqual(3, self.tank("computer")["x"])

    def test_a_tank_pinned_against_a_wall_never_overlaps_the_other(self):
        self.place("computer", 17.8, 0, 0)
        self.place("player", 18.8, 2.3, 270)
        self.hold("w", 1)
        p, c = self.tank("player"), self.tank("computer")
        self.assertGreaterEqual(((p["x"] - c["x"]) ** 2 + (p["z"] - c["z"]) ** 2) ** 0.5, 2.4 - 1e-4)


class ShellPathTest(GameCase, unittest.TestCase):
    def test_inner_wall_bounce_sends_the_shell_back(self):
        self.place("computer", 15, 12)
        self.place("player", -14, -8, 0)
        self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
        shell = self.step(0.3)["shells"][0]  # the wall face is at x = -9
        self.assertEqual(1, shell["bounces"])
        self.assertLess(shell["x"], -9.2)
        self.assertLess(self.step(0.1)["shells"][0]["x"], shell["x"])
        self.assertEqual(75, self.step(2)["tanks"]["player"]["health"])

    def test_a_shell_near_a_wall_corner_does_not_bounce(self):
        self.place("computer", -15, 12)
        self.place("player", 7.891, -12.371, 135)  # the shell starts 0.34 from the corner (7, -11), heading away
        self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
        self.assertEqual(0, self.step(0.1)["shells"][0]["bounces"])

    def test_a_grazing_shell_still_hits(self):
        self.place("player", 0, 0, 0)
        self.place("computer", 3.225, 1.449, 180)  # 1.449 off the shell's line: inside the 1.45 reach
        self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
        state = self.step(1)
        self.assertEqual(75, state["tanks"]["computer"]["health"])
        self.assertEqual([], state["shells"])

    def test_shells_pass_through_each_other(self):
        self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
        self.assertTrue(self.g.call("fire", {"tank": "computer"})["fired"])
        shells = self.step(1)["shells"]  # they crossed at x = 0 before this
        self.assertEqual([0, 0], [s["bounces"] for s in shells])
        tanks = self.step(2)["tanks"]
        self.assertEqual((75, 75), (tanks["player"]["health"], tanks["computer"]["health"]))


if __name__ == "__main__":
    unittest.main()

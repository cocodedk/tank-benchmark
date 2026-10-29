"""Driving, walls, shooting, bounces and reload."""
import unittest

from common import GameCase


class DriveTest(GameCase, unittest.TestCase):
    def test_forward_one_second(self):
        self.hold("w", 1)
        tank = self.tank("player")
        self.assertAlmostEqual(-9, tank["x"], delta=0.05)
        self.assertAlmostEqual(0, tank["z"], delta=0.05)

    def test_turning(self):
        self.hold("a", 0.5)
        self.assertAlmostEqual(300, self.tank("player")["heading"], delta=0.05)
        self.g.call("reset")
        self.hold("d", 0.5)
        self.assertAlmostEqual(60, self.tank("player")["heading"], delta=0.05)

    def test_holding_space_fires_once(self):
        self.hold("Space", 1)
        self.assertEqual(1, self.tank("player")["shots"])

    def test_inner_wall_stops_the_tank(self):
        self.place("computer", 15, 12)
        self.place("player", -13, -8, 0)
        self.hold("w", 2)
        self.assertAlmostEqual(-10.2, self.tank("player")["x"], delta=0.05)

    def test_outer_wall_stops_the_tank(self):
        self.place("player", 0, 10, 90)
        self.hold("w", 2)
        self.assertAlmostEqual(13.8, self.tank("player")["z"], delta=0.05)


class ShellTest(GameCase, unittest.TestCase):
    def fire(self):
        return self.g.call("fire", {"tank": "player"})["fired"]

    def test_shell_hits_the_computer(self):
        self.assertTrue(self.fire())
        self.step(3)
        state = self.state()
        self.assertEqual(75, state["tanks"]["computer"]["health"])
        self.assertEqual([], state["shells"])

    def bounced_shot(self):
        self.place("player", 0, -3, 90)
        self.place("computer", 15, -12)
        self.assertTrue(self.fire())
        self.step_until(lambda s: s["shells"] and s["shells"][0]["bounces"] == 1)
        z = self.state()["shells"][0]["z"]
        self.step(0.1)
        self.assertLess(self.state()["shells"][0]["z"], z)  # coming back

    def test_bounce_comes_back_and_hits_the_shooter(self):
        self.bounced_shot()
        self.step_until(lambda s: s["tanks"]["player"]["health"] < 100)
        tanks = self.state()["tanks"]
        self.assertEqual(75, tanks["player"]["health"])
        self.assertEqual(100, tanks["computer"]["health"])

    def test_bounced_shell_ends_at_the_far_wall(self):
        self.bounced_shot()
        self.place("player", -15, -12)
        self.step_until(lambda s: not s["shells"])
        tanks = self.state()["tanks"]
        self.assertEqual(100, tanks["player"]["health"])
        self.assertEqual(100, tanks["computer"]["health"])

    def test_reload_takes_half_a_second(self):
        self.assertTrue(self.fire())
        self.assertFalse(self.fire())
        self.step(0.25)
        self.assertFalse(self.fire())
        self.step(0.25)
        self.assertTrue(self.fire())

    def test_at_most_three_shells(self):
        self.place("player", 0, -3, 90)
        self.place("computer", 15, -12)
        for _ in range(3):
            self.assertTrue(self.fire())
            self.step(0.5)
        self.assertEqual(3, len(self.state()["shells"]))
        self.assertFalse(self.fire())


if __name__ == "__main__":
    unittest.main()

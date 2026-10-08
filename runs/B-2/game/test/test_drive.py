"""Driving: speeds, turning, collisions."""
import unittest

from base import GameCase, dist


class DriveTest(GameCase):
    def test_many_short_steps_add_up(self):
        self.g.page.keyboard.down("w")
        for _ in range(100):
            s = self.step(0.01)
        self.assertAlmostEqual(-9, self.tank(s)["x"], delta=0.01)

    def test_tank_at_the_outer_wall_stops_at_the_other_tank(self):
        self.place("computer", 17.6, 0, 180)
        self.place("player", 18.8, 3, 270)
        s = self.hold("w", 1)
        self.assertEqual((17.6, 0), (self.tank(s, "computer")["x"], self.tank(s, "computer")["z"]))
        self.assertGreaterEqual(dist(self.tank(s), self.tank(s, "computer")), 2.4 - 1e-3)

    def assertNear(self, a, b, tol=0.05):
        self.assertAlmostEqual(a, b, delta=tol)

    def test_forward_6_per_second_along_heading(self):
        p = self.tank(self.hold("w", 1))
        self.assertNear(p["x"], -9)
        self.assertNear(p["z"], 0)
        self.place("player", 0, 0, 90)
        p = self.tank(self.hold("w", 1))
        self.assertNear(p["x"], 0)
        self.assertNear(p["z"], 6)

    def test_reverse_4_per_second(self):
        self.place("player", 0, 0, 0)
        self.assertNear(self.tank(self.hold("s", 1))["x"], -4)

    def test_turning_120_per_second_in_opposite_directions(self):
        self.place("player", 0, 0, 180)
        a = self.tank(self.hold("a", 0.5))["heading"] - 180
        self.place("player", 0, 0, 180)
        d = self.tank(self.hold("d", 0.5))["heading"] - 180
        self.assertNear(abs(a), 60, 0.5)
        self.assertNear(abs(d), 60, 0.5)
        self.assertLess(a * d, 0)

    def test_heading_wraps_into_0_360(self):
        h = self.tank(self.hold("a", 0.25))["heading"]
        self.assertTrue(0 <= h < 360)
        self.assertNear(h, 330, 0.5)

    def test_inner_wall_stops_tank(self):
        self.place("player", -14, -8, 0)
        p = self.tank(self.hold("w", 3))
        self.assertNear(p["x"], -10.2)
        self.assertNear(p["z"], -8)

    def test_outer_wall_stops_tank(self):
        self.place("player", 15, -10, 0)
        self.assertNear(self.tank(self.hold("w", 2))["x"], 18.8)

    def test_other_tank_stops_tank(self):
        self.place("computer", 0, 0, 180)
        self.place("player", -10, 0, 0)
        s = self.hold("w", 3)
        self.assertNear(dist(self.tank(s), self.tank(s, "computer")), 2.4, 0.06)
        self.assertNear(self.tank(s, "computer")["x"], 0)


if __name__ == "__main__":
    unittest.main()

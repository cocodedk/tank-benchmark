"""Keyboard driving, firing key, and wall contact."""
import unittest

from gamecase import GameCase

NEAR = 0.12


class DriveTest(GameCase):
    def setUp(self):
        super().setUp()
        self.put("computer", 0, 12, 0)

    def test_forward_and_back_by_heading(self):
        for key_f, key_b in (("w", "s"), ("ArrowUp", "ArrowDown")):
            with self.subTest(keys=key_f):
                self.put("player", 0, 0, 0)
                self.hold(key_f, 1)
                self.assertAlmostEqual(6, self.tank("player")["x"], delta=NEAR)
                self.put("player", 0, 0, 0)
                self.hold(key_b, 1)
                self.assertAlmostEqual(-4, self.tank("player")["x"], delta=NEAR)

    def test_forward_along_heading_90(self):
        self.put("player", 0, 0, 90)
        self.hold("w", 1)
        p = self.tank("player")
        self.assertAlmostEqual(6, p["z"], delta=NEAR)
        self.assertAlmostEqual(0, p["x"], delta=NEAR)

    def test_turning_120_per_second_both_ways(self):
        for key_l, key_r in (("a", "d"), ("ArrowLeft", "ArrowRight")):
            with self.subTest(keys=key_l):
                self.put("player", 0, 0, 0)
                self.hold(key_r, 1)
                self.assertAlmostEqual(120, self.tank("player")["heading"], delta=1.5)
                self.put("player", 0, 0, 0)
                self.hold(key_l, 1)
                self.assertAlmostEqual(240, self.tank("player")["heading"], delta=1.5)

    def test_turn_right_goes_toward_plus_z(self):
        self.put("player", 0, 0, 0)
        self.hold("d", 0.25)
        self.hold("w", 0.5)
        self.assertGreater(self.tank("player")["z"], 0.1)

    def test_holding_space_fires_one_shell(self):
        self.hold("Space", 0.3)
        s = self.state()
        self.assertEqual(1, s["tanks"]["player"]["shots"])
        self.assertEqual(1, len(s["shells"]))

    def test_inner_wall_stops_at_contact(self):
        self.put("player", -12, 8, 0)
        self.hold("w", 3)
        p = self.tank("player")
        self.assertAlmostEqual(-10.2, p["x"], delta=NEAR)
        self.assertAlmostEqual(8, p["z"], delta=NEAR)

    def test_outer_wall_stops_at_contact(self):
        self.put("player", 10, 0, 0)
        self.hold("w", 3)
        self.assertAlmostEqual(18.8, self.tank("player")["x"], delta=NEAR)
        self.put("player", -10, 0, 180)
        self.hold("w", 3)
        self.assertAlmostEqual(-18.8, self.tank("player")["x"], delta=NEAR)

    def test_tank_cannot_drive_through_the_other_tank(self):
        self.put("computer", 0, 0, 180)
        self.put("player", -10, 0, 0)
        self.hold("w", 3)
        self.assertAlmostEqual(-2.4, self.tank("player")["x"], delta=NEAR)
        self.assertAlmostEqual(0, self.tank("computer")["x"], delta=NEAR)

    def test_wedged_between_a_wall_and_the_other_tank_it_stays_out_of_the_wall(self):
        self.put("player", -10.2, 8, 90)
        self.put("computer", -11.4, 10.2, 0)
        self.run_for(1 / 60)
        self.hold("w", 5 / 60)
        p = self.tank("player")
        self.assertGreaterEqual(abs(p["x"]) - 9, 1.2 - 0.01, p)  # wall face at x = -9


if __name__ == "__main__":
    unittest.main()

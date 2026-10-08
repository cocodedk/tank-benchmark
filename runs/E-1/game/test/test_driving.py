"""Held keys drive, turn and fire the player's tank; walls and the other tank stop it."""
import unittest

from base import GameCase


class DrivingTest(GameCase):
    def player(self, state):
        return state["tanks"]["player"]

    def test_w_and_up_drive_6_units_per_second_s_reverses_at_4(self):
        p = self.player(self.hold("w", 1))
        self.assertAlmostEqual(-9, p["x"], places=6)
        self.assertAlmostEqual(0, p["z"], places=6)
        self.assertAlmostEqual(-3, self.player(self.hold("ArrowUp", 1))["x"], places=6)
        self.assertAlmostEqual(-7, self.player(self.hold("s", 1))["x"], places=6)
        self.assertAlmostEqual(-9, self.player(self.hold("ArrowDown", 0.5))["x"], places=6)

    def test_driving_follows_the_heading(self):
        self.place("player", 0, 0, 90)
        p = self.player(self.hold("w", 0.5))
        self.assertAlmostEqual(0, p["x"], places=6)
        self.assertAlmostEqual(3, p["z"], places=6)

    def test_a_and_d_turn_opposite_ways_at_120_degrees_per_second(self):
        self.assertAlmostEqual(300, self.player(self.hold("a", 0.5))["heading"], places=6)
        self.assertAlmostEqual(0, self.player(self.hold("ArrowRight", 0.5))["heading"] % 360, places=6)
        self.assertAlmostEqual(120, self.player(self.hold("d", 1))["heading"], places=6)
        self.assertAlmostEqual(60, self.player(self.hold("ArrowLeft", 0.5))["heading"], places=6)

    def test_holding_space_fires_one_shell(self):
        state = self.hold(" ", 1.2)
        self.assertEqual(1, self.player(state)["shots"])
        self.assertEqual(1, len(state["shells"]))

    def test_an_inner_wall_stops_the_tank_at_contact(self):
        self.place("player", -15, 8, 0)
        self.assertAlmostEqual(-10.2, self.player(self.hold("w", 2))["x"], places=6)

    def test_the_outer_wall_stops_the_tank_and_it_slides_along(self):
        self.place("computer", 0, -10, 0)
        self.place("player", 15, 0, 0)
        self.assertAlmostEqual(18.8, self.player(self.hold("w", 2))["x"], places=6)
        self.place("player", 0, 10, 60)
        p = self.player(self.hold("w", 2))
        self.assertAlmostEqual(13.8, p["z"], places=6)
        self.assertGreater(p["x"], 2)

    def test_the_other_tank_stops_the_tank_at_contact(self):
        self.place("computer", -10, 0, 180)
        self.assertAlmostEqual(-12.4,self.player(self.hold("w", 2))["x"], places=6)


if __name__ == "__main__":
    unittest.main()

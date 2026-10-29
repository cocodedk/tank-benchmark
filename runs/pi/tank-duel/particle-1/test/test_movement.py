"""Held keys drive the player tank, and walls stop it at the contact point."""
from base import PageTest


class MovementTest(PageTest):
    def test_forward_for_one_second_moves_six_units(self):
        self.g.call("place", {"tank": "player", "x": -15, "z": 0, "heading": 0})
        self.key_down("w")
        self.step(1.0)
        self.key_up("w")
        tank = self.tank()
        self.assertAlmostEqual(-9, tank["x"], delta=0.01)
        self.assertAlmostEqual(0, tank["z"], delta=0.01)

    def test_a_and_d_turn_in_opposite_directions(self):
        self.g.call("place", {"tank": "player", "x": 0, "z": 0, "heading": 0})
        self.key_down("a")
        self.step(1.0)
        self.key_up("a")
        left = self.tank()["heading"]
        self.assertAlmostEqual(240, left, delta=0.01)

        self.g.call("place", {"tank": "player", "x": 0, "z": 0, "heading": 0})
        self.key_down("d")
        self.step(1.0)
        self.key_up("d")
        right = self.tank()["heading"]
        self.assertAlmostEqual(120, right, delta=0.01)
        self.assertAlmostEqual(120, (left - right) % 360, delta=0.01)

    def test_inner_wall_stops_the_tank(self):
        self.g.call("place", {"tank": "player", "x": -8, "z": 0, "heading": 90})
        self.key_down("w")
        self.step(2.0)
        self.key_up("w")
        tank = self.tank()
        self.assertAlmostEqual(-8, tank["x"], delta=0.01)
        self.assertAlmostEqual(3.8, tank["z"], delta=0.02)

    def test_outer_wall_stops_the_tank(self):
        self.g.call("place", {"tank": "player", "x": 10, "z": -12, "heading": 0})
        self.key_down("w")
        self.step(3.0)
        self.key_up("w")
        tank = self.tank()
        self.assertAlmostEqual(18.8, tank["x"], delta=0.02)
        self.assertAlmostEqual(-12, tank["z"], delta=0.01)


if __name__ == "__main__":
    import unittest
    unittest.main()

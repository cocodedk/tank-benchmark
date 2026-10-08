"""Keys move and turn the player; walls and the other tank stop it."""
import unittest

from base import GameCase


class DriveTest(GameCase):
    def test_w_moves_forward_6_and_s_back_4(self):
        self.hold(["w"], 1)
        self.assertAlmostEqual(-9, self.player()["x"], places=2)
        self.place("player", 0, 0, 0)
        self.hold(["s"], 1)
        self.assertAlmostEqual(-4, self.player()["x"], places=2)

    def test_a_and_d_turn_60_degrees_in_opposite_directions(self):
        self.hold(["a"], 0.5)
        self.assertAlmostEqual(300, self.player()["heading"], places=2)
        self.place("player", -15, 0, 0)
        self.hold(["d"], 0.5)
        self.assertAlmostEqual(60, self.player()["heading"], places=2)

    def test_space_held_fires_exactly_one_shell(self):
        s = self.hold(["Space"], 1)
        self.assertEqual(1, s["tanks"]["player"]["shots"])
        self.assertEqual(1, len(s["shells"]))

    def test_inner_wall_stops_the_tank_at_contact(self):
        self.place("player", -12, 8, 0)
        for _ in range(3):
            x = self.hold(["w"], 1)["tanks"]["player"]["x"]
            self.assertLessEqual(x, -10.2 + 0.01)
        self.assertAlmostEqual(-10.2, x, places=2)

    def test_outer_wall_stops_the_tank(self):
        self.place("computer", 0, 10)
        self.place("player", 15, 0, 0)
        self.hold(["w"], 1)
        self.assertAlmostEqual(18.8, self.player()["x"], places=2)

    def test_tanks_stop_at_centre_distance_2_4(self):
        self.place("player", -5, 0, 0)
        self.place("computer", 5, 0, 180)
        s = self.hold(["w"], 3)
        self.assertAlmostEqual(2.6, s["tanks"]["player"]["x"], places=2)
        self.assertAlmostEqual(5, s["tanks"]["computer"]["x"], places=2)

    def test_a_tank_pinned_against_the_edge_by_the_other_stays_inside(self):
        self.place("player", 18.8, 0, 90)
        self.place("computer", 17, 1.6)
        p = self.hold(["w"], 0.5)["tanks"]["player"]
        self.assertLessEqual(p["x"], 18.8)


if __name__ == "__main__":
    unittest.main()

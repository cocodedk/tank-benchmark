"""Shell flight, bounce, damage, cooldown and the three-in-flight cap."""
import unittest

from base import GameCase


class ShellsTest(GameCase):
    def test_shell_across_open_ground_costs_the_computer_25(self):
        self.assertTrue(self.call("fire", {"tank": "player"})["fired"])
        s = self.call("step", {"seconds": 2.5})
        self.assertEqual(75, s["tanks"]["computer"]["health"])
        self.assertEqual(100, s["tanks"]["player"]["health"])
        self.assertEqual([], s["shells"])

    def test_a_grazing_shell_hits_between_steps(self):
        self.place("player", -5, 0, 0)
        self.place("computer", 0.225, 1.449)
        self.call("fire", {"tank": "player"})
        self.assertEqual(75, self.call("step", {"seconds": 1})["tanks"]["computer"]["health"])

    def test_a_shell_exactly_touching_a_tank_hits(self):
        self.place("player", -5, 0, 0)
        self.place("computer", 0, 1.45)
        self.call("fire", {"tank": "player"})
        self.assertEqual(75, self.call("step", {"seconds": 1})["tanks"]["computer"]["health"])

    def test_a_shell_into_a_wall_corner_comes_straight_back(self):
        self.place("player", -11, -3, 315)  # aimed at the corner (-9, -5) of wall (-8, -8)
        self.call("fire", {"tank": "player"})
        s = self.call("step", {"seconds": 1})
        self.assertEqual((75, 100), (s["tanks"]["player"]["health"], s["tanks"]["computer"]["health"]))

    def test_shell_bounces_off_the_outer_wall_and_hits_its_own_tank(self):
        self.place("player", 0, 0, 90)
        self.call("fire", {"tank": "player"})
        s = self.call("step", {"seconds": 1.2})
        self.assertEqual(1, len(s["shells"]))
        self.assertEqual(1, s["shells"][0]["bounces"])
        self.assertTrue(8 < s["shells"][0]["z"] < 12, s["shells"])
        self.assertEqual(100, s["tanks"]["player"]["health"])
        s = self.call("step", {"seconds": 1.2})
        self.assertEqual(75, s["tanks"]["player"]["health"])
        self.assertEqual([], s["shells"])

    def test_second_wall_contact_removes_the_shell(self):
        # heading 85 from (0,0): north wall at x~1.3, then south wall at x~3.9, clear of inner walls.
        self.place("player", 0, 0, 85)
        self.call("fire", {"tank": "player"})
        s = self.call("step", {"seconds": 1.2})
        self.assertEqual([1], [sh["bounces"] for sh in s["shells"]])
        s = self.call("step", {"seconds": 0.8})
        self.assertEqual([1], [sh["bounces"] for sh in s["shells"]])
        s = self.call("step", {"seconds": 1.6})
        self.assertEqual([], s["shells"])
        self.assertEqual([100, 100], [s["tanks"][t]["health"] for t in ("player", "computer")])

    def test_fire_has_a_half_second_cooldown(self):
        self.assertTrue(self.call("fire", {"tank": "player"})["fired"])
        self.assertFalse(self.call("fire", {"tank": "player"})["fired"])
        self.call("step", {"seconds": 0.5})
        self.assertTrue(self.call("fire", {"tank": "player"})["fired"])
        self.assertEqual(2, self.player()["shots"])

    def test_at_most_three_shells_in_flight(self):
        for _ in range(3):
            self.assertTrue(self.call("fire", {"tank": "player"})["fired"])
            self.call("step", {"seconds": 0.5})
        self.assertEqual(3, len(self.state()["shells"]))
        self.assertFalse(self.call("fire", {"tank": "player"})["fired"])
        self.assertEqual(3, self.player()["shots"])


if __name__ == "__main__":
    unittest.main()

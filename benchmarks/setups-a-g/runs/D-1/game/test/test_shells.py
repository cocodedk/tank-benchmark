"""Shells fly at 15 units/s, bounce once, hurt any tank and wait 0.5 s between shots."""
import unittest

from helpers import GameCase


def fire(case, tank="player"):
    return case.call("fire", {"tank": tank})["fired"]


class ShellsTest(GameCase):
    def test_a_shell_leaves_1_6_in_front_at_15_units_a_second(self):
        self.place("player", 0, 0, 90)
        fire(self)
        s = self.call("describe")
        self.assertAlmostEqual(1.6, s["shells"][0]["z"], places=3)
        self.assertEqual(("player", 0), (s["shells"][0]["owner"], s["shells"][0]["bounces"]))
        s = self.step(0.2)
        self.assertAlmostEqual(1.6 + 3, s["shells"][0]["z"], places=3)

    def test_a_shell_across_open_ground_takes_25_health_and_disappears(self):
        fire(self)
        s = self.step(2.5)
        self.assertEqual(75, s["tanks"]["computer"]["health"])
        self.assertEqual(100, s["tanks"]["player"]["health"])
        self.assertEqual([], s["shells"])

    def test_a_shell_bounces_once_and_comes_back_to_hit_its_own_tank(self):
        self.place("computer", 15, 12, 180)
        fire(self)
        s = self.step(2.5)  # past the outer wall at x = 20
        self.assertEqual([1], [sh["bounces"] for sh in s["shells"]])
        self.assertLess(s["shells"][0]["x"], 19.8)
        s = self.step(3)
        self.assertEqual(75, s["tanks"]["player"]["health"])
        self.assertEqual(([], 100), (s["shells"], s["tanks"]["computer"]["health"]))

    def test_a_shell_is_removed_at_its_second_wall(self):
        self.place("player", -14, -8, 0)
        fire(self)
        self.place("player", 0, 12, 0)
        s = self.step(0.3)  # bounced off the inner wall at x = -9
        self.assertEqual([1], [sh["bounces"] for sh in s["shells"]])
        s = self.step(1.5)  # gone at the outer wall at x = -20
        self.assertEqual([], s["shells"])
        self.assertEqual((100, 100), (s["tanks"]["player"]["health"], s["tanks"]["computer"]["health"]))

    def test_a_shell_grazing_a_tank_between_two_steps_still_hits(self):
        self.place("player", -5, 0, 0)
        self.place("computer", 0, 1.448, 180)
        fire(self)
        self.assertEqual(75, self.step(1)["tanks"]["computer"]["health"])

    def test_a_shell_just_touching_a_tank_hits_it(self):
        self.place("player", -5, 0, 0)
        self.place("computer", 0, 1.45, 180)
        fire(self)
        self.assertEqual(75, self.step(1)["tanks"]["computer"]["health"])

    def test_a_shell_grazing_a_wall_face_counts_as_its_first_bounce(self):
        self.place("player", -10.8, -11.1, 0)
        fire(self)
        self.assertEqual([1], [sh["bounces"] for sh in self.step(0.05)["shells"]])

    def test_a_shell_fired_with_the_muzzle_in_the_wall_bounces_at_once(self):
        self.place("player", -10.2, -8, 0)  # the muzzle, 1.6 ahead, is inside the wall
        fire(self)
        self.place("player", 0, 12, 0)  # out of the way of the shell coming back
        self.assertEqual([1], [sh["bounces"] for sh in self.step(0.05)["shells"]])

    def test_a_tank_cannot_fire_twice_within_half_a_second(self):
        self.assertTrue(fire(self))
        self.assertFalse(fire(self))
        self.step(0.45)
        self.assertFalse(fire(self))
        self.step(0.1)
        self.assertTrue(fire(self))

    def test_at_most_three_shells_in_flight(self):
        for _ in range(3):
            self.assertTrue(fire(self))
            self.step(0.5)
        self.assertFalse(fire(self))
        s = self.call("describe")
        self.assertEqual((3, 3), (s["tanks"]["player"]["shots"], len(s["shells"])))

    def test_shells_pass_through_each_other(self):
        fire(self)
        fire(self, "computer")
        s = self.step(3)
        self.assertEqual((75, 75, []), (s["tanks"]["player"]["health"], s["tanks"]["computer"]["health"], s["shells"]))


if __name__ == "__main__":
    unittest.main()

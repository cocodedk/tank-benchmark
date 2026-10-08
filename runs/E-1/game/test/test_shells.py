"""Shells hit tanks, bounce once off walls, and tanks fire at most every 0.5 s with 3 shells out."""
import unittest

from base import GameCase


class ShellTest(GameCase):
    def fire(self, tank="player"):
        return self.call("fire", {"tank": tank})["fired"]

    def test_a_shell_starts_in_front_and_flies_at_15_units_per_second(self):
        self.place("player", 0, 0, 90)
        self.fire()
        shell = self.step(0.2)["shells"][0]
        self.assertAlmostEqual(0, shell["x"], places=6)
        self.assertAlmostEqual(4.6, shell["z"], places=6)
        self.assertEqual(("player", 0), (shell["owner"], shell["bounces"]))

    def test_a_hit_across_open_ground_takes_25_and_removes_the_shell(self):
        self.assertTrue(self.fire())
        state = self.step(2.5)
        self.assertEqual(75, state["tanks"]["computer"]["health"])
        self.assertEqual(100, state["tanks"]["player"]["health"])
        self.assertEqual([], state["shells"])
        self.assertEqual(1, state["tanks"]["player"]["shots"])

    def test_a_shell_bounces_once_and_disappears_at_its_second_wall(self):
        self.place("player", 0, 13, 0)
        self.fire()
        self.place("player", 0, 0, 0)
        first = self.step(1.5)["shells"][0]
        self.assertEqual(1, first["bounces"])
        self.assertAlmostEqual(13, first["z"], places=6)
        self.assertLess(self.step(0.1)["shells"][0]["x"], first["x"])
        state = self.step(3)
        self.assertEqual([], state["shells"])
        self.assertEqual([100, 100], [t["health"] for t in state["tanks"].values()])

    def test_a_shell_grazing_a_tank_between_ticks_still_hits(self):
        self.place("player", 0, 0, 0)
        self.place("computer", 5.225, 1.45, 180)  # exactly touching the shell's path
        self.fire()
        state = self.step(0.5)
        self.assertEqual(75, state["tanks"]["computer"]["health"])
        self.assertEqual([], state["shells"])

    def test_a_shell_reflected_off_an_inner_wall_hits_its_own_tank(self):
        self.place("player", -15, 8, 0)
        self.fire()
        state = self.step(1)
        self.assertEqual(75, state["tanks"]["player"]["health"])
        self.assertEqual([], state["shells"])

    def test_shells_pass_through_each_other(self):
        self.place("computer", 5, 0, 180)
        self.place("player", -5, 0, 0)
        self.fire()
        self.fire("computer")
        state = self.step(1)
        self.assertEqual([75, 75], [t["health"] for t in state["tanks"].values()])

    def test_a_tank_cannot_fire_twice_within_half_a_second(self):
        self.assertTrue(self.fire())
        self.assertFalse(self.fire())
        self.step(29 / 60)
        self.assertFalse(self.fire())
        self.step(1 / 60)
        self.assertTrue(self.fire())

    def test_at_most_three_shells_in_flight(self):
        self.place("player", 0, 13, 0)
        for _ in range(3):
            self.assertTrue(self.fire())
            state = self.step(0.5)
        self.assertEqual(3, len(state["shells"]))
        self.assertFalse(self.fire())


if __name__ == "__main__":
    unittest.main()

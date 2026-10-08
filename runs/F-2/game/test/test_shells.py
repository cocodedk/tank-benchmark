"""Shells: hits, bounces, cooldown and the three-in-flight limit."""
import unittest

from test_common import Base


class ShellsTest(Base):
    def test_a_hit_takes_25_health_and_removes_the_shell(self):
        self.place("player", -5, 0, 0)
        self.place("computer", 5, 0, 180)
        self.assertTrue(self.fire())
        s = self.step(1)
        self.assertEqual(75, s["tanks"]["computer"]["health"])
        self.assertEqual(100, s["tanks"]["player"]["health"])
        self.assertEqual([], s["shells"])

    def test_a_grazing_shell_hits(self):
        self.place("computer", 0, 0, 180)
        self.place("player", -5, 1.449, 0)
        self.assertTrue(self.fire())
        self.assertEqual(75, self.step(1)["tanks"]["computer"]["health"])

    def test_a_just_touching_shell_hits(self):
        self.place("computer", 0, 0, 180)
        self.place("player", -5, 1.45, 0)
        self.assertTrue(self.fire())
        self.assertEqual(75, self.step(1)["tanks"]["computer"]["health"])

    def test_a_shell_grazing_a_corner_between_steps_bounces(self):
        self.place("player", 2.973027, 8.715846, 315)
        self.assertTrue(self.fire())
        s = self.step(0.4)
        self.assertEqual([1], [sh["bounces"] for sh in s["shells"]])

    def test_a_shell_reflects_straight_back_off_a_wall_corner(self):
        self.place("player", -10.5, -12.5, 45)
        self.assertTrue(self.fire())
        s = self.step(0.3)
        self.assertEqual(75, s["tanks"]["player"]["health"])
        self.assertEqual([], s["shells"])

    def test_a_shell_bounces_off_the_outer_wall_and_hits_its_own_tank(self):
        self.place("computer", 15, 10, 180)
        self.place("player", 0, 0, 90)
        self.assertTrue(self.fire())
        s = self.step(1.0)
        self.assertEqual(1, len(s["shells"]))
        self.assertEqual(1, s["shells"][0]["bounces"])
        z = s["shells"][0]["z"]
        self.assertLess(self.step(0.1)["shells"][0]["z"], z)
        s = self.step(3)
        self.assertEqual(75, s["tanks"]["player"]["health"])
        self.assertEqual([], s["shells"])

    def test_a_second_bounce_removes_the_shell(self):
        self.place("computer", 15, -10, 180)
        self.place("player", 0, 0, 45)
        self.assertTrue(self.fire())
        seen = set()
        for _ in range(40):
            s = self.step(0.1)
            seen.update(sh["bounces"] for sh in s["shells"])
        self.assertIn(1, seen)
        self.assertNotIn(2, seen)
        self.assertEqual([], s["shells"])
        self.assertEqual((100, 100), (s["tanks"]["player"]["health"], s["tanks"]["computer"]["health"]))

    def test_firing_waits_half_a_second(self):
        self.assertTrue(self.fire())
        self.assertFalse(self.fire())
        self.step(0.25)
        self.assertFalse(self.fire())
        self.step(0.3)
        self.assertTrue(self.fire())

    def test_three_shells_in_flight_is_the_limit(self):
        self.place("computer", 15, 10, 180)
        self.place("player", 0, -13, 0)
        for _ in range(3):
            self.assertTrue(self.fire())
            self.step(0.5)
        self.assertEqual(3, len(self.state()["shells"]))
        self.assertFalse(self.fire())
        self.assertEqual(3, self.tank("player")["shots"])


if __name__ == "__main__":
    unittest.main()

"""Shells: flight, damage, refire, limit, bounce."""
import unittest

from base import GameCase


class ShellTest(GameCase):
    def test_hit_across_open_ground(self):
        self.assertTrue(self.fire()["fired"])
        sh = self.step(0.05)["shells"][0]
        self.assertEqual("player", sh["owner"])
        self.assertAlmostEqual(sh["x"], -15 + 1.6 + 15 * 0.05, delta=0.3)
        s = self.step(2.5)
        self.assertEqual(75, self.tank(s, "computer")["health"])
        self.assertEqual(100, self.tank(s)["health"])
        self.assertEqual([], s["shells"])
        self.assertEqual(1, self.tank(s)["shots"])

    def test_grazing_shell_is_not_skipped_between_steps(self):
        self.place("computer", 0, 0, 180)
        self.place("player", -5, 1.449, 0)
        self.fire()
        self.assertEqual(75, self.tank(self.step(0.5), "computer")["health"])

    def test_shell_touching_the_tank_exactly_hits(self):
        self.place("computer", 0, 0, 180)
        self.place("player", -5, 1.45, 0)
        self.fire()
        self.assertEqual(75, self.tank(self.step(0.5), "computer")["health"])

    def test_shell_bounces_off_a_wall_corner(self):
        self.place("computer", 15, 10, 180)
        self.place("player", -8.049759197546795, -3.6102408024532053, 315)
        self.fire()
        s = self.step(0.1)
        self.assertEqual([1], [sh["bounces"] for sh in s["shells"]])

    def test_holding_space_fires_one_shell(self):
        self.assertEqual(1, self.tank(self.hold(" ", 1))["shots"])

    def test_refire_after_half_a_second(self):
        self.assertTrue(self.fire()["fired"])
        self.step(0.3)
        self.assertFalse(self.fire()["fired"])
        self.step(0.3)
        self.assertTrue(self.fire()["fired"])

    def test_at_most_three_in_flight(self):
        self.place("computer", 15, 10, 180)
        res = []
        for _ in range(4):
            res.append(self.fire()["fired"])
            s = self.step(0.5)
        self.assertEqual([True, True, True, False], res)
        self.assertEqual(3, len(s["shells"]))

    def test_bounce_off_wall_then_removed(self):
        self.place("player", 10, 0, 0)
        self.place("computer", 15, 10, 180)
        self.fire()
        self.assertTrue(self.place("player", 12, -10, 0)["ok"])
        self.assertEqual(0,self.step(0.2)["shells"][0]["bounces"])
        seen = []
        for _ in range(12):
            s = self.step(0.1)
            if s["shells"]:
                seen.append((s["shells"][0]["bounces"], s["shells"][0]["x"]))
        after = [x for b, x in seen if b == 1]
        self.assertTrue(after, seen)
        self.assertTrue(all(a > b for a, b in zip(after, after[1:])), after)
        s = self.step(3)
        self.assertEqual([], s["shells"])
        self.assertEqual((100, 100), (self.tank(s)["health"], self.tank(s, "computer")["health"]))

    def test_own_shell_hits_its_owner(self):
        self.place("player", 10, 0, 0)
        self.place("computer", 15, 10, 180)
        self.fire()
        s = self.step(4)
        self.assertEqual(75, self.tank(s)["health"])
        self.assertEqual([], s["shells"])


if __name__ == "__main__":
    unittest.main()

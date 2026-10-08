"""Shells: hits, bounces, the cooldown and the limit of three."""
import unittest

from common import fresh, place, state, step, tank
from page import game

PLAYER = {"tank": "player"}


class ShellsTest(unittest.TestCase):
    def test_a_shell_across_open_ground_takes_25_health_and_disappears(self):
        with game() as g:
            fresh(g)
            self.assertEqual({"ok": True, "fired": True}, g.call("fire", PLAYER))
            shell = state(g)["shells"][0]
            self.assertEqual(({"x": -13.4, "z": 0}, "player", 0), ({"x": shell["x"], "z": shell["z"]}, shell["owner"], shell["bounces"]))
            step(g, 0.5)
            self.assertAlmostEqual(-13.4 + 7.5, state(g)["shells"][0]["x"], delta=0.05)
            step(g, 2)
            self.assertEqual((75, 100, []), (tank(g, "computer")["health"], tank(g, "player")["health"], state(g)["shells"]))

    def test_a_shell_bounces_once_off_the_outer_wall_and_goes_at_its_second_wall(self):
        with game() as g:
            fresh(g)
            place(g, "computer", 15, 12)
            g.call("fire", PLAYER)
            place(g, "player", -15, -10)                       # out of the way of the shell coming back
            step(g, 2.5)
            shell = state(g)["shells"][0]
            self.assertEqual(1, shell["bounces"])
            self.assertAlmostEqual(19.75 - (2.5 - 33.15 / 15) * 15, shell["x"], delta=0.3)
            step(g, 3)
            self.assertEqual([], state(g)["shells"])
            self.assertEqual((100, 100), (tank(g, "player")["health"], tank(g, "computer")["health"]))

    def test_a_shell_bounces_off_an_inner_wall_and_can_hit_its_own_tank(self):
        with game() as g:
            fresh(g)
            place(g, "player", -12, 8, 0)
            g.call("fire", PLAYER)
            step(g, 0.1)
            shell = state(g)["shells"][0]
            self.assertEqual(1, shell["bounces"])
            self.assertLess(shell["x"], -9.2)                  # reflected from the wall face at x = -9
            step(g, 1)
            self.assertEqual((75, []), (tank(g, "player")["health"], state(g)["shells"]))

    def test_a_grazing_shell_hits_and_one_clearing_a_wall_corner_does_not_bounce(self):
        with game() as g:
            fresh(g)
            place(g, "player", 0, 0, 0)
            place(g, "computer", 10, 1.449, 180)
            g.call("fire", PLAYER)
            step(g, 1)
            self.assertEqual(75, tank(g, "computer")["health"])
            fresh(g)
            place(g, "player", -10.508147545, 6.108147545, 315)
            g.call("fire", PLAYER)
            step(g, 0.2)
            self.assertEqual(0, state(g)["shells"][0]["bounces"])
            fresh(g)                                           # passing 0.24 from the corner (-9, 5) is a touch
            place(g, "player", -10.389464826, 6.050053570, 315)
            g.call("fire", PLAYER)
            step(g, 0.2)
            self.assertEqual(1, state(g)["shells"][0]["bounces"])
            fresh(g)                                           # touching a tank at a tangent is a hit
            place(g, "player", 0, 0, 0)
            place(g, "computer", 10, 1.45, 180)
            g.call("fire", PLAYER)
            step(g, 1)
            self.assertEqual(75, tank(g, "computer")["health"])

    def test_a_tank_cannot_fire_twice_within_half_a_second(self):
        with game() as g:
            fresh(g)
            place(g, "computer", 15, 12)
            self.assertTrue(g.call("fire", PLAYER)["fired"])
            self.assertFalse(g.call("fire", PLAYER)["fired"])
            step(g, 0.4)
            self.assertFalse(g.call("fire", PLAYER)["fired"])
            step(g, 0.1)
            self.assertTrue(g.call("fire", PLAYER)["fired"])
            self.assertEqual(2, tank(g, "player")["shots"])

    def test_at_most_three_shells_are_in_flight(self):
        with game() as g:
            fresh(g)
            place(g, "computer", 15, 12)
            fired = []
            for _ in range(4):
                fired.append(g.call("fire", PLAYER)["fired"])
                step(g, 0.5)
            self.assertEqual([True, True, True, False], fired)
            self.assertEqual((3, 3), (len(state(g)["shells"]), tank(g, "player")["shots"]))


if __name__ == "__main__":
    unittest.main()

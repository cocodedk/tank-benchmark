"""Shells: spawn, hit, bounce once, cooldown and the limit of three."""
import unittest

from tank import GameTest, place, shoot


class ShellsTest(GameTest):
    def aside(self):
        """Put the computer out of the way of shells flying along z = 0."""
        place(self.g, "computer", 15, 12, 180)

    def test_a_shell_starts_1_6_ahead_and_flies_15_units_a_second(self):
        g = self.g
        place(g, "player", 0, 5, 90)
        g.call("fire", {"tank": "player"})
        self.assertEqual([{"x": 0, "z": 6.6, "owner": "player", "bounces": 0}], g.call("describe")["shells"])
        self.assertAlmostEqual(9.6, g.call("step", {"seconds": 0.2})["shells"][0]["z"], places=3)

    def test_a_shell_across_open_ground_takes_25_health_and_disappears(self):
        s = shoot(self.g)
        self.assertEqual((75, 100, []), (s["tanks"]["computer"]["health"], s["tanks"]["player"]["health"], s["shells"]))

    def test_a_shell_bounces_off_an_inner_wall(self):
        g = self.g
        self.aside()
        place(g, "player", -14, -8)
        g.call("fire", {"tank": "player"})
        s = g.call("step", {"seconds": 0.3})["shells"][0]
        self.assertEqual(1, s["bounces"])
        self.assertLess(s["x"], -10)

    def test_a_shell_bounces_once_and_goes_at_the_second_wall(self):
        g = self.g
        self.aside()
        g.call("fire", {"tank": "player"})
        place(g, "player", -15, 3)  # out of the way of the shell coming back
        s = g.call("step", {"seconds": 2.4})["shells"]
        self.assertEqual([1], [x["bounces"] for x in s])
        self.assertLess(s[0]["x"], 19.75)
        self.assertEqual([], g.call("step", {"seconds": 3})["shells"])
        self.assertEqual(100, g.call("describe")["tanks"]["player"]["health"])

    def test_a_shell_that_comes_back_hits_its_own_tank(self):
        self.aside()
        place(self.g, "player", 0, 0)
        s = shoot(self.g, seconds=5)
        self.assertEqual((75, []), (s["tanks"]["player"]["health"], s["shells"]))

    def test_a_shell_grazing_a_tank_between_two_steps_still_hits(self):
        place(self.g, "computer", 0.225, 1.449)
        self.assertEqual(75, shoot(self.g)["tanks"]["computer"]["health"])

    def test_a_shell_touching_a_tank_exactly_hits(self):
        place(self.g, "computer", 0, 1.45)
        self.assertEqual(75, shoot(self.g)["tanks"]["computer"]["health"])

    def test_a_shell_fired_from_inside_a_wall_bounces_off_it(self):
        place(self.g, "computer", 15, 12, 180)
        place(self.g, "player", -10.2, -5.1)  # the muzzle is inside the wall
        self.g.call("fire", {"tank": "player"})
        s = self.g.call("step", {"seconds": 0.2})
        # it bounced straight back and hit the tank that fired it, instead of flying on through the wall
        self.assertEqual((75, []), (s["tanks"]["player"]["health"], s["shells"]))

    def test_the_computer_can_hit_the_player(self):
        self.assertEqual(75, shoot(self.g, "computer")["tanks"]["player"]["health"])

    def test_no_second_shot_within_half_a_second(self):
        g = self.g
        self.aside()
        self.assertTrue(g.call("fire", {"tank": "player"})["fired"])
        g.call("step", {"seconds": 0.4})
        self.assertFalse(g.call("fire", {"tank": "player"})["fired"])
        g.call("step", {"seconds": 0.1})
        self.assertTrue(g.call("fire", {"tank": "player"})["fired"])
        self.assertEqual(2, g.call("describe")["tanks"]["player"]["shots"])

    def test_at_most_three_shells_in_flight(self):
        g = self.g
        self.aside()
        for _ in range(3):
            self.assertTrue(g.call("fire", {"tank": "player"})["fired"])
            g.call("step", {"seconds": 0.5})
        self.assertFalse(g.call("fire", {"tank": "player"})["fired"])
        self.assertEqual(3, len(g.call("describe")["shells"]))

    def test_shells_pass_through_each_other(self):
        g = self.g
        place(g, "player", -15, 3)
        place(g, "computer", 15, 3, 180)
        g.call("fire", {"tank": "player"})
        g.call("fire", {"tank": "computer"})
        self.assertEqual(2, len(g.call("step", {"seconds": 0.9})["shells"]))


if __name__ == "__main__":
    unittest.main()

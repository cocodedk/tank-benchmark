"""Shells hit, bounce once off a wall, and are limited by reload and count."""
import unittest

from helpers import game, place, quiet


class ShellsTest(unittest.TestCase):
    def test_a_shell_across_open_ground_takes_25_health_and_disappears(self):
        with game() as g:
            quiet(g)
            self.assertEqual({"ok": True, "fired": True}, g.call("fire", {"tank": "player"}))
            shell = g.call("describe")["shells"][0]
            self.assertEqual("player", shell["owner"])
            self.assertEqual(0, shell["bounces"])
            self.assertAlmostEqual(-13.4, shell["x"], places=3)
            state = g.call("step", {"seconds": 2.5})
            self.assertEqual(75, state["tanks"]["computer"]["health"])
            self.assertEqual(100, state["tanks"]["player"]["health"])
            self.assertEqual([], state["shells"])

    def test_a_shell_grazing_a_tank_between_two_steps_still_hits_it(self):
        with game() as g:
            quiet(g)
            place(g, "player", 0, 0, 0)
            place(g, "computer", 5.225, 1.449, 180)
            g.call("fire", {"tank": "player"})
            self.assertEqual(75, g.call("step", {"seconds": 1})["tanks"]["computer"]["health"])

    def test_a_shell_just_touching_a_tank_hits_it(self):
        with game() as g:
            quiet(g)
            place(g, "player", 0, 0, 0)
            place(g, "computer", 5, 1.45, 180)
            g.call("fire", {"tank": "player"})
            self.assertEqual(75, g.call("step", {"seconds": 1})["tanks"]["computer"]["health"])

    def test_a_shell_bounces_once_off_the_outer_wall_and_goes_at_the_second(self):
        with game() as g:
            quiet(g)
            place(g, "computer", 0, 10, 180)
            g.call("fire", {"tank": "player"})
            bounced = g.call("step", {"seconds": 2.4})["shells"]
            self.assertEqual([1], [s["bounces"] for s in bounced])
            self.assertLess(bounced[0]["x"], 19.75)
            self.assertEqual([], g.call("step", {"seconds": 3})["shells"])

    def test_a_shell_bounces_off_an_inner_wall(self):
        with game() as g:
            quiet(g)
            place(g, "computer", 0, -10, 180)
            place(g, "player", -12, 8, 0)
            g.call("fire", {"tank": "player"})
            shell = g.call("step", {"seconds": 0.1})["shells"][0]
            self.assertEqual(1, shell["bounces"])
            self.assertLess(shell["x"], -9.25)
            self.assertAlmostEqual(8, shell["z"], places=3)

    def test_a_shell_that_comes_back_hits_its_own_tank(self):
        with game() as g:
            quiet(g)
            place(g, "computer", 0, 10, 180)
            place(g, "player", 17, 0, 0)
            g.call("fire", {"tank": "player"})
            state = g.call("step", {"seconds": 1})
            self.assertEqual(75, state["tanks"]["player"]["health"])
            self.assertEqual([], state["shells"])

    def test_a_tank_cannot_fire_twice_within_half_a_second(self):
        with game() as g:
            quiet(g)
            self.assertTrue(g.call("fire", {"tank": "player"})["fired"])
            self.assertFalse(g.call("fire", {"tank": "player"})["fired"])
            g.call("step", {"seconds": 0.45})
            self.assertFalse(g.call("fire", {"tank": "player"})["fired"])
            g.call("step", {"seconds": 0.05})
            self.assertTrue(g.call("fire", {"tank": "player"})["fired"])

    def test_at_most_three_shells_are_in_flight(self):
        with game() as g:
            quiet(g)
            place(g, "computer", 0, 10, 180)
            fired = []
            for _ in range(4):
                fired.append(g.call("fire", {"tank": "player"})["fired"])
                g.call("step", {"seconds": 0.5})
            self.assertEqual([True, True, True, False], fired)
            state = g.call("describe")
            self.assertEqual(3, len(state["shells"]))
            self.assertEqual(3, state["tanks"]["player"]["shots"])


if __name__ == "__main__":
    unittest.main()

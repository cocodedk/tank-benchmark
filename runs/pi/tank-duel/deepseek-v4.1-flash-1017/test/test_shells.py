"""Shells fly, bounce once, hit any tank, and obey cooldown and the in-flight cap."""
import unittest

from page import game
from helpers import fresh, place, step, tank


class ShellsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._context = game()
        cls.g = cls._context.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls._context.__exit__(None, None, None)

    def setUp(self):
        fresh(self.g)

    def test_shell_crosses_open_ground_takes_25_and_disappears(self):
        fired = self.g.call("fire", {"tank": "player"})
        self.assertEqual({"ok": True, "fired": True}, fired)
        shell = self.g.call("describe")["shells"][0]
        self.assertAlmostEqual(-13.4, shell["x"], places=6)
        self.assertAlmostEqual(0, shell["z"], places=6)
        self.assertEqual("player", shell["owner"])
        self.assertEqual(0, shell["bounces"])

        state = step(self.g, 1.5)
        self.assertEqual(100, tank(state, "computer")["health"])
        self.assertEqual(1, len(state["shells"]))

        state = step(self.g, 0.5)
        self.assertEqual(75, tank(state, "computer")["health"])
        self.assertEqual([], state["shells"])
        self.assertEqual(100, tank(state)["health"])
        self.assertEqual(1, tank(state)["shots"])

    def test_shell_bounces_once_and_vanishes_at_the_second_wall(self):
        place(self.g, "player", 0, 0, 270)
        self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
        place(self.g, "player", 10, 0, 0)

        state = step(self.g, 1.2)
        self.assertEqual(1, len(state["shells"]))
        self.assertEqual(1, state["shells"][0]["bounces"])
        self.assertGreater(state["shells"][0]["z"], -12)

        state = step(self.g, 1.8)
        self.assertEqual([], state["shells"])
        self.assertEqual(100, tank(state)["health"])
        self.assertEqual(100, tank(state, "computer")["health"])

    def test_a_bounced_shell_can_hit_its_own_tank(self):
        place(self.g, "player", 0, 0, 180)
        self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
        state = step(self.g, 1.3)
        self.assertEqual(1, state["shells"][0]["bounces"])
        state = step(self.g, 1.4)
        self.assertEqual(75, tank(state)["health"])
        self.assertEqual([], state["shells"])

    def test_cooldown_is_half_a_second(self):
        self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
        self.assertFalse(self.g.call("fire", {"tank": "player"})["fired"])
        step(self.g, 0.4)
        self.assertFalse(self.g.call("fire", {"tank": "player"})["fired"])
        step(self.g, 0.1)
        self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
        self.assertEqual(2, tank(self.g.call("describe"))["shots"])

    def test_at_most_three_shells_in_flight(self):
        self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
        step(self.g, 0.5)
        self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
        step(self.g, 0.5)
        self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
        step(self.g, 0.5)
        self.assertFalse(self.g.call("fire", {"tank": "player"})["fired"])
        self.assertEqual(3, tank(self.g.call("describe"))["shots"])

        state = step(self.g, 0.5)
        self.assertEqual(2, len(state["shells"]))
        self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
        self.assertEqual(4, tank(self.g.call("describe"))["shots"])
        self.assertEqual([], self.g.errors)


if __name__ == "__main__":
    unittest.main()

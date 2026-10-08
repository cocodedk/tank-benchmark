"""Shells: hits, one wall bounce, own hits, the fire cooldown, the 3-shell cap and the round end."""
import unittest

from page import game


class ShellsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._ctx = game()
        cls.g = cls._ctx.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls._ctx.__exit__(None, None, None)

    def setUp(self):
        self.g.call("pause", {"paused": True})
        self.g.call("set_ai", {"enabled": False})
        self.g.call("reset", {})

    def describe(self):
        return self.g.call("describe")

    def step(self, seconds):
        return self.g.call("step", {"seconds": seconds})

    def place(self, tank, x, z, heading):
        s = self.g.call("place", {"tank": tank, "x": x, "z": z, "heading": heading})
        self.assertTrue(s["ok"], s)
        return s

    def fire(self, tank):
        return self.g.call("fire", {"tank": tank})["fired"]

    def test_a_shell_hits_the_computer_for_25(self):
        self.assertTrue(self.fire("player"))
        s = self.step(2.5)
        self.assertEqual(75, s["tanks"]["computer"]["health"])
        self.assertEqual([], s["shells"])
        self.assertEqual(100, s["tanks"]["player"]["health"])

    def test_a_shell_bounces_once_off_a_wall_then_is_removed(self):
        self.place("computer", 15, -12, 180)
        self.place("player", 0, 0, 60)  # heading 60 keeps clear of the inner wall at (8, 8)
        self.assertTrue(self.fire("player"))
        s = self.step(1.5)  # the z=15 wall is hit about 1.03 s after firing
        self.assertEqual(1, len(s["shells"]))
        self.assertEqual(1, s["shells"][0]["bounces"])
        z_before = s["shells"][0]["z"]
        s = self.step(0.2)
        self.assertLess(s["shells"][0]["z"], z_before)  # heading back towards z=0
        s = self.step(1.3)  # second wall (x=20) at about 2.5 s
        self.assertEqual([], s["shells"])
        self.assertEqual(100, s["tanks"]["player"]["health"])
        self.assertEqual(100, s["tanks"]["computer"]["health"])

    def test_a_shell_hits_its_own_tank_after_a_bounce(self):
        self.place("computer", 15, -12, 180)
        self.place("player", 0, 0, 90)
        self.assertTrue(self.fire("player"))
        s = self.step(2.5)  # bounces off z=15, comes back down x=0 and hits the player at about 1.8 s
        self.assertEqual(75, s["tanks"]["player"]["health"])
        self.assertEqual([], s["shells"])

    def test_an_inner_wall_reflects_a_shell_across_either_face(self):
        for x, z, heading, first in ((-12, 8, 0, 0.1), (-8, 0, 90, 0.25)):  # west face, then south end
            self.g.call("reset", {})
            self.place("player", x, z, heading)
            self.assertTrue(self.fire("player"))
            s = self.step(first)
            self.assertEqual(1, len(s["shells"]))
            self.assertEqual(1, s["shells"][0]["bounces"])
            s = self.step(0.5)
            self.assertEqual([], s["shells"])
            self.assertEqual(75, s["tanks"]["player"]["health"])

    def test_a_shell_that_grazes_a_tank_between_steps_hits_it(self):
        for z in (1.449, 1.45):  # its path passes inside, then exactly at, 1.2 + 0.25 from the computer's centre
            self.g.call("reset", {})
            self.place("computer", 10, 0, 180)
            self.place("player", 0, z, 0)
            self.assertTrue(self.fire("player"))
            s = self.step(0.75)
            self.assertEqual(75, s["tanks"]["computer"]["health"], z)
            self.assertEqual([], s["shells"], z)

    def test_a_shell_fired_into_a_wall_reflects_back_off_the_face_it_entered(self):
        self.place("player", -10.2, 10, 0)  # the muzzle is inside the wall at (-8, 8)
        self.assertTrue(self.fire("player"))
        s = self.step(1 / 60)  # it reflects off the west face, straight back into its own tank
        self.assertEqual([], s["shells"])
        self.assertEqual(75, s["tanks"]["player"]["health"])

    def test_the_computer_winning_shows_its_banner(self):
        for wait in (0.5, 0.5, 1.0, 2.0):
            self.assertTrue(self.fire("computer"))
            s = self.step(wait)
        self.assertEqual("round_over", s["state"])
        self.assertEqual({"player": 0, "computer": 1}, s["score"])
        self.assertIn("The computer wins the round", self.g.page.locator("#banner").text_content())

    def test_a_tank_waits_half_a_second_between_shots(self):
        self.assertTrue(self.fire("player"))
        self.assertFalse(self.fire("player"))
        self.step(0.4)
        self.assertFalse(self.fire("player"))
        self.step(0.1)
        self.assertTrue(self.fire("player"))

    def test_a_tank_has_at_most_three_shells_in_flight(self):
        self.place("player", -15, -12, 90)  # shells fly up x=-15, clear of walls for 1.6 s
        for _ in range(3):
            self.assertTrue(self.fire("player"))
            self.step(0.5)
        self.assertEqual(3, len(self.describe()["shells"]))
        self.assertFalse(self.fire("player"))

    def test_four_hits_end_the_round_then_a_new_round_starts(self):
        self.assertTrue(self.fire("player"))  # t=0, hits at about 1.8
        self.step(0.5)
        self.assertTrue(self.fire("player"))  # t=0.5
        self.step(0.5)
        self.assertTrue(self.fire("player"))  # t=1.0
        self.step(1.0)
        self.assertTrue(self.fire("player"))  # t=2.0, allowed once the first shell has landed
        s = self.step(2.0)  # t=4.0, the fourth hit landed at about 3.8
        self.assertEqual("round_over", s["state"])
        self.assertEqual(1, s["score"]["player"])
        self.assertEqual(0, s["tanks"]["computer"]["health"])
        banner = self.g.page.locator("#banner")
        self.assertTrue(banner.is_visible())
        self.assertIn("You win the round", banner.text_content())
        s = self.step(2.0)  # t=6.0, the banner ended at about 5.8
        self.assertEqual("playing", s["state"])
        self.assertEqual(2, s["round"])
        self.assertEqual(1, s["score"]["player"])
        self.assertEqual([], s["shells"])
        self.assertEqual(100, s["tanks"]["player"]["health"])
        self.assertEqual(100, s["tanks"]["computer"]["health"])
        self.assertAlmostEqual(-15, s["tanks"]["player"]["x"])
        self.assertAlmostEqual(0, s["tanks"]["player"]["z"])
        self.assertAlmostEqual(15, s["tanks"]["computer"]["x"])
        self.assertAlmostEqual(0, s["tanks"]["computer"]["z"])
        self.assertFalse(banner.is_visible())


if __name__ == "__main__":
    unittest.main()

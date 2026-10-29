"""Shells: firing, the cooldown, the flight limit, wall bounces and removal, and hits."""
import unittest

from page import game


def place(g, tank, x, z, heading):
    g.call("place", {"tank": tank, "x": x, "z": z, "heading": heading})


def fire(g, tank="player"):
    return g.call("fire", {"tank": tank})["fired"]


class ShellTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.context = game()
        cls.g = cls.context.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls.context.__exit__(None, None, None)

    def setUp(self):
        self.g.call("pause", {"paused": True})
        self.g.call("set_ai", {"enabled": False})
        self.g.call("reset")

    def state(self):
        return self.g.call("describe")

    def lone_shell(self, s):
        self.assertEqual(1, len(s["shells"]))
        return s["shells"][0]

    def test_firing_from_the_start_spawns_a_shell_that_hits_the_computer(self):
        self.assertTrue(fire(self.g))
        s = self.state()
        shell = self.lone_shell(s)
        self.assertAlmostEqual(-13.4, shell["x"], delta=0.05)
        self.assertAlmostEqual(0.0, shell["z"], delta=0.05)
        self.assertEqual("player", shell["owner"])
        self.assertEqual(0, shell["bounces"])
        self.assertEqual(1, s["tanks"]["player"]["shots"])

        self.g.call("step", {"seconds": 2.5})
        s = self.state()
        self.assertEqual(75, s["tanks"]["computer"]["health"])
        self.assertEqual(100, s["tanks"]["player"]["health"])
        self.assertEqual([], s["shells"])

    def test_holding_space_fires_exactly_one_shell(self):
        self.g.page.keyboard.down(" ")
        self.g.call("step", {"seconds": 0.3})
        self.g.page.keyboard.up(" ")
        s = self.state()
        self.assertEqual(1, s["tanks"]["player"]["shots"])
        self.lone_shell(s)

    def test_the_cooldown_is_half_a_second(self):
        self.assertTrue(fire(self.g))
        self.assertFalse(fire(self.g))
        self.g.call("step", {"seconds": 0.3})
        self.assertFalse(fire(self.g))
        self.g.call("step", {"seconds": 0.25})
        self.assertTrue(fire(self.g))

    def test_at_most_three_shells_are_in_flight(self):
        place(self.g, "computer", 15, 12, 180)
        for _ in range(3):
            self.assertTrue(fire(self.g))
            self.g.call("step", {"seconds": 0.5})
        self.assertFalse(fire(self.g))
        s = self.state()
        self.assertEqual(3, len(s["shells"]))
        self.assertEqual(3, s["tanks"]["player"]["shots"])

    def test_a_shell_bounces_off_the_outer_wall(self):
        place(self.g, "computer", 15, 12, 180)
        place(self.g, "player", 0, 0, 90)
        self.assertTrue(fire(self.g))
        shell = None
        for _ in range(20):
            self.g.call("step", {"seconds": 0.1})
            shell = self.lone_shell(self.state())
            if shell["bounces"] == 1:
                break
        self.assertEqual(1, shell["bounces"])
        self.assertGreater(shell["z"], 12)

        before = shell["z"]
        self.g.call("step", {"seconds": 0.1})
        after = self.lone_shell(self.state())
        self.assertEqual(1, after["bounces"])
        self.assertLess(after["z"], before)

    def test_a_returning_shell_hits_its_own_tank(self):
        place(self.g, "computer", 15, 12, 180)
        place(self.g, "player", 0, 0, 90)
        self.assertTrue(fire(self.g))
        for _ in range(60):
            self.g.call("step", {"seconds": 0.1})
            if not self.state()["shells"]:
                break
        s = self.state()
        self.assertEqual([], s["shells"])
        self.assertEqual(75, s["tanks"]["player"]["health"])
        self.assertEqual(100, s["tanks"]["computer"]["health"])

    def test_a_shell_is_removed_at_its_second_wall_contact(self):
        place(self.g, "computer", -15, 12, 0)
        place(self.g, "player", 0, 0, 30)
        self.assertTrue(fire(self.g))
        bounces = set()
        for _ in range(60):
            s = self.state()
            if not s["shells"]:
                break
            bounces.update(shell["bounces"] for shell in s["shells"])
            self.g.call("step", {"seconds": 0.1})
        s = self.state()
        self.assertEqual([], s["shells"])
        self.assertEqual({0, 1}, bounces)
        self.assertEqual(100, s["tanks"]["player"]["health"])
        self.assertEqual(100, s["tanks"]["computer"]["health"])

    def test_a_point_blank_wall_shot_reflects_onto_its_own_tank(self):
        place(self.g, "player", -10.3, -8, 0)
        self.assertTrue(fire(self.g))
        self.g.call("step", {"seconds": 0.1})
        s = self.state()
        self.assertEqual([], s["shells"])
        self.assertEqual(75, s["tanks"]["player"]["health"])

    def test_a_grazing_shell_hits(self):
        place(self.g, "computer", 5, 0, 180)
        place(self.g, "player", 0, 1.4499, 0)
        self.assertTrue(fire(self.g))
        self.g.call("step", {"seconds": 1})
        self.assertEqual(75, self.state()["tanks"]["computer"]["health"])

    def test_shells_pass_through_each_other(self):
        self.assertTrue(fire(self.g, "player"))
        self.assertTrue(fire(self.g, "computer"))
        self.g.call("step", {"seconds": 1.0})
        s = self.state()
        self.assertEqual({"player", "computer"}, {shell["owner"] for shell in s["shells"]})
        self.assertEqual(2, len(s["shells"]))

        self.g.call("step", {"seconds": 1.5})
        s = self.state()
        self.assertEqual(75, s["tanks"]["player"]["health"])
        self.assertEqual(75, s["tanks"]["computer"]["health"])


if __name__ == "__main__":
    unittest.main()

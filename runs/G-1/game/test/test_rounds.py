"""Rounds: four hits end a round, the banner, the new round, and the computer's AI."""
import math
import unittest

from page import game

# Inner walls as (x0, x1, z0, z1), from the spec.
WALLS = [(-9, -7, -11, -5), (-9, -7, 5, 11), (7, 9, -11, -5), (7, 9, 5, 11)]


def place(g, tank, x, z, heading):
    g.call("place", {"tank": tank, "x": x, "z": z, "heading": heading})


def fire(g, tank="player"):
    return g.call("fire", {"tank": tank})["fired"]


def wait_for(g, done, step=0.1, limit=5.0):
    """Step the paused game in small steps until done(state) holds; return that state."""
    s = g.call("describe")
    for _ in range(round(limit / step)):
        if done(s):
            break
        g.call("step", {"seconds": step})
        s = g.call("describe")
    return s


def distance_to_wall(x, z, wall):
    x0, x1, z0, z1 = wall
    dx = x - min(max(x, x0), x1)
    dz = z - min(max(z, z0), z1)
    return math.hypot(dx, dz)


class RoundTest(unittest.TestCase):
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

    def finish_round(self, shooter, target):
        """Three hits 0.8 s apart, then a fourth; returns the state once the round is over."""
        for health in (75, 50, 25):
            self.assertTrue(fire(self.g, shooter))
            self.g.call("step", {"seconds": 0.8})
            self.assertEqual(health, self.state()["tanks"][target]["health"])
        self.assertTrue(fire(self.g, shooter))
        return wait_for(self.g, lambda s: s["state"] == "round_over")

    def test_four_hits_end_the_round_and_a_new_round_starts(self):
        place(self.g, "computer", -5, 0, 180)
        s = self.finish_round("player", "computer")
        self.assertEqual("round_over", s["state"])
        self.assertEqual({"player": 1, "computer": 0}, s["score"])
        self.assertEqual(1, s["round"])
        self.assertIn("You win the round", self.g.page.text_content("#banner"))
        self.assertTrue(self.g.page.is_visible("#banner"))

        self.g.call("step", {"seconds": 1.8})
        self.assertEqual("round_over", self.state()["state"])

        self.g.call("step", {"seconds": 0.3})
        s = self.state()
        self.assertEqual("playing", s["state"])
        self.assertEqual(2, s["round"])
        self.assertEqual({"player": 1, "computer": 0}, s["score"])
        self.assertEqual([], s["shells"])
        for tank, x, heading in (("player", -15, 0), ("computer", 15, 180)):
            self.assertAlmostEqual(x, s["tanks"][tank]["x"], delta=0.01)
            self.assertAlmostEqual(0, s["tanks"][tank]["z"], delta=0.01)
            self.assertAlmostEqual(heading, s["tanks"][tank]["heading"], delta=0.01)
            self.assertEqual(100, s["tanks"][tank]["health"])

    def test_the_computer_can_win_a_round(self):
        place(self.g, "player", 5, 0, 0)
        s = self.finish_round("computer", "player")
        self.assertEqual("round_over", s["state"])
        self.assertEqual({"player": 0, "computer": 1}, s["score"])
        self.assertEqual(1, s["round"])
        self.assertIn("The computer wins the round", self.g.page.text_content("#banner"))
        self.assertTrue(self.g.page.is_visible("#banner"))

    def test_the_ai_hits_a_still_player(self):
        self.g.call("set_ai", {"enabled": True})
        for _ in range(30):
            self.g.call("step", {"seconds": 1.0})
            if self.state()["tanks"]["player"]["health"] < 100:
                break
        s = self.state()
        self.assertLess(s["tanks"]["player"]["health"], 100)
        self.assertGreater(s["tanks"]["computer"]["shots"], 0)

    def test_the_ai_finds_a_hidden_player_without_entering_a_wall(self):
        self.g.call("set_ai", {"enabled": True})
        place(self.g, "player", -12, -8, 0)
        moved = False
        hurt = False
        for _ in range(120):
            self.g.call("step", {"seconds": 0.25})
            s = self.state()
            x, z = s["tanks"]["computer"]["x"], s["tanks"]["computer"]["z"]
            moved = moved or math.hypot(x - 15, z) > 0.01
            for wall in WALLS:
                self.assertGreaterEqual(distance_to_wall(x, z, wall), 1.2 - 0.01, f"computer in wall at {x}, {z}")
            self.assertLessEqual(abs(x), 18.8 + 0.01, f"computer left the arena at x={x}")
            self.assertLessEqual(abs(z), 13.8 + 0.01, f"computer left the arena at z={z}")
            if s["tanks"]["player"]["health"] < 100:
                hurt = True
                break
        self.assertTrue(moved)
        self.assertTrue(hurt)


if __name__ == "__main__":
    unittest.main()

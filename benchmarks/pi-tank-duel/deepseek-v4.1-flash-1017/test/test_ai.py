"""The default AI shoots a still player and drives around walls to reach one."""
import math
import unittest

from page import game
from helpers import fresh, place, step, tank, wall_overlap


class AiTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._context = game()
        cls.g = cls._context.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls._context.__exit__(None, None, None)

    def setUp(self):
        fresh(self.g, ai=True)

    def test_it_fires_and_hits_a_still_player_within_30_seconds(self):
        hit = False
        state = None
        for _ in range(60):
            state = step(self.g, 0.5)
            if tank(state)["health"] < 100 or state["score"]["computer"] > 0:
                hit = True
                break
        self.assertTrue(hit, state)
        self.assertGreater(tank(state, "computer")["shots"], 0)

    def test_it_drives_around_a_wall_without_entering_one(self):
        place(self.g, "player", 8, 13, 0)
        start = tank(self.g.call("describe"), "computer")
        found = False
        state = None
        for _ in range(60):
            state = step(self.g, 0.5)
            computer = tank(state, "computer")
            self.assertFalse(wall_overlap(computer), computer)
            if tank(state)["health"] < 100 or state["score"]["computer"] > 0:
                found = True
                break
        self.assertTrue(found, state)
        end = tank(state, "computer")
        self.assertGreater(math.hypot(end["x"] - start["x"], end["z"] - start["z"]), 3)

    def test_ai_off_leaves_the_computer_still(self):
        fresh(self.g, ai=False)
        state = step(self.g, 5)
        self.assertEqual((-15, 0, 100), (tank(state)["x"], tank(state)["z"], tank(state)["health"]))
        self.assertEqual({"x": 15, "z": 0, "heading": 180, "health": 100, "shots": 0},
                         tank(state, "computer"))
        self.assertEqual([], self.g.errors)


if __name__ == "__main__":
    unittest.main()

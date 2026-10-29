"""Keys drive the tank at the speeds in the spec, and walls and tanks stop it."""
import unittest

from page import game
from helpers import fresh, held, place, step, tank


class ControlsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._context = game()
        cls.g = cls._context.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls._context.__exit__(None, None, None)

    def setUp(self):
        fresh(self.g)

    def test_w_moves_six_units_and_s_reverses_four(self):
        with held(self.g.page, "w"):
            state = step(self.g, 1)
        self.assertAlmostEqual(-9, tank(state)["x"], places=6)
        self.assertAlmostEqual(0, tank(state)["z"], places=6)

        fresh(self.g)
        place(self.g, "player", 0, 0, 0)
        with held(self.g.page, "s"):
            state = step(self.g, 1)
        self.assertAlmostEqual(-4, tank(state)["x"], places=6)

    def test_arrow_keys_match_wasd(self):
        with held(self.g.page, "ArrowUp"):
            state = step(self.g, 1)
        self.assertAlmostEqual(-9, tank(state)["x"], places=6)

        fresh(self.g)
        with held(self.g.page, "ArrowLeft"):
            state = step(self.g, 0.5)
        self.assertAlmostEqual(300, tank(state)["heading"], places=6)

    def test_a_and_d_turn_opposite_ways_at_120_degrees_per_second(self):
        with held(self.g.page, "a"):
            left = step(self.g, 0.5)
        self.assertAlmostEqual(300, tank(left)["heading"], places=6)
        self.assertAlmostEqual(-15, tank(left)["x"], places=6)

        fresh(self.g)
        with held(self.g.page, "d"):
            right = step(self.g, 0.5)
        self.assertAlmostEqual(60, tank(right)["heading"], places=6)
        self.assertAlmostEqual(-15, tank(right)["x"], places=6)

    def test_space_fires_a_shell(self):
        with held(self.g.page, "Space"):
            state = step(self.g, 0.1)
        self.assertEqual(1, tank(state)["shots"])
        self.assertEqual(1, len(state["shells"]))
        self.assertEqual("player", state["shells"][0]["owner"])

    def test_outer_wall_stops_the_tank(self):
        place(self.g, "player", 0, 0, 270)
        with held(self.g.page, "w"):
            state = step(self.g, 5)
        self.assertAlmostEqual(-13.8, tank(state)["z"], places=6)
        self.assertAlmostEqual(0, tank(state)["x"], places=6)

    def test_inner_wall_stops_the_tank(self):
        place(self.g, "player", -8, 0, 270)
        with held(self.g.page, "w"):
            state = step(self.g, 2)
        self.assertAlmostEqual(-3.8, tank(state)["z"], places=6)
        self.assertAlmostEqual(-8, tank(state)["x"], places=6)

    def test_a_tank_stops_at_the_other_tank(self):
        place(self.g, "computer", 0, 0, 180)
        place(self.g, "player", -5, 0, 0)
        with held(self.g.page, "w"):
            state = step(self.g, 1)
        self.assertAlmostEqual(-2.4, tank(state)["x"], places=6)
        self.assertAlmostEqual(0, tank(state, "computer")["x"], places=6)
        self.assertEqual([], self.g.errors)


if __name__ == "__main__":
    unittest.main()

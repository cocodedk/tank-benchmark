"""Driving: keys move the tank, walls and the other tank stop it."""
import unittest

from page import game

POS = 0.05   # position tolerance, in units
HEAD = 0.5   # heading tolerance, in degrees


def place(g, who, x, z, heading):
    g.call("place", {"tank": who, "x": x, "z": z, "heading": heading})


def hold(g, keys, seconds):
    """Hold keys down while the game steps `seconds`; return the state after."""
    for key in keys:
        g.page.keyboard.down(key)
    try:
        g.call("step", {"seconds": seconds})
    finally:
        for key in keys:
            g.page.keyboard.up(key)
    return g.call("describe")


def tank_state(state, who):
    return state["tanks"][who]


class DrivingTest(unittest.TestCase):
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

    def test_w_drives_forward_six_units_a_second(self):
        g = self.g
        place(g, "player", -15, 0, 0)
        p = tank_state(hold(g, ["w"], 1), "player")
        self.assertAlmostEqual(p["x"], -9, delta=POS)
        self.assertAlmostEqual(p["z"], 0, delta=POS)

    def test_arrow_up_drives_forward_too(self):
        g = self.g
        place(g, "player", -15, 0, 0)
        p = tank_state(hold(g, ["ArrowUp"], 1), "player")
        self.assertAlmostEqual(p["x"], -9, delta=POS)
        self.assertAlmostEqual(p["z"], 0, delta=POS)

    def test_s_reverses_four_units_a_second(self):
        g = self.g
        place(g, "player", 0, 0, 0)
        p = tank_state(hold(g, ["s"], 1), "player")
        self.assertAlmostEqual(p["x"], -4, delta=POS)
        self.assertAlmostEqual(p["z"], 0, delta=POS)

    def test_a_turns_left_and_d_turns_right(self):
        g = self.g
        place(g, "player", -15, 0, 0)
        h = tank_state(hold(g, ["a"], 1), "player")["heading"]
        self.assertAlmostEqual(h, 240, delta=HEAD)
        place(g, "player", -15, 0, 0)
        h = tank_state(hold(g, ["d"], 1), "player")["heading"]
        self.assertAlmostEqual(h, 120, delta=HEAD)

    def test_w_moves_along_the_heading(self):
        g = self.g
        place(g, "player", -15, 0, 90)
        p = tank_state(hold(g, ["w"], 1), "player")
        self.assertAlmostEqual(p["x"], -15, delta=POS)
        self.assertAlmostEqual(p["z"], 6, delta=POS)

    def test_space_fires_one_shell(self):
        g = self.g
        place(g, "player", -15, 0, 0)
        s = hold(g, ["Space"], 0.3)
        self.assertEqual(tank_state(s, "player")["shots"], 1)
        self.assertEqual(len(s["shells"]), 1)
        self.assertEqual(s["shells"][0]["owner"], "player")

    def test_inner_wall_stops_the_tank_and_holds_it_there(self):
        g = self.g
        place(g, "player", -12, 8, 0)
        xs = []
        g.page.keyboard.down("w")
        try:
            for _ in range(6):
                g.call("step", {"seconds": 0.5})
                xs.append(tank_state(g.call("describe"), "player")["x"])
        finally:
            g.page.keyboard.up("w")
        for x in xs:
            self.assertLessEqual(x, -10.2 + POS)
        self.assertAlmostEqual(xs[-1], -10.2, delta=POS)

    def test_outer_wall_east_stops_the_tank(self):
        g = self.g
        place(g, "computer", 0, -12, 0)
        place(g, "player", 15, 0, 0)
        p = tank_state(hold(g, ["w"], 2), "player")
        self.assertAlmostEqual(p["x"], 18.8, delta=POS)

    def test_outer_wall_north_stops_the_tank(self):
        g = self.g
        place(g, "computer", 0, -12, 0)
        place(g, "player", 0, 10, 90)
        p = tank_state(hold(g, ["w"], 2), "player")
        self.assertAlmostEqual(p["z"], 13.8, delta=POS)

    def test_tank_slides_along_an_inner_wall(self):
        g = self.g
        place(g, "player", -12, 8, 10)
        p = tank_state(hold(g, ["w"], 3), "player")
        self.assertLessEqual(p["x"], -10.2 + POS)
        self.assertGreater(p["z"], 8.5)

    def test_other_tank_stops_the_tank(self):
        g = self.g
        place(g, "computer", 0, 0, 180)
        place(g, "player", -6, 0, 0)
        p = tank_state(hold(g, ["w"], 2), "player")
        self.assertAlmostEqual(p["x"], -2.4, delta=POS)


if __name__ == "__main__":
    unittest.main()

"""Driving: the keys move and turn the player, and walls and the other tank stop it at contact."""
import contextlib
import math
import unittest

from page import game


def wrap(deg: float) -> float:
    """Signed angle in (-180, 180], so 359.5 reads as -0.5."""
    return (deg + 180) % 360 - 180


class DrivingTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls.stack = contextlib.ExitStack()
        cls.g = cls.stack.enter_context(game())

    @classmethod
    def tearDownClass(cls):
        cls.stack.close()

    def setUp(self):
        self.g.call("pause", {"paused": True})
        self.g.call("set_ai", {"enabled": False})
        self.g.call("reset")

    def tank(self, name: str) -> dict:
        return self.g.call("describe")["tanks"][name]

    def place(self, tank: str, x: float, z: float, heading: float):
        s = self.g.call("place", {"tank": tank, "x": x, "z": z, "heading": heading})
        self.assertIs(s["ok"], True, s)

    def hold(self, keys: list[str], seconds: float):
        """Hold keys while the paused game steps `seconds`, then release them."""
        for key in keys:
            self.g.page.keyboard.down(key)
        try:
            s = self.g.call("step", {"seconds": seconds})
            self.assertIs(s["ok"], True, s)
        finally:
            for key in keys:
                self.g.page.keyboard.up(key)

    def assertAt(self, name: str, x: float, z: float, heading: float | None = None):
        t = self.tank(name)
        self.assertAlmostEqual(t["x"], x, delta=0.05)
        self.assertAlmostEqual(t["z"], z, delta=0.05)
        if heading is not None:
            self.assertAlmostEqual(wrap(t["heading"] - heading), 0, delta=0.5)

    def test_w_drives_forward_at_six_units_a_second(self):
        self.hold(["w"], 1)
        self.assertAt("player", -9, 0, heading=0)

    def test_arrow_up_drives_forward_too(self):
        self.hold(["ArrowUp"], 1)
        self.assertAt("player", -9, 0, heading=0)

    def test_s_reverses_at_four_units_a_second(self):
        self.place("player", 0, 0, 0)
        self.hold(["s"], 1)
        self.assertAt("player", -4, 0)

    def test_a_and_d_turn_sixty_degrees_in_half_a_second_each_way(self):
        self.place("player", 0, 0, 0)
        self.hold(["a"], 0.5)
        left = wrap(self.tank("player")["heading"])
        self.place("player", 0, 0, 0)
        self.hold(["d"], 0.5)
        right = wrap(self.tank("player")["heading"])
        self.assertAlmostEqual(abs(left), 60, delta=0.5)
        self.assertAlmostEqual(abs(right), 60, delta=0.5)
        self.assertLess(left * right, 0)

    def test_forward_follows_the_heading(self):
        self.place("player", 0, -3, 90)
        self.hold(["w"], 1)
        self.assertAt("player", 0, 3, heading=90)

    def test_an_inner_wall_stops_the_tank_at_contact(self):
        self.place("player", -14, -8, 0)
        self.hold(["w"], 2)
        self.assertAt("player", -10.2, -8)

    def test_the_outer_wall_stops_the_tank_at_contact(self):
        self.place("computer", 0, 13, 180)
        self.place("player", 15, 0, 0)
        self.hold(["w"], 2)
        self.assertAt("player", 18.8, 0)

    def test_the_other_tank_stops_the_tank_at_contact(self):
        self.place("computer", -5, 0, 180)
        self.place("player", -12, 0, 0)
        self.hold(["w"], 2)
        p, c = self.tank("player"), self.tank("computer")
        self.assertAlmostEqual(math.hypot(p["x"] - c["x"], p["z"] - c["z"]), 2.4, delta=0.1)
        self.assertAlmostEqual(c["x"], -5, delta=0.05)

    def test_a_wall_never_pushes_a_tank_into_the_other(self):
        self.place("computer", 0, 12, 0)
        self.place("player", 2.4, 12, 135)
        self.hold(["w"], 4)
        p, c = self.tank("player"), self.tank("computer")
        self.assertGreaterEqual(math.hypot(p["x"] - c["x"], p["z"] - c["z"]), 2.4 - 1e-4)


if __name__ == "__main__":
    unittest.main()

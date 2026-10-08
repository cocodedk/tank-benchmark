"""Keys drive, turn and fire; tanks stop at walls and at each other."""
import unittest

from helpers import GameCase


class MovesTest(GameCase):
    def test_w_for_one_second_moves_six_units_along_the_heading(self):
        t = self.hold("w", 1)["tanks"]["player"]
        self.assertAlmostEqual(-9, t["x"], places=3)
        self.assertAlmostEqual(0, t["z"], places=3)
        self.place("player", 0, 0, 90)
        t = self.hold("ArrowUp", 1)["tanks"]["player"]
        self.assertAlmostEqual(6, t["z"], places=3)

    def test_s_reverses_at_four_units_per_second(self):
        self.place("player", 0, 0, 0)
        self.assertAlmostEqual(-4, self.hold("s", 1)["tanks"]["player"]["x"], places=3)
        self.assertAlmostEqual(-8, self.hold("ArrowDown", 1)["tanks"]["player"]["x"], places=3)

    def test_d_and_a_turn_in_opposite_directions_at_120_degrees_a_second(self):
        self.assertAlmostEqual(60, self.hold("d", 0.5)["tanks"]["player"]["heading"], places=3)
        self.assertAlmostEqual(300, self.hold("a", 1)["tanks"]["player"]["heading"], places=3)
        self.assertAlmostEqual(30, self.hold("ArrowRight", 0.75)["tanks"]["player"]["heading"], places=3)
        self.assertAlmostEqual(90, self.hold("ArrowLeft", 2.5)["tanks"]["player"]["heading"], places=3)

    def test_holding_space_fires_one_shell(self):
        s = self.hold(" ", 1)
        self.assertEqual(1, s["tanks"]["player"]["shots"])
        self.assertEqual(1, len(s["shells"]))

    def test_driving_into_an_inner_wall_stops_at_it(self):
        self.place("player", -14, -8, 0)
        self.assertAlmostEqual(-10.2, self.hold("w", 2)["tanks"]["player"]["x"], places=3)
        self.place("player", -4, -8, 0)
        self.assertAlmostEqual(-5.8, self.hold("s", 2)["tanks"]["player"]["x"], places=3)  # backs into the wall at x = -7

    def test_driving_into_the_outer_wall_stops_at_it(self):
        self.place("computer", 15, 12, 180)
        self.place("player", 0, 0, 0)
        self.assertAlmostEqual(18.8, self.hold("w", 4)["tanks"]["player"]["x"], places=3)
        self.place("player", 0, 0, 90)
        self.assertAlmostEqual(13.8, self.hold("w", 4)["tanks"]["player"]["z"], places=3)
        self.place("player", 0, 0, 270)
        self.assertAlmostEqual(-13.8, self.hold("w", 4)["tanks"]["player"]["z"], places=3)
        self.place("player", 0, 0, 0)
        self.assertAlmostEqual(-18.8, self.hold("s", 6)["tanks"]["player"]["x"], places=3)

    def test_a_tank_slides_along_a_wall(self):
        self.place("player", -12, -8, 45)
        t = self.hold("w", 0.6)["tanks"]["player"]
        self.assertAlmostEqual(-10.2, t["x"], places=3)
        self.assertGreater(t["z"], -6)

    def test_a_key_stays_held_while_another_key_for_it_is_down(self):
        kb = self.g.page.keyboard
        kb.down("w")
        kb.down("ArrowUp")
        kb.up("w")
        try:
            self.assertAlmostEqual(-9, self.step(1)["tanks"]["player"]["x"], places=3)
        finally:
            kb.up("ArrowUp")

    def test_a_tank_pinned_between_a_wall_and_the_other_tank_keeps_its_distance(self):
        self.place("computer", 17, 0, 180)
        self.place("player", 18.767767, 1.767767, 240)
        s = self.hold("w", 0.1)
        p, c = s["tanks"]["player"], s["tanks"]["computer"]
        self.assertGreaterEqual(((p["x"] - c["x"]) ** 2 + (p["z"] - c["z"]) ** 2) ** 0.5, 2.4 - 1e-6)

    def test_a_tank_stops_at_the_other_tank(self):
        self.place("computer", 0, 0, 180)
        self.place("player", -5, 0, 0)
        self.assertAlmostEqual(-2.4, self.hold("w", 2)["tanks"]["player"]["x"], places=3)


if __name__ == "__main__":
    unittest.main()

"""Keys drive, turn and fire; walls and the other tank stop a tank."""
import unittest

from tank import GameTest, hold, place


def player(state):
    return state["tanks"]["player"]


class DrivingTest(GameTest):
    def test_w_moves_6_units_and_s_reverses_4(self):
        g = self.g
        self.assertAlmostEqual(-9, player(hold(g, ["w"], 1))["x"], places=3)
        self.assertAlmostEqual(-13, player(hold(g, ["s"], 1))["x"], places=3)

    def test_arrow_keys_drive_and_turn(self):
        g = self.g
        self.assertAlmostEqual(-9, player(hold(g, ["ArrowUp"], 1))["x"], places=3)
        self.assertAlmostEqual(-13, player(hold(g, ["ArrowDown"], 1))["x"], places=3)
        self.assertAlmostEqual(120, player(hold(g, ["ArrowRight"], 1))["heading"], places=3)
        self.assertAlmostEqual(0, player(hold(g, ["ArrowLeft"], 1))["heading"], places=3)

    def test_d_and_a_turn_in_opposite_directions(self):
        g = self.g
        self.assertAlmostEqual(120, player(hold(g, ["d"], 1))["heading"], places=3)
        self.assertAlmostEqual(0, player(hold(g, ["a"], 1))["heading"], places=3)
        self.assertAlmostEqual(240, player(hold(g, ["a"], 1))["heading"], places=3)

    def test_driving_follows_the_heading(self):
        place(self.g, "player", 0, 0, 90)
        s = player(hold(self.g, ["w"], 1))
        self.assertAlmostEqual(0, s["x"], places=3)
        self.assertAlmostEqual(6, s["z"], places=3)

    def test_holding_space_fires_one_shell(self):
        g = self.g
        g.page.keyboard.down("Space")
        s = g.call("step", {"seconds": 1})
        g.page.keyboard.up("Space")
        self.assertEqual(1, player(s)["shots"])
        self.assertEqual(1, player(g.call("step", {"seconds": 1}))["shots"])

    def test_an_inner_wall_stops_a_tank(self):
        place(self.g, "player", -14, -8)
        s = player(hold(self.g, ["w"], 3))
        self.assertAlmostEqual(-10.2, s["x"], places=3)  # wall face at -9, minus the radius 1.2
        self.assertAlmostEqual(-8, s["z"], places=3)

    def test_a_tank_slides_along_a_wall(self):
        place(self.g, "player", -14, -8, 20)
        s = player(hold(self.g, ["w"], 1))
        self.assertAlmostEqual(-10.2, s["x"], places=3)
        self.assertAlmostEqual(-5.95, s["z"], places=1)

    def test_a_tank_squeezed_against_a_wall_never_pushes_the_other(self):
        place(self.g, "computer", 17, 0, 180)
        place(self.g, "player", 18.8, 2, 270)
        s = hold(self.g, ["w"], 5 / 60)
        self.assertEqual((17, 0), (s["tanks"]["computer"]["x"], s["tanks"]["computer"]["z"]))

    def test_the_outer_wall_stops_a_tank(self):
        g = self.g
        place(g, "player", -3, 0, 180)
        self.assertAlmostEqual(-18.8, player(hold(g, ["w"], 4))["x"], places=3)
        place(g, "player", 0, 5, 90)
        self.assertAlmostEqual(13.8, player(hold(g, ["w"], 4))["z"], places=3)

    def test_a_tank_cannot_enter_the_other_tank(self):
        place(self.g, "player", 0, 0)
        place(self.g, "computer", 5, 0, 180)
        self.assertAlmostEqual(2.6, player(hold(self.g, ["w"], 2))["x"], places=3)


if __name__ == "__main__":
    unittest.main()

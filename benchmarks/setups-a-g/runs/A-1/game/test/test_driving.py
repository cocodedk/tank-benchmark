"""Keys drive, turn and fire; walls and the other tank stop a tank."""
import unittest

from helpers import game, hold, place, quiet


class DrivingTest(unittest.TestCase):
    def test_w_for_one_second_moves_six_units_along_the_heading(self):
        with game() as g:
            quiet(g)
            place(g, "player", 0, 0, 90)
            tank = hold(g, "w", 1)["tanks"]["player"]
            self.assertAlmostEqual(0, tank["x"], places=3)
            self.assertAlmostEqual(6, tank["z"], places=3)

    def test_s_reverses_at_four_units_per_second(self):
        with game() as g:
            quiet(g)
            place(g, "player", 0, 0, 0)
            self.assertAlmostEqual(-4, hold(g, "ArrowDown", 1)["tanks"]["player"]["x"], places=3)

    def test_d_turns_right_and_a_turns_left_at_120_degrees_a_second(self):
        with game() as g:
            quiet(g)
            place(g, "player", 0, 0, 90)
            self.assertAlmostEqual(150, hold(g, "d", 0.5)["tanks"]["player"]["heading"], places=3)
            self.assertAlmostEqual(30, hold(g, "ArrowLeft", 1)["tanks"]["player"]["heading"], places=3)
            self.assertAlmostEqual(330, hold(g, "a", 0.5)["tanks"]["player"]["heading"], places=3)

    def test_an_inner_wall_stops_the_tank_at_contact(self):
        with game() as g:
            quiet(g)
            place(g, "player", -12, 8, 0)
            tank = hold(g, "w", 2)["tanks"]["player"]
            self.assertAlmostEqual(-10.2, tank["x"], places=3)
            self.assertAlmostEqual(8, tank["z"], places=3)

    def test_the_tank_slides_along_a_wall(self):
        with game() as g:
            quiet(g)
            place(g, "player", -12, 6, 45)
            tank = hold(g, "w", 1)["tanks"]["player"]
            self.assertAlmostEqual(-10.2, tank["x"], places=3)
            self.assertAlmostEqual(10.243, tank["z"], places=3)

    def test_the_outer_wall_stops_the_tank(self):
        with game() as g:
            quiet(g)
            place(g, "computer", 0, 10, 180)
            place(g, "player", 0, 0, 0)
            self.assertAlmostEqual(18.8, hold(g, "w", 5)["tanks"]["player"]["x"], places=3)

    def test_the_other_tank_stops_the_tank(self):
        with game() as g:
            quiet(g)
            place(g, "computer", 10, 0, 180)
            place(g, "player", 0, 0, 0)
            self.assertAlmostEqual(7.6, hold(g, "w", 3)["tanks"]["player"]["x"], places=3)

    def test_a_tank_wedged_between_a_wall_and_the_other_tank_never_overlaps_it(self):
        with game() as g:
            quiet(g)
            place(g, "computer", -11.8, 5.5, 0)
            place(g, "player", -10.2, 3.5, 90)
            for _ in range(10):
                tanks = hold(g, "w", 0.1)["tanks"]
                gap = ((tanks["player"]["x"] - tanks["computer"]["x"]) ** 2 + (tanks["player"]["z"] - tanks["computer"]["z"]) ** 2) ** 0.5
                self.assertGreaterEqual(gap, 2.4 - 1e-6)

    def test_holding_space_fires_one_shell(self):
        with game() as g:
            quiet(g)
            state = hold(g, "Space", 0.3)
            self.assertEqual(1, len(state["shells"]))
            self.assertEqual(1, state["tanks"]["player"]["shots"])

    def test_real_time_drives_the_game_while_it_is_not_paused(self):
        with game() as g:
            quiet(g)
            g.call("pause", {"paused": False})
            g.page.keyboard.down("w")
            g.page.wait_for_timeout(600)
            g.page.keyboard.up("w")
            g.call("pause", {"paused": True})
            self.assertGreater(g.call("describe")["tanks"]["player"]["x"], -15 + 2)


if __name__ == "__main__":
    unittest.main()

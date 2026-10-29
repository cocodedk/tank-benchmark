"""Keys, speeds, walls, real-time play and the page itself."""
import unittest

from common import fresh, hold, place, state, step, tank
from page import game


class DriveTest(unittest.TestCase):
    def test_keys_drive_and_turn_at_the_stated_speeds(self):
        with game() as g:
            for key, dx in [("w", 6), ("ArrowUp", 6), ("s", -4), ("ArrowDown", -4)]:
                fresh(g)
                place(g, "player", 0, 0, 0)
                hold(g, key, 1)
                self.assertAlmostEqual(dx, tank(g, "player")["x"], delta=0.05, msg=key)
            for key, heading in [("a", 240), ("ArrowLeft", 240), ("d", 120), ("ArrowRight", 120)]:
                fresh(g)
                hold(g, key, 1)
                self.assertAlmostEqual(heading, tank(g, "player")["heading"], delta=0.05, msg=key)
            fresh(g)
            place(g, "player", 0, 0, 90)
            hold(g, "w", 1)
            self.assertAlmostEqual(6, tank(g, "player")["z"], delta=0.05)

    def test_holding_space_fires_one_shell(self):
        with game() as g:
            fresh(g)
            hold(g, " ", 1.2)
            self.assertEqual((1, 1), (tank(g, "player")["shots"], len(state(g)["shells"])))

    def test_tanks_stop_at_inner_and_outer_walls_and_at_each_other(self):
        with game() as g:
            fresh(g)
            place(g, "player", -12, 8, 0)
            hold(g, "w", 2)                                    # into the wall at x = -9
            self.assertAlmostEqual(-10.2, tank(g, "player")["x"], delta=0.01)
            place(g, "player", 0, 0, 90)
            hold(g, "w", 4)                                    # into the wall at z = 15
            self.assertAlmostEqual(13.8, tank(g, "player")["z"], delta=0.01)
            place(g, "player", 10, 0, 0)                       # towards the computer at x = 15
            hold(g, "w", 2)
            self.assertAlmostEqual(12.6, tank(g, "player")["x"], delta=0.01)
            place(g, "player", -10.5, 8, 20)                   # slides up the face of the wall at x = -9
            hold(g, "w", 1)
            self.assertGreater(tank(g, "player")["z"], 9.5)
            self.assertAlmostEqual(-10.2, tank(g, "player")["x"], delta=0.01)

    def test_edge_cases_of_squeezing_and_of_keys(self):
        with game() as g:
            fresh(g)                                           # pinned between a tank and a wall: stays out of the wall
            place(g, "computer", -12, 8, 0)
            place(g, "player", -10.2, 10, 270)
            hold(g, "w", 0.5)
            self.assertGreaterEqual(tank(g, "player")["x"], -10.2 - 1e-6)
            fresh(g)                                           # releasing W while ArrowUp is held keeps driving
            place(g, "player", 0, 0, 0)
            g.page.keyboard.down("w")
            g.page.keyboard.down("ArrowUp")
            g.page.keyboard.up("w")
            step(g, 1)
            g.page.keyboard.up("ArrowUp")
            self.assertAlmostEqual(6, tank(g, "player")["x"], delta=0.05)
            g.page.keyboard.down(" ")                          # a Space released before the step fires nothing
            g.page.keyboard.up(" ")
            step(g, 0.1)
            self.assertEqual(0, tank(g, "player")["shots"])

    def test_real_time_drives_the_game_until_it_is_paused(self):
        with game() as g:
            fresh(g)
            g.call("pause", {"paused": False})
            g.page.keyboard.down("w")
            g.page.wait_for_timeout(500)
            g.page.keyboard.up("w")
            g.call("pause", {"paused": True})
            moved = tank(g, "player")["x"]
            self.assertGreater(moved, -15 + 1)
            g.page.wait_for_timeout(200)
            self.assertEqual(moved, tank(g, "player")["x"])

    def test_page_shows_the_hud_and_fills_the_window(self):
        with game() as g:
            fresh(g)
            text = g.page.inner_text("body")
            for word in ["You", "Computer", "Round 1", "Space"]:
                self.assertIn(word, text)
            self.assertEqual((1280, 800), tuple(g.page.evaluate("[document.querySelector('canvas').width, document.querySelector('canvas').height]")))
            g.page.set_viewport_size({"width": 900, "height": 700})
            g.page.wait_for_timeout(100)
            self.assertEqual(900, g.page.evaluate("document.querySelector('canvas').clientWidth"))
            self.assertEqual([], g.errors)


if __name__ == "__main__":
    unittest.main()

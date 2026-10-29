"""Driving, walls, shells, cooldown and rounds, through held keys and the step tool."""
import unittest

from game_case import GameCase


class PlayTest(GameCase):
    def player(self, s):
        return s["tanks"]["player"]

    def test_w_drives_six_units_per_second(self):
        p = self.player(self.hold("w", 1))
        self.assertAlmostEqual(-9, p["x"], places=2)
        self.assertAlmostEqual(0, p["z"], places=2)
        self.assertAlmostEqual(-11, self.player(self.hold("ArrowDown", 0.5))["x"], places=2)

    def test_a_and_d_turn_opposite_ways_at_120_per_second(self):
        self.assertAlmostEqual(60, self.player(self.hold("d", 0.5))["heading"], places=2)
        self.g.call("reset")
        self.assertAlmostEqual(300, self.player(self.hold("a", 0.5))["heading"], places=2)

    def test_holding_space_fires_one_shell(self):
        s = self.hold("Space", 1)
        self.assertEqual(1, len(s["shells"]))
        self.assertEqual(1, self.player(s)["shots"])

    def test_stops_at_inner_and_outer_walls(self):
        self.place("player", -14, 8, 0)
        p = self.player(self.hold("w", 3))
        self.assertAlmostEqual(-10.2, p["x"], places=2)
        self.place("player", 0, 0, 90)
        p = self.player(self.hold("w", 4))
        self.assertAlmostEqual(13.8, p["z"], places=2)

    def test_stops_at_the_other_tank(self):
        self.place("computer", 0, 0, 180)
        self.place("player", -5, 0, 0)
        self.assertAlmostEqual(-2.4, self.player(self.hold("w", 2))["x"], places=2)
        self.hold("d", 0.25)
        p = self.player(self.hold("w", 1))   # slides round it, never into it
        self.assertGreater(p["z"], 1)
        self.assertGreaterEqual((p["x"] ** 2 + p["z"] ** 2) ** 0.5, 2.4 - 1e-3)
        self.assertEqual((0, 0), tuple(self.g.call("describe")["tanks"]["computer"][k] for k in ("x", "z")))

    def test_shell_fired_into_a_touching_wall_bounces_back(self):
        self.place("player", -10.200001, 8, 0)
        self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
        s = self.step(0.1)
        self.assertEqual(([], 75), (s["shells"], self.player(s)["health"]))

    def test_grazing_shell_hits(self):
        self.place("computer", 0, 0, 180)
        self.place("player", -5, 1.449, 0)
        self.g.call("fire", {"tank": "player"})
        s = self.step(1)
        self.assertEqual(([], 75), (s["shells"], s["tanks"]["computer"]["health"]))

    def test_shell_hits_the_other_tank_once(self):
        self.assertEqual({"ok": True, "fired": True}, self.g.call("fire", {"tank": "player"}))
        s = self.step(2.5)
        self.assertEqual((75, 100, []), (s["tanks"]["computer"]["health"], self.player(s)["health"], s["shells"]))

    def test_shell_bounces_back_and_hits_its_own_tank(self):
        self.place("player", 0, 0, 90)
        self.g.call("fire", {"tank": "player"})
        self.assertEqual(0, self.step(0.5)["shells"][0]["bounces"])
        self.assertEqual(1, self.step(0.7)["shells"][0]["bounces"])
        s = self.step(1.0)
        self.assertEqual(([], 75), (s["shells"], self.player(s)["health"]))

    def test_shell_disappears_at_its_second_wall(self):
        self.place("player", 0, 0, 90)
        self.g.call("fire", {"tank": "player"})
        self.step(1.2)
        self.place("player", 5, 0, 90)
        shell = self.step(1.0)["shells"][0]
        self.assertEqual(1, shell["bounces"])
        self.assertLess(shell["z"], 0)
        s = self.step(1.5)
        self.assertEqual(([], 100, 100), (s["shells"], self.player(s)["health"], s["tanks"]["computer"]["health"]))

    def test_cannot_fire_twice_within_half_a_second_nor_with_three_out(self):
        self.place("computer", 15, 10, 180)
        fire = lambda: self.g.call("fire", {"tank": "player"})["fired"]
        self.assertTrue(fire())
        self.step(0.4)
        self.assertFalse(fire())
        self.step(0.1)
        self.assertTrue(fire())
        self.step(0.5)
        self.assertTrue(fire())
        self.step(0.5)
        self.assertFalse(fire())
        self.assertEqual(3, self.player(self.g.call("describe"))["shots"])

    def test_four_hits_end_the_round_and_a_new_one_starts_after_two_seconds(self):
        for _ in range(4):
            self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
            self.step(0.7)
        for _ in range(30):
            s = self.step(0.1)
            if s["state"] == "round_over":
                break
        self.assertEqual(("round_over", {"player": 1, "computer": 0}, 0),
                         (s["state"], s["score"], s["tanks"]["computer"]["health"]))
        self.g.page.wait_for_function("document.getElementById('banner').textContent === 'You win the round'")
        self.assertEqual("round_over", self.step(1.8)["state"])
        s = self.step(0.3)
        self.assertEqual(("playing", 2, {"player": 1, "computer": 0}, []), (s["state"], s["round"], s["score"], s["shells"]))
        self.assertEqual((-15, 0, 100), tuple(self.player(s)[k] for k in ("x", "heading", "health")))
        self.assertEqual((15, 180, 100), tuple(s["tanks"]["computer"][k] for k in ("x", "heading", "health")))


if __name__ == "__main__":
    unittest.main()

"""Winning a round, and the computer opponent."""
import unittest

from common import START, GameCase


class RoundTest(GameCase, unittest.TestCase):
    def test_four_hits_win_the_round_then_a_new_one_starts(self):
        for hit in range(1, 5):
            self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
            self.step_until(lambda s: s["tanks"]["computer"]["health"] <= 100 - 25 * hit, limit=5)
            if hit < 4:
                self.step(0.5)
        state = self.state()
        self.assertEqual("round_over", state["state"])
        self.assertEqual({"player": 1, "computer": 0}, state["score"])
        banner = self.g.page.locator("#banner")
        self.assertTrue(banner.is_visible())
        self.assertEqual("You win the round", banner.inner_text().strip())
        self.step(1.5)
        self.assertEqual("round_over", self.state()["state"])
        self.step(1)
        state = self.state()
        self.assertEqual(("playing", 2), (state["state"], state["round"]))
        self.assertEqual({"player": 1, "computer": 0}, state["score"])
        shots = {"player": 4, "computer": 0}  # the count is per game, not per round
        self.assertEqual({k: {**v, "shots": shots[k]} for k, v in START["tanks"].items()}, state["tanks"])
        self.assertEqual([], state["shells"])
        self.assertFalse(banner.is_visible())


class ComputerTest(GameCase, unittest.TestCase):
    ai = True

    def test_computer_hits_a_player_in_the_open(self):
        self.step_until(lambda s: s["tanks"]["player"]["health"] < 100, limit=30, chunk=1)

    def test_computer_finds_a_player_pinned_behind_a_wall(self):
        self.place("player", -18, -8, 0)
        self.step_until(lambda s: s["tanks"]["player"]["health"] < 100, limit=60, chunk=1)

    def test_computer_stays_clear_of_walls_and_finds_the_player(self):
        self.place("player", -11, -8, 0)
        walls = self.state()["walls"]
        start = self.tank("computer")
        moved = False
        for _ in range(120):
            state = self.step(0.25)
            c = state["tanks"]["computer"]
            moved = moved or (c["x"], c["z"]) != (start["x"], start["z"])
            self.assertLessEqual(abs(c["x"]), 18.8 + 1e-6)
            self.assertLessEqual(abs(c["z"]), 13.8 + 1e-6)
            for w in walls:
                dx = abs(c["x"] - w["x"]) - w["width"] / 2
                dz = abs(c["z"] - w["z"]) - w["depth"] / 2
                self.assertGreaterEqual((max(dx, 0) ** 2 + max(dz, 0) ** 2) ** 0.5, 1.2 - 1e-6, (c, w))
            if state["tanks"]["player"]["health"] < 100:
                break
        self.assertTrue(moved)
        self.assertLess(self.tank("player")["health"], 100)


if __name__ == "__main__":
    unittest.main()

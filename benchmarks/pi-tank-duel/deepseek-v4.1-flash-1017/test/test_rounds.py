"""Four hits end a round, the banner shows for 2 s, then the next round starts."""
import unittest

from page import game
from helpers import fresh, place, step, tank


class RoundsTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._context = game()
        cls.g = cls._context.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls._context.__exit__(None, None, None)

    def setUp(self):
        fresh(self.g)
        place(self.g, "computer", 5, 0, 180)
        place(self.g, "player", 0, 0, 0)

    def shoot(self, shooter: str, health: int) -> dict:
        self.assertTrue(self.g.call("fire", {"tank": shooter})["fired"])
        state = step(self.g, 0.5)
        target = "computer" if shooter == "player" else "player"
        self.assertEqual(health, tank(state, target)["health"])
        return state

    def test_four_hits_win_the_round_and_the_banner_shows(self):
        for hit in range(1, 4):
            state = self.shoot("player", 100 - hit * 25)
            self.assertEqual("playing", state["state"])

        state = self.shoot("player", 0)
        self.assertEqual("round_over", state["state"])
        self.assertEqual({"player": 1, "computer": 0}, state["score"])
        self.assertEqual(1, state["round"])
        self.assertEqual("You win the round",
                         self.g.page.evaluate("() => document.querySelector('#banner').textContent"))

        state = step(self.g, 1.5)
        self.assertEqual("round_over", state["state"])
        state = step(self.g, 0.2)
        self.assertEqual("playing", state["state"])
        self.assertEqual(2, state["round"])
        self.assertEqual({"player": 1, "computer": 0}, state["score"])
        self.assertEqual({"x": -15, "z": 0, "heading": 0, "health": 100, "shots": 4},
                         state["tanks"]["player"])
        self.assertEqual({"x": 15, "z": 0, "heading": 180, "health": 100, "shots": 0},
                         state["tanks"]["computer"])
        self.assertEqual([], state["shells"])
        self.assertEqual("", self.g.page.evaluate("() => document.querySelector('#banner').textContent"))

    def test_the_computer_can_win_a_round(self):
        for hit in range(1, 4):
            self.shoot("computer", 100 - hit * 25)
        state = self.shoot("computer", 0)
        self.assertEqual("round_over", state["state"])
        self.assertEqual({"player": 0, "computer": 1}, state["score"])
        self.assertEqual("The computer wins the round",
                         self.g.page.evaluate("() => document.querySelector('#banner').textContent"))

    def test_reset_starts_a_fresh_game_but_keeps_pause_and_ai(self):
        for index in range(4):
            self.shoot("player", 0 if index == 3 else 75 - index * 25)
        state = self.g.call("reset")
        self.assertEqual({"player": 0, "computer": 0}, state["score"])
        self.assertEqual(1, state["round"])
        self.assertEqual("playing", state["state"])
        self.assertTrue(state["paused"])
        self.assertFalse(state["ai"])
        self.assertEqual([], state["shells"])
        self.assertEqual(0, tank(state)["shots"])
        self.assertEqual(0, tank(state, "computer")["shots"])
        self.assertEqual((-15, 0, 0), (tank(state)["x"], tank(state)["z"], tank(state)["heading"]))
        self.assertEqual([], self.g.errors)


if __name__ == "__main__":
    unittest.main()

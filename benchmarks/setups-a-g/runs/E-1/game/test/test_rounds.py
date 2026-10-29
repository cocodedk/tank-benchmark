"""Four hits end the round, score it and show the banner; 2 s later the next round starts."""
import unittest

from base import GameCase


class RoundTest(GameCase):
    def win_a_round(self):
        self.place("computer", -5, 0, 180)
        for _ in range(4):
            self.assertTrue(self.call("fire", {"tank": "player"})["fired"])
            state = self.step(0.6)
        return state

    def test_four_hits_end_the_round_and_the_next_starts_2_seconds_later(self):
        state = self.win_a_round()
        self.assertEqual(("round_over", {"player": 1, "computer": 0}, 1, 0),
                         (state["state"], state["score"], state["round"], state["tanks"]["computer"]["health"]))
        self.g.page.wait_for_selector("#banner", state="visible")
        self.assertEqual("You win the round", self.g.page.inner_text("#banner"))
        self.g.page.wait_for_function("document.getElementById('score').textContent === '1 : 0'")
        self.assertEqual("round_over", self.step(1.8)["state"])  # the 4th hit came 8 ticks before this
        state = self.step(0.1)
        self.assertEqual(("playing", 2, {"player": 1, "computer": 0}, []),
                         (state["state"], state["round"], state["score"], state["shells"]))
        self.assertEqual({"player": {"x": -15, "z": 0, "heading": 0, "health": 100, "shots": 4},
                          "computer": {"x": 15, "z": 0, "heading": 180, "health": 100, "shots": 0}}, state["tanks"])
        self.g.page.wait_for_selector("#banner", state="hidden")

    def test_the_computer_wins_when_the_player_falls(self):
        self.place("player", -15, 8, 0)
        for _ in range(4):
            self.assertTrue(self.call("fire", {"tank": "player"})["fired"])
            state = self.step(0.6)
        self.assertEqual(("round_over", {"player": 0, "computer": 1}), (state["state"], state["score"]))
        self.g.page.wait_for_selector("#banner", state="visible")
        self.assertEqual("The computer wins the round", self.g.page.inner_text("#banner"))

    def test_reset_starts_a_new_game(self):
        self.win_a_round()
        self.step(2)
        state = self.call("reset")
        self.assertEqual((1, {"player": 0, "computer": 0}, "playing", 0),
                         (state["round"], state["score"], state["state"], state["tanks"]["player"]["shots"]))


if __name__ == "__main__":
    unittest.main()

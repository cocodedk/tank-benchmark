"""Rounds: four hits end a round, banner, next round."""
import unittest

from base import GameCase


class RoundTest(GameCase):
    def banner(self):
        return self.g.page.evaluate(
            "async () => { await new Promise(r => requestAnimationFrame(r)); const b = document.getElementById('banner'); "
            "return {text: b.innerText, shown: b.getClientRects().length > 0 && getComputedStyle(b).visibility !== 'hidden'}; }")

    def win_round(self):
        self.place("computer", 0, 0, 180)
        self.place("player", -10, 0, 0)
        s = self.g.call("describe")
        for _ in range(8):
            if s["state"] != "playing":
                break
            self.fire()
            s = self.step(0.6)
        return s

    def test_four_hits_win_the_round_then_new_round(self):
        s = self.win_round()
        self.assertEqual("round_over", s["state"])
        self.assertEqual({"player": 1, "computer": 0}, s["score"])
        self.assertEqual(0, self.tank(s, "computer")["health"])
        b = self.banner()
        self.assertTrue(b["shown"], b)
        self.assertIn("You win the round", b["text"])
        s = self.step(1.0)
        self.assertEqual("round_over", s["state"])
        s = self.step(1.1)
        self.assertEqual(("playing", 2), (s["state"], s["round"]))
        self.assertEqual({"player": 1, "computer": 0}, s["score"])
        self.assertEqual([], s["shells"])
        p, c = self.tank(s), self.tank(s, "computer")
        self.assertEqual((-15, 0, 0, 100), (p["x"], p["z"], p["heading"], p["health"]))
        self.assertEqual((15, 0, 180, 100), (c["x"], c["z"], c["heading"], c["health"]))
        self.assertFalse(self.banner()["shown"])

    def test_computer_wins_when_player_reaches_zero(self):
        self.place("computer", 0, 0, 180)
        self.place("player", -10, 0, 0)
        s = self.g.call("describe")
        for _ in range(8):
            if s["state"] != "playing":
                break
            self.fire("computer")
            s = self.step(0.6)
        self.assertEqual("round_over", s["state"])
        self.assertEqual({"player": 0, "computer": 1}, s["score"])
        self.assertIn("The computer wins the round", self.banner()["text"])


if __name__ == "__main__":
    unittest.main()

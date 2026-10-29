"""Four hits end a round, the banner shows for 2 s of game time, then the next round starts."""
import unittest

from helpers import GameCase

BANNERS = {"player": "You win the round", "computer": "The computer wins the round"}


class RoundsTest(GameCase):
    def hit(self, shooter, times):
        """Fire from `shooter` across the arena until the other tank has been hit `times` times."""
        for _ in range(times):
            while not self.call("fire", {"tank": shooter})["fired"]:
                self.step(0.1)
        while self.call("describe")["shells"]:
            self.step(0.1)

    def end_round(self, winner):
        shooter = winner
        self.hit(shooter, 3)
        self.assertEqual("playing", self.call("describe")["state"])
        self.hit(shooter, 1)
        return self.call("describe")

    def test_four_hits_end_the_round_and_show_the_banner(self):
        for winner, loser in (("player", "computer"), ("computer", "player")):
            self.call("reset")
            s = self.end_round(winner)
            self.assertEqual(("round_over", 0), (s["state"], s["tanks"][loser]["health"]))
            self.assertEqual(1, s["score"][winner])
            self.see(".banner", BANNERS[winner])

    def test_two_seconds_later_the_next_round_starts_fresh(self):
        s = self.end_round("player")
        self.assertEqual((1, "round_over"), (s["round"], s["state"]))
        self.assertFalse(self.call("fire", {"tank": "player"})["fired"])
        self.assertEqual("round_over", self.step(1.8)["state"])
        s = self.step(0.25)
        self.assertEqual((2, "playing", {"player": 1, "computer": 0}, []), (s["round"], s["state"], s["score"], s["shells"]))
        self.assertEqual({"x": -15, "z": 0, "heading": 0, "health": 100}, {k: s["tanks"]["player"][k] for k in ("x", "z", "heading", "health")})
        self.assertEqual({"x": 15, "z": 0, "heading": 180, "health": 100}, {k: s["tanks"]["computer"][k] for k in ("x", "z", "heading", "health")})
        self.see(".banner", "")
        self.assertEqual(4, s["tanks"]["player"]["shots"])  # shots count the whole game

    def test_the_score_carries_on_and_reset_clears_it(self):
        self.end_round("player")
        self.step(2.1)
        s = self.end_round("computer")
        self.assertEqual(({"player": 1, "computer": 1}, 2), (s["score"], s["round"]))
        s = self.call("reset")
        self.assertEqual(({"player": 0, "computer": 0}, 1, "playing"), (s["score"], s["round"], s["state"]))

    def test_the_hud_shows_health_score_round_and_controls(self):
        self.hit("player", 1)
        self.g.page.wait_for_function("document.querySelectorAll('.fill')[1].style.width === '75%'", timeout=3000)
        hud = self.g.page.inner_text(".hud")
        for text in ("You", "Computer", "Round 1", "Score 0 : 0", "Space"):
            self.assertIn(text, hud)
        self.assertEqual(["100%", "75%"], self.g.page.eval_on_selector_all(".fill", "e => e.map(x => x.style.width)"))
        self.assertEqual(1, self.g.page.evaluate("document.querySelectorAll('canvas').length"))
        self.assertEqual([1280, 800], self.g.page.evaluate("(() => { const c = document.querySelector('canvas'); return [c.clientWidth, c.clientHeight]; })()"))


if __name__ == "__main__":
    unittest.main()

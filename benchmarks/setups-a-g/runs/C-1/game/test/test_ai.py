"""The computer opponent."""
import unittest

from gamecase import GameCase, wall_gap


class AiTest(GameCase):
    def test_ai_shoots_a_player_standing_in_its_line(self):
        self.g.call("set_ai", {"enabled": True})
        for _ in range(30):
            self.run_for(1)
            if self.tank("player")["health"] < 100:
                break
        self.assertLess(self.tank("player")["health"], 100)

    def test_ai_finds_and_hits_a_player_out_of_its_line(self):
        self.put("player", 0, 12, 0)  # the wall at (8, 8) hides it from (15, 0)
        self.g.call("set_ai", {"enabled": True})
        for _ in range(30):
            if self.run_for(1)["tanks"]["player"]["health"] < 100:
                break
        self.assertLess(self.tank("player")["health"], 100)

    def test_ai_never_enters_a_wall_while_hunting_a_hidden_player(self):
        self.put("player", -12, 8, 0)
        self.g.call("set_ai", {"enabled": True})
        walls = self.state()["walls"]
        farthest = 0.0
        for _ in range(60):
            self.run_for(0.5)
            c = self.tank("computer")
            for w in walls:
                self.assertGreaterEqual(wall_gap(c["x"], c["z"], w), 1.2 - 0.01, (c, w))
            self.assertLessEqual(abs(c["x"]), 20 - 1.2 + 0.01, c)
            self.assertLessEqual(abs(c["z"]), 15 - 1.2 + 0.01, c)
            farthest = max(farthest, ((c["x"] - 15) ** 2 + c["z"] ** 2) ** 0.5)
        self.assertGreater(farthest, 0.5)


if __name__ == "__main__":
    unittest.main()

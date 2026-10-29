"""The computer: it finds a line and fires, and never drives into a wall."""
import unittest

from test_common import Base

R, TOL = 1.2, 0.05


class AiTest(Base):
    AI = True

    def test_the_computer_hits_a_standing_player_within_30_seconds(self):
        for _ in range(30):
            if self.step(1)["tanks"]["player"]["health"] < 100:
                return
        self.fail("player never hit")

    def test_the_computer_hunts_a_hidden_player_without_touching_walls(self):
        self.place("player", -12, -8, 0)
        moved = hit = False
        for _ in range(60):
            s = self.step(0.5)
            c = s["tanks"]["computer"]
            moved = moved or (round(c["x"], 2), round(c["z"], 2)) != (15, 0)
            self.assertLessEqual(abs(c["x"]), 20 - R + TOL, c)
            self.assertLessEqual(abs(c["z"]), 15 - R + TOL, c)
            for w in s["walls"]:
                dx = max(abs(c["x"] - w["x"]) - w["width"] / 2, 0)
                dz = max(abs(c["z"] - w["z"]) - w["depth"] / 2, 0)
                self.assertGreaterEqual((dx * dx + dz * dz) ** 0.5, R - TOL, (c, w))
            if s["tanks"]["player"]["health"] < 100:
                hit = True
                break
        self.assertTrue(moved, "computer never moved")
        self.assertTrue(hit, "player never hit")


if __name__ == "__main__":
    unittest.main()

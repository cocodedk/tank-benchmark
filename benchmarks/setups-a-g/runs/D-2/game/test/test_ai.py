"""The computer: it hits a player who stands still, and it finds one hiding behind a wall."""
import math
import unittest

from common import fresh, place, state, step
from page import game

WALLS = [(-8, -8), (-8, 8), (8, -8), (8, 8)]


def in_a_wall(t):
    """True when the tank's circle (radius 1.2) overlaps an inner wall by more than a hair."""
    return any(math.hypot(max(abs(t["x"] - wx) - 1, 0), max(abs(t["z"] - wz) - 3, 0)) < 1.2 - 1e-6 for wx, wz in WALLS)


class AiTest(unittest.TestCase):
    def test_the_computer_hits_a_player_who_stands_still_within_30_seconds(self):
        with game() as g:
            fresh(g, ai=True)
            for _ in range(15):
                s = step(g, 2)
                if s["tanks"]["player"]["health"] < 100 or s["score"]["computer"] > 0:
                    return
            self.fail("the computer never hit a standing player")

    def test_the_computer_drives_round_a_wall_to_find_you_and_never_enters_one(self):
        with game() as g:
            fresh(g, ai=True)
            place(g, "player", -12, 8, 0)                      # behind the wall at (-8, 8)
            start = state(g)["tanks"]["computer"]
            travelled = 0
            for _ in range(100):
                s = step(g, 0.2)
                computer = s["tanks"]["computer"]
                self.assertFalse(in_a_wall(computer), computer)
                travelled = max(travelled, math.hypot(computer["x"] - start["x"], computer["z"] - start["z"]))
                if computer["shots"]:
                    break
            self.assertGreater(travelled, 3, "the computer stayed put")
            self.assertGreater(computer["shots"], 0, "the computer never found a clear line")


if __name__ == "__main__":
    unittest.main()

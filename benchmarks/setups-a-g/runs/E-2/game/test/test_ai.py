"""The computer hits a player standing still, and finds one behind a wall without entering a wall."""
import math
import unittest

from game_case import GameCase


def wall_gap(t, w):
    """Distance from a tank's centre to wall w's rectangle."""
    dx = max(abs(t["x"] - w["x"]) - w["width"] / 2, 0)
    dz = max(abs(t["z"] - w["z"]) - w["depth"] / 2, 0)
    return math.hypot(dx, dz)


class AiTest(GameCase):
    def hit_within(self, seconds, chunk):
        """Step with the AI on until the player is hit; the states seen."""
        self.g.call("set_ai", {"enabled": True})
        seen = []
        for _ in range(round(seconds / chunk)):
            seen.append(self.step(chunk))
            if seen[-1]["tanks"]["player"]["health"] < 100:
                break
        return seen

    def test_hits_a_player_standing_still_within_30_seconds(self):
        seen = self.hit_within(30, 1)
        self.assertLess(seen[-1]["tanks"]["player"]["health"], 100)
        self.assertGreater(seen[-1]["tanks"]["computer"]["shots"], 0)

    def test_finds_a_player_behind_a_wall_without_entering_a_wall(self):
        self.place("computer", 12, 8, 180)
        self.place("player", 4, 8, 0)
        seen = self.hit_within(30, 0.25)
        self.assertLess(seen[-1]["tanks"]["player"]["health"], 100)
        for s in seen:
            c = s["tanks"]["computer"]
            self.assertTrue(abs(c["x"]) <= 18.8 + 1e-3 and abs(c["z"]) <= 13.8 + 1e-3, c)
            for w in s["walls"]:
                self.assertGreaterEqual(wall_gap(c, w), 1.2 - 1e-3, c)
        self.assertNotEqual((12, 8), (seen[-1]["tanks"]["computer"]["x"], seen[-1]["tanks"]["computer"]["z"]))


if __name__ == "__main__":
    unittest.main()

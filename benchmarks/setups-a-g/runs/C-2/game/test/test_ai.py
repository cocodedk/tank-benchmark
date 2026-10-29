"""The computer shoots a standing player and stays legal while hunting one behind a wall."""
import math
import unittest

from base import GameCase

WALLS = [(x, z) for x in (-8, 8) for z in (-8, 8)]


def overlaps_wall(x, z, r=1.2, eps=1e-3):
    for wx, wz in WALLS:
        px, pz = max(wx - 1, min(x, wx + 1)), max(wz - 3, min(z, wz + 3))
        if math.hypot(x - px, z - pz) < r - eps:
            return True
    return False


class AiTest(GameCase):
    def test_computer_hits_a_standing_player_within_30_seconds(self):
        self.call("set_ai", {"enabled": True})
        for _ in range(30):
            if self.call("step", {"seconds": 1})["tanks"]["player"]["health"] < 100:
                return
        self.fail("player still at full health after 30 s")

    def test_computer_hunting_a_hidden_player_moves_and_stays_legal(self):
        self.place("player", -12, 8, 0)  # the line from (15, 0) crosses wall (-8, 8)
        self.call("set_ai", {"enabled": True})
        start, far = (15, 0), 0
        for i in range(20):
            c = self.call("step", {"seconds": 1})["tanks"]["computer"]
            self.assertFalse(overlaps_wall(c["x"], c["z"]), (i, c))
            self.assertLessEqual(abs(c["x"]), 18.8 + 1e-3, (i, c))
            self.assertLessEqual(abs(c["z"]), 13.8 + 1e-3, (i, c))
            far = max(far, math.hypot(c["x"] - start[0], c["z"] - start[1]))
        self.assertGreater(far, 3)

    def test_computer_finds_a_player_hugging_a_wall(self):
        self.place("player", -10.2, 8, 0)
        self.call("set_ai", {"enabled": True})
        for _ in range(20):
            if self.call("step", {"seconds": 2})["tanks"]["player"]["health"] < 100:
                return
        self.fail("player still at full health after 40 s")

    def test_computer_resting_against_a_wall_drives_off_and_hits(self):
        self.place("computer", -10.2, 8, 0)  # touching wall (-8, 8), which hides the player
        self.place("player", 0, 8, 180)
        self.call("set_ai", {"enabled": True})
        for _ in range(30):
            if self.call("step", {"seconds": 1})["tanks"]["player"]["health"] < 100:
                return
        self.fail("player still at full health after 30 s")


if __name__ == "__main__":
    unittest.main()

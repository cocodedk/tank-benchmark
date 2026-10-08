"""The computer driver, with the AI on."""
import unittest

from base import GameCase

WALLS = [(-8, -8), (-8, 8), (8, -8), (8, 8)]


def overlap_depth(t):
    """How far the tank circle (r 1.2) sinks into the nearest inner wall or arena edge (<=0 is fine)."""
    worst = max(abs(t["x"]) + 1.2 - 20, abs(t["z"]) + 1.2 - 15)
    for wx, wz in WALLS:
        cx = min(max(t["x"], wx - 1), wx + 1)
        cz = min(max(t["z"], wz - 3), wz + 3)
        worst = max(worst, 1.2 - ((t["x"] - cx) ** 2 + (t["z"] - cz) ** 2) ** 0.5)
    return worst


class AiTest(GameCase):
    ai = True

    def test_standing_still_player_gets_hit(self):
        s = self.g.call("describe")
        for _ in range(30):
            s = self.step(1)
            if self.tank(s)["health"] < 100:
                break
        self.assertLess(self.tank(s)["health"], 100)
        self.assertGreaterEqual(self.tank(s, "computer")["shots"], 1)

    def test_player_near_a_wall_corner_gets_hit(self):
        self.place("player", -15, -6, 0)
        s = self.step(2)
        for _ in range(29):
            if self.tank(s)["health"] < 100:
                break
            s = self.step(2)
        self.assertLess(self.tank(s)["health"], 100)

    def test_hunts_player_behind_wall_without_entering_walls(self):
        self.place("player", -12, -8, 0)
        s = self.g.call("describe")
        moved = False
        for _ in range(60):
            s = self.step(0.5)
            c = self.tank(s, "computer")
            self.assertLessEqual(overlap_depth(c), 0.01, (c, s["round"]))
            moved = moved or (c["x"], c["z"]) != (15, 0)
            if self.tank(s)["health"] < 100 or s["round"] > 1:
                break
        self.assertTrue(moved)
        self.assertTrue(self.tank(s)["health"] < 100 or s["round"] > 1, s)


if __name__ == "__main__":
    unittest.main()

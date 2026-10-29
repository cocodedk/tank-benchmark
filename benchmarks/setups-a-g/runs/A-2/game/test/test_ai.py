"""The computer turns, drives, finds a clear line and fires; it never enters a wall."""
import math
import unittest

from tank import GameTest, paused, place

R = 1.2


def wall_gap(state, tank):
    """Distance from the tank's centre to the nearest wall face, minus its radius (negative: inside)."""
    t = state["tanks"][tank]
    gaps = [20 - abs(t["x"]) - R, 15 - abs(t["z"]) - R]
    for w in state["walls"]:
        dx = max(abs(t["x"] - w["x"]) - w["width"] / 2, 0)
        dz = max(abs(t["z"] - w["z"]) - w["depth"] / 2, 0)
        gaps.append(math.hypot(dx, dz) - R)
    return min(gaps)


class AiTest(GameTest):
    ai = True

    def test_it_hits_a_player_who_stands_still(self):
        hit = None
        for _ in range(60):  # 30 s
            s = self.g.call("step", {"seconds": 0.5})
            if s["tanks"]["player"]["health"] < 100 or s["score"]["computer"]:
                hit = s
                break
        self.assertIsNotNone(hit, "the computer never hit the player in 30 s")
        self.assertGreater(hit["tanks"]["computer"]["shots"], 0)

    def test_it_drives_round_a_wall_to_find_a_player_behind_it(self):
        place(self.g, "player", -12, -8)  # behind the wall at (-8, -8) as seen from (15, 0)
        closest = 99
        for _ in range(150):  # 15 s
            s = self.g.call("step", {"seconds": 0.1})
            if s["round"] > 1:
                break
            c, p = s["tanks"]["computer"], s["tanks"]["player"]
            closest = min(closest, math.hypot(c["x"] - p["x"], c["z"] - p["z"]))
            self.assertGreaterEqual(wall_gap(s, "computer"), -1e-6, c)
        self.assertLess(closest, 14, "the computer never came round the wall")

    def test_with_the_ai_off_the_computer_stays_put(self):
        paused(self.g, ai=False)
        s = self.g.call("step", {"seconds": 5})
        self.assertEqual((15, 0, 180, 0), tuple(s["tanks"]["computer"][k] for k in ("x", "z", "heading", "shots")))


if __name__ == "__main__":
    unittest.main()

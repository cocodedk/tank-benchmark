"""The computer fires and hits a standing player, and walks round a wall to find one in hiding."""
import math
import unittest

from helpers import game, place, quiet

WALLS = [(-8, -8), (-8, 8), (8, -8), (8, 8)]


def in_a_wall(tank):
    """Is the tank's circle (radius 1.2) inside an inner wall or through the outer one?"""
    if abs(tank["x"]) > 18.8 + 1e-6 or abs(tank["z"]) > 13.8 + 1e-6:
        return True
    for wx, wz in WALLS:
        dx = tank["x"] - min(max(tank["x"], wx - 1), wx + 1)
        dz = tank["z"] - min(max(tank["z"], wz - 3), wz + 3)
        if math.hypot(dx, dz) < 1.2 - 1e-6:
            return True
    return False


class AiTest(unittest.TestCase):
    def test_it_hits_a_player_who_stands_still_within_thirty_seconds(self):
        with game() as g:
            quiet(g, ai=True)
            for _ in range(60):
                state = g.call("step", {"seconds": 0.5})
                if state["tanks"]["player"]["health"] < 100 or state["score"]["computer"]:
                    return
            self.fail("the computer never hit the player")

    def test_it_drives_round_a_wall_to_find_a_player_behind_it(self):
        with game() as g:
            quiet(g, ai=True)
            place(g, "computer", 12, 8, 180)
            place(g, "player", 0, 8, 0)
            for _ in range(200):
                state = g.call("step", {"seconds": 0.1})
                self.assertFalse(in_a_wall(state["tanks"]["computer"]), state["tanks"]["computer"])
                if state["tanks"]["computer"]["shots"]:
                    break
            tank = state["tanks"]["computer"]
            self.assertGreater(tank["shots"], 0, "it never found a line of fire")
            self.assertGreater(abs(tank["z"] - 8), 3, "it should have left the wall's shadow")


if __name__ == "__main__":
    unittest.main()

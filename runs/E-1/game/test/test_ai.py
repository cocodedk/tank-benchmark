"""With its AI on, the computer hits a still player and drives around walls to find one hiding."""
import math
import unittest

from base import GameCase


def inside_a_wall(tank, walls):
    if abs(tank["x"]) > 18.8 + 1e-6 or abs(tank["z"]) > 13.8 + 1e-6:
        return True
    for w in walls:
        cx = min(max(tank["x"], w["x"] - w["width"] / 2), w["x"] + w["width"] / 2)
        cz = min(max(tank["z"], w["z"] - w["depth"] / 2), w["z"] + w["depth"] / 2)
        if math.hypot(tank["x"] - cx, tank["z"] - cz) < 1.2 - 1e-6:
            return True
    return False


class AiTest(GameCase):
    def setUp(self):
        super().setUp()
        self.assertEqual({"ok": True, "ai": True}, self.call("set_ai", {"enabled": True}))

    def hit_within_30_seconds(self):
        """Steps until the player is hit, checking the computer never enters a wall; the computer's path."""
        path = []
        for _ in range(120):
            state = self.step(0.25)
            computer = state["tanks"]["computer"]
            self.assertFalse(inside_a_wall(computer, state["walls"]), computer)
            path.append((computer["x"], computer["z"]))
            if state["tanks"]["player"]["health"] < 100:
                return path
        self.fail("the computer did not hit the player within 30 s")

    def test_it_fires_and_hits_a_still_player_within_30_seconds(self):
        self.hit_within_30_seconds()
        self.assertGreater(self.call("describe")["tanks"]["computer"]["shots"], 0)

    def test_it_drives_to_find_a_player_behind_a_wall(self):
        self.place("player", -11, 8, 0)
        path = self.hit_within_30_seconds()
        self.assertGreater(math.dist(path[0], path[-1]), 2)

    def test_it_stays_still_when_off(self):
        self.call("set_ai", {"enabled": False})
        state = self.step(3)
        self.assertEqual((15, 0, 0), (state["tanks"]["computer"]["x"], state["tanks"]["computer"]["z"],
                                      state["tanks"]["computer"]["shots"]))


if __name__ == "__main__":
    unittest.main()

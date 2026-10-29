"""The computer aims and hits a still target, and routes around a wall without entering it."""
from base import PageTest, overlaps_wall


class AiTest(PageTest):
    def test_the_computer_hits_a_standing_player(self):
        self.g.call("set_ai", {"enabled": True})
        state = self.step(2.5)
        self.assertLess(state["tanks"]["player"]["health"], 100)

    def test_the_computer_goes_around_a_wall_without_entering_it(self):
        self.g.call("set_ai", {"enabled": True})
        self.g.call("place", {"tank": "player", "x": 0, "z": 10, "heading": 180})
        self.g.call("place", {"tank": "computer", "x": 15, "z": 0, "heading": 180})
        state = self.g.call("describe")
        hit = False
        for _ in range(60):
            state = self.step(0.5)
            computer = state["tanks"]["computer"]
            self.assertFalse(
                overlaps_wall(computer["x"], computer["z"], state["walls"]),
                f"computer entered a wall at {computer}",
            )
            self.assertLessEqual(abs(computer["x"]), 18.8 + 1e-6)
            self.assertLessEqual(abs(computer["z"]), 13.8 + 1e-6)
            if state["tanks"]["player"]["health"] < 100:
                hit = True
                break
        self.assertTrue(hit, f"computer never hit the player: {state}")


if __name__ == "__main__":
    import unittest
    unittest.main()

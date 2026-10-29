"""Shells hit tanks, reload, bounce once off a wall, and can hit the tank that fired."""
from base import PageTest


class CombatTest(PageTest):
    def test_holding_space_fires_a_shell(self):
        self.g.call("place", {"tank": "player", "x": -15, "z": 0, "heading": 180})
        self.key_down(" ")
        state = self.step(0.1)
        self.key_up(" ")
        self.assertEqual(1, state["tanks"]["player"]["shots"])
        self.assertEqual(1, len(state["shells"]))
        self.assertEqual("player", state["shells"][0]["owner"])

    def test_shell_across_open_ground_damages_the_other_tank(self):
        self.g.call("place", {"tank": "player", "x": -15, "z": 0, "heading": 0})
        self.g.call("place", {"tank": "computer", "x": 0, "z": 0, "heading": 90})
        answer = self.g.call("fire", {"tank": "player"})
        self.assertEqual({"ok": True, "fired": True}, answer)
        state = self.step(1.0)
        self.assertEqual([], state["shells"])
        self.assertEqual(75, state["tanks"]["computer"]["health"])
        self.assertEqual(100, state["tanks"]["player"]["health"])

    def test_a_tank_cannot_fire_twice_within_half_a_second(self):
        self.g.call("place", {"tank": "player", "x": -15, "z": 0, "heading": 180})
        self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
        self.assertFalse(self.g.call("fire", {"tank": "player"})["fired"])
        self.step(0.4)
        self.assertFalse(self.g.call("fire", {"tank": "player"})["fired"])
        self.step(0.2)
        self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])

    def test_shell_bounces_once_then_hits_its_own_tank(self):
        self.g.call("place", {"tank": "player", "x": -15, "z": 0, "heading": 90})
        self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
        state = self.step(1.0)
        self.assertEqual(1, len(state["shells"]))
        self.assertEqual(1, state["shells"][0]["bounces"])
        state = self.step(1.0)
        self.assertEqual([], state["shells"])
        self.assertEqual(75, state["tanks"]["player"]["health"])

    def test_shell_disappears_at_its_second_wall(self):
        self.g.call("place", {"tank": "player", "x": -15, "z": 0, "heading": 90})
        self.assertTrue(self.g.call("fire", {"tank": "player"})["fired"])
        self.step(1.0)
        self.g.call("place", {"tank": "player", "x": 0, "z": 0, "heading": 0})
        state = self.step(2.0)
        self.assertEqual([], state["shells"])
        self.assertEqual(100, state["tanks"]["player"]["health"])


if __name__ == "__main__":
    import unittest
    unittest.main()

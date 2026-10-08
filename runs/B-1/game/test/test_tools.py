"""The seven tools, the start state, and bad inputs."""
import unittest

from common import START, GameCase


class ToolsTest(GameCase, unittest.TestCase):
    def test_exactly_seven_tools(self):
        self.assertEqual(["describe", "fire", "pause", "place", "reset", "set_ai", "step"], sorted(self.g.tools()))

    def test_describe_is_the_start_state(self):
        self.assertEqual({**START, "paused": True, "ai": False}, self.state())

    def test_pause_and_set_ai_answers(self):
        self.assertEqual({"ok": True, "paused": True}, self.g.call("pause", {"paused": True}))
        self.assertEqual({"ok": True, "ai": False}, self.g.call("set_ai", {"enabled": False}))

    def test_reset_returns_start_state_and_keeps_flags(self):
        self.place("player", 0, 0)
        self.assertEqual({**START, "paused": True, "ai": False}, self.g.call("reset"))

    def assertRefused(self, name, payload):
        answer = self.g.call(name, payload)
        self.assertIs(False, answer["ok"], (name, payload))
        self.assertIsInstance(answer["error"], str, (name, payload))

    def test_bad_inputs_are_refused(self):
        for seconds in (0, 31, "x"):
            self.assertRefused("step", {"seconds": seconds})
        self.assertRefused("place", {"tank": "bob", "x": 0, "z": 0})
        self.assertRefused("place", {"tank": "player", "x": -8, "z": -8})
        self.assertRefused("place", {"tank": "player", "x": 15, "z": 0})
        self.assertRefused("place", {"tank": "player", "x": 19.5, "z": 0})
        self.assertRefused("fire", {"tank": "bob"})

    def test_step_while_running_is_refused(self):
        self.g.call("pause", {"paused": False})
        try:
            self.assertRefused("step", {"seconds": 1})
        finally:
            self.g.call("pause", {"paused": True})


if __name__ == "__main__":
    unittest.main()

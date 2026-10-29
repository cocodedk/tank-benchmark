"""With the AI on, the computer fires along a clear line and goes round walls to find one."""
import unittest

from helpers import GameCase


class AiTest(GameCase):
    ai = True

    def run_until(self, done, limit=30, tick=0.25):
        """Step in small slices until done(state), checking every state; returns (state, seconds)."""
        t = 0
        while t < limit:
            s = self.step(tick)
            t += tick
            self.assert_out_of_walls(s)
            if done(s):
                return s, t
        return s, t

    def assert_out_of_walls(self, s):
        c = s["tanks"]["computer"]
        for w in s["walls"]:
            dx = max(abs(c["x"] - w["x"]) - w["width"] / 2, 0)
            dz = max(abs(c["z"] - w["z"]) - w["depth"] / 2, 0)
            self.assertGreaterEqual((dx * dx + dz * dz) ** 0.5, 1.2 - 1e-6, c)
        self.assertLessEqual(abs(c["x"]), 18.8 + 1e-6)
        self.assertLessEqual(abs(c["z"]), 13.8 + 1e-6)

    def test_standing_still_in_its_line_the_player_is_hit_within_30_seconds(self):
        s, seconds = self.run_until(lambda s: s["tanks"]["player"]["health"] < 100)
        self.assertLess(s["tanks"]["player"]["health"], 100, f"not hit in {seconds} s")
        self.assertGreater(s["tanks"]["computer"]["shots"], 0)

    def test_behind_a_wall_it_drives_round_it_to_find_the_player(self):
        self.place("player", -14, 8, 0)
        self.place("computer", -2, 8, 180)
        start = self.call("describe")["tanks"]["computer"]
        s, seconds = self.run_until(lambda s: s["tanks"]["computer"]["shots"] > 0)
        c = s["tanks"]["computer"]
        self.assertGreater(c["shots"], 0, f"never fired in {seconds} s")
        self.assertNotEqual((start["x"], start["z"]), (c["x"], c["z"]))

    def test_with_the_ai_off_the_computer_stays_put(self):
        self.call("set_ai", {"enabled": False})
        s = self.step(5)
        self.assertEqual((15, 0, 180, 0), tuple(s["tanks"]["computer"][k] for k in ("x", "z", "heading", "shots")))


if __name__ == "__main__":
    unittest.main()

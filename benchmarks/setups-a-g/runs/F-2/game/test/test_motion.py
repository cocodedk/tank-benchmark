"""Driving: speeds, turns, firing on the key, and stopping at walls and tanks."""
import unittest

from test_common import Base


class MotionTest(Base):
    def test_w_drives_forward_six_units_a_second(self):
        self.hold("w", 1)
        t = self.tank("player")
        self.assertAlmostEqual(t["x"], -9, delta=0.05)
        self.assertAlmostEqual(t["z"], 0, delta=0.05)

    def test_s_reverses_four_units_a_second(self):
        self.place("player", 0, 0, 0)
        self.hold("s", 1)
        t = self.tank("player")
        self.assertAlmostEqual(t["x"], -4, delta=0.05)
        self.assertAlmostEqual(t["z"], 0, delta=0.05)

    def test_d_turns_right_and_a_turns_left_at_120_degrees_a_second(self):
        self.hold("d", 0.5)
        self.assertHeading(self.tank("player")["heading"], 60)
        self.ok(self.g.call("reset"))
        self.hold("a", 0.5)
        h = self.tank("player")["heading"]
        self.assertTrue(0 <= h < 360, h)
        self.assertHeading(h, 300)

    def test_holding_space_fires_exactly_one_shell(self):
        self.hold(" ", 1)
        s = self.state()
        self.assertEqual(1, len(s["shells"]))
        self.assertEqual(1, s["tanks"]["player"]["shots"])

    def test_the_inner_wall_stops_the_tank(self):
        self.place("player", -15, -8, 0)
        states = self.hold("w", 3, chunk=0.25)
        for s in states:
            self.assertLessEqual(s["tanks"]["player"]["x"], -10.1)
        self.assertAlmostEqual(states[-1]["tanks"]["player"]["x"], -10.2, delta=0.1)

    def test_the_outer_wall_stops_the_tank(self):
        self.place("computer", 0, 10, 0)
        self.place("player", 15, 0, 0)
        self.hold("w", 2)
        self.assertAlmostEqual(self.tank("player")["x"], 18.8, delta=0.1)

    def test_the_other_tank_stops_the_tank(self):
        self.place("player", 0, 0, 0)
        self.place("computer", 5, 0, 180)
        self.hold("w", 2)
        p, c = self.tank("player"), self.tank("computer")
        self.assertAlmostEqual(((p["x"] - c["x"]) ** 2 + (p["z"] - c["z"]) ** 2) ** 0.5, 2.4, delta=0.1)

    def test_a_tank_wedged_between_the_wall_and_the_other_tank_never_overlaps_it(self):
        self.place("computer", 17, 1.7, 180)
        self.place("player", 18.8, 0, 90)
        self.hold("w", 0.5)
        p, c = self.tank("player"), self.tank("computer")
        self.assertGreaterEqual(((p["x"] - c["x"]) ** 2 + (p["z"] - c["z"]) ** 2) ** 0.5, 2.399)

    def test_a_heading_just_below_360_reads_as_0(self):
        h = self.place("player", 0, 0, 359.9999)["tanks"]["player"]["heading"]
        self.assertTrue(0 <= h < 360, h)


if __name__ == "__main__":
    unittest.main()

"""Shells, bounces, cooldown, hits and rounds."""
import unittest

from gamecase import GameCase


class CombatTest(GameCase):
    def until(self, done, limit=4.0, dt=0.05):
        seen, t = [], 0.0
        while t < limit:
            self.run_for(dt)
            t += dt
            seen.append(self.state())
            if done(seen[-1]):
                break
        return seen

    def test_shell_hits_the_computer(self):
        self.fire()
        self.until(lambda s: s["tanks"]["computer"]["health"] < 100, dt=0.1)
        s = self.state()
        self.assertEqual(75, s["tanks"]["computer"]["health"])
        self.assertEqual(100, s["tanks"]["player"]["health"])
        self.assertEqual([], s["shells"])
        self.assertEqual(1, s["tanks"]["player"]["shots"])

    def test_a_shell_grazing_a_tank_between_steps_hits_it(self):
        for z in (1.449, 1.45):  # inside, then exactly touching
            self.g.call("reset", {})
            self.put("player", -5, 0, 0)
            self.put("computer", 0, z, 180)
            self.fire()
            self.run_for(0.5)
            self.assertEqual(75, self.tank("computer")["health"], z)

    def test_a_shell_grazing_a_wall_corner_bounces(self):
        # along z = 4.76 the shell passes 0.24 from the corner (-9, 5), touching it for only 0.14 of x:
        # step ends at x = -9.15 and -8.9 would skip it
        self.put("player", -14, 4.76, 0)
        self.fire()
        self.run_for(0.3)
        self.assertEqual(1, self.state()["shells"][0]["bounces"])

    def test_shell_bounces_back_and_hits_its_owner(self):
        self.put("computer", 15, -12, 180)
        self.put("player", 0, 0, 90)
        self.fire()
        seen = self.until(lambda s: s["tanks"]["player"]["health"] < 100)
        bounced = [s for s in seen if s["shells"] and s["shells"][0]["bounces"] == 1]
        self.assertTrue(bounced, "shell never showed bounces == 1")
        i = seen.index(bounced[0])
        self.assertLess(seen[i + 1]["shells"][0]["z"], bounced[0]["shells"][0]["z"])  # coming back
        self.assertEqual(75, self.tank("player")["health"])
        self.assertEqual([], self.state()["shells"])
        self.assertEqual(100, self.tank("computer")["health"])

    def test_shell_bounces_once_then_vanishes_at_the_second_wall(self):
        self.put("computer", 15, -12, 180)
        self.put("player", 0, 0, 45)
        self.fire()
        seen = self.until(lambda s: not s["shells"], limit=5)
        self.assertTrue(any(s["shells"] and s["shells"][0]["bounces"] == 1 for s in seen))
        self.assertEqual([], seen[-1]["shells"])
        self.assertEqual((100, 100), (self.tank("player")["health"], self.tank("computer")["health"]))

    def test_refire_waits_half_a_second(self):
        self.put("computer", 0, 12, 0)
        self.assertIs(True, self.fire())
        self.assertIs(False, self.fire())
        self.run_for(0.55)
        self.assertIs(True, self.fire())

    def test_at_most_three_shells_in_flight(self):
        self.put("computer", 0, 12, 0)
        for _ in range(3):
            self.assertIs(True, self.fire())
            self.run_for(0.55)
        self.assertEqual(3, len(self.state()["shells"]))
        self.assertIs(False, self.fire())
        self.assertEqual(3, self.tank("player")["shots"])

    def banner(self, text):
        self.g.page.get_by_text(text).first.wait_for(state="visible", timeout=2000)  # drawn on the next frame
        return True

    def win_round(self, shooter, target, x, heading):
        self.put(shooter, x, 0, heading)
        self.put(target, -x, 0, (heading + 180) % 360)
        for hp in (75, 50, 25, 0):
            self.assertIs(True, self.fire(shooter))
            self.run_for(0.6)
            self.assertEqual(hp, self.tank(target)["health"])

    def test_four_hits_end_the_round_then_a_new_one_starts(self):
        self.win_round("player", "computer", -5, 0)
        s = self.state()
        self.assertEqual(("round_over", 1), (s["state"], s["round"]))
        self.assertEqual({"player": 1, "computer": 0}, s["score"])
        self.assertTrue(self.banner("You win the round"))
        self.run_for(2.1)
        s = self.state()
        self.assertEqual(("playing", 2, {"player": 1, "computer": 0}), (s["state"], s["round"], s["score"]))
        self.assertEqual([], s["shells"])
        for name, (x, z, h) in {"player": (-15, 0, 0), "computer": (15, 0, 180)}.items():
            t = s["tanks"][name]
            self.assertEqual((x, z, h, 100), (t["x"], t["z"], t["heading"], t["health"]))

    def test_computer_can_win_a_round(self):
        self.win_round("computer", "player", 5, 180)
        s = self.state()
        self.assertEqual(("round_over", {"player": 0, "computer": 1}), (s["state"], s["score"]))
        self.assertTrue(self.banner("The computer wins the round"))


if __name__ == "__main__":
    unittest.main()

"""The four WebMCP tools: describe, zoom_by, pan, reset, and their input checks."""
import unittest

from page import game


class ViewToolsTest(unittest.TestCase):
    def test_describe_zoom_pan_and_reset(self):
        with game() as g:
            self.assertEqual([], g.errors)
            start = g.call("describe")
            self.assertTrue(start["ok"])
            self.assertEqual(1, start["zoom"])
            self.assertEqual(0, start["x"])
            self.assertEqual(0, start["y"])
            self.assertIn("central dome", start["parts"])
            self.assertIn("four minarets", start["parts"])

            doubled = g.call("zoom_by", {"factor": 2})
            self.assertEqual(2, doubled["zoom"])
            self.assertEqual(start["x"], doubled["x"])
            self.assertEqual(start["y"], doubled["y"])

            high = g.call("zoom_by", {"factor": 100})
            self.assertEqual(20, high["zoom"])
            low = g.call("zoom_by", {"factor": 1 / 1000})
            self.assertEqual(1, low["zoom"])

            panned = g.call("pan", {"dx": 10, "dy": -5})
            self.assertAlmostEqual(low["x"] + 10, panned["x"], places=3)
            self.assertAlmostEqual(low["y"] - 5, panned["y"], places=3)

            reset = g.call("reset")
            self.assertEqual({"ok": True, "zoom": 1, "x": 0, "y": 0},
                             {k: reset[k] for k in ("ok", "zoom", "x", "y")})

    def test_bad_input_answers_an_error_and_never_throws(self):
        with game() as g:
            cases = [
                ("zoom_by", {}),
                ("zoom_by", {"factor": 0}),
                ("zoom_by", {"factor": "two"}),
                ("zoom_by", {"factor": None}),
                ("pan", {}),
                ("pan", {"dx": 1}),
                ("pan", {"dx": "a", "dy": 2}),
                ("pan", {"dx": [], "dy": 2}),
            ]
            for name, payload in cases:
                answer = g.call(name, payload)
                self.assertFalse(answer["ok"], f"{name} {payload}")
                self.assertIn("error", answer)
            self.assertEqual([], g.errors)


if __name__ == "__main__":
    unittest.main()

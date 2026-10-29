"""Zoom and pan: through the tools, the wheel and the buttons."""
import unittest

from page import game


class ViewStateTest(unittest.TestCase):
    def test_describe_reports_a_centred_bridge_at_zoom_one(self):
        with game() as g:
            state = g.call("describe")
            self.assertTrue(state["ok"])
            self.assertEqual(1, state["zoom"])
            self.assertAlmostEqual(0, state["x"], places=5)
            self.assertAlmostEqual(-175, state["y"], places=5)
            self.assertIn("north tower", state["parts"])
            self.assertIn("high-level walkways", state["parts"])
            self.assertEqual([], g.errors)

    def test_zoom_by_multiplies_and_clamps(self):
        with game() as g:
            self.assertAlmostEqual(2, g.call("zoom_by", {"factor": 2})["zoom"], places=5)
            self.assertAlmostEqual(5, g.call("zoom_by", {"factor": 2.5})["zoom"], places=5)
            self.assertEqual(20, g.call("zoom_by", {"factor": 100})["zoom"])
            self.assertEqual(20, g.call("zoom_by", {"factor": 2})["zoom"])
            self.assertEqual(1, g.call("zoom_by", {"factor": 0.0001})["zoom"])

    def test_zoom_by_holds_the_window_centre(self):
        with game() as g:
            g.call("pan", {"dx": 30, "dy": -12})
            state = g.call("zoom_by", {"factor": 3})
            self.assertAlmostEqual(30, state["x"], places=5)
            self.assertAlmostEqual(-187, state["y"], places=5)
            self.assertEqual(3, state["zoom"])

    def test_pan_moves_the_view_in_model_units(self):
        with game() as g:
            state = g.call("pan", {"dx": 10, "dy": -5})
            self.assertAlmostEqual(10, state["x"], places=5)
            self.assertAlmostEqual(-180, state["y"], places=5)
            state = g.call("pan", {"dx": 2.5, "dy": 7.25})
            self.assertAlmostEqual(12.5, state["x"], places=5)
            self.assertAlmostEqual(-172.75, state["y"], places=5)

    def test_reset_returns_to_zoom_one_centred(self):
        with game() as g:
            g.call("zoom_by", {"factor": 6})
            g.call("pan", {"dx": -240, "dy": 130})
            state = g.call("reset")
            self.assertEqual(1, state["zoom"])
            self.assertAlmostEqual(0, state["x"], places=5)
            self.assertAlmostEqual(-175, state["y"], places=5)

    def test_bad_input_answers_an_error_and_never_throws(self):
        with game() as g:
            for name, payload in [
                ("zoom_by", {"factor": 0}),
                ("zoom_by", {"factor": -2}),
                ("zoom_by", {"factor": "huge"}),
                ("zoom_by", {}),
                ("pan", {"dx": "left"}),
                ("pan", {"dy": None}),
            ]:
                answer = g.call(name, payload)
                self.assertFalse(answer["ok"], (name, payload, answer))
                self.assertIn("error", answer)
            self.assertEqual(1, g.call("describe")["zoom"])
            self.assertEqual([], g.errors)


class PointerTest(unittest.TestCase):
    def test_wheel_zooms_towards_the_cursor(self):
        with game() as g:
            g.page.mouse.move(900, 400)
            g.page.mouse.wheel(0, -500)
            state = g.call("describe")
            self.assertGreater(state["zoom"], 1.5)
            # The point under the cursor was to the right, so the view drifts right.
            self.assertGreater(state["x"], 50)
            self.assertAlmostEqual(-175, state["y"], places=3)

    def test_drag_pans_the_scene(self):
        with game() as g:
            g.page.mouse.move(640, 400)
            g.page.mouse.down()
            g.page.mouse.move(760, 330, steps=6)
            g.page.mouse.up()
            state = g.call("describe")
            self.assertLess(state["x"], -50)
            self.assertGreater(state["y"], -160)
            self.assertEqual([], g.errors)

    def test_buttons_zoom_and_reset(self):
        with game() as g:
            g.page.locator("#zoom-in").click()
            zoomed = g.call("describe")["zoom"]
            self.assertGreater(zoomed, 1)
            g.page.locator("#zoom-in").click()
            self.assertGreater(g.call("describe")["zoom"], zoomed)
            g.page.locator("#zoom-out").click()
            self.assertLess(g.call("describe")["zoom"], 20)
            g.page.locator("#reset").click()
            state = g.call("describe")
            self.assertEqual(1, state["zoom"])
            self.assertAlmostEqual(0, state["x"], places=5)
            self.assertEqual([], g.errors)


if __name__ == "__main__":
    unittest.main()

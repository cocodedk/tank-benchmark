"""Zoom and pan through the WebMCP tools, and through the mouse."""
import unittest

from page import game


class ViewToolsTest(unittest.TestCase):
    def test_describe_names_the_bridge_and_starts_fitted(self):
        with game() as g:
            state = g.call("describe")
            self.assertIs(state["ok"], True)
            self.assertEqual(1, state["zoom"])
            self.assertEqual(0, state["x"])
            self.assertEqual(0, state["y"])
            parts = set(state["parts"])
            for part in ["north tower", "south tower", "high-level walkways", "river", "sky"]:
                self.assertIn(part, parts)
            self.assertEqual([], g.errors)

    def test_zoom_by_multiplies_and_clamps(self):
        with game() as g:
            state = g.call("zoom_by", {"factor": 2})
            self.assertEqual(2, state["zoom"])
            self.assertEqual((0, 0), (state["x"], state["y"]))

            state = g.call("zoom_by", {"factor": 2.5})
            self.assertEqual(5, state["zoom"])

            state = g.call("zoom_by", {"factor": 1000})
            self.assertEqual(20, state["zoom"])

            state = g.call("zoom_by", {"factor": 0.00001})
            self.assertEqual(1, state["zoom"])
            self.assertEqual([], g.errors)

    def test_pan_moves_the_centre_and_reset_returns(self):
        with game() as g:
            state = g.call("pan", {"dx": 10, "dy": 0})
            self.assertEqual((10, 0), (state["x"], state["y"]))

            state = g.call("pan", {"dx": -5, "dy": 12.5})
            self.assertEqual((5, 12.5), (state["x"], state["y"]))

            state = g.call("zoom_by", {"factor": 2})
            self.assertEqual((5, 12.5, 2), (state["x"], state["y"], state["zoom"]))

            state = g.call("reset")
            self.assertEqual((0, 0, 1), (state["x"], state["y"], state["zoom"]))
            self.assertEqual([], g.errors)

    def test_bad_input_answers_instead_of_throwing(self):
        bad_calls = [
            ("zoom_by", {}),
            ("zoom_by", {"factor": 0}),
            ("zoom_by", {"factor": -2}),
            ("zoom_by", {"factor": "2"}),
            ("pan", {}),
            ("pan", {"dx": 1}),
            ("pan", {"dx": 1, "dy": None}),
            ("pan", {"dx": "x", "dy": 0}),
            ("pan", {"dx": 1e308, "dy": 0}),
        ]
        with game() as g:
            for name, payload in bad_calls:
                with self.subTest(name=name, payload=payload):
                    answer = g.call(name, payload)
                    self.assertIs(answer["ok"], False)
                    self.assertTrue(answer["error"])
            state = g.call("describe")
            self.assertEqual((0, 0, 1), (state["x"], state["y"], state["zoom"]))
            self.assertEqual([], g.errors)

    def test_wheel_zooms_towards_the_cursor(self):
        with game() as g:
            g.page.mouse.move(320, 200)
            g.page.mouse.wheel(0, -360)
            state = g.call("describe")
            self.assertGreater(state["zoom"], 1)
            # Zooming about a point left of and above centre pulls the view that way.
            self.assertLess(state["x"], 0)
            self.assertLess(state["y"], 0)
            self.assertEqual([], g.errors)

    def test_drag_pans_the_view(self):
        with game() as g:
            g.page.mouse.move(640, 400)
            g.page.mouse.down()
            g.page.mouse.move(760, 460, steps=4)
            g.page.mouse.up()
            state = g.call("describe")
            self.assertLess(state["x"], 0)
            self.assertLess(state["y"], 0)
            # Dragging right twice as far as down moves the view the same way.
            self.assertAlmostEqual(state["x"], 2 * state["y"], places=2)
            self.assertEqual([], g.errors)

    def test_buttons_zoom_and_reset(self):
        with game() as g:
            g.page.click("#zoom-in")
            self.assertEqual(1.5, g.call("describe")["zoom"])
            g.page.click("#zoom-in")
            self.assertEqual(2.25, g.call("describe")["zoom"])
            g.page.click("#zoom-out")
            self.assertEqual(1.5, g.call("describe")["zoom"])
            g.page.click("#reset")
            state = g.call("describe")
            self.assertEqual((0, 0, 1), (state["x"], state["y"], state["zoom"]))
            self.assertEqual([], g.errors)


if __name__ == "__main__":
    unittest.main()

"""Zoom and pan: the tools, the wheel, the drag and the buttons."""
import unittest

from page import game

W, H = 1280, 800          # the viewport page.py opens
MODEL_W, MODEL_H = 1200, 780


def point_at(state, px, py):
    """The model point under a window pixel, from what describe reports."""
    scale = state["zoom"] * min(W / MODEL_W, H / MODEL_H)
    bw, bh = MODEL_W / state["zoom"], MODEL_H / state["zoom"]
    return (state["x"] - bw / 2 + (px - (W - bw * scale) / 2) / scale,
            state["y"] - bh / 2 + (py - (H - bh * scale) / 2) / scale)


class ViewTest(unittest.TestCase):
    def test_describe_says_where_we_are(self):
        with game() as g:
            state = g.call("describe")
            self.assertTrue(state["ok"], state)
            self.assertEqual(1, state["zoom"])
            self.assertAlmostEqual(600, state["x"], delta=0.5)
            self.assertAlmostEqual(390, state["y"], delta=0.5)
            self.assertIn("central dome", state["parts"])
            self.assertIn("four minarets", state["parts"])

    def test_zoom_by_multiplies_and_clamps(self):
        with game() as g:
            self.assertEqual(2, g.call("zoom_by", {"factor": 2})["zoom"])
            self.assertEqual(6, g.call("zoom_by", {"factor": 3})["zoom"])
            self.assertEqual(20, g.call("zoom_by", {"factor": 10})["zoom"])
            self.assertEqual(1, g.call("zoom_by", {"factor": 0.001})["zoom"])
            self.assertEqual(1, g.call("zoom_by", {"factor": 0.001})["zoom"])

    def test_a_bad_factor_is_an_error_not_a_throw(self):
        with game() as g:
            for bad in ({"factor": "two"}, {"factor": 0}, {"factor": -1}, {}):
                answer = g.call("zoom_by", bad)
                self.assertFalse(answer["ok"], bad)
                self.assertTrue(answer["error"])
            self.assertEqual(1, g.call("describe")["zoom"])

    def test_pan_moves_the_drawing_and_stops_at_the_edge(self):
        with game() as g:
            g.call("zoom_by", {"factor": 4})
            before = g.call("describe")
            after = g.call("pan", {"dx": 20, "dy": 10})
            self.assertAlmostEqual(before["x"] - 20, after["x"], delta=0.01)
            self.assertAlmostEqual(before["y"] - 10, after["y"], delta=0.01)
            # far past the edge: the drawing stays in the window
            edge = g.call("pan", {"dx": 100000, "dy": 100000})
            self.assertGreaterEqual(edge["x"], 0)
            self.assertGreaterEqual(edge["y"], 0)
            self.assertLessEqual(edge["x"], MODEL_W)
            self.assertLessEqual(edge["y"], MODEL_H)
            self.assertTrue(g.call("pan", {"dx": "a", "dy": 0})["error"])

    def test_pan_at_zoom_one_does_nothing(self):
        with game() as g:
            self.assertEqual(600, g.call("pan", {"dx": 40, "dy": 40})["x"])

    def test_reset_returns_to_the_whole_drawing(self):
        with game() as g:
            g.call("zoom_by", {"factor": 8})
            g.call("pan", {"dx": 300, "dy": 200})
            state = g.call("reset")
            self.assertEqual(1, state["zoom"])
            self.assertAlmostEqual(600, state["x"], delta=0.5)
            self.assertAlmostEqual(390, state["y"], delta=0.5)

    def test_the_wheel_zooms_towards_the_cursor(self):
        with game() as g:
            under = point_at(g.call("describe"), 320, 210)
            g.page.mouse.move(320, 210)
            g.page.mouse.wheel(0, -320)
            state = g.call("describe")
            self.assertGreater(state["zoom"], 1)
            # the point that was under the cursor is still under the cursor
            x, y = point_at(state, 320, 210)
            self.assertAlmostEqual(under[0], x, delta=2)
            self.assertAlmostEqual(under[1], y, delta=2)

    def test_dragging_pans(self):
        with game() as g:
            g.call("zoom_by", {"factor": 4})
            before = g.call("describe")
            before_pt = point_at(before, 640, 400)
            g.page.mouse.move(640, 400)
            g.page.mouse.down()
            g.page.mouse.move(740, 450, steps=4)
            g.page.mouse.up()
            after = g.call("describe")
            self.assertEqual(4, after["zoom"])
            x, y = point_at(after, 640, 400)
            self.assertAlmostEqual(before_pt[0] - 100 / (4 * min(W / MODEL_W, H / MODEL_H)), x, delta=1)
            self.assertAlmostEqual(before_pt[1] - 50 / (4 * min(W / MODEL_W, H / MODEL_H)), y, delta=1)

    def test_the_buttons_zoom_and_reset(self):
        with game() as g:
            g.page.click("#zoom-in")
            self.assertEqual(2, g.call("describe")["zoom"])
            g.page.click("#zoom-out")
            self.assertEqual(1, g.call("describe")["zoom"])
            g.call("zoom_by", {"factor": 5})
            g.page.click("#reset")
            self.assertEqual(1, g.call("describe")["zoom"])

    def test_the_window_size_is_followed(self):
        with game() as g:
            g.page.set_viewport_size({"width": 700, "height": 900})
            g.page.wait_for_timeout(120)
            self.assertEqual(1, g.call("describe")["zoom"])
            self.assertEqual([], g.errors)


if __name__ == "__main__":
    unittest.main()

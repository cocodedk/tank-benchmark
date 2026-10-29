"""Wheel zoom toward the cursor, the buttons, and drag-to-pan."""
import unittest

from page import game

CX, CY = 640, 400  # the screen point at the window centre


def world_under(view, sx, sy, width=1280, height=800):
    """The model point under a screen point, with zoom 1 fitting the window."""
    return (view["x"] + (sx - width / 2) / view["zoom"],
            view["y"] + (sy - height / 2) / view["zoom"])


class InteractionTest(unittest.TestCase):
    def test_wheel_zooms_toward_the_cursor(self):
        with game() as g:
            before = g.call("describe")
            g.page.mouse.move(300, 200)
            g.page.mouse.wheel(0, -300)
            after = g.call("describe")
            self.assertGreater(after["zoom"], 1)
            wx0, wy0 = world_under(before, 300, 200)
            wx1, wy1 = world_under(after, 300, 200)
            self.assertAlmostEqual(wx0, wx1, delta=0.05)
            self.assertAlmostEqual(wy0, wy1, delta=0.05)

    def test_buttons_zoom_and_reset(self):
        with game() as g:
            g.page.click("#zoom-in")
            zoomed = g.call("describe")
            self.assertGreater(zoomed["zoom"], 1)
            g.page.click("#zoom-out")
            self.assertEqual(1, g.call("describe")["zoom"])
            g.page.click("#zoom-in")
            g.page.click("#zoom-in")
            g.page.click("#reset")
            reset = g.call("describe")
            self.assertEqual((1, 0, 0), (reset["zoom"], reset["x"], reset["y"]))

    def test_drag_pans_in_model_units(self):
        with game() as g:
            g.call("zoom_by", {"factor": 4})
            before = g.call("describe")
            g.page.mouse.move(CX, CY)
            g.page.mouse.down()
            g.page.mouse.move(CX + 100, CY + 40)
            g.page.mouse.up()
            after = g.call("describe")
            self.assertAlmostEqual(before["x"] - 100 / 4, after["x"], places=2)
            self.assertAlmostEqual(before["y"] - 40 / 4, after["y"], places=2)


if __name__ == "__main__":
    unittest.main()

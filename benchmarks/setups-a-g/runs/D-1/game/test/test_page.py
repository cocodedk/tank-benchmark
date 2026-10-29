"""The page follows the window, draws explosions, drops held keys on blur and plays without WebMCP."""
import base64
import functools
import http.server
import threading
import unittest

from helpers import GameCase
from page import ROOT, _Quiet

# Counts the explosion's orange pixels in a screenshot, decoded by the page itself.
ORANGE = """async (b64) => {
  const img = new Image();
  img.src = 'data:image/png;base64,' + b64;
  await img.decode();
  const t = document.createElement('canvas');
  t.width = img.width; t.height = img.height;
  const x = t.getContext('2d'); x.drawImage(img, 0, 0);
  const d = x.getImageData(0, 0, t.width, t.height).data;
  let n = 0;
  for (let i = 0; i < d.length; i += 4) if (d[i] > 200 && d[i + 1] > 120 && d[i + 1] < 190 && d[i + 2] < 90) n++;
  return n;
}"""


class PageTest(GameCase):
    def canvas_size(self):
        return self.g.page.evaluate("(() => { const c = document.querySelector('canvas'); return [c.clientWidth, c.clientHeight]; })()")

    def test_the_canvas_follows_the_window_size(self):
        self.g.page.set_viewport_size({"width": 700, "height": 500})
        self.g.page.wait_for_function("document.querySelector('canvas').clientWidth === 700", timeout=3000)
        self.assertEqual([700, 500], self.canvas_size())
        self.g.page.set_viewport_size({"width": 1280, "height": 800})

    def orange(self):
        self.g.page.evaluate("new Promise(r => requestAnimationFrame(() => requestAnimationFrame(r)))")  # let it draw
        return self.g.page.evaluate(ORANGE, base64.b64encode(self.g.page.screenshot()).decode())

    def test_an_explosion_shows_where_a_shell_hits_and_goes_away(self):
        self.assertEqual(0, self.orange())
        self.call("fire", {"tank": "player"})
        self.step(2.1)  # the shell reaches the computer at about 1.9 s
        self.assertGreater(self.orange(), 50)
        self.step(0.6)
        self.assertEqual(0, self.orange())

    def test_blur_releases_every_held_key(self):
        self.g.page.keyboard.down("w")
        try:
            self.g.page.evaluate("dispatchEvent(new Event('blur'))")
            self.assertEqual(-15, self.step(1)["tanks"]["player"]["x"])
        finally:
            self.g.page.keyboard.up("w")

    def test_many_small_steps_add_up(self):
        self.g.page.keyboard.down("w")
        try:
            for _ in range(100):
                self.step(0.01)
        finally:
            self.g.page.keyboard.up("w")
        self.assertAlmostEqual(-9, self.call("describe")["tanks"]["player"]["x"], places=3)


class WithoutWebMcpTest(unittest.TestCase):
    def test_the_page_still_loads_and_shows_the_hud(self):
        from playwright.sync_api import sync_playwright
        import os
        import shutil
        server = http.server.ThreadingHTTPServer(("127.0.0.1", 0), functools.partial(_Quiet, directory=str(ROOT)))
        threading.Thread(target=server.serve_forever, daemon=True).start()
        chrome = os.environ.get("CHROME") or shutil.which("google-chrome") or shutil.which("chromium")
        errors = []
        try:
            with sync_playwright() as p:
                browser = p.chromium.launch(executable_path=chrome)
                page = browser.new_page()
                page.on("pageerror", lambda e: errors.append(str(e)))
                page.on("console", lambda m: m.type == "error" and not m.location.get("url", "").endswith("/favicon.ico")
                        and errors.append(m.text))
                page.goto(f"http://127.0.0.1:{server.server_port}/index.html")
                page.wait_for_selector(".hud")
                self.assertFalse(page.evaluate("!!document.modelContext"))
                page.wait_for_function("document.querySelector('.hud').innerText.includes('Round 1')", timeout=5000)
                self.assertEqual(1, page.evaluate("document.querySelectorAll('canvas').length"))
                browser.close()
        finally:
            server.shutdown()
            server.server_close()
        self.assertEqual([], errors)


if __name__ == "__main__":
    unittest.main()

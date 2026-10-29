"""python shots.py <checkout> <out-prefix> [wheel-x wheel-y]: screenshots at zoom 1, 5 and (with a point) wheel zoom there."""
import json
import pathlib
import sys

root, out = pathlib.Path(sys.argv[1]), sys.argv[2]
sys.path.insert(0, str(root / "test"))
from page import game  # noqa: E402

with game(root) as g:
    print("tools", g.tools(), "errors", g.errors)
    print(json.dumps(g.call("describe"))[:500])
    g.page.screenshot(path=f"{out}-z1.png")
    if len(sys.argv) > 4:
        g.page.mouse.move(float(sys.argv[3]), float(sys.argv[4]))
        for _ in range(12):
            g.page.mouse.wheel(0, -120)
            g.page.wait_for_timeout(60)
        print(json.dumps(g.call("describe"))[:200])
        g.page.screenshot(path=f"{out}-wheel.png")
        g.call("reset")
    print(json.dumps(g.call("zoom_by", {"factor": 5}))[:200])
    g.page.screenshot(path=f"{out}-z5.png")
    print("errors", g.errors)

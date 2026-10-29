"""python bridge_checks.py <checkout>: the judge's checks on a zoomable page, through its own tools and real input."""
import pathlib
import re
import sys

root = pathlib.Path(sys.argv[1])
sys.path.insert(0, str(root / "test"))
from page import game  # noqa: E402

results = []


def check(name, ok, note=""):
    results.append(ok)
    print("PASS" if ok else "FAIL", name, note)


with game(root) as g:
    page = g.page
    d = g.call("describe")
    check("describe answers ok with zoom 1 and parts", d.get("ok") and d.get("zoom") == 1 and len(d.get("parts", [])) >= 6, str(d)[:120])
    z = g.call("zoom_by", {"factor": 2})
    check("zoom_by 2 doubles the zoom", abs(z.get("zoom", 0) - 2) < 1e-6, str(z.get("zoom")))
    z = g.call("zoom_by", {"factor": 1000})
    check("zoom is clamped at 20", abs(z.get("zoom", 0) - 20) < 1e-6, str(z.get("zoom")))
    z = g.call("zoom_by", {"factor": 0.0001})
    check("zoom is clamped at 1", abs(z.get("zoom", 0) - 1) < 1e-6, str(z.get("zoom")))
    for bad in ({"factor": "x"}, {"factor": -2}, {}, {"factor": 0}):
        r = g.call("zoom_by", bad)
        check(f"zoom_by {bad} is refused, not thrown", r.get("ok") is False and "error" in r, str(r)[:80])
    r = g.call("pan", {"dx": "a"})
    check("pan with a bad input is refused", r.get("ok") is False and "error" in r, str(r)[:80])
    g.call("reset")
    z = g.call("zoom_by", {"factor": 4})
    before = g.call("pan", {"dx": 0, "dy": 0})
    after = g.call("pan", {"dx": 10, "dy": 5})
    moved = abs(after["x"] - before["x"] - 10) < 1e-6 and abs(after["y"] - before["y"] - 5) < 1e-6
    check("pan moves the view by dx, dy", moved, f"{before['x']},{before['y']} -> {after['x']},{after['y']}")
    r = g.call("reset")
    check("reset gives zoom 1 centred as at the start", r.get("zoom") == 1 and (r["x"], r["y"]) == (d["x"], d["y"]), str((r.get("x"), r.get("y"))))

    page.mouse.move(900, 250)
    page.mouse.wheel(0, -300)
    page.wait_for_timeout(400)
    w = g.call("describe")
    check("wheel up zooms in", w["zoom"] > 1, f"zoom {w['zoom']}")
    check("wheel zooms toward the cursor (view centre moves right and up)", w["x"] > d["x"], f"x {d['x']} -> {w['x']}")
    page.mouse.wheel(0, 300)
    page.wait_for_timeout(400)
    check("wheel down zooms back out", g.call("describe")["zoom"] < w["zoom"])

    g.call("reset")
    g.call("zoom_by", {"factor": 4})
    a = g.call("describe")
    page.mouse.move(600, 400)
    page.mouse.down()
    page.mouse.move(700, 400, steps=8)
    page.mouse.up()
    page.wait_for_timeout(200)
    b = g.call("describe")
    check("dragging right moves the view left", b["x"] < a["x"], f"x {a['x']} -> {b['x']}")

    g.call("reset")

    def button(pattern):
        for el in page.locator("button, [role=button]").all():
            text = " ".join(filter(None, [el.inner_text(), el.get_attribute("aria-label"), el.get_attribute("title")]))
            if re.search(pattern, text, re.I):
                return el
        return None

    plus, minus, reset = button(r"^\s*\+|zoom in|in\b"), button(r"^\s*[−-]|zoom out|out\b"), button(r"reset")
    check("+, − and Reset buttons exist", bool(plus and minus and reset))
    plus.click()
    z1 = g.call("describe")["zoom"]
    minus.click()
    z2 = g.call("describe")["zoom"]
    check("+ zooms in and − zooms out", z1 > 1 and z2 < z1, f"{z1} then {z2}")
    plus.click()
    plus.click()
    reset.click()
    check("Reset button returns to zoom 1", g.call("describe")["zoom"] == 1)

    page.set_viewport_size({"width": 700, "height": 500})
    page.wait_for_timeout(300)
    size = page.evaluate("""() => { const e = document.querySelector('canvas, svg'); const r = e.getBoundingClientRect();
        return [Math.round(r.width), Math.round(r.height), innerWidth, innerHeight]; }""")
    check("the drawing follows the window size", size[0] >= size[2] - 2 and size[1] >= size[3] - 2, str(size))
    check("no console errors", g.errors == [], str(g.errors)[:120])

print(f"{sum(results)}/{len(results)} checks passed")

"""The hidden acceptance checks: the builder never sees them. They grade one built game through its tools.

    uvx --with playwright python hidden/checks.py <game dir> [--out <dir>]

Prints one line per check and writes hidden.json (and screenshot.png) to --out. Each check opens its own
page, so one broken check cannot spoil the next. The numbers come from the spec: speed 6, turning 120°/s,
shell speed 15, tank radius 1.2, shell radius 0.25, 25 damage, inner walls 2 by 6 at (±8, ±8).
"""
from __future__ import annotations

import argparse
import json
import math
import pathlib
import sys

sys.path.insert(0, str(pathlib.Path(__file__).resolve().parents[1] / "seed" / "test"))
from page import game  # noqa: E402

TOOLS = {"describe", "pause", "step", "place", "fire", "set_ai", "reset"}
WALLS = {(-8, -8), (-8, 8), (8, -8), (8, 8)}
CHECKS = []


def check(fn):
    CHECKS.append(fn)
    return fn


def fresh(g, ai=False):
    g.call("pause", {"paused": True})
    g.call("set_ai", {"enabled": ai})
    return g.call("reset", {})


def hold(g, key, seconds):
    g.page.keyboard.down(key)
    state = g.call("step", {"seconds": seconds})
    g.page.keyboard.up(key)
    return state


def tank(state, who):
    return state["tanks"][who]


def signed(heading):
    return (heading + 180) % 360 - 180


def place(g, who, x, z, heading):
    said = g.call("place", {"tank": who, "x": x, "z": z, "heading": heading})
    assert said.get("ok"), f"place {who} ({x}, {z}) refused: {said}"
    return said


def near(name, got, want, tol):
    assert abs(got - want) <= tol, f"{name} {got:.2f}, expected {want} ± {tol}"


@check
def opens_clean(g, out):
    g.page.wait_for_timeout(2000)
    png = g.page.screenshot(path=str(out / "screenshot.png"))
    assert not g.errors, f"errors: {g.errors[:3]}"
    assert g.page.locator("canvas").count() >= 1, "no canvas"
    assert len(png) > 12000, f"the screenshot is {len(png)} bytes: nearly blank"


@check
def lists_the_seven_tools(g, out):
    missing = TOOLS - set(g.tools())
    assert not missing, f"missing {sorted(missing)}"


@check
def starts_as_the_spec_says(g, out):
    s = fresh(g)
    assert s["arena"] == {"width": 40, "depth": 30}, s["arena"]
    assert {(round(w["x"]), round(w["z"])) for w in s["walls"]} == WALLS, s["walls"]
    assert all((w["width"], w["depth"]) == (2, 6) for w in s["walls"]), s["walls"]
    p, c = tank(s, "player"), tank(s, "computer")
    near("player x", p["x"], -15, 0.01), near("computer x", c["x"], 15, 0.01)
    assert (round(p["heading"]), round(c["heading"])) == (0, 180), (p, c)
    assert p["health"] == c["health"] == 100 and s["score"] == {"player": 0, "computer": 0}, s
    assert s["round"] == 1 and s["state"] == "playing" and s["shells"] == [], s


@check
def w_drives_six_units_a_second(g, out):
    fresh(g)
    p = tank(hold(g, "w", 1.0), "player")
    near("x", p["x"], -9, 0.5), near("z", p["z"], 0, 0.3)


@check
def a_and_d_turn_opposite_ways(g, out):
    fresh(g)
    left = signed(tank(hold(g, "a", 0.5), "player")["heading"])
    near("turn after 0.5 s of A", abs(left), 60, 8)
    right = signed(tank(hold(g, "d", 1.0), "player")["heading"])
    near("heading after 1 s of D", right, -left, 10)


@check
def space_fires_one_shell(g, out):
    fresh(g)
    assert tank(hold(g, " ", 0.2), "player")["shots"] == 1, "holding Space for 0.2 s did not fire exactly once"


@check
def walls_stop_a_tank(g, out):
    fresh(g)
    place(g, "computer", 0, 13, 0)
    place(g, "player", -12, 8, 0)
    near("x at the inner wall", tank(hold(g, "w", 2.0), "player")["x"], -10.2, 0.35)
    place(g, "player", 16, 0, 0)
    near("x at the outer wall", tank(hold(g, "w", 2.0), "player")["x"], 18.8, 0.35)


@check
def a_shell_hits_for_25(g, out):
    fresh(g)
    place(g, "player", -5, 0, 0), place(g, "computer", 5, 0, 180)
    assert g.call("fire", {"tank": "player"}).get("fired") is True, "fire did not fire"
    s = g.call("step", {"seconds": 1.5})
    assert (tank(s, "computer")["health"], tank(s, "player")["health"], s["shells"]) == (75, 100, []), s


@check
def a_shell_bounces_once_then_goes(g, out):
    fresh(g)
    place(g, "computer", 0, 13, 0), place(g, "player", -14, 0, 90)
    assert g.call("fire", {"tank": "player"}).get("fired") is True, "fire did not fire"
    place(g, "player", -17, -13, 0)
    s = g.call("step", {"seconds": 1.0})
    assert len(s["shells"]) == 1 and s["shells"][0]["bounces"] == 1, f"after 1 s: {s['shells']}"
    near("shell z after its bounce", s["shells"][0]["z"], 12.9, 1.0)
    s = g.call("step", {"seconds": 2.5})
    assert s["shells"] == [] and tank(s, "player")["health"] == 100, f"after 3.5 s: {s['shells']}"


@check
def a_shell_can_hit_its_own_tank(g, out):
    fresh(g)
    place(g, "computer", 0, 13, 0), place(g, "player", 12, 0, 0)
    g.call("fire", {"tank": "player"})
    s = g.call("step", {"seconds": 1.5})
    assert (tank(s, "player")["health"], tank(s, "computer")["health"]) == (75, 100), s["tanks"]


@check
def no_second_shot_within_half_a_second(g, out):
    fresh(g)
    fired = [g.call("fire", {"tank": "player"}).get("fired")]
    fired.append(g.call("fire", {"tank": "player"}).get("fired"))
    g.call("step", {"seconds": 0.55})
    fired.append(g.call("fire", {"tank": "player"}).get("fired"))
    assert fired == [True, False, True], f"fire, fire, wait 0.55 s, fire gave {fired}"


@check
def four_hits_end_the_round(g, out):
    fresh(g)
    place(g, "player", -5, 0, 0), place(g, "computer", 5, 0, 180)
    for _ in range(4):
        g.call("fire", {"tank": "player"})
        s = g.call("step", {"seconds": 0.6})
    assert s["state"] == "round_over" and s["score"] == {"player": 1, "computer": 0}, (s["state"], s["score"])
    assert "You win the round" in g.page.inner_text("body"), "no banner saying 'You win the round'"
    s = g.call("step", {"seconds": 2.5})
    p, c = tank(s, "player"), tank(s, "computer")
    assert s["state"] == "playing" and s["round"] == 2 and p["health"] == c["health"] == 100, s
    near("player x in round 2", p["x"], -15, 0.01), near("computer x in round 2", c["x"], 15, 0.01)


@check
def the_computer_fires_and_hits(g, out):
    fresh(g, ai=True)
    s = g.call("step", {"seconds": 10})
    assert tank(s, "computer")["shots"] >= 1, "no computer shot in 10 s"
    s = g.call("step", {"seconds": 20})
    assert tank(s, "player")["health"] < 100 or s["score"]["computer"] > 0, "no hit on a still player in 30 s"


@check
def the_computer_seeks_without_entering_walls(g, out):
    fresh(g)
    place(g, "player", -12, 8, 0)
    g.call("set_ai", {"enabled": True})
    moved = 0.0
    for _ in range(30):
        c = tank(g.call("step", {"seconds": 1.0}), "computer")
        moved = max(moved, math.hypot(c["x"] - 15, c["z"]))
        for wx, wz in WALLS:
            gap = math.hypot(max(abs(c["x"] - wx) - 1, 0), max(abs(c["z"] - wz) - 3, 0))
            assert gap >= 1.1, f"computer inside the wall at ({wx}, {wz}): {c}"
        assert abs(c["x"]) <= 18.9 and abs(c["z"]) <= 13.9, f"computer through the outer wall: {c}"
    assert moved >= 2, f"the computer moved at most {moved:.1f} units in 30 s with the player behind a wall"


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("game")
    ap.add_argument("--out", default=".")
    args = ap.parse_args()
    root, out = pathlib.Path(args.game).resolve(), pathlib.Path(args.out).resolve()
    out.mkdir(parents=True, exist_ok=True)
    results = []
    for fn in CHECKS:
        try:
            with game(root) as g:
                fn(g, out)
            results.append({"check": fn.__name__, "passed": True})
        except Exception as error:  # a check that cannot run is a failed check, with its reason
            results.append({"check": fn.__name__, "passed": False, "why": f"{type(error).__name__}: {error}"[:400]})
        print(("PASS " if results[-1]["passed"] else "FAIL ") + fn.__name__, results[-1].get("why", ""), flush=True)
    passed = sum(r["passed"] for r in results)
    (out / "hidden.json").write_text(json.dumps({"passed": passed, "total": len(results), "checks": results}, indent=1))
    print(f"{passed}/{len(results)} hidden checks passed")
    return 0


if __name__ == "__main__":
    sys.exit(main())

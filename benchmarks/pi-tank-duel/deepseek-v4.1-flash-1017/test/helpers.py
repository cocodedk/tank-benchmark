"""Small shared helpers for the browser tests."""
from __future__ import annotations

import contextlib
import math

WALLS = [(-8, -8), (-8, 8), (8, -8), (8, 8)]
TANK_RADIUS = 1.2


def fresh(page, ai: bool = False) -> dict:
    """A paused game, AI as asked, reset to round one."""
    page.call("pause", {"paused": True})
    page.call("set_ai", {"enabled": ai})
    return page.call("reset")


def tank(state: dict, name: str = "player") -> dict:
    return state["tanks"][name]


def place(page, name: str, x: float, z: float, heading: float = 0) -> dict:
    answer = page.call("place", {"tank": name, "x": x, "z": z, "heading": heading})
    assert answer["ok"], answer
    return answer


def step(page, seconds: float) -> dict:
    return page.call("step", {"seconds": seconds})


@contextlib.contextmanager
def held(page, *keys: str):
    for key in keys:
        page.keyboard.down(key)
    try:
        yield
    finally:
        for key in keys:
            page.keyboard.up(key)


def wall_overlap(tank_state: dict, radius: float = TANK_RADIUS) -> bool:
    x, z = tank_state["x"], tank_state["z"]
    if abs(x) > 20 - radius + 1e-6 or abs(z) > 15 - radius + 1e-6:
        return True
    for wx, wz in WALLS:
        dx = max(abs(x - wx) - 1, 0)
        dz = max(abs(z - wz) - 3, 0)
        if math.hypot(dx, dz) < radius - 1e-6:
            return True
    return False

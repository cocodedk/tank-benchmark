"""Shared helpers for the tests: a paused, AI-off game and short ways to read and drive it."""


def fresh(g, ai=False):
    """Paused, round 1, AI as asked."""
    g.call("pause", {"paused": True})
    g.call("set_ai", {"enabled": ai})
    return g.call("reset")


def state(g):
    return g.call("describe")


def tank(g, name):
    return state(g)["tanks"][name]


def place(g, name, x, z, heading=0):
    return g.call("place", {"tank": name, "x": x, "z": z, "heading": heading})


def step(g, seconds):
    return g.call("step", {"seconds": seconds})


def hold(g, key, seconds):
    """Hold a key down for that many seconds of game time."""
    g.page.keyboard.down(key)
    out = step(g, seconds)
    g.page.keyboard.up(key)
    return out

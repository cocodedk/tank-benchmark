"""Small moves shared by the tests."""
import atexit
import contextlib

import page

_stack = contextlib.ExitStack()
_shared = None


@contextlib.contextmanager
def game():
    """The one Chrome the suite shares (opening one per test costs minutes); every test starts with quiet()."""
    global _shared
    if _shared is None:
        _shared = _stack.enter_context(page.game())
        atexit.register(_stack.close)
    yield _shared


def quiet(g, ai=False):
    """A fresh paused game, the computer's AI as asked."""
    g.call("pause", {"paused": True})
    g.call("set_ai", {"enabled": ai})
    return g.call("reset")


def hold(g, key, seconds):
    """Hold a key down while the game steps for that long; the state after."""
    g.page.keyboard.down(key)
    try:
        return g.call("step", {"seconds": seconds})
    finally:
        g.page.keyboard.up(key)


def place(g, tank, x, z, heading):
    answer = g.call("place", {"tank": tank, "x": x, "z": z, "heading": heading})
    assert answer["ok"], answer
    return answer


def win_round(g, shooter):
    """The shooter fires four shells at the other tank from the start positions; the state after."""
    for _ in range(3):
        g.call("fire", {"tank": shooter})
        g.call("step", {"seconds": 2.5})
    g.call("fire", {"tank": shooter})
    for _ in range(60):
        state = g.call("step", {"seconds": 0.05})
        if state["state"] == "round_over":
            return state
    raise AssertionError("the round never ended")

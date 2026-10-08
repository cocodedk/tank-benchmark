"""calls.charged(): what each claude call itself cost, so a resumed session is not paid for twice.

Run from the repository root: python3 -m unittest discover -s tests -v
"""
from __future__ import annotations

import pathlib
import sys
import unittest

HERE = pathlib.Path(__file__).resolve().parent
sys.path.insert(0, str(HERE.parent))

import calls  # noqa: E402 — after the path line above

EXPECTED_TESTS = 5


def call(cost: float, by_model: dict[str, float], resumed: bool = False) -> dict:
    """A claude call as bench.py records it: cost and by_model are the session's running totals."""
    return {"resumed": resumed, "cost": cost, "by_model": by_model}


class Charged(unittest.TestCase):
    def test_resumed_call_is_charged_only_what_it_added(self):
        out = calls.charged([call(1.0, {"opus": 1.0}), call(1.5, {"opus": 1.2, "haiku": 0.3}, resumed=True)])
        self.assertEqual(out[1]["cost"], 0.5)

    def test_resumed_call_is_charged_only_what_it_added_per_model(self):
        out = calls.charged([call(1.0, {"opus": 1.0}), call(1.5, {"opus": 1.2, "haiku": 0.3}, resumed=True)])
        self.assertEqual(out[1]["by_model"], {"opus": 0.2, "haiku": 0.3})

    def test_fresh_call_is_charged_its_whole_cost(self):
        out = calls.charged([call(2.0, {"sonnet": 1.25, "haiku": 0.75}), call(0.4, {"haiku": 0.4})])
        self.assertEqual(out, [{"cost": 2.0, "by_model": {"sonnet": 1.25, "haiku": 0.75}},
                               {"cost": 0.4, "by_model": {"haiku": 0.4}}])

    def test_build_then_two_resumed_repairs_sum_to_the_last_running_total(self):
        chain = [call(1.0, {"opus": 1.0}),
                 call(1.75, {"opus": 1.5, "haiku": 0.25}, resumed=True),
                 call(2.0, {"opus": 1.5, "haiku": 0.5}, resumed=True)]
        out = calls.charged(chain)
        self.assertEqual([one["cost"] for one in out], [1.0, 0.75, 0.25])
        self.assertEqual(sum(one["cost"] for one in out), chain[-1]["cost"])
        for model, running in chain[-1]["by_model"].items():
            self.assertEqual(sum(one["by_model"].get(model, 0) for one in out), running)


class Count(unittest.TestCase):
    def test_this_file_holds_expected_tests(self):
        found = unittest.defaultTestLoader.discover(str(HERE), pattern=pathlib.Path(__file__).name)
        self.assertEqual(found.countTestCases(), EXPECTED_TESTS)


if __name__ == "__main__":
    unittest.main()

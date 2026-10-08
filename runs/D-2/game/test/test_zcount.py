"""Guards against a test going missing: the suite has exactly this many tests."""
import pathlib
import unittest

EXPECTED = 22


class CountTest(unittest.TestCase):
    def test_the_suite_has_the_expected_number_of_tests(self):
        suite = unittest.defaultTestLoader.discover(str(pathlib.Path(__file__).parent), "test_*.py")
        self.assertEqual(EXPECTED, suite.countTestCases())


if __name__ == "__main__":
    unittest.main()

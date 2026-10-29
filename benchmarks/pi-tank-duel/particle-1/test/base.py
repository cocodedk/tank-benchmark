"""A page held open for a whole test class, paused with the AI off before each test."""
import unittest

from page import game


class PageTest(unittest.TestCase):
    @classmethod
    def setUpClass(cls):
        cls._context = game()
        cls.g = cls._context.__enter__()

    @classmethod
    def tearDownClass(cls):
        cls._context.__exit__(None, None, None)

    def setUp(self):
        self.g.call("pause", {"paused": True})
        self.g.call("set_ai", {"enabled": False})
        self.g.call("reset", {})
        self.state = self.g.call("describe")

    def key_down(self, key):
        self.g.page.keyboard.down(key)

    def key_up(self, key):
        self.g.page.keyboard.up(key)

    def step(self, seconds):
        return self.g.call("step", {"seconds": seconds})

    def tank(self, name="player"):
        return self.g.call("describe")["tanks"][name]


def overlaps_wall(x, z, walls, radius=1.2):
    for wall in walls:
        min_x = wall["x"] - wall["width"] / 2
        max_x = wall["x"] + wall["width"] / 2
        min_z = wall["z"] - wall["depth"] / 2
        max_z = wall["z"] + wall["depth"] / 2
        px = max(min_x, min(max_x, x))
        pz = max(min_z, min(max_z, z))
        if (x - px) ** 2 + (z - pz) ** 2 < radius ** 2 - 1e-6:
            return True
    return False

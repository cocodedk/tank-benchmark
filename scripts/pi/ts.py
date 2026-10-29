"""Stamps each line read from stdin with the time it arrived: pi's events in, `<seconds>\t<line>` out."""
import sys
import time

for line in sys.stdin:
    sys.stdout.write(f"{time.time():.3f}\t{line}")
    sys.stdout.flush()

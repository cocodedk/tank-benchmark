# Tower Bridge

A zoomable 2D model of Tower Bridge in London, in a browser. What it must do is the spec the builder is given.

- Pure JavaScript, HTML and CSS: no library, no build step, no npm, nothing loaded from the network.
- `index.html` at the top, code under `src/`.
- No file over 200 lines: split a growing file at a natural seam.
- The suite is `bash test/gate.sh`: Python unittest files `test/test_*.py`, each driving the page
  through its WebMCP tools with `test/page.py`. Keep the whole suite under two minutes.
- The simplest thing that works.

"""python image_checks.py <checkout> <model id>: the page draws its picture in code, loads no image, and signs its work."""
import pathlib
import re
import sys

root, model = pathlib.Path(sys.argv[1]), sys.argv[2]
sys.path.insert(0, str(root / "test"))
from page import game  # noqa: E402

IMAGE_FILE = re.compile(r"\.(png|jpe?g|gif|webp|avif|bmp|ico|tiff?)\b|data:image", re.I)
SOURCE_SUFFIXES = (".html", ".js", ".css", ".svg")
SIGNATURE = re.compile(r"Built by .+ · .+ · pi on OpenRouter")
LOADED = """() => [
  document.querySelectorAll('img, picture, image').length,
  performance.getEntriesByType('resource').filter(e => !e.name.endsWith('/favicon.ico')
    && (e.initiatorType === 'img' || /\\.(png|jpe?g|gif|webp|avif|bmp|ico)\\b/i.test(e.name))).length,
  (() => { const b = document.body.cloneNode(true); b.querySelectorAll('script, style').forEach(e => e.remove()); return b.textContent; })()
]"""

results = []


def check(name, ok, note=""):
    results.append(ok)
    print("PASS" if ok else "FAIL", name, note)


tracked = [p for p in root.rglob("*") if p.is_file() and ".git" not in p.parts and "__pycache__" not in p.parts]
pictures = [str(p.relative_to(root)) for p in tracked if p.suffix.lower() in (".png", ".jpg", ".jpeg", ".gif", ".webp", ".avif", ".bmp", ".ico")]
check("no image file in the checkout", not pictures, str(pictures[:3]))
mentions = [str(p.relative_to(root)) for p in tracked
            if p.suffix in SOURCE_SUFFIXES and "test" not in p.relative_to(root).parts and IMAGE_FILE.search(p.read_text(errors="ignore"))]
check("no source names an image file or a data:image", not mentions, str(mentions[:3]))

with game(root) as g:
    g.page.wait_for_timeout(500)
    elements, resources, text = g.page.evaluate(LOADED)
    check("the page has no img, picture or image element", elements == 0, str(elements))
    check("the page loaded no image", resources == 0, str(resources))
    check("the page signs its work with its model id", bool(SIGNATURE.search(text)) and model in text, (SIGNATURE.search(text) or [""])[0][:100])
    check("no console errors", g.errors == [], str(g.errors)[:120])

print(f"{sum(results)}/{len(results)} checks passed")

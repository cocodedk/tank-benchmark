"""Build the static site in site/: `python3 gallery.py`.

site/ holds the results page in English (index.html) and Persian (fa/index.html), each built from head.html,
page.html and the strings in i18n.json; the playable games of every finished run (games/<run>/), their first
frames (shots/), and the files GitHub Pages serves with them. .github/workflows/pages.yml publishes site/.
"""
from __future__ import annotations

import datetime
import json
import pathlib
import re
import shutil
import struct

import calls as calling

HERE = pathlib.Path(__file__).resolve().parent
SITE = HERE / "site"
ORIGIN = "https://tanks.cocode.dk"
REPO = "https://github.com/cocodedk/tank-benchmark"
LOCAL_THREE = "./vendor/three.module.min.js"
CDN_THREE = "https://cdn.jsdelivr.net/npm/three@0.170.0/build/three.module.min.js"
FONTS = {
    "en": "https://fonts.googleapis.com/css2?family=Saira+Semi+Condensed:wght@500;700"
          "&family=Source+Sans+3:ital,wght@0,400;0,600;1,400&display=swap",
    "fa": "https://fonts.googleapis.com/css2?family=Vazirmatn:wght@400;500;700&display=swap",
}
# Each page: its folder, direction, the way back to the shared files, Open Graph locales, and the other language's link.
PAGES = {
    "en": {"path": "", "dir": "ltr", "root": "", "locale": "en_US", "other": "fa_IR", "switch": ("fa/", "fa", "فارسی")},
    "fa": {"path": "fa/", "dir": "rtl", "root": "../", "locale": "fa_IR", "other": "en_US", "switch": ("../", "en", "English")},
}
STATIC = ("styles.css", "favicon.svg", "og.png")
I18N = json.loads((HERE / "i18n.json").read_text(encoding="utf-8"))
FA_DIGITS = str.maketrans("0123456789", "۰۱۲۳۴۵۶۷۸۹")


def summary(r: dict) -> dict:
    calls = [{**c, **paid} for c, paid in zip(r["calls"], calling.charged(r["calls"]))]
    rounds = r["rounds"]
    stage = lambda name, key: round(sum(c[key] for c in calls if c["stage"] == name), 2)  # noqa: E731
    by_model: dict[str, float] = {}
    for call in calls:
        for model, cost in call["by_model"].items():
            name = model.replace("claude-", "").replace("-5-5", "").split("-")[0].title()
            by_model[name] = round(by_model.get(name, 0) + cost, 2)
    build = next(c for c in calls if c["stage"] == "build")
    repairs = [c for c in calls if c["stage"] == "repair"]
    if "workers" not in r["final"]:
        raise SystemExit(f"{r['run']}: final.workers is missing (bench.py records it when a run ends)")
    return {"run": r["run"], "combo": r["run"].split("-")[0], "says": r["says"], "cost": round(sum(c["cost"] for c in calls), 2),
            "minutes": r["final"]["minutes"], "build_cost": stage("build", "cost"), "repair_cost": stage("repair", "cost"),
            "build_min": round(stage("build", "wall_s") / 60, 1), "repair_min": round(stage("repair", "wall_s") / 60, 1),
            "suite_min": round(sum(s.get("suite_s", 0) for s in rounds) / 60, 1),
            "review_min": round(sum(s.get("review_s", 0) for s in rounds) / 60, 1),
            "repairs": len(repairs), "rounds": [("green" if s.get("green") else "red") + "/" + (s.get("review") or "-")
                                                for s in rounds],
            "accepted": r["final"]["review"] == "ACCEPT", "green": r["final"]["green"],
            "findings": rounds[-1].get("findings", []) if rounds else [],
            "hidden": r["hidden"]["passed"], "checks": r["hidden"]["total"],
            "failed": [c["check"] for c in r["hidden"]["checks"] if not c["passed"]],
            "by_model": by_model, "cache_build": build["cache_read_share"],
            "cache_repair": [c["cache_read_share"] for c in repairs],
            "workers": r["final"]["workers"], "lines": r["final"]["diff_lines"],
            "code_lines": written(r["run"])[0], "test_lines": written(r["run"])[1],
            "shot": png_size(HERE / "runs" / r["run"] / "screenshot.png")}


def written(run: str) -> tuple[int, int]:
    """Non-blank lines the run wrote, as (game code, tests); a file still as the seed gave it does not count."""
    game, code, tests = HERE / "runs" / run / "game", 0, 0
    for path in sorted(game.rglob("*")):
        rel = path.relative_to(game)
        if not path.is_file() or rel.parts[0] == "vendor" or path.suffix not in (".html", ".js", ".css", ".py"):
            continue
        seed = HERE / "seed" / rel
        if seed.is_file() and seed.read_bytes() == path.read_bytes():
            continue
        lines = sum(1 for line in path.read_text(encoding="utf-8").splitlines() if line.strip())
        if rel.parts[0] == "test":
            tests += lines
        else:
            code += lines
    return code, tests


def png_size(path: pathlib.Path) -> list[int]:
    head = path.read_bytes()[:24]
    if head[:8] != b"\x89PNG\r\n\x1a\n":
        raise ValueError(f"{path} is not a PNG")
    return list(struct.unpack(">II", head[16:24]))


def persian_year(day: datetime.date) -> int:
    """The Solar Hijri year, which starts on 21 March (the day can differ by one in some years)."""
    return day.year - 621 if (day.month, day.day) >= (3, 21) else day.year - 622


def fill(template: str, values: dict) -> str:
    """Replace each {{name}}. A name with no value raises KeyError, so a misspelt placeholder cannot ship."""
    return re.sub(r"\{\{(\w+)\}\}", lambda m: values[m.group(1)], template)


def script_json(value) -> str:
    """JSON that can sit inside a <script>: no literal '<', so a string cannot close the tag."""
    return json.dumps(value).replace("<", "\\u003c")


def jsonld(lang: str, text: dict, url: str) -> dict:
    return {"@context": "https://schema.org", "@type": "WebSite", "name": "Tank Duel Benchmark",
            "description": text["description"], "url": url, "inLanguage": lang, "codeRepository": REPO,
            "author": {"@type": "Person", "name": "Babak Bandpey", "url": "https://cocode.dk",
                       "sameAs": ["https://linkedin.com/in/babakbandpey", "https://github.com/cocodedk"]},
            "publisher": {"@type": "Organization", "name": "Cocode", "url": "https://cocode.dk"}}


def page_html(lang: str, rows: list[dict], today: datetime.date) -> str:
    cfg, text = PAGES[lang], I18N[lang]
    url = f"{ORIGIN}/{cfg['path']}"
    year = str(persian_year(today)).translate(FA_DIGITS) if lang == "fa" else str(today.year)
    strings = {k: v for k, v in text.items() if isinstance(v, str)}
    strings["footer"] = text["footer"].replace("{year}", year)
    strings["lede"] = text["lede"].replace("{runs}", str(len(rows))).replace("{setups}", str(len({r["combo"] for r in rows})))
    head = fill(pathlib.Path(HERE / "head.html").read_text(encoding="utf-8"), {
        **strings, "origin": ORIGIN, "lang": lang, "dir": cfg["dir"], "root": cfg["root"], "fonts": FONTS[lang],
        "canonical": url, "og_locale": cfg["locale"], "og_locale_alt": cfg["other"],
        "jsonld": json.dumps(jsonld(lang, text, url), ensure_ascii=False, indent=1)})
    body = fill((HERE / "page.html").read_text(encoding="utf-8"), {
        **strings, "notes": "".join(f"<li>{item}</li>" for item in text["notes"]),
        "method": "".join(f"<li>{item}</li>" for item in text["method"]),
        "switch_href": cfg["switch"][0], "switch_lang": cfg["switch"][1], "switch_text": cfg["switch"][2]})
    script_data = {**text, "en_setups": I18N["en"]["setups"], "root": cfg["root"]}
    body = body.replace("/*DATA*/[]", script_json(rows)).replace("/*T*/{}", script_json(script_data))
    return head + body + "</body>\n</html>\n"


def publish_games(rows: list[dict]) -> None:
    (SITE / "shots").mkdir(parents=True, exist_ok=True)
    for row in rows:
        run = row["run"]
        game = HERE / "runs" / run / "game"
        for path in sorted(game.rglob("*")):
            rel = path.relative_to(game)
            if not path.is_file() or {"test", "vendor"} & set(rel.parts) or path.suffix not in (".html", ".js", ".txt"):
                continue
            out = SITE / "games" / run / rel
            out.parent.mkdir(parents=True, exist_ok=True)
            if rel.as_posix() == "index.html":
                text = path.read_text(encoding="utf-8")
                if LOCAL_THREE not in text or text.count("<head>") != 1:
                    raise SystemExit(f"{run}: index.html does not load {LOCAL_THREE} from one <head>")
                text = text.replace(LOCAL_THREE, CDN_THREE).replace(
                    "<head>", '<head>\n<link rel="icon" type="image/svg+xml" href="../../favicon.svg">')
                out.write_text(text, encoding="utf-8")
            else:
                shutil.copyfile(path, out)
        shutil.copyfile(HERE / "runs" / run / "screenshot.png", SITE / "shots" / f"{run}.png")


def sitemap(lastmod: str) -> str:
    alternates = (f'<xhtml:link rel="alternate" hreflang="en" href="{ORIGIN}/"/>'
                  f'<xhtml:link rel="alternate" hreflang="fa" href="{ORIGIN}/fa/"/>')
    urls = "".join(f"\n  <url>\n    <loc>{ORIGIN}/{cfg['path']}</loc>\n    {alternates}\n    <lastmod>{lastmod}</lastmod>\n  </url>"
                   for cfg in PAGES.values())
    return f'<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" ' \
           f'xmlns:xhtml="http://www.w3.org/1999/xhtml">{urls}\n</urlset>\n'


def llms(rows: list[dict]) -> str:
    games = ", ".join(row["run"] for row in rows)
    return f"""# Tank Duel Benchmark

> Results of a benchmark of AI build setups on one three.js tank game, with a playable copy of every run.

This site has WebMCP tools. A page that declares them registers each one with document.modelContext.registerTool,
and an agent in the browser lists them with document.modelContext.getTools(). Use the tools instead of reading the
page. Every tool takes a JSON object and answers with a JSON object.

## Results page: {ORIGIN}/ and {ORIGIN}/fa/

The English and the Persian page declare the same three read-only tools:

- describe: Says what this page shows: the benchmark, how many runs it holds and which setup won.
- list_runs: Lists every run with its setup letter, dollars, minutes, repairs, workers started, hidden checks passed and game link.
- compare_setups: Compares every setup, averaged over its runs: dollars, minutes, repairs and whether every run passed every hidden check.

## Game pages: {ORIGIN}/games/<run>/index.html

One playable game per finished run ({games}). Each game page declares seven tools:

- describe: Reads the game: arena, walls, both tanks, shells, score, round, state, paused and ai.
- pause: Pauses or resumes real-time play, with {{"paused": true}}.
- step: While paused, advances the game by more than 0 and at most 30 seconds, in 1/60 s steps.
- place: Moves a tank to x, z with a heading in degrees, if the spot is clear of walls and of the other tank.
- fire: Fires a shell for a tank, as the Space key does.
- set_ai: Switches the computer's driving and firing on or off.
- reset: Starts a new game: round 1, score 0 to 0, start positions and full health.

## Other files

- {ORIGIN}/robots.txt
- {ORIGIN}/sitemap.xml
"""


def main() -> None:
    today = datetime.date.today()
    runs = [json.loads(p.read_text(encoding="utf-8")) for p in sorted((HERE / "runs").glob("*/run.json"))]
    rows = [summary(r) for r in runs if "hidden" in r]
    shutil.rmtree(SITE, ignore_errors=True)
    (SITE / "fa").mkdir(parents=True)
    for lang, cfg in PAGES.items():
        (SITE / cfg["path"] / "index.html").write_text(page_html(lang, rows, today), encoding="utf-8")
    for name in STATIC:
        shutil.copyfile(HERE / name, SITE / name)
    publish_games(rows)
    # The repository keeps its own copy of what crawlers and agents read, so it is reviewed with the code.
    lastmod = max(r["updated"][:10] for r in runs if "hidden" in r)
    for name, text in (("robots.txt", f"User-agent: *\nAllow: /\n\nSitemap: {ORIGIN}/sitemap.xml\n"),
                       ("sitemap.xml", sitemap(lastmod)), ("llms.txt", llms(rows))):
        (HERE / name).write_text(text, encoding="utf-8")
        shutil.copyfile(HERE / name, SITE / name)
    (SITE / "CNAME").write_text("tanks.cocode.dk\n", encoding="utf-8")
    print(f"site/: {len(rows)} runs, {len(PAGES)} pages")


if __name__ == "__main__":
    main()

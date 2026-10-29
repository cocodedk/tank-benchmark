"""Numbers for one pi run: python3 -I metrics.py <pi-work> <dir> <in $/M> <out $/M> <cache-read $/M> [window].

`window` bills at half price when OpenRouter's DeepSeek listing does (UTC: weekends, and weekdays 00-01, 04-06, 10-24).
"""
import datetime
import json
import pathlib
import re
import sys


def half(at):
    t = datetime.datetime.fromtimestamp(at, datetime.timezone.utc)
    return t.weekday() >= 5 or t.hour in (0, 4, 5) or t.hour >= 10


work, name = pathlib.Path(sys.argv[1]), sys.argv[2]
price_in, price_out, price_cache = (float(x) for x in sys.argv[3:6])
windowed, billed = len(sys.argv) > 6, 0.0
begin = float((work / f"{name}.start").read_text())
end = float((work / f"{name}.done").read_text().split()[-1])

use = dict(input=0, output=0, cacheRead=0, cacheWrite=0, reasoning=0)
turns, gen_s, tool_s, errors = 0, 0.0, 0.0, 0
gates, started, cmds = [], None, {}
for line in (work / f"{name}.events").read_text().splitlines():
    stamp, _, body = line.partition("\t")
    try:
        ev = json.loads(body)
    except ValueError:
        continue
    kind, at = ev.get("type"), float(stamp)
    msg = ev.get("message") or {}
    if kind == "message_start" and msg.get("role") == "assistant":
        started = at
    elif kind == "message_end" and msg.get("role") == "assistant":
        turns += 1
        gen_s += at - started if started else 0
        one = msg.get("usage") or {}
        for key in use:
            use[key] += one.get(key, 0)
        billed += (one.get("input", 0) * price_in + one.get("output", 0) * price_out
                   + one.get("cacheRead", 0) * price_cache) / 1e6 * (0.5 if windowed and half(at) else 1)
        errors += bool(msg.get("errorMessage"))
    elif kind == "tool_execution_end":
        tool_s += (ev.get("durationMs") or 0) / 1000
        text = "".join(c.get("text", "") for c in (ev.get("result") or {}).get("content", []))
        if "test/gate.sh" in cmds.get(ev["toolCallId"], ""):
            gates.append(bool(re.search(r"^OK\s*$", text, re.M)) and "FAILED" not in text)
    elif kind == "tool_execution_start":
        cmds[ev["toolCallId"]] = (ev.get("args") or {}).get("command", "")

tree = work / name
code = {"game": 0, "test": 0, "files": 0, "longest": 0}
for path in tree.rglob("*"):
    rel = path.relative_to(tree).parts
    if not path.is_file() or rel[0] in (".git", "vendor", "__pycache__") or path.suffix not in (".js", ".html", ".css", ".py", ".sh"):
        continue
    n = sum(1 for ln in path.read_text().splitlines() if ln.strip())
    if rel[0] == "test" and rel[-1] in ("gate.sh", "page.py"):
        continue
    code["test" if rel[0] == "test" else "game"] += n
    code["files"] += 1
    code["longest"] = max(code["longest"], n)

cost = (use["input"] * price_in + use["output"] * price_out + use["cacheRead"] * price_cache) / 1e6
print(json.dumps({
    "wall_s": round(end - begin), "turns": turns, "gen_s": round(gen_s), "tool_s": round(tool_s),
    "tok_per_s": round(use["output"] / gen_s, 1) if gen_s else None, **use,
    "cost_flat_usd": round(cost, 4), "cost_billed_usd": round(billed, 4), "suite_runs": len(gates), "suite_green": gates,
    "errors": errors, "code": code,
}, indent=1))

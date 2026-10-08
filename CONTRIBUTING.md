# Contributing to Tank benchmark

This repository measures graph-loop's build setups ([issue #463](https://github.com/cocodedk/graph-loop/issues/463)).
A change to the harness, the spec or the hidden checks changes what the runs measure, so say so in the pull request.

## Local Setup

1. Install Python 3, git, [uv](https://docs.astral.sh/uv/), Google Chrome or Chromium, the Claude Code CLI (`claude`) and the Codex CLI (`codex`).
2. Clone the repository. Nothing else to install: the harness uses the standard library, and `uvx` fetches Playwright when a suite or the hidden checks run.

## Local Git Setup

Run once after cloning:

```bash
git config pull.rebase true          # rebase on pull instead of merge commit
git config core.autocrlf input       # normalize CRLF → LF on commit (macOS/Linux)
git config push.autoSetupRemote true # git push without needing -u the first time
git config init.defaultBranch main   # default branch name for new repos
```

Windows contributors use `core.autocrlf true` instead of `input`.

Then switch on the repository's hooks (lint, tests, Conventional Commits, no local paths, no force-push to main):

```bash
bash scripts/install-hooks.sh
```

## Build and Test Commands

```bash
python3 bench.py status                 # where every run is (reads only)
cp -r seed/vendor runs/B-1/game/ && cd runs/B-1/game && bash test/gate.sh   # one game's suite (three.js is not committed per run)
python3 bench.py grade B-1              # hidden checks again; rewrites that run's record in runs/
python3 gallery.py                      # rebuild site/ from the finished runs
```

## Coding Style

- Python 3 and the standard library only, in the harness.
- Keep files small and focused.
- The game is plain ES modules with no build step, and it loads nothing from the network. Leave `seed/vendor/` as it is.

## Changing the Benchmark

- `spec.md`, `seed/` and `hidden/` are the inputs to every run. A change to them changes what future runs measure, and existing runs were made with the old version. The pull request says which runs it affects.
- The setups are `COMBOS` in `bench.py`. The setups table in `README.md` must match them.

## Branches and Commits

- Use Conventional Commits, as the history does.
- The branch prefix matches the Conventional Commit type of the pull request.

| Branch prefix | Conventional Commit type | Example |
|---|---|---|
| `feature/` | `feat:` | `feature/add-setup-h` |
| `fix/` | `fix:` | `fix/status-with-no-runs` |
| `chore/` | `chore:` | `chore/update-dependabot` |
| `docs/` | `docs:` | `docs/update-readme` |
| `refactor/` | `refactor:` | `refactor/split-progress` |
| `ci/` | `ci:` | `ci/add-dependabot` |

Branch names use **kebab-case**. Never commit directly to `main`. Always open a pull request.

## PR Checklist

- [ ] `python3 bench.py status` runs without error.
- [ ] Changed behaviour was tried by hand, and the pull request says which command.
- [ ] `README.md` and `CONTRIBUTING.md` are updated if behaviour changed.
- [ ] A change to `spec.md`, `seed/` or `hidden/` says which runs it affects.

## Security

Report security problems as [SECURITY.md](SECURITY.md) describes, not in a public issue.

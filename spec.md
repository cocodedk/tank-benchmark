# Tank Duel

A browser game made with three.js. You drive a blue tank around a walled arena and try to hit the
computer's red tank before it hits you. Shells fly straight and bounce once off a wall.

## What you start with

- `vendor/three.module.min.js`: three.js r170, the only library. Load it with an import map
  (`"three": "./vendor/three.module.min.js"`). No npm, no build step, nothing else from the network.
- `test/gate.sh`: the suite. It runs every `test/test_*.py` in Chrome with WebMCP switched on, through
  the helper `test/page.py`. Add your tests there.

## The page

`index.html` at the top of the checkout, plus the ES modules it imports, under `src/`. The canvas fills
the browser window and follows its size.

## The arena

- A flat floor, x from -20 to 20 and z from -15 to 15 (40 by 30 units, y is up), with an outer wall on
  all four sides.
- Four inner walls, each 2 units along x and 6 along z, centred at (-8, -8), (-8, 8), (8, -8) and
  (8, 8). Nothing else blocks the way; the line z = 0 is open from wall to wall.
- A fixed camera, above the arena and tilted, shows all of it at once, so the tanks look
  three-dimensional.

## The tanks

- Two tanks: yours (blue) and the computer's (red). Each is a low-poly model with a hull, tracks, a
  turret and a barrel, made from three.js geometry (no model files). The turret and barrel point the
  way the hull points.
- For collisions a tank is a circle of radius 1.2. It cannot enter a wall or the other tank: it stops
  at the contact (sliding along a wall is fine).
- A heading is in degrees: heading h faces the direction (cos h, sin h) in (x, z), so 0 faces +x and 90
  faces +z.
- Forward speed 6 units/s, reverse 4 units/s, turning 120 degrees/s.
- Every round starts with yours at (-15, 0) heading 0 and the computer's at (15, 0) heading 180, both
  with 100 health.

## Your controls

- W or ↑ drives forward and S or ↓ backward; A or ← and D or → turn the tank left and right, as its
  driver sees it. Space fires.
- A key acts while it is held: the game reads the held keys at every simulation step.

## Shells

- A tank fires a shell from 1.6 units in front of its centre, along its heading, at 15 units/s. A shell
  is a sphere of radius 0.25.
- A tank may fire again 0.5 s after its last shot, and may have at most 3 shells in flight.
- A shell's first wall contact reflects it (the part of its velocity across the wall flips). Its second
  wall contact removes it.
- A shell that touches any tank, its own included, is removed and takes 25 health from that tank. A
  short explosion shows where it hit.
- Shells pass through each other.

## Rounds and score

- A tank at 0 health loses the round. The other side scores 1 and a banner says "You win the round" or
  "The computer wins the round" for 2 seconds of game time. Then a new round starts from the start
  positions, with full health and no shells. The score carries on; there is no end to the match.
- A head-up display shows each tank's health as a bar, labelled "You" and "Computer", the score, the
  round number, and one line with the controls.

## The computer

When its AI is on (the default), the computer drives and fires by itself. It turns toward you, moves to
find a clear line, never drives into a wall, and fires when you are in its line of fire with no wall
between. A steady player should beat it often, but not always.

## Timing

The game advances in fixed steps of 1/60 s. Real time drives the steps while the game is not paused;
the `step` tool drives them while it is paused. Both run the same code, so a test through `step`
tests the game.

## WebMCP tools

Register each tool with `document.modelContext.registerTool({name, description, inputSchema, execute})`.
When `document.modelContext` is absent, register nothing; the game still plays. Every tool answers
with a JSON object. A bad input answers `{"ok": false, "error": "..."}` and never throws.

| Tool | Input | What it does | Answer |
|---|---|---|---|
| `describe` | `{}` | reads the game | the state |
| `pause` | `{"paused": true}` | pauses or resumes real-time play | `{"ok": true, "paused": true}` |
| `step` | `{"seconds": 1.5}`, more than 0 and at most 30 | only while paused: advances the game by that many seconds in 1/60 s steps, reading the keys held now | the state |
| `place` | `{"tank": "player", "x": 0, "z": 0, "heading": 90}` | moves that tank (`player` or `computer`) there; refuses a spot inside a wall, overlapping the other tank or outside the arena | the state |
| `fire` | `{"tank": "player"}` | fires, as Space does | `{"ok": true, "fired": true}`; `fired` is false while the tank must wait or has 3 shells out |
| `set_ai` | `{"enabled": false}` | switches the computer's driving and firing on or off | `{"ok": true, "ai": false}` |
| `reset` | `{}` | a new game: round 1, score 0 to 0, start positions, full health, no shells; pause and AI stay as they are | the state |

The state:

```json
{"ok": true,
 "arena": {"width": 40, "depth": 30},
 "walls": [{"x": -8, "z": -8, "width": 2, "depth": 6}, {"x": -8, "z": 8, "width": 2, "depth": 6},
           {"x": 8, "z": -8, "width": 2, "depth": 6}, {"x": 8, "z": 8, "width": 2, "depth": 6}],
 "tanks": {"player": {"x": -15, "z": 0, "heading": 0, "health": 100, "shots": 0},
           "computer": {"x": 15, "z": 0, "heading": 180, "health": 100, "shots": 0}},
 "shells": [{"x": 1.0, "z": 0.0, "owner": "player", "bounces": 0}],
 "score": {"player": 0, "computer": 0},
 "round": 1, "state": "playing", "paused": false, "ai": true}
```

`walls` lists the four inner walls. `heading` is in [0, 360). `shots` counts the shells that tank fired
in this game. `state` is `"playing"`, or `"round_over"` while the banner shows.

## Done when

1. Opening the page shows the arena, both tanks and the head-up display, with no error in the console.
2. All seven tools are listed and answer as above.
3. Holding W for 1 s moves your tank 6 units along its heading; A and D turn it in opposite directions
   at 120 degrees/s; holding Space fires one shell.
4. A tank driving into an inner wall or the outer wall stops at it.
5. A shell fired at the other tank across open ground takes 25 health from it and disappears.
6. A shell bounces once off a wall and disappears at its second wall; a shell that comes back can hit
   its own tank.
7. A tank cannot fire twice within 0.5 s.
8. Four hits end the round, update the score and show the banner; 2 s later the next round starts from
   the start positions with full health.
9. With the AI on and you standing still, the computer fires and hits you within 30 s; with you behind
   a wall, it drives to find you without entering a wall.
10. `bash test/gate.sh` passes, with tests for the above.

Out of scope: sound, menus, more levels, touch controls, more than two tanks.

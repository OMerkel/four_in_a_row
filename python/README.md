# Four in a Row (Connect Four)

[![Python Version](https://img.shields.io/badge/python-3.13%2B-blue.svg)](https://www.python.org/)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)
[![Pytest](https://img.shields.io/badge/tested%20with-pytest-blue.svg)](https://docs.pytest.org/)
[![GUI Coverage](https://img.shields.io/badge/gui%20coverage-100%25-brightgreen.svg)](https://pypi.org/project/pytest-cov/)
[![UV](https://img.shields.io/badge/managed%20by-uv-purple.svg)](https://github.com/astral-sh/uv)

Fully functional Four in a Row game in Python with CLI and GUI front-ends:

- 7x6 board (width x height)
- two human players
- AI engines (computer players): random, minimax, negamax, alpha-beta, MCTS with UCB
- principal variation (PV) and evaluation output in range [-1.0, +1.0]
- undo and replay move history
- SGF import/export for persistence
- pytest + pytest-cov test suite

## Choose your mode

| Mode | Start command | Best for |
| --- | --- | --- |
| CLI | `uv run python -m four_in_a_row` | command-driven play, undo/replay workflows, quick engine experiments |
| GUI | `uv run python -m four_in_a_row.gui` | click-based play, visual board state, engine-vs-engine observation |

## Requirements

- Python 3.13+
- [uv](https://docs.astral.sh/uv/)

## License

This project is licensed under the terms in [LICENSE](LICENSE).

## Setup

```powershell
uv sync --dev
```

## Run

This section describes how to run the Command Line Interface version:

```powershell
uv run python -m four_in_a_row
```

or

```powershell
uv run four-in-a-row
```

Compatibility wrapper (equivalent behavior):

```powershell
uv run python main.py
```

## GUI

Launch the graphical interface (requires `matplotlib`):

```powershell
uv run python -m four_in_a_row.gui
```

Without arguments the GUI prompts for each player's mode interactively. You can
also configure both players upfront via command-line flags:

```powershell
# Human vs MCTS
uv run python -m four_in_a_row.gui --p1 human --p2 mcts --p2-strength 800

# Minimax vs Alpha-Beta
uv run python -m four_in_a_row.gui --p1 minimax --p1-strength 4 --p2 alphabeta --p2-strength 6

# AI self-play: Negamax vs Random
uv run python -m four_in_a_row.gui --p1 negamax --p1-strength 4 --p2 random
```

### GUI flags

| Flag | Values | Description |
| ---- | ------ | ----------- |
| `--p1` | `human`, `random`, `minimax`, `negamax`, `alphabeta`, `mcts` | Player 1 (red) mode |
| `--p2` | same as `--p1` | Player 2 (yellow) mode |
| `--p1-strength` | integer | Engine strength for Player 1: search depth or MCTS iterations |
| `--p2-strength` | integer | Engine strength for Player 2: search depth or MCTS iterations |

Aliases `alpha-beta` and `alpha_beta` are also accepted for the alphabeta engine.

### GUI in-game controls

Click a column to drop your token. After a game ends, a prompt appears for the
next action:

- `help` - show post-game command help
- `save <file.sgf>` - export the finished game to SGF
- `new` — start a new game
- `quit` — close the window

## In-game commands (CLI)

### 1..7

- Usage: `<column>`
- Meaning: Drop a token into column `1..7`.

### move \<n\>

- Usage: `move <column>`
- Parameters:
  - `<column>`: column number in range `1..7`
- Meaning: Same as entering a number directly.

### new

- Usage: `new`
- Meaning: Start a fresh game and clear undo/replay history.

### undo [n]

- Usage: `undo [count]`
- Parameters:
  - `[count]`: optional positive integer (default: `1`)
- Meaning: Undo one or more already applied moves.
  This is also available after a match has finished, which reopens the game.

### replay [n]

- Usage: `replay [count]`
- Parameters:
  - `[count]`: optional positive integer (default: `1`)
- Meaning: Replay one or more previously undone moves.
  This is also available after a match has finished.

### suggest \<engine\> [value]

- Usage: `suggest <engine> [value]`
- Parameters:
  - `<engine>`: `random` | `minimax` | `negamax` | `alphabeta` |
    `alpha-beta` | `alpha_beta` | `mcts` (default: `alphabeta`)
  - `[value]`: positive integer
    - `minimax`/`negamax`/`alphabeta`: search depth (default: `5`)
    - `mcts`: iteration count (default: `800`)
- Meaning: Print suggested move, principal variation (PV), and evaluation.

### play \<engine\> [value]

- Usage: `play <engine> [value]`
- Parameters:
  - `<engine>`: same engine options as `suggest`
  - `[value]`: same meaning/defaults as `suggest`
- Meaning: Compute a suggestion and apply that move immediately.

### save <file.sgf>

- Usage: `save <path/to/file.sgf>`
- Parameters:
  - `<path>`: target SGF file path
- Meaning: Export current move sequence to SGF.

### load <file.sgf>

- Usage: `load <path/to/file.sgf>`
- Parameters:
  - `<path>`: source SGF file path
- Meaning: Import SGF moves and rebuild game state/history.

### show

- Usage: `show`
- Meaning: Re-render the board without changing game state.

### help

- Usage: `help`
- Meaning: Print command reference.

### quit

- Usage: `quit`
- Meaning: Exit the game.

CLI output shows columns as `1..7`. Engine APIs and `EngineSuggestion` values use
**0-based** column indexes internally.

The CLI prompt also shows a compact move counter:

- `#6`: 6 moves are currently applied.
- `#6/11`: 6 moves are currently applied out of 11 total recorded moves.
  The `/total` part is shown only when replay is possible.

After `undo`, the CLI prints the same compact progress form, for example
`Undo state: #6/11`.

Examples:

```text
suggest negamax 5
play negamax 5
suggest alpha-beta 5
suggest minimax 4
suggest mcts 1200
```

## Testing

```powershell
uv run pytest
```

Run fast unit checks only:

```powershell
uv run pytest -m fast
```

With test coverage measurement:

```powershell
uv run pytest --rootdir=. --cov=. --cov-branch
```

Run AI/CLI regression checks:

```powershell
uv run pytest -m regression
```

Coverage is configured in `pyproject.toml` using `pytest-cov`.

### GUI test suite map

GUI tests are split by responsibility under `tests/gui/`:

- `conftest.py`: shared fixtures/helpers (`input_from`, `make_app`)
- `test_gui_config.py`: player kind/strength normalization and config resolution
- `test_gui_rendering.py`: plot setup, board rendering, winner/highlight behavior
- `test_gui_ai_flow.py`: move application, AI turn logic, AI loop handling
- `test_gui_click_interaction.py`: click-event branch behavior
- `test_gui_post_game_prompt.py`: post-game command loop (`help`, `save`, `new`, `quit`)
- `test_gui_entrypoints.py`: run lifecycle and module/CLI entrypoints

Run only GUI tests with:

```powershell
uv run pytest tests/gui
```

## Quality checks

Run lint checks:

```powershell
uv run ruff check .
```

Run type checks:

```powershell
uv run mypy
```

CI runs lint, type-checking, and tests via `.github/workflows/ci.yml`.

## Public API imports

You can import the engine API directly from the package root:

```python
from four_in_a_row import (
  EngineSuggestion,
  suggest_move,
  random_suggestion,
  minimax_suggestion,
  negamax_suggestion,
  alphabeta_suggestion,
  mcts_suggestion,
)
```

You can also import the split engine modules if you prefer module-oriented usage:

```python
from four_in_a_row import ai_random, ai_minimax, ai_negamax, ai_alphabeta, ai_mcts_ucb

suggestion = ai_minimax.minimax_suggestion(state, depth=4)
```

## Documentation

Project documentation source files live in `doc/` and are rendered with Zensical
into `site/`.

- Source directory: `doc/`
- Build output directory: `site/`

Build the site with:

```powershell
uv run zensical build
```

Preview the documentation locally with:

```powershell
uv run zensical serve
```

Docs build validation also runs in CI via `.github/workflows/docs.yml`.

Documentation source of truth lives in `doc/`. Edit those markdown files,
rebuild with Zensical using `zensical.toml`, and treat `site/` as generated
output.

Pull requests that change CLI, engine, or SGF behavior files must also update
at least one relevant documentation page. The policy is described in
`doc/docs_freshness.md` and enforced in CI.

### Docs contribution quick checklist

- If behavior changes, update related docs in `README.md` and/or `doc/*.md`.
- Rebuild docs locally with `uv run zensical build`.
- Run the freshness helper: `uv run python scripts/check_docs_freshness.py`.

## Where to change what

Use this map when deciding where to implement or document a change:

- Start from the docs index: [doc/index.md](doc/index.md)
- High-level system flow and module responsibilities: [doc/software_architecture.md](doc/software_architecture.md)
- Engine behavior and API contract: [doc/engines.md](doc/engines.md)
- SGF persistence format and validation: [doc/sgf.md](doc/sgf.md)

Common code touchpoints:

- CLI commands and interaction loop: `four_in_a_row/cli.py`
- Game rules and board state: `four_in_a_row/game.py`
- Undo/replay behavior: `four_in_a_row/history.py`
- Engine facade and dispatch: `four_in_a_row/engines.py`
- SGF import/export implementation: `four_in_a_row/sgf.py`

## Engine benchmark

Compare minimax and negamax node calls and timings:

```powershell
uv run python scripts/benchmark_minimax_negamax.py --max-depth 5 --repeats 3
```

For deterministic engine tests or experiments, pass a seeded `random.Random`
instance to the random or MCTS helpers.

## Contact

For questions or contributions, please open an issue or pull request on GitHub.

----

## Further Reading

- [Monte Carlo Tree Search (Wikipedia)](https://en.wikipedia.org/wiki/Monte_Carlo_tree_search)
- [Connect Four Strategy](https://en.wikipedia.org/wiki/Connect_Four#Strategy)

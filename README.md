# Four in a Row

[![Python Version](https://img.shields.io/badge/python-3.13%2B-blue.svg)](https://www.python.org/)
[![JavaScript](https://img.shields.io/badge/javascript-ES%20Modules-f7df1e.svg?logo=javascript&logoColor=black)](https://developer.mozilla.org/en-US/docs/Web/JavaScript)
[![HTML5](https://img.shields.io/badge/html5-browser%20app-e34f26.svg?logo=html5&logoColor=white)](https://developer.mozilla.org/en-US/docs/Glossary/HTML5)

[![Pytest](https://img.shields.io/badge/tested%20with-pytest-blue.svg)](https://docs.pytest.org/)
[![Vitest](https://img.shields.io/badge/tested%20with-vitest-6e9f18.svg?logo=vitest&logoColor=white)](https://vitest.dev/)
[![Playwright](https://img.shields.io/badge/e2e-playwright-45ba63.svg?logo=playwright&logoColor=white)](https://playwright.dev/)
[![GUI Coverage](https://img.shields.io/badge/gui%20coverage-100%25-brightgreen.svg)](https://pypi.org/project/pytest-cov/)

[![UV](https://img.shields.io/badge/managed%20by-uv-purple.svg)](https://github.com/astral-sh/uv)
[![License](https://img.shields.io/badge/license-MIT-green.svg)](LICENSE)

This repository contains two playable implementations of Four in a Row (Connect Four):

- a Python application with CLI and GUI front ends
- an HTML5/JavaScript browser version with an MCTS-based AI

Both versions implement the classic 7x6 game and focus on clear engine structure,
testability, and documented architecture.

## Repository Overview

### Python

Path: `python/`

Highlights:

- command-line interface for human and engine-driven play
- graphical interface built with `matplotlib`
- multiple AI engines: random, minimax, negamax, alpha-beta, MCTS with UCB
- SGF import/export support
- pytest-based test suite

Quick start:

```powershell
cd python
uv sync --dev
uv run python -m four_in_a_row
```

Launch the GUI:

```powershell
cd python
uv run python -m four_in_a_row.gui
```

Run tests:

```powershell
cd python
uv run pytest
```

See [python/README.md](python/README.md) for commands, engine options, GUI usage,
and test details.

### HTML5 / JavaScript

Path: `javascript/html5/src/`

Highlights:

- browser-based Connect Four with responsive board rendering
- independent human/AI configuration for both players
- AI powered by UCT / MCTS in a Web Worker
- unit tests with Vitest and end-to-end tests with Playwright

Quick start:

```powershell
cd javascript/html5/src
npm install
node tests/server.js
```

Then open `http://localhost:4173` in a browser.

Run tests:

```powershell
cd javascript/html5/src
npm test
npm run test:e2e
```

See [javascript/html5/src/README.md](javascript/html5/src/README.md) for browser,
testing, and architecture details.

## Project Structure

```text
four_in_a_row/
├── README.md
├── python/
│   ├── four_in_a_row/
│   ├── tests/
│   └── doc/
└── javascript/
    └── html5/
        └── src/
            ├── js/
            ├── tests/
            └── doc/
```

## Documentation

Repository documentation is organized per implementation:

- Python engine and architecture docs: `python/doc/`
- HTML5 engine and architecture docs: `javascript/html5/src/doc/`

Generated site output for the Python documentation is committed under `python/site/`.

## Requirements

- Python version: 3.13+
- Python package manager: `uv`
- Node.js and npm for the browser version

On some Windows systems, `node` may resolve to Microsoft HPC tools instead of
Node.js. If that happens, prepend `C:\Program Files\nodejs` to `PATH` before
running npm-based commands.

## Authors

See the `AUTHORS` files at the repository root and within each implementation.

## License

This repository is licensed under the terms in [LICENSE](LICENSE).

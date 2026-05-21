# Connect 4

Modern HTML5 implementation of Connect 4 with a built-in AI based on UCT / MCTS (UCB1).

This project is fully browser-based, uses modern ES modules, and has no runtime UI framework dependency.

---

## Features

- Play Connect 4 on a 7x6 grid.
- Configure players independently: Human vs Human, Human vs AI, AI vs AI.
- Configure AI difficulty independently for Red and Yellow: Easy, Medium, Hard.
- Difficulty badge in the header shows both sides and profile (for example `AI: R Easy | Y Hard | Desktop`).
- Reactive UI state store with explicit worker message flow.
- AI move selection via Monte Carlo Tree Search (UCT/UCB1).
- Responsive SVG board rendering.
- Full test suite:
  - Unit tests (Vitest) for board logic and UCT engine.
  - End-to-end tests (Playwright) for gameplay and UI flows.
- PWA (Progressive Web App) install support

---

## Tech Stack

- Language: JavaScript (ES modules)
- UI: HTML5 + CSS + SVG DOM API
- Concurrency: Web Worker (`js/controller.js`)
- AI: UCT / MCTS (`js/uct/`)
- Unit tests: Vitest
- E2E tests: Playwright

---

## Project Structure

```text
src/
├── index.html
├── README.md
├── package.json
├── vitest.config.js
├── playwright.config.js
├── css/
│   └── index.css
├── doc/
│   ├── engine_mcts_ucb.md
│   └── software_architecture.md
├── js/
│   ├── common.js
│   ├── board.js
│   ├── store.js
│   ├── renderer.js
│   ├── hmi.js
│   ├── controller.js
│   └── uct/
│       ├── uct.js
│       └── uctnode.js
├── tests/
│   ├── server.js
│   ├── unit/
│   │   ├── board.test.js
│   │   └── uct.test.js
│   └── e2e/
│       └── game.spec.js
└── img/
```

---

## Getting Started

### Play online

- [Play Four in a Row online](https://omerkel.github.io/four_in_a_row/javascript/html5/src/)

### PWA - Progressive Web App

This app is a **Progressive Web App (PWA)**, which means you can install it on your device for an app-like experience.

#### Install on Your Device

**Desktop (Windows, macOS, Linux):**

1. Open the app in a modern browser (Chrome, Edge, Brave, etc.)
2. Look for an **install icon** in the address bar (may appear as a download icon or app icon)
3. Click it and confirm installation
4. The app will open in its own window, independent of the browser

**Mobile (iOS, Android):**

*Android:*

1. Open the app in Chrome, Edge, or Samsung Internet
2. Tap the **menu** (three dots) → **Install app** (or similar)
3. Confirm the installation
4. The app appears on your home screen as an icon

*iOS:*

1. Open the app in Safari
2. Tap the **Share** button at the bottom
3. Select **Add to Home Screen**
4. Choose a name and tap **Add**
5. The app appears on your home screen

#### PWA Features

Once installed, you get:

- **Offline Play** – Play games without an internet connection
- **Fast Loading** – Cached assets load instantly
- **Standalone App** – Runs like a native app (no address bar)
- **Custom Icon** – Appears on your device with the game icon
- **Themed UI** – Matches the app's color scheme

#### PWA Caching Strategy

The service worker in `sw.js` uses a two-layer cache model:

- **Strict app-shell precache at install time**
  - Core files (HTML, CSS, JS, manifest, and key UI assets) must cache successfully.
  - If app-shell precache fails, service worker install fails instead of silently succeeding.
- **Manifest-driven media precache**
  - Icons and screenshots listed in `manifest.json` are discovered and cached automatically.
  - This media step is additive and non-blocking, so shell reliability is prioritized.

Runtime fetch behavior:

- **Navigation requests** (`mode === "navigate"`): network-first, then cached page, then cached app shell.
- **Same-origin static assets**: cache-first with network fill.

This combination improves reliability on mobile installs while still keeping HTML reasonably fresh.

#### Verifying Mobile Offline Install

1. Open the app while online and wait for initial load to finish.
2. Install to home screen.
3. Re-open the installed app once online to let the latest service worker activate.
4. Disable network (Airplane mode) and launch again.
5. Confirm board UI, icons, and gameplay still load.

If you previously installed an older build, clear site storage/uninstall and reinstall once.

#### PWA Requirements

- A modern browser supporting service workers (Chrome, Edge, Firefox, Safari 11+)
- HTTPS connection (or localhost for development)

### Prerequisites

- Node.js and npm installed.
- A modern browser (Chrome, Firefox, Edge, Safari).

### Install dependencies

```powershell
npm install
```

### Run in browser

Because this app uses a module Web Worker, load it through HTTP (not `file://`).

For local manual testing:

```powershell
node tests/server.js
```

Then open `http://localhost:4173`.

Playwright also starts its own test server automatically for E2E runs.

---

## Usage

1. Open the app.
2. Use the menu button (top-left) to:
   - Start a New Game
   - Open Rules
   - Change Options
   - View About
3. In game mode, click a highlighted column to drop your piece.
4. For AI turns, the worker computes and applies the move automatically.

### Options

- Red player: Human or AI
- Yellow player: Human or AI
- Red AI difficulty: Easy, Medium, Hard
- Yellow AI difficulty: Easy, Medium, Hard
- AI device profile: Auto, Desktop, Mobile

In the UI, players are presented as Red and Yellow. In the code and worker settings,
these two sides are stored as `playerSouth` and `playerNorth`.

---

## Connect 4 Rules (Summary)

- The board has 7 columns and 6 rows.
- Players alternate turns dropping one piece into a column.
- A piece occupies the lowest available cell in the chosen column.
- First player to make a line of 4 wins.
- Valid lines are horizontal, vertical, or diagonal.
- If the board fills with no 4-in-a-row, the game is a draw.

---

## Testing

### Run unit tests

```powershell
npm test
```

### Watch unit tests

```powershell
npm run test:watch
```

### Unit test coverage

```powershell
npm run test:coverage
```

### Run E2E tests

```powershell
npm run test:e2e
```

### Run all tests

```powershell
npm run test:all
```

### Coverage summary

- Unit tests (`tests/unit`)
  - Connect 4 board creation and legal actions
  - Move application and win detection (horizontal/vertical/diagonal)
  - UCT node behavior and UCT-board integration
- E2E tests (`tests/e2e`)
  - Page load and navigation
  - Options defaults and difficulty updates
  - Header difficulty badge behavior
  - Board interaction and new-game reset
  - Accessibility smoke checks

---

## Architecture Documentation

Detailed architecture is documented in:

- [doc/software_architecture.md](doc/software_architecture.md)
- [doc/engine_mcts_ucb.md](doc/engine_mcts_ucb.md) (UCT/MCTS engine behavior, UCB formula, and budget wiring)

---

## Troubleshooting

### PWA assets are not cached after install

- Open the app online at least once after deployment so the latest service worker can install.
- If device storage contains an old service worker version, uninstall/reinstall the PWA.
- Confirm your hosting path and PWA scope match; this app uses scope-safe relative cache URLs.

### `node` command opens Microsoft HPC help instead of Node.js

On some Windows environments, `node` may resolve to Microsoft HPC's command tool.
This project includes npm scripts that prepend the Node.js path before running tests.

If needed, call npm explicitly:

```powershell
& 'C:\Program Files\nodejs\npm.cmd' test
```

---

## License

- Source code: MIT License
- Image assets: see in-app About section and repository license files.

---

## Credits

Original game implementation and AI foundations by Oliver Merkel.

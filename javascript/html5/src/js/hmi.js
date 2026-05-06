//
// Copyright (c) 2016,2026 Oliver Merkel. All rights reserved.
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
// SPDX-License-Identifier: MIT
//
// Human-Machine Interface – main application entry point.
// Wires the reactive store, the SVG renderer, and the AI Web Worker together.
//

import { getActions } from './board.js';
import { createRenderer } from './renderer.js';
import { Actions, appReducer, createStore, initialAppState } from './store.js';

// ---------------------------------------------------------------------------
// Reactive store
// ---------------------------------------------------------------------------

const store = createStore(appReducer, initialAppState);

// ---------------------------------------------------------------------------
// Navigation helpers – show/hide named <section> elements
// ---------------------------------------------------------------------------

const sections = ['game', 'rules', 'options', 'about'];

const showView = (view) => {
  sections.forEach(id => {
    const el = document.getElementById(`view-${id}`);
    if (el) el.hidden = (id !== view);
  });
  document.getElementById('app-header-title').textContent =
    view === 'game'
      ? 'Connect 4'
      : view.charAt(0).toUpperCase() + view.slice(1);
};

const updateDifficultyBadge = (
  playerSouth,
  playerNorth,
  difficultySouth,
  difficultyNorth,
  resolvedDeviceProfile
) => {
  const badge = document.getElementById('app-header-badge');
  if (!badge) return;
  const south = (playerSouth ?? 'Human') === 'Human' ? 'human' : (difficultySouth ?? 'Medium');
  const north = (playerNorth ?? 'Human') === 'Human' ? 'human' : (difficultyNorth ?? 'Medium');
  const profile = resolvedDeviceProfile ?? 'Desktop';
  badge.textContent = `R ${south} | Y ${north} | ${profile}`;
  badge.setAttribute('aria-label', `Red ${south}, Yellow ${north}, profile ${profile}`);
};

const detectAutoDeviceProfile = () => {
  const smallViewport = (window.innerWidth || 1200) <= 900;
  const coarsePointer = window.matchMedia && window.matchMedia('(pointer: coarse)').matches;
  return (smallViewport || coarsePointer) ? 'Mobile' : 'Desktop';
};

const updateAutoProfileHint = () => {
  const hint = document.getElementById('device-profile-hint');
  if (!hint) return;
  const resolved = detectAutoDeviceProfile();
  hint.textContent = `Auto currently resolves to ${resolved}.`;
};

// ---------------------------------------------------------------------------
// Settings read from the options form
// ---------------------------------------------------------------------------

const readSettings = () => ({
  playersouth:           document.querySelector('input[name="firstplayer"]:checked')?.value ?? 'Human',
  playernorth:           document.querySelector('input[name="secondplayer"]:checked')?.value ?? 'Human',
  difficultysouth:       document.querySelector('input[name="difficultysouth"]:checked')?.value ?? 'Medium',
  difficultynorth:       document.querySelector('input[name="difficultynorth"]:checked')?.value ?? 'Medium',
  deviceprofile:         document.querySelector('input[name="deviceprofile"]:checked')?.value ?? 'Auto',
  resolveddeviceprofile: (() => {
    const selected = document.querySelector('input[name="deviceprofile"]:checked')?.value ?? 'Auto';
    return selected === 'Auto' ? detectAutoDeviceProfile() : selected;
  })(),
});

// ---------------------------------------------------------------------------
// Worker bootstrap
// ---------------------------------------------------------------------------

const engine = new Worker('js/controller.js', { type: 'module' });

const sendToEngine = (request, extra = {}) => {
  engine.postMessage({ class: 'request', request, settings: readSettings(), ...extra });
};

// ---------------------------------------------------------------------------
// SVG renderer bootstrap
// ---------------------------------------------------------------------------

let renderer = null;

const handleColumnClick = (column) => {
  if (store.getState().phase !== 'human_turn') return;
  sendToEngine('move', { column });
};

// ---------------------------------------------------------------------------
// Worker → store: translate engine messages to store actions
// ---------------------------------------------------------------------------

engine.addEventListener('message', ({ data }) => {
  switch (data.request) {
    case 'redraw':
      store.dispatch({ type: Actions.ENGINE_BOARD_UPDATE, board: data.board });
      break;

    case 'human_to_move': {
      const selectable = data.board ? getActions(data.board) : [];
      store.dispatch({ type: Actions.HUMAN_TURN_READY, board: data.board, selectableColumns: selectable });
      break;
    }

    case 'ai_to_move':
      store.dispatch({ type: Actions.AI_THINKING });
      sendToEngine('action_by_ai');
      break;

    default:
      break;
  }
});

// ---------------------------------------------------------------------------
// Store → renderer: re-render on every state change
// ---------------------------------------------------------------------------

store.subscribe((state) => {
  showView(state.view);
  updateDifficultyBadge(
    state.settings.playerSouth,
    state.settings.playerNorth,
    state.settings.difficultySouth,
    state.settings.difficultyNorth,
    state.settings.resolvedDeviceProfile
  );

  if (renderer && state.board) {
    renderer.render(state.board, state.selectableColumns);
  }

  // Reflect AI-thinking in the title bar.
  if (state.phase === 'ai_thinking') {
    document.getElementById('app-header-title').textContent = 'AI thinking...';
  }
});

// ---------------------------------------------------------------------------
// DOM event wiring (called once after DOMContentLoaded)
// ---------------------------------------------------------------------------

const wireUI = () => {
  // Renderer
  const boardContainer = document.getElementById('board');
  renderer = createRenderer(boardContainer, handleColumnClick);

  // Menu panel toggle
  const panel    = document.getElementById('side-panel');
  const menuBtn  = document.getElementById('btn-menu');
  const closeBtn = document.getElementById('btn-panel-close');
  const overlay  = document.getElementById('panel-overlay');

  const openPanel  = () => { panel.classList.add('open'); overlay.hidden = false; };
  const closePanel = () => { panel.classList.remove('open'); overlay.hidden = true; };
  const applySettingsFromOptions = () => {
    const s = readSettings();
    store.dispatch({ type: Actions.SETTINGS_CHANGE, settings: {
      playerSouth: s.playersouth,
      playerNorth: s.playernorth,
      difficultySouth: s.difficultysouth,
      difficultyNorth: s.difficultynorth,
      deviceProfile: s.deviceprofile,
      resolvedDeviceProfile: s.resolveddeviceprofile,
    }});
    sendToEngine('sync');
  };
  const closePanelAndReturnToGame = () => {
    closePanel();
    const currentView = store.getState().view;
    if (currentView === 'options') {
      applySettingsFromOptions();
      store.dispatch({ type: Actions.NAVIGATE, view: 'game' });
      return;
    }
    if (currentView === 'rules' || currentView === 'about') {
      store.dispatch({ type: Actions.NAVIGATE, view: 'game' });
    }
  };

  menuBtn?.addEventListener('click',  openPanel);
  closeBtn?.addEventListener('click', closePanelAndReturnToGame);
  overlay?.addEventListener('click',  closePanelAndReturnToGame);

  // Navigation links
  document.getElementById('nav-new')?.addEventListener('click', () => {
    if (store.getState().view === 'options') {
      applySettingsFromOptions();
    }
    closePanel();
    store.dispatch({ type: Actions.NAVIGATE, view: 'game' });
    store.dispatch({ type: Actions.NEW_GAME });
    sendToEngine('restart');
  });

  const navTo = (view) => () => { closePanel(); store.dispatch({ type: Actions.NAVIGATE, view }); };
  document.getElementById('nav-rules')?.addEventListener('click',   navTo('rules'));
  document.getElementById('nav-options')?.addEventListener('click', () => {
    navTo('options')();
    updateAutoProfileHint();
  });
  document.getElementById('nav-about')?.addEventListener('click',   navTo('about'));

  // Back buttons inside sub-views
  document.querySelectorAll('.btn-back').forEach(btn => {
    btn.addEventListener('click', () => store.dispatch({ type: Actions.NAVIGATE, view: 'game' }));
  });

  // Options "OK" – sync settings then dismiss
  document.getElementById('btn-options-ok')?.addEventListener('click', () => {
    applySettingsFromOptions();
    store.dispatch({ type: Actions.NAVIGATE, view: 'game' });
  });

  document.querySelectorAll('input[name="deviceprofile"]').forEach((input) => {
    input.addEventListener('change', updateAutoProfileHint);
  });

  window.addEventListener('resize', updateAutoProfileHint);

  const initialSettings = readSettings();
  store.dispatch({ type: Actions.SETTINGS_CHANGE, settings: {
    playerSouth: initialSettings.playersouth,
    playerNorth: initialSettings.playernorth,
    difficultySouth: initialSettings.difficultysouth,
    difficultyNorth: initialSettings.difficultynorth,
    deviceProfile: initialSettings.deviceprofile,
    resolvedDeviceProfile: initialSettings.resolveddeviceprofile,
  }});

  updateAutoProfileHint();

  // Kick off a new game
  sendToEngine('start');
};

// ---------------------------------------------------------------------------
// Bootstrap
// ---------------------------------------------------------------------------

// Register Service Worker for PWA functionality
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch((error) => {
      console.log('Service Worker registration failed:', error);
    });
  });
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', wireUI);
} else {
  wireUI();
}

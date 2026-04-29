// Copyright (c) 2016,2026 Oliver Merkel. All rights reserved.
// SPDX-License-Identifier: MIT

import { COLUMNS, EMPTY, NORTH, ROWS, SOUTH } from './common.js';

const SVG_NS = 'http://www.w3.org/2000/svg';
const VB_W = 700;
const VB_H = 620;
const CELL = 90;
const OFFSET_X = 35;
const OFFSET_Y = 60;
const PIECE_R = 34;
const PARTY_FX = {
  burstsPerWin: 8,
  particlesPerBurst: 30,
  minDistance: 58,
  maxDistance: 120,
  minRadius: 3.4,
  maxRadius: 6.2,
  minDuration: 2400,
  maxDuration: 4200,
  burstStaggerMs: 340,
  cleanupMs: 8400,
};

const colors = {
  board: '#1565c0',
  slot: '#f4f7ff',
  south: '#ef4444',
  north: '#facc15',
};

const svgEl = (tag, attrs = {}) => {
  const el = document.createElementNS(SVG_NS, tag);
  Object.entries(attrs).forEach(([k, v]) => el.setAttribute(k, String(v)));
  return el;
};

const pieceFill = (value) => {
  if (value === SOUTH) return colors.south;
  if (value === NORTH) return colors.north;
  return colors.slot;
};

const cellCenter = (row, col) => ({
  x: OFFSET_X + col * CELL + CELL / 2,
  y: OFFSET_Y + row * CELL + CELL / 2,
});

export const createRenderer = (container, onColumnClick) => {
  const svg = svgEl('svg', {
    viewBox: `0 0 ${VB_W} ${VB_H}`,
    preserveAspectRatio: 'xMidYMid meet',
    role: 'img',
    'aria-label': 'Connect 4 game board',
  });
  svg.style.cssText = 'display:block;width:100%;height:100%;';

  svg.appendChild(svgEl('rect', {
    x: 0,
    y: 0,
    width: VB_W,
    height: VB_H,
    fill: '#0f172a',
    rx: 16,
    ry: 16,
  }));

  svg.appendChild(svgEl('rect', {
    x: OFFSET_X - 18,
    y: OFFSET_Y - 18,
    width: COLUMNS * CELL + 36,
    height: ROWS * CELL + 36,
    fill: colors.board,
    rx: 18,
    ry: 18,
  }));

  const cells = Array.from({ length: ROWS }, (_, row) =>
    Array.from({ length: COLUMNS }, (_, col) => {
      const circle = svgEl('circle', {
        cx: OFFSET_X + col * CELL + CELL / 2,
        cy: OFFSET_Y + row * CELL + CELL / 2,
        r: PIECE_R,
        fill: colors.slot,
        stroke: '#1e293b',
        'stroke-width': 3,
      });
      svg.appendChild(circle);
      return circle;
    })
  );

  const overlays = Array.from({ length: COLUMNS }, (_, col) => {
    const rect = svgEl('rect', {
      x: OFFSET_X + col * CELL,
      y: OFFSET_Y,
      width: CELL,
      height: ROWS * CELL,
      fill: '#ffffff',
      opacity: 0,
      rx: 8,
      ry: 8,
    });
    rect.style.cursor = 'default';
    svg.appendChild(rect);
    return rect;
  });

  const statusText = svgEl('text', {
    x: VB_W / 2,
    y: 34,
    'text-anchor': 'middle',
    style: 'font:700 22px/1 system-ui,sans-serif;fill:#e2e8f0;',
  });
  svg.appendChild(statusText);

  const fxLayer = svgEl('g', { 'aria-hidden': 'true' });
  svg.appendChild(fxLayer);

  container.appendChild(svg);

  let handlers = Array(COLUMNS).fill(null);
  let lastCelebrationKey = null;
  let particleFrame = null;
  let particles = [];
  let fireworkTimers = [];
  let outcomeTextEl = null;

  const clearFireworkTimers = () => {
    fireworkTimers.forEach((id) => clearTimeout(id));
    fireworkTimers = [];
  };

  const scheduleFirework = (callback, delayMs) => {
    const id = setTimeout(callback, delayMs);
    fireworkTimers.push(id);
  };

  const tickParticles = (now) => {
    particles = particles.filter((particle) => {
      const t = Math.min(1, (now - particle.start) / particle.duration);
      const ease = 1 - (1 - t) * (1 - t);
      particle.el.setAttribute('cx', String(particle.x + particle.dx * ease));
      particle.el.setAttribute('cy', String(particle.y + particle.dy * ease + 22 * t * t));
      particle.el.setAttribute('opacity', String(1 - t));
      particle.el.setAttribute('r', String(Math.max(0.6, particle.r * (1 - 0.7 * t))));
      if (t >= 1) {
        if (particle.el.parentNode === fxLayer) fxLayer.removeChild(particle.el);
        return false;
      }
      return true;
    });

    if (particles.length > 0) {
      particleFrame = requestAnimationFrame(tickParticles);
    } else {
      particleFrame = null;
    }
  };

  const clearFireworks = () => {
    clearFireworkTimers();
    if (particleFrame !== null) {
      cancelAnimationFrame(particleFrame);
      particleFrame = null;
    }
    particles = [];
    outcomeTextEl = null;
    while (fxLayer.firstChild) fxLayer.removeChild(fxLayer.firstChild);
  };

  const showOutcomeText = (label, x, y, palette) => {
    const text = svgEl('text', {
      x,
      y,
      'text-anchor': 'middle',
      fill: '#ffffff',
      stroke: '#0f172a',
      'stroke-width': 2,
      style: 'font:900 56px/1 system-ui,sans-serif;letter-spacing:0.06em;',
    });
    text.textContent = label;
    text.style.filter = 'drop-shadow(0 0 14px rgba(255,255,255,0.95))';
    fxLayer.appendChild(text);
    outcomeTextEl = text;

    const steps = Math.max(1, Math.floor(PARTY_FX.cleanupMs / 240));
    for (let i = 0; i < steps; i++) {
      scheduleFirework(() => {
        if (!outcomeTextEl) return;
        const color = palette[i % palette.length];
        const glow = 12 + (i % 4) * 4;
        const dy = (i % 2 === 0 ? -2 : 2);
        outcomeTextEl.setAttribute('fill', color);
        outcomeTextEl.setAttribute('y', String(y + dy));
        outcomeTextEl.setAttribute('opacity', i % 3 === 0 ? '1' : '0.92');
        outcomeTextEl.style.filter = `drop-shadow(0 0 ${glow}px ${color})`;
      }, i * 240);
    }
  };

  const launchBurst = (x, y, particleCount = PARTY_FX.particlesPerBurst) => {
    const palette = ['#fb7185', '#f97316', '#facc15', '#4ade80', '#22d3ee', '#60a5fa', '#f472b6'];
    for (let i = 0; i < particleCount; i++) {
      const angle = (Math.PI * 2 * i) / particleCount + (Math.random() * 0.25);
      const distance = PARTY_FX.minDistance + Math.random() * (PARTY_FX.maxDistance - PARTY_FX.minDistance);
      const dx = Math.cos(angle) * distance;
      const dy = Math.sin(angle) * distance;
      const circle = svgEl('circle', {
        cx: x,
        cy: y,
        r: PARTY_FX.minRadius + Math.random() * (PARTY_FX.maxRadius - PARTY_FX.minRadius),
        fill: palette[(i + Math.floor(Math.random() * 3)) % palette.length],
        opacity: 1,
      });
      circle.style.filter = 'drop-shadow(0 0 9px rgba(255,255,255,0.8))';
      fxLayer.appendChild(circle);
      particles.push({
        el: circle,
        x,
        y,
        dx,
        dy,
        r: Number(circle.getAttribute('r')),
        start: performance.now(),
        duration: PARTY_FX.minDuration + Math.random() * (PARTY_FX.maxDuration - PARTY_FX.minDuration),
      });
    }

    if (particleFrame === null && particles.length > 0) {
      particleFrame = requestAnimationFrame(tickParticles);
    }
  };

  const celebrateWin = (winningLine) => {
    if (!winningLine || winningLine.length === 0) return;
    clearFireworks();

    const avg = winningLine.reduce((acc, cell) => {
      const p = cellCenter(cell.row, cell.column);
      return { x: acc.x + p.x, y: acc.y + p.y };
    }, { x: 0, y: 0 });
    const center = { x: avg.x / winningLine.length, y: avg.y / winningLine.length };

    const bursts = [
      { x: center.x, y: Math.max(70, center.y - 80) },
      { x: Math.max(55, center.x - 115), y: Math.max(65, center.y - 42) },
      { x: Math.min(VB_W - 55, center.x + 115), y: Math.max(65, center.y - 42) },
      { x: Math.max(55, center.x - 160), y: Math.max(60, center.y - 92) },
      { x: Math.min(VB_W - 55, center.x + 160), y: Math.max(60, center.y - 92) },
      { x: center.x, y: Math.max(55, center.y - 145) },
      { x: Math.max(55, center.x - 70), y: Math.max(55, center.y - 150) },
      { x: Math.min(VB_W - 55, center.x + 70), y: Math.max(55, center.y - 150) },
    ];

    bursts.slice(0, PARTY_FX.burstsPerWin).forEach((burst, idx) => {
      scheduleFirework(() => launchBurst(burst.x, burst.y), idx * PARTY_FX.burstStaggerMs);
    });

    // Add a delayed grand finale burst near the center.
    scheduleFirework(
      () => launchBurst(center.x, Math.max(60, center.y - 110), PARTY_FX.particlesPerBurst + 14),
      PARTY_FX.burstsPerWin * PARTY_FX.burstStaggerMs + 440
    );

    showOutcomeText(
      'Win!',
      center.x,
      Math.max(76, center.y - 170),
      ['#ffffff', '#fde047', '#f9a8d4', '#67e8f9', '#86efac']
    );

    scheduleFirework(clearFireworks, PARTY_FX.cleanupMs);
  };

  const celebrateDraw = () => {
    clearFireworks();
    showOutcomeText(
      'Draw',
      VB_W / 2,
      120,
      ['#e2e8f0', '#67e8f9', '#93c5fd', '#c4b5fd', '#f9a8d4']
    );

    scheduleFirework(clearFireworks, PARTY_FX.cleanupMs);
  };

  const clearHandlers = () => {
    handlers.forEach((handler, col) => {
      if (handler) overlays[col].removeEventListener('click', handler);
      overlays[col].style.cursor = 'default';
      overlays[col].setAttribute('opacity', '0');
      handlers[col] = null;
    });
  };

  const render = (boardState, selectableColumns = []) => {
    const latest = boardState.latestMove;
    const winning = new Set((boardState.winningLine ?? []).map((cell) => `${cell.row}:${cell.column}`));

    boardState.grid.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        const cell = cells[rowIndex][colIndex];
        const isLatest = latest && latest.row === rowIndex && latest.column === colIndex;
        const isWinning = winning.has(`${rowIndex}:${colIndex}`);

        cell.setAttribute('fill', pieceFill(value));
        cell.setAttribute('stroke', isWinning ? '#22c55e' : (isLatest ? '#f8fafc' : '#1e293b'));
        cell.setAttribute('stroke-width', isWinning ? '8' : (isLatest ? '6' : '3'));
        cell.style.filter = isWinning
          ? 'drop-shadow(0 0 10px rgba(34,197,94,0.95))'
          : (isLatest ? 'drop-shadow(0 0 8px rgba(248,250,252,0.95))' : 'none');
      });
    });

    if (boardState.winner === null && !boardState.isDraw) {
      lastCelebrationKey = null;
      clearFireworks();
    } else {
      const latest = boardState.latestMove;
      const terminalType = boardState.isDraw ? 'draw' : `win:${boardState.winner}`;
      const celebrationKey = latest
        ? `${terminalType}:${latest.row}:${latest.column}`
        : `${terminalType}:terminal`;
      if (celebrationKey !== lastCelebrationKey) {
        lastCelebrationKey = celebrationKey;
        if (boardState.isDraw) celebrateDraw();
        else celebrateWin(boardState.winningLine ?? []);
      }
    }

    if (boardState.winner === 0) statusText.textContent = 'Red wins';
    else if (boardState.winner === 1) statusText.textContent = 'Yellow wins';
    else if (boardState.isDraw) statusText.textContent = 'Draw';
    else statusText.textContent = boardState.active === 0 ? 'Red to move' : 'Yellow to move';

    clearHandlers();
    selectableColumns.forEach((column) => {
      const click = () => onColumnClick(column);
      handlers[column] = click;
      overlays[column].addEventListener('click', click);
      overlays[column].style.cursor = 'pointer';
      overlays[column].setAttribute('opacity', '0.12');
    });
  };

  const flashSowing = (column) => {
    if (column < 0 || column >= COLUMNS) return;
    overlays[column].setAttribute('opacity', '0.22');
    setTimeout(() => overlays[column].setAttribute('opacity', '0.12'), 80);
  };

  const resize = () => {};

  return { render, flashSowing, resize };
};

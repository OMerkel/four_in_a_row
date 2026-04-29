// Copyright (c) 2016,2026 Oliver Merkel. All rights reserved.
// @author Oliver Merkel, <Merkel(dot)Oliver(at)web(dot)de>
// SPDX-License-Identifier: MIT

import { COLUMNS, EMPTY, NORTH, ROWS, SOUTH } from './common.js';

const createGrid = () => Array.from({ length: ROWS }, () => Array(COLUMNS).fill(EMPTY));

export const createBoard = () => ({
  active: 0,
  grid: createGrid(),
  winner: null,
  isDraw: false,
  latestMove: null,
  winningLine: null,
});

const inBounds = (row, col) => row >= 0 && row < ROWS && col >= 0 && col < COLUMNS;

const hasFour = (grid, row, col, piece) => {
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];
  return dirs.some(([dr, dc]) => {
    let count = 1;
    for (let sign = -1; sign <= 1; sign += 2) {
      let r = row + dr * sign;
      let c = col + dc * sign;
      while (inBounds(r, c) && grid[r][c] === piece) {
        count++;
        r += dr * sign;
        c += dc * sign;
      }
    }
    return count >= 4;
  });
};

const findWinningLine = (grid, row, col, piece) => {
  const dirs = [
    [0, 1],
    [1, 0],
    [1, 1],
    [1, -1],
  ];

  for (const [dr, dc] of dirs) {
    const line = [];

    let r = row - dr;
    let c = col - dc;
    while (inBounds(r, c) && grid[r][c] === piece) {
      line.unshift({ row: r, column: c });
      r -= dr;
      c -= dc;
    }

    line.push({ row, column: col });

    r = row + dr;
    c = col + dc;
    while (inBounds(r, c) && grid[r][c] === piece) {
      line.push({ row: r, column: c });
      r += dr;
      c += dc;
    }

    if (line.length >= 4) {
      const centerIndex = line.findIndex((cell) => cell.row === row && cell.column === col);
      const start = Math.max(0, Math.min(centerIndex - 3, line.length - 4));
      return line.slice(start, start + 4);
    }
  }

  return null;
};

export const getActions = (board) => {
  if (board.winner !== null || board.isDraw) return [];
  return Array.from({ length: COLUMNS }, (_, col) => col).filter(col => board.grid[0][col] === EMPTY);
};

const dropInColumn = (grid, col, piece) => {
  for (let row = ROWS - 1; row >= 0; row--) {
    if (grid[row][col] === EMPTY) {
      const nextGrid = grid.map(line => [...line]);
      nextGrid[row][col] = piece;
      return { grid: nextGrid, row };
    }
  }
  return null;
};

export const doAction = (board, column) => {
  if (!getActions(board).includes(column)) return board;

  const piece = board.active === 0 ? SOUTH : NORTH;
  const dropped = dropInColumn(board.grid, column, piece);
  if (!dropped) return board;

  const winner = hasFour(dropped.grid, dropped.row, column, piece) ? board.active : null;
  const isDraw = winner === null && dropped.grid[0].every(cell => cell !== EMPTY);
  const winningLine = winner !== null ? findWinningLine(dropped.grid, dropped.row, column, piece) : null;

  return {
    ...board,
    grid: dropped.grid,
    winner,
    isDraw,
    latestMove: { row: dropped.row, column, player: board.active },
    winningLine,
    active: winner === null && !isDraw ? 1 - board.active : board.active,
  };
};

export const getResult = (board) => {
  if (board.winner === 0) return [1, 0];
  if (board.winner === 1) return [0, 1];
  if (board.isDraw) return [0.5, 0.5];
  return [0.01, 0.01];
};

export class Board {
  constructor(state) {
    this._state = state ?? createBoard();
  }

  get active() { return this._state.active; }

  getActions() { return getActions(this._state); }
  getResult() { return getResult(this._state); }

  doAction(column) { this._state = doAction(this._state, column); }

  copy() {
    return new Board({
      ...this._state,
      grid: this._state.grid.map(row => [...row]),
      latestMove: this._state.latestMove ? { ...this._state.latestMove } : null,
      winningLine: this._state.winningLine
        ? this._state.winningLine.map((cell) => ({ ...cell }))
        : null,
    });
  }

  getState() { return this._state; }
  setState(state) { this._state = state; }
}

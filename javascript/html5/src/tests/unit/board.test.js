import { describe, expect, it } from 'vitest';
import { Board, createBoard, doAction, getActions, getResult } from '../../js/board.js';

const withMoves = (moves) => moves.reduce((state, col) => doAction(state, col), createBoard());

describe('createBoard', () => {
  it('creates an empty 7x6 board', () => {
    const board = createBoard();
    expect(board.grid).toHaveLength(6);
    board.grid.forEach((row) => expect(row).toHaveLength(7));
    expect(board.grid.flat().every(cell => cell === 0)).toBe(true);
    expect(board.active).toBe(0);
    expect(board.winner).toBeNull();
    expect(board.isDraw).toBe(false);
  });
});

describe('getActions', () => {
  it('returns all columns on a fresh board', () => {
    expect(getActions(createBoard())).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });

  it('excludes a full column', () => {
    let board = createBoard();
    for (let i = 0; i < 6; i++) {
      board = doAction(board, 0);
      if (i < 5) board = doAction(board, 1);
    }
    expect(getActions(board)).not.toContain(0);
  });
});

describe('doAction', () => {
  it('drops pieces to the bottom then stacks upward', () => {
    let board = createBoard();
    board = doAction(board, 3);
    board = doAction(board, 3);

    expect(board.grid[5][3]).toBe(1);
    expect(board.grid[4][3]).toBe(2);
  });

  it('switches active player on non-terminal moves', () => {
    const board = doAction(createBoard(), 2);
    expect(board.active).toBe(1);
  });

  it('detects horizontal win', () => {
    const board = withMoves([0, 0, 1, 1, 2, 2, 3]);
    expect(board.winner).toBe(0);
    expect(board.isDraw).toBe(false);
  });

  it('stores winning line coordinates for a win', () => {
    const board = withMoves([0, 0, 1, 1, 2, 2, 3]);
    expect(board.winningLine).toEqual([
      { row: 5, column: 0 },
      { row: 5, column: 1 },
      { row: 5, column: 2 },
      { row: 5, column: 3 },
    ]);
  });

  it('detects vertical win', () => {
    const board = withMoves([0, 1, 0, 1, 0, 1, 0]);
    expect(board.winner).toBe(0);
  });

  it('detects diagonal win', () => {
    const board = withMoves([0, 1, 1, 2, 2, 3, 2, 3, 3, 5, 3]);
    expect(board.winner).toBe(0);
  });

  it('detects draw after filling the full board without a winner', () => {
    const moves = [1, 2, 3, 0, 2, 3, 6, 4, 4, 1, 0, 5, 2, 1, 0, 6, 1, 3, 6, 5, 2, 6, 1, 1, 4, 6, 3, 0, 5, 2, 5, 4, 3, 0, 2, 3, 0, 5, 4, 5, 6, 4];
    const board = withMoves(moves);

    expect(moves).toHaveLength(42);
    expect(board.winner).toBeNull();
    expect(board.isDraw).toBe(true);
    expect(getActions(board)).toEqual([]);
  });
});

describe('getResult', () => {
  it('returns reward for player 0 win', () => {
    const board = withMoves([0, 0, 1, 1, 2, 2, 3]);
    expect(getResult(board)).toEqual([1, 0]);
  });

  it('returns draw reward', () => {
    const drawBoard = {
      ...createBoard(),
      isDraw: true,
    };
    expect(getResult(drawBoard)).toEqual([0.5, 0.5]);
  });

  it('returns small undecided value for non-terminal state', () => {
    expect(getResult(createBoard())).toEqual([0.01, 0.01]);
  });
});

describe('Board adapter', () => {
  it('supports copy and simulation without mutating original', () => {
    const board = new Board();
    const copy = board.copy();
    copy.doAction(0);

    expect(board.getState().grid[5][0]).toBe(0);
    expect(copy.getState().grid[5][0]).toBe(1);
  });
});

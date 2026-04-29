import { describe, expect, it } from 'vitest';
import { UctNode } from '../../js/uct/uctnode.js';
import { Uct } from '../../js/uct/uct.js';
import { Board, createBoard, doAction } from '../../js/board.js';

const boardStub = (actions, active = 0) => ({
  getActions: () => [...actions],
  active,
  copy: function () { return boardStub(actions, active); },
  doAction: () => {},
  getResult: () => [0.01, 0.01],
});

const withMoves = (moves) => moves.reduce((state, column) => doAction(state, column), createBoard());

const withSeededRandom = (seed, fn) => {
  const originalRandom = Math.random;
  let state = seed >>> 0;
  Math.random = () => {
    state = (1664525 * state + 1013904223) >>> 0;
    return state / 0x100000000;
  };
  try {
    return fn();
  } finally {
    Math.random = originalRandom;
  }
};

describe('UctNode', () => {
  it('stores action and unexamined moves from board', () => {
    const node = new UctNode(null, boardStub([0, 1, 2]), null);
    expect(node.unexamined).toEqual([0, 1, 2]);
    expect(node.activePlayer).toBe(0);
  });

  it('adds child and removes action from unexamined list', () => {
    const node = new UctNode(null, boardStub([2, 4, 6]), null);
    const child = node.addChild(boardStub([], 1), 1);
    expect(child.action).toBe(4);
    expect(node.unexamined).toEqual([2, 6]);
  });

  it('selects child with highest UCB1 value', () => {
    const parent = new UctNode(null, boardStub([0, 1]), null);
    parent.visits = 10;

    const c0 = parent.addChild(boardStub([]), 0);
    c0.wins = 8;
    c0.visits = 10;

    const c1 = parent.addChild(boardStub([]), 0);
    c1.wins = 1;
    c1.visits = 1;

    expect(parent.selectChild()).toBe(c1);
  });
});

describe('Uct.getActionInfo', () => {
  const uct = new Uct();

  it('returns a legal action on an initial board', () => {
    const board = new Board();
    const result = uct.getActionInfo(board, 1000, 200, 10, 20);
    expect(result.action).toBeGreaterThanOrEqual(0);
    expect(result.action).toBeLessThanOrEqual(6);
  });

  it('returns the only legal action when six columns are full', () => {
    const state = createBoard();
    state.grid[0][0] = 1;
    state.grid[0][1] = 1;
    state.grid[0][2] = 2;
    state.grid[0][3] = 2;
    state.grid[0][4] = 1;
    state.grid[0][5] = 2;
    const board = new Board(state);
    const result = uct.getActionInfo(board, 1000, 200, 10, 20);
    expect(result.action).toBe(6);
    expect(result.info).toMatch(/1 action/i);
  });

  it('returns null when no legal actions remain', () => {
    let state = createBoard();
    for (let c = 0; c < 7; c++) {
      for (let r = 0; r < 6; r++) {
        state = doAction(state, c);
      }
    }
    const board = new Board(state);
    const result = uct.getActionInfo(board, 1000, 200, 10, 20);
    expect(result.action).toBeNull();
    expect(result.info).toMatch(/no action/i);
  });

  it('prefers an immediate winning move', () => {
    let state = createBoard();
    // Player 0 can win by playing column 3 on this turn.
    state = doAction(state, 0); // P0
    state = doAction(state, 6); // P1
    state = doAction(state, 1); // P0
    state = doAction(state, 6); // P1
    state = doAction(state, 2); // P0
    state = doAction(state, 5); // P1

    const board = new Board(state);
    const result = uct.getActionInfo(board, 20000, 800, 12, 24);
    expect(result.action).toBe(3);
  });

  it('plays a forced blocking move against an immediate loss', () => {
    let state = createBoard();
    // It is player 0 to move. Player 1 threatens a horizontal win on column 3.
    state = doAction(state, 6); // P0
    state = doAction(state, 0); // P1
    state = doAction(state, 6); // P0
    state = doAction(state, 1); // P1
    state = doAction(state, 5); // P0
    state = doAction(state, 2); // P1

    const board = new Board(state);
    const result = uct.getActionInfo(board, 30000, 1200, 14, 28);
    expect(result.action).toBe(3);
  });

  it('finds a deterministic two-ply trap move', () => {
    // Position searched from the live board rules where only column 3 creates
    // a forced win in two plies for player 0.
    const board = new Board(withMoves([0, 0, 0, 0, 0, 0, 2, 2, 4, 2]));

    const result = withSeededRandom(0xC0FFEE, () =>
      uct.getActionInfo(board, 120000, 2500, 50, 70)
    );

    expect(result.action).toBe(3);
  });

  it('finds a deterministic two-ply trap move for the opposite player', () => {
    // Mirrored-side position where player 1 has exactly one trap move: column 3.
    const board = new Board(withMoves([0, 0, 0, 0, 0, 0, 1, 1, 2, 2, 2]));

    const result = withSeededRandom(0xBADC0DE, () =>
      uct.getActionInfo(board, 120000, 2500, 50, 70)
    );

    expect(result.action).toBe(3);
  });
});

describe('Board adapter x Uct integration', () => {
  it('plays multiple AI moves and keeps cell values valid', () => {
    const uct = new Uct();
    const board = new Board();

    for (let i = 0; i < 14; i++) {
      const { action } = uct.getActionInfo(board, 600, 120, 10, 20);
      if (action === null) break;
      board.doAction(action);
      if (board.getState().winner !== null || board.getState().isDraw) break;
    }

    const values = board.getState().grid.flat();
    expect(values.every((v) => v === 0 || v === 1 || v === 2)).toBe(true);
  });
});

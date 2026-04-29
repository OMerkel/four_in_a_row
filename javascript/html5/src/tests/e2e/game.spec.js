import { expect, test } from '@playwright/test';

const waitForHumanTurn = (page) =>
  page.waitForFunction(() => {
    const overlays = document.querySelectorAll('#board svg rect');
    return [...overlays].some((el) => el.style.cursor === 'pointer');
  }, { timeout: 10_000 });

const getCellFills = (page) =>
  page.evaluate(() => {
    const circles = [...document.querySelectorAll('#board svg circle')];
    return circles.map((c) => c.getAttribute('fill'));
  });

const getPlacedPieceCount = (page) =>
  page.evaluate(() => {
    const circles = [...document.querySelectorAll('#board svg circle')];
    return circles.filter((c) => c.getAttribute('fill') !== '#f4f7ff').length;
  });

const clickFirstSelectableColumn = async (page) => {
  const index = await page.evaluate(() => {
    const overlays = [...document.querySelectorAll('#board svg rect')];
    return overlays.findIndex((r) => r.style.cursor === 'pointer');
  });
  if (index === -1) throw new Error('No selectable column found');

  await page.evaluate((i) => {
    const overlays = [...document.querySelectorAll('#board svg rect')];
    overlays[i].dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, index);

  return index;
};

const clickColumn = async (page, column) => {
  await page.waitForFunction((i) => {
    const overlays = [...document.querySelectorAll('#board svg rect')]
      .filter((r) => r.style.cursor !== '');
    return overlays[i]?.style.cursor === 'pointer';
  }, column, { timeout: 10_000 });

  await page.evaluate((i) => {
    const overlays = [...document.querySelectorAll('#board svg rect')]
      .filter((r) => r.style.cursor !== '');
    overlays[i].dispatchEvent(new MouseEvent('click', { bubbles: true }));
  }, column);
};

test.describe('Page load', () => {
  test('title is correct', async ({ page }) => {
    await page.goto('/');
    await expect(page).toHaveTitle(/Connect 4/i);
  });

  test('game view is visible on load', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#view-game')).toBeVisible();
    await expect(page.locator('#view-rules')).toBeHidden();
    await expect(page.locator('#view-options')).toBeHidden();
    await expect(page.locator('#view-about')).toBeHidden();
  });

  test('header title shows Connect 4', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app-header-title')).toHaveText('Connect 4');
  });

  test('header badge shows default difficulty', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#app-header-badge')).toContainText('R human');
    await expect(page.locator('#app-header-badge')).toContainText('Y human');
    await expect(page.locator('#app-header-badge')).toContainText('Desktop');
  });

  test('board SVG is rendered', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#board svg')).toBeVisible();
  });
});

test.describe('Navigation', () => {
  test('Rules link shows rules view', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-menu').click();
    await page.locator('#nav-rules').click();
    await expect(page.locator('#view-rules')).toBeVisible();
  });

  test('Options link shows options view', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-menu').click();
    await page.locator('#nav-options').click();
    await expect(page.locator('#view-options')).toBeVisible();
  });

  test('About link shows about view', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-menu').click();
    await page.locator('#nav-about').click();
    await expect(page.locator('#view-about')).toBeVisible();
  });

  test('Close from rules/about returns to game view', async ({ page }) => {
    await page.goto('/');

    await page.locator('#btn-menu').click();
    await page.locator('#nav-rules').click();
    await expect(page.locator('#view-rules')).toBeVisible();
    await page.locator('#btn-menu').click();
    await page.locator('#btn-panel-close').click();
    await expect(page.locator('#view-game')).toBeVisible();

    await page.locator('#btn-menu').click();
    await page.locator('#nav-about').click();
    await expect(page.locator('#view-about')).toBeVisible();
    await page.locator('#btn-menu').click();
    await page.locator('#btn-panel-close').click();
    await expect(page.locator('#view-game')).toBeVisible();
  });

  test('New Game from side panel returns to game view', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-menu').click();
    await page.locator('#nav-rules').click();
    await expect(page.locator('#view-rules')).toBeVisible();

    await page.locator('#btn-menu').click();
    await page.locator('#nav-new').click();

    await expect(page.locator('#view-game')).toBeVisible();
    await expect(page.locator('#view-rules')).toBeHidden();
  });

  test('New Game from options applies settings and updates badge', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-menu').click();
    await page.locator('#nav-options').click();
    await expect(page.locator('#view-options')).toBeVisible();

    await page.locator('input[name="firstplayer"][value="AI"]').check();
    await page.locator('input[name="secondplayer"][value="Human"]').check();
    await page.locator('input[name="difficultysouth"][value="Hard"]').check();

    await page.locator('#btn-menu').click();
    await page.locator('#nav-new').click();

    await expect(page.locator('#view-game')).toBeVisible();
    await expect(page.locator('#app-header-badge')).toContainText('R Hard');
    await expect(page.locator('#app-header-badge')).toContainText('Y human');
  });
});

test.describe('Options', () => {
  test('player options are present', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-menu').click();
    await page.locator('#nav-options').click();

    await expect(page.locator('input[name="firstplayer"][value="Human"]')).toBeChecked();
    await expect(page.locator('input[name="secondplayer"][value="Human"]')).toBeChecked();
    await expect(page.locator('input[name="difficultysouth"][value="Medium"]')).toBeChecked();
    await expect(page.locator('input[name="difficultynorth"][value="Medium"]')).toBeChecked();
    await expect(page.locator('input[name="deviceprofile"][value="Auto"]')).toBeChecked();
    await expect(page.locator('#device-profile-hint')).toHaveText(/Auto currently resolves to (Desktop|Mobile)\./);
  });

  test('changing red and yellow difficulties updates header badge', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-menu').click();
    await page.locator('#nav-options').click();

    await page.locator('input[name="firstplayer"][value="AI"]').check();
    await page.locator('input[name="secondplayer"][value="AI"]').check();
    await page.locator('input[name="difficultysouth"][value="Easy"]').check();
    await page.locator('input[name="difficultynorth"][value="Hard"]').check();
    await page.locator('#btn-options-ok').click();

    await expect(page.locator('#view-game')).toBeVisible();
    await expect(page.locator('#app-header-badge')).toContainText('R Easy');
    await expect(page.locator('#app-header-badge')).toContainText('Y Hard');
  });

  test('badge shows human for human side and difficulty for AI side', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-menu').click();
    await page.locator('#nav-options').click();

    await page.locator('input[name="firstplayer"][value="Human"]').check();
    await page.locator('input[name="secondplayer"][value="AI"]').check();
    await page.locator('input[name="difficultynorth"][value="Hard"]').check();
    await page.locator('#btn-options-ok').click();

    await expect(page.locator('#view-game')).toBeVisible();
    await expect(page.locator('#app-header-badge')).toContainText('R human');
    await expect(page.locator('#app-header-badge')).toContainText('Y Hard');
  });

  test('manual profile override updates header badge', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-menu').click();
    await page.locator('#nav-options').click();

    await page.locator('input[name="deviceprofile"][value="Mobile"]').check();
    await page.locator('#btn-options-ok').click();

    await expect(page.locator('#view-game')).toBeVisible();
    await expect(page.locator('#app-header-badge')).toContainText('Mobile');
  });

  test('closing side panel from options applies settings and returns to game view', async ({ page }) => {
    await page.goto('/');
    await page.locator('#btn-menu').click();
    await page.locator('#nav-options').click();
    await expect(page.locator('#view-options')).toBeVisible();

    await page.locator('input[name="firstplayer"][value="AI"]').check();
    await page.locator('input[name="secondplayer"][value="AI"]').check();
    await page.locator('input[name="difficultysouth"][value="Hard"]').check();
    await page.locator('input[name="difficultynorth"][value="Easy"]').check();

    await page.locator('#btn-menu').click();
    await page.locator('#panel-overlay').click();

    await expect(page.locator('#view-game')).toBeVisible();
    await expect(page.locator('#view-options')).toBeHidden();
    await expect(page.locator('#app-header-badge')).toContainText('R Hard');
    await expect(page.locator('#app-header-badge')).toContainText('Y Easy');
  });
});

test.describe('Board interaction', () => {
  test('human turn has selectable columns', async ({ page }) => {
    await page.goto('/');
    await waitForHumanTurn(page);

    const hasPointer = await page.evaluate(() => {
      const overlays = [...document.querySelectorAll('#board svg rect')];
      return overlays.some((r) => r.style.cursor === 'pointer');
    });
    expect(hasPointer).toBe(true);
  });

  test('making a move changes board cells', async ({ page }) => {
    await page.goto('/');
    await waitForHumanTurn(page);

    const before = await getCellFills(page);
    await clickFirstSelectableColumn(page);

    await page.waitForFunction(() => {
      const red = [...document.querySelectorAll('#board svg circle')]
        .some((c) => c.getAttribute('fill') === '#ef4444');
      return red;
    }, { timeout: 10_000 });

    const after = await getCellFills(page);
    expect(after).not.toEqual(before);
  });

  test('new game resets the board', async ({ page }) => {
    await page.goto('/');
    await waitForHumanTurn(page);
    await clickFirstSelectableColumn(page);

    await page.locator('#btn-menu').click();
    await page.locator('#nav-new').click();

    await waitForHumanTurn(page);
    const afterReset = await getCellFills(page);
    expect(afterReset.every(fill => fill === '#f4f7ff')).toBe(true);
  });

  test('draw shows draw overlay text', async ({ page }) => {
    await page.goto('/');

    // Deterministic sequence that fills the board with no winner.
    const moves = [1, 2, 3, 0, 2, 3, 6, 4, 4, 1, 0, 5, 2, 1, 0, 6, 1, 3, 6, 5, 2, 6, 1, 1, 4, 6, 3, 0, 5, 2, 5, 4, 3, 0, 2, 3, 0, 5, 4, 5, 6, 4];

    for (const column of moves) {
      const before = await getPlacedPieceCount(page);
      await clickColumn(page, column);
      await page.waitForFunction((expected) => {
        const circles = [...document.querySelectorAll('#board svg circle')];
        const placed = circles.filter((c) => c.getAttribute('fill') !== '#f4f7ff').length;
        return placed > expected;
      }, before, { timeout: 10_000 });
    }

    await expect(page.locator('#board svg text').filter({ hasText: 'Draw' }).first()).toBeVisible();

    // Status text plus temporary overlay text should both exist right after terminal draw.
    const drawTextCount = await page.evaluate(() =>
      [...document.querySelectorAll('#board svg text')].filter((t) => t.textContent === 'Draw').length
    );
    expect(drawTextCount).toBeGreaterThanOrEqual(2);
  });
});

test.describe('Accessibility', () => {
  test('header button has accessible label', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#btn-menu')).toHaveAttribute('aria-label', /menu/i);
  });

  test('board SVG has an accessible label', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#board svg')).toHaveAttribute('aria-label', /Connect 4/i);
  });
});

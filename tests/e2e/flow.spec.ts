import { expect, test, type Browser, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';

const WED = new Date(2026, 10, 11, 12, 0);
const SAT = new Date(2026, 10, 14, 12, 0);
const MON = new Date(2026, 10, 16, 12, 0);

async function start(page: Page, when: Date, nick = '철수', char = '에버', stats: [string, string] = ['힘', '지력']) {
  await page.clock.install({ time: when });
  await page.goto('/');
  await page.getByLabel('닉네임').fill(nick);
  await page.getByRole('button', { name: new RegExp(char) }).click();
  for (const s of stats) await page.getByRole('button', { name: s, exact: true }).click();
  await page.getByRole('button', { name: '모험 시작하기' }).click();
  await expect(page.locator('.quest').first()).toBeVisible();
}

async function second(browser: Browser, when: Date) {
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 } });
  const page = await ctx.newPage();
  await start(page, when, '영희', '루미', ['정신력', '행운']);
  return page;
}

test('onboarding gives 5 weekday quests; checking persists across reload', async ({ page }) => {
  await start(page, WED);
  await expect(page.locator('.quest')).toHaveCount(5);
  await expect(page.getByTestId('today-progress')).toHaveText('0/5');
  await page.locator('.quest').first().click();
  await expect(page.getByTestId('today-progress')).toHaveText('1/5');
  await page.reload();
  await expect(page.getByTestId('today-progress')).toHaveText('1/5');
});

test('weekend shows 7 quests', async ({ page }) => {
  await start(page, SAT);
  await expect(page.locator('.quest')).toHaveCount(7);
});

test('profile change is blocked midweek and allowed on Monday', async ({ page }) => {
  await start(page, WED);
  await page.getByRole('button', { name: '캐릭터' }).click();
  await expect(page.getByText('변경은 월요일에만 할 수 있어요')).toBeVisible();
  await page.clock.setSystemTime(MON);
  await page.reload();
  await expect(page.locator('.quest').first()).toBeVisible();
  await page.getByRole('button', { name: '캐릭터' }).click();
  await expect(page.getByRole('button', { name: '변경 적용' })).toBeVisible();
});

test('share link opens a side-by-side comparison; broken links show an error', async ({ page, browser }) => {
  await start(page, WED);
  await page.locator('.quest').first().click();
  await page.getByRole('button', { name: '공유' }).click();
  const url = await page.getByLabel('공유 링크').inputValue();
  const other = await second(browser, WED);
  await other.goto(url);
  await other.reload();
  await expect(other.locator('.compare')).toContainText('철수');
  await expect(other.locator('.compare')).toContainText('영희');
  await other.goto('/#/compare/abc');
  await other.reload();
  await expect(other.getByRole('alert')).toContainText('열 수 없는 공유 링크');
  await other.context().close();
});

test('export, reset, import restores progress', async ({ page }) => {
  await start(page, WED);
  await page.locator('.quest').first().click();
  await page.getByRole('button', { name: '설정' }).click();
  const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: '내보내기' }).click()]);
  const path = await download.path();
  const saved = readFileSync(path!, 'utf8');
  page.once('dialog', (d) => void d.accept());
  await page.getByRole('button', { name: '모두 삭제' }).click();
  await expect(page.getByRole('button', { name: '모험 시작하기' })).toBeVisible();
  // onboard again (import lives in settings) then import the backup
  await page.getByLabel('닉네임').fill('임시');
  await page.getByRole('button', { name: /에버/ }).click();
  await page.getByRole('button', { name: '힘', exact: true }).click();
  await page.getByRole('button', { name: '지력', exact: true }).click();
  await page.getByRole('button', { name: '모험 시작하기' }).click();
  await page.getByRole('button', { name: '설정' }).click();
  await page.setInputFiles('input[type=file]', { name: 'save.json', mimeType: 'application/json', buffer: Buffer.from(saved) });
  await expect(page.getByText('가져오기 완료!')).toBeVisible();
  await page.getByRole('button', { name: '홈' }).click();
  await expect(page.getByTestId('today-progress')).toHaveText('1/5');
});

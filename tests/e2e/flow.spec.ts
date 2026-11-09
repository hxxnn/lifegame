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
  for (const s of stats) await page.getByRole('button', { name: new RegExp('^' + s) }).click();
  await page.getByRole('button', { name: '모험 시작하기' }).click();
  await expect(page.locator('.quest').first()).toBeVisible();
}

async function complete(page: Page, index = 0) {
  await page.locator('.quest').nth(index).click();
  await page.getByRole('button', { name: '완료하기' }).click();
}

async function completeNext(page: Page) {
  await page.locator('.quest:not(:disabled)').first().click();
  await page.getByRole('button', { name: '완료하기' }).click();
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
  await expect(page.getByRole('heading', { name: /(평온한|보통의|도전의|지옥의) 주$/ })).toBeVisible();
  await expect(page.getByTestId('today-progress')).toHaveText('0/5');
  await complete(page);
  await expect(page.getByTestId('today-progress')).toHaveText('1/5');
  await page.reload();
  await expect(page.getByTestId('today-progress')).toHaveText('1/5');
});

test('tapping a quest only asks for confirmation; cancel, Esc and outside taps back out', async ({ page }) => {
  await start(page, WED);
  const card = page.locator('.quest').first();
  await card.click();
  await expect(page.getByRole('button', { name: '완료하기' })).toBeVisible();
  await expect(page.getByTestId('today-progress')).toHaveText('0/5');
  await page.getByRole('button', { name: '취소' }).click();
  await expect(page.getByRole('button', { name: '완료하기' })).toHaveCount(0);
  await card.click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('button', { name: '완료하기' })).toHaveCount(0);
  await card.click();
  await page.getByRole('heading', { name: '스탯' }).click();
  await expect(page.getByRole('button', { name: '완료하기' })).toHaveCount(0);
  await card.click();
  await page.locator('.quest').nth(1).click();
  await expect(page.getByRole('button', { name: '완료하기' })).toHaveCount(1); // selection moved, not duplicated
  await expect(page.getByTestId('today-progress')).toHaveText('0/5');
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
  await complete(page);
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
  await page.addInitScript(() => { (window as unknown as { showSaveFilePicker?: unknown }).showSaveFilePicker = undefined; });
  await start(page, WED);
  await complete(page);
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
  await page.getByRole('button', { name: /^힘/ }).click();
  await page.getByRole('button', { name: /^지력/ }).click();
  await page.getByRole('button', { name: '모험 시작하기' }).click();
  await page.getByRole('button', { name: '설정' }).click();
  await page.setInputFiles('input[type=file]', { name: 'save.json', mimeType: 'application/json', buffer: Buffer.from(saved) });
  await expect(page.getByText('가져오기 완료')).toBeVisible();
  await page.getByRole('button', { name: '홈' }).click();
  await expect(page.getByTestId('today-progress')).toHaveText('1/5');
});

test('onboarding folds locked characters and explains each stat', async ({ page }) => {
  await page.clock.install({ time: WED });
  await page.goto('/');
  await expect(page.getByText('잠긴 캐릭터 5명 보기')).toBeVisible();
  await expect(page.getByText('근력 운동')).toBeVisible();
  await expect(page.getByText('새로운 시도·도전')).toBeVisible();
});

test('a quest can be swapped for another of the same stat, at most twice a day', async ({ page }) => {
  await start(page, WED);
  const card = page.locator('.quest:not(.pill)').first();
  const before = await card.locator('.q-title').innerText();
  const stat = await card.locator('.chip').first().innerText();
  await card.click();
  await expect(page.getByRole('button', { name: '교체 0/2' })).toHaveCount(0);
  await page.getByRole('button', { name: /^교체 2\/2/ }).click();
  const swapped = page.locator('.quest:not(.pill)').first();
  await expect(swapped.locator('.q-title')).not.toHaveText(before);
  await expect(swapped.locator('.chip').first()).toHaveText(stat);
  await swapped.click();
  await expect(page.getByRole('button', { name: /^교체 1\/2/ })).toBeVisible();
});

test('last week\'s report shows once on Monday and can be dismissed', async ({ page }) => {
  await start(page, new Date(2026, 10, 8, 12)); // Sunday
  await complete(page);
  await page.clock.setSystemTime(MON);
  await page.reload();
  const report = page.getByRole('region', { name: '지난주 결산' });
  await expect(report).toBeVisible();
  await expect(report).toContainText('이번 주는');
  await report.getByRole('button', { name: '확인' }).click();
  await expect(report).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('region', { name: '지난주 결산' })).toHaveCount(0);
  await page.getByRole('button', { name: '캐릭터' }).click();
  await expect(page.getByRole('heading', { name: '주간 기록' })).toBeVisible();
});

test('backup nudge appears after 10 clears and can be snoozed for the day', async ({ page }) => {
  await start(page, SAT); // 7 quests
  for (let i = 0; i < 7; i++) {
    await completeNext(page);
    await expect(page.getByTestId('today-progress')).toHaveText(`${i + 1}/7`);
  }
  await page.clock.setSystemTime(new Date(2026, 10, 15, 12));
  await page.reload();
  await expect(page.locator('.quest')).toHaveCount(7);
  await expect(page.getByText('아직 백업한 적이 없어요.')).toHaveCount(0);
  for (let i = 0; i < 3; i++) {
    await completeNext(page);
    await expect(page.getByTestId('today-progress')).toHaveText(`${i + 1}/7`);
  }
  await expect(page.getByText('아직 백업한 적이 없어요.')).toBeVisible();
  await page.getByRole('button', { name: '나중에' }).click();
  await expect(page.getByText('아직 백업한 적이 없어요.')).toHaveCount(0);
  await page.reload();
  await expect(page.getByText('아직 백업한 적이 없어요.')).toHaveCount(0);
});

test('day start hour keeps the late-night session on the previous day', async ({ page }) => {
  await start(page, WED);
  await complete(page);
  await page.getByRole('button', { name: '설정' }).click();
  await page.getByLabel('하루 시작 시간').selectOption('4');
  await page.clock.setSystemTime(new Date(2026, 10, 12, 2, 0)); // Thursday 02:00 -> still Wednesday
  await page.reload();
  await expect(page.getByTestId('today-progress')).toHaveText('1/5');
  await page.clock.setSystemTime(new Date(2026, 10, 12, 5, 0)); // Thursday 05:00 -> new day
  await page.reload();
  await expect(page.getByTestId('today-progress')).toHaveText('0/5');
});

test('gallery teases only the next reward and the share tab previews the card', async ({ page }) => {
  await start(page, WED);
  await page.getByRole('button', { name: '도감' }).click();
  await expect(page.getByText('다음 보상: 견습 모험가 (칭호)')).toBeVisible();
  await expect(page.getByText('장비 ???').first()).toBeVisible();
  await page.getByRole('button', { name: '공유' }).click();
  await expect(page.getByRole('img', { name: '공유 카드 미리보기' })).toBeVisible();
});


test('cancelling the save dialog does not record a backup', async ({ page }) => {
  await page.addInitScript(() => {
    (window as unknown as { showSaveFilePicker: unknown }).showSaveFilePicker = async () => { throw new DOMException('cancel', 'AbortError'); };
  });
  await start(page, WED);
  await page.getByRole('button', { name: '설정' }).click();
  await page.getByRole('button', { name: '내보내기' }).click();
  await expect(page.getByText('저장을 취소했어요')).toBeVisible();
  await expect(page.getByText('마지막 백업: 아직 없어요')).toBeVisible();
});

test('two tabs stay in sync and an old-version tab cannot overwrite the save', async ({ page }) => {
  await start(page, WED);
  const other = await page.context().newPage();
  await other.clock.install({ time: WED });
  await other.goto('/');
  await expect(other.getByTestId('today-progress')).toHaveText('0/5');
  await complete(page);
  await expect(other.getByTestId('today-progress')).toHaveText('1/5'); // no reload needed
  // an old v1 build in another tab writes a v1 shaped save
  await other.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('lifegame:v1')!);
    s.version = 1;
    delete s.settings; delete s.backup; delete s.reportSeenWeek;
    localStorage.setItem('lifegame:v1', JSON.stringify(s));
  });
  await expect.poll(() => other.evaluate(() => JSON.parse(localStorage.getItem('lifegame:v1')!).version)).toBe(3);
  await expect(page.getByTestId('today-progress')).toHaveText('1/5');
  await other.close();
});


test('illustrated characters load as images, pixel ones stay vector', async ({ page }) => {
  await page.clock.install({ time: WED });
  await page.goto('/');
  for (const name of ['에버', '카게', '루미']) {
    const img = page.getByRole('img', { name: `${name} 캐릭터` });
    await expect(img).toBeVisible();
    await expect.poll(() => img.evaluate((el) => (el as HTMLImageElement).complete && (el as HTMLImageElement).naturalWidth)).toBeGreaterThan(0);
  }
  await page.getByText(/잠긴 캐릭터/).click();
  await expect(page.locator('svg[aria-label="팡 캐릭터"]')).toHaveCount(1);
  await page.getByLabel('닉네임').fill('철수');
  await page.getByRole('button', { name: /카게/ }).click();
  await page.getByRole('button', { name: /^힘/ }).click();
  await page.getByRole('button', { name: /^지력/ }).click();
  await page.getByRole('button', { name: '모험 시작하기' }).click();
  await page.getByRole('button', { name: '캐릭터' }).click();
  const full = page.getByRole('img', { name: '카게 전신' });
  await expect(full).toBeVisible();
  await expect.poll(() => full.evaluate((el) => (el as HTMLImageElement).naturalHeight)).toBeGreaterThan(300);
});


test('the character\'s look changes as that character levels up', async ({ page }) => {
  await start(page, WED, '철수', '에버', ['힘', '지력']);
  const portrait = page.getByRole('img', { name: '에버 캐릭터' }).first();
  await expect(portrait).toHaveAttribute('src', /ember-1-portrait/);
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('lifegame:v1')!);
    s.characters = { ember: { xp: 3000 } };   // Lv.27
    localStorage.setItem('lifegame:v1', JSON.stringify(s));
  });
  await page.reload();
  await expect(page.getByRole('img', { name: '에버 캐릭터' }).first()).toHaveAttribute('src', /ember-2-portrait/);
  await page.getByRole('button', { name: '캐릭터' }).click();
  await expect(page.getByRole('img', { name: '에버 전신' })).toHaveAttribute('src', /ember-2-full/);
  await expect(page.getByText('캐릭터 Lv.27')).toBeVisible();
  await expect(page.getByText(/다음 모습/)).toContainText('Lv.50');
});

test('each character keeps its own level when you switch on a Monday', async ({ page }) => {
  await start(page, MON, '철수', '에버', ['힘', '지력']);
  await page.evaluate(() => {
    const s = JSON.parse(localStorage.getItem('lifegame:v1')!);
    s.characters = { ember: { xp: 3000 } };
    localStorage.setItem('lifegame:v1', JSON.stringify(s));
  });
  await page.reload();
  await page.getByRole('button', { name: '캐릭터' }).click();
  await expect(page.getByText('Lv.27').first()).toBeVisible();
  await page.getByRole('button', { name: /카게/ }).click();
  await page.getByRole('button', { name: '변경 적용' }).click();
  await expect(page.getByText('캐릭터 Lv.1')).toBeVisible();
  await expect(page.getByRole('img', { name: '카게 캐릭터' }).first()).toHaveAttribute('src', /shade-1-portrait/);
  await page.getByRole('button', { name: /에버/ }).click();   // back on the next Monday it would be Lv.27 again
});

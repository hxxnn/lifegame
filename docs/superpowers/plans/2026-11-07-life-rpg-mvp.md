# 라이프 RPG 1차 버전 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 매일 퀘스트를 깨며 스탯 5종을 키우고, 클리어마다 해금되며, 주간 난이도 테마가 바뀌고, 공유 링크로 비교할 수 있는 서버 없는 웹앱을 만든다.

**Architecture:** 화면과 무관한 순수 로직(`src/domain`)을 먼저 TDD로 만들고, 콘텐츠(`src/data`)와 저장(`src/storage`)을 분리한 뒤, React UI가 `useReducer` 스토어로 이를 연결한다. 날짜와 난수는 항상 인자로 주입한다.

**Tech Stack:** React 18, Vite 5, TypeScript 5, Vitest 2, Playwright, vite-plugin-pwa. 외부 상태 라이브러리와 서버는 쓰지 않는다.

**Spec:** `docs/superpowers/specs/2026-11-07-life-rpg-design.md`

## Global Constraints

- 스탯 ID와 이름: `str` 힘, `agi` 민첩, `int` 지력, `spi` 정신력, `luk` 행운 (5종 고정).
- 주는 월요일 시작, 하루는 기기 로컬 시간 0시 기준. 날짜는 `'YYYY-MM-DD'` 문자열로 다루고, 일 수 계산은 `Date.UTC`로 해서 서머타임에 흔들리지 않게 한다.
- 일일 퀘스트 수: 월~금 5개, 토·일 7개, 모든 테마 동일. "매일 고정" 습관 1개 포함.
- 테마 4종, 일일 경험치 배율: `calm` ×1.0, `normal` ×1.3, `challenge` ×1.6, `hell` ×2.0. 기본 확률 30/40/25/5.
- 주력 스탯 2개가 변동 슬롯의 약 60%, 나머지 3개가 약 40%.
- 레벨: 다음 레벨 필요 경험치 `round(100 × 1.12^(L−1))`, 최대 30. 1→2는 100, 5→6은 157, 10→11은 277, 20→21은 861, 29→30은 2388.
- 하루 전부 완료 +10%, 주 5일 이상 전부 완료 시 주간 보너스. 미완료는 감점 없음.
- 마일스톤 임계값: 5, 12, 22, 35, 51, 70… (차이가 4+3k씩 증가). 스탯 구간 해금 레벨: 5, 10, 15, 20, 25, 30.
- 시작 캐릭터 3종, 전체 8종. 캐릭터와 주력 스탯 변경은 월요일에만 가능하다(최초 선택 제외).
- 저장 키 `lifegame:v1`, 데이터 `version: 1`. 닉네임은 최대 20자.
- 모든 밸런스 수치는 `src/data/balance.ts` 한 곳에 둔다.
- 기존 만화·애니메이션 캐릭터의 이름과 이미지를 쓰지 않는다. 서버, 계정, 랭킹, 푸시 알림은 만들지 않는다.
- Playwright는 사전 설치된 Chromium을 쓰고(`executablePath: '/opt/pw-browsers/chromium'`), `--trace off`로 실행한다. `playwright install`은 하지 않는다.
- 작업 브랜치는 `feat/mvp`. PR은 요청이 있을 때만 만든다.

## Review Focus

1. 몇 주를 건너뛰고 앱을 열었을 때, 또는 수요일 같은 주중에 처음 시작했을 때: 비어 있는 날마다 미완료로 정산하되, 설치 전 날짜는 세지 않는다. (Task 7)
2. 필터(잠금, 어제 중복, 티어)로 후보가 모자란 퀘스트 풀: 중복 허용 → 인접 티어 → 다른 스탯 순으로 완화해 항상 정해진 개수를 채운다. (Task 5)
3. 이미 완료한 퀘스트를 다시 체크: 경험치와 클리어 수가 두 번 오르지 않는다. (Task 6)
4. localStorage를 쓸 수 없거나(사생활 보호 모드, 용량 초과) 데이터가 깨진 경우: 앱은 메모리 저장으로 계속 동작하고, 깨진 데이터는 백업으로 남긴다. (Task 9)
5. 길거나 이상한 닉네임·깨진 공유 링크: 20자로 자르고 제어 문자를 제거하며 텍스트로만 렌더링하고, 범위를 벗어난 값은 거부한다. (Task 10)

---

## File Structure

```
package.json, vite.config.ts, tsconfig.json, index.html, playwright.config.ts
src/domain/    types.ts dates.ts leveling.ts rng.ts difficulty.ts quests.ts progress.ts unlocks.ts rollover.ts
src/data/      balance.ts questPool.ts characters.ts stories.ts cosmetics.ts
src/storage/   adapter.ts migrate.ts backup.ts
src/share/     codec.ts
src/ui/        store.ts App.tsx screens/{Onboarding,Home,Character,Gallery,Share,Settings}.tsx components/CharacterAvatar.tsx
tests/         domain/*.test.ts storage/*.test.ts share/*.test.ts data/*.test.ts e2e/*.spec.ts
```

---

### Task 1: 프로젝트 골격, 타입, 밸런스 상수

**Files:**
- Create: `package.json`, `vite.config.ts`, `tsconfig.json`, `index.html`, `.gitignore`, `src/main.tsx`, `src/domain/types.ts`, `src/data/balance.ts`
- Test: `tests/data/balance.test.ts`

**Interfaces:**
- Produces (`types.ts`): `StatId`, `STAT_IDS: StatId[]`, `Tier = 1|2|3|4`, `ThemeId`, `Rng = () => number`,
  `QuestDef { id; stat: StatId; tier: Tier; title; desc; baseXp: number; fixed?: boolean; requires?: { stat: StatId; level: number } }`,
  `QuestInstance { questId: string; done: boolean }`, `DayRecord { date: string; quests: QuestInstance[]; allDoneBonus: boolean }`,
  `WeekRecord { weekId: string; theme: ThemeId; days: DayRecord[]; weeklyBonus: boolean; clearRate: number | null }`,
  `PlayerState { version: 1; nickname: string; characterId: string | null; focusStats: [StatId, StatId] | null; xp: Record<StatId, number>; weeks: WeekRecord[]; unlockedIds: string[]; totalCleared: number; lastDate: string | null }`,
  `emptyState(): PlayerState`.
- Produces (`balance.ts`): `BALANCE` 객체: `levelBase: 100`, `levelRatio: 1.12`, `maxLevel: 30`, `themeMultiplier`, `themeBaseProb`, `themeProbHighClear` (지난주 ≥0.8: calm 10, normal 35, challenge 40, hell 15), `themeProbLowClear` (≤0.4: 50/35/13/2), `themeTierWeights` (calm {1:80,2:20}, normal {1:30,2:60,3:10}, challenge {2:30,3:60,4:10}, hell {3:50,4:50}), `tierBaseXp` ({1:10,2:20,3:35,4:55}), `focusShare: 0.6`, `weekdayQuests: 5`, `weekendQuests: 7`, `dayBonusRate: 0.1`, `weeklyBonusDays: 5`, `weeklyBonusXp: 100`, `statUnlockLevels: [5,10,15,20,25,30]`, `highClear: 0.8`, `lowClear: 0.4`.

- [ ] **Step 1: 스캐폴드** — `npm create vite@5` 템플릿(react-ts)으로 현재 폴더에 만들고, `vitest@2`, `@playwright/test`를 dev 의존성으로 추가한다. `npm test`는 `vitest run`으로 설정한다. 브랜치 `feat/mvp`를 만든다.
- [ ] **Step 2: 실패하는 테스트** — `balance.test.ts`: 각 테마 확률 객체(`themeBaseProb`, `themeProbHighClear`, `themeProbLowClear`)의 합이 100, 각 `themeTierWeights` 테마의 합이 100, `themeMultiplier.hell === 2.0`, `weekdayQuests === 5`, `weekendQuests === 7`.
- [ ] **Step 3:** `npm test` → FAIL (모듈 없음).
- [ ] **Step 4:** `types.ts`, `balance.ts`를 위 시그니처와 값으로 작성한다. `emptyState()`는 `xp`가 모든 스탯 0이고 `nickname: ''`.
- [ ] **Step 5:** `npm test` → PASS, `npm run build` 성공.
- [ ] **Step 6: Commit** — `git commit -m "chore: 프로젝트 골격과 타입, 밸런스 상수"`

### Task 2: 날짜 유틸

**Files:** Create `src/domain/dates.ts` · Test `tests/domain/dates.test.ts`

**Interfaces:**
- Produces: `dateKey(d: Date): string` (로컬 기준 `YYYY-MM-DD`), `addDays(key: string, n: number): string`, `daysBetween(a: string, b: string): number` (b−a, 일 수), `weekIdOf(key: string): string` (그 주 월요일의 key), `isWeekend(key: string): boolean`, `isMonday(key: string): boolean`.

- [ ] **Step 1: 실패하는 테스트** — `weekIdOf('2026-11-08') === '2026-11-02'`(일요일), `weekIdOf('2026-11-02') === '2026-11-02'`, `isWeekend('2026-11-07') === true`, `isWeekend('2026-11-09') === false`, `daysBetween('2026-03-07','2026-03-09') === 2`, `addDays('2026-12-31', 1) === '2027-01-01'`, 서머타임 구간 `addDays('2026-03-28', 7) === '2026-04-04'`.
- [ ] **Step 2:** FAIL 확인 → **Step 3:** 구현(문자열을 파싱해 `Date.UTC`로 계산) → **Step 4:** PASS 확인.
- [ ] **Step 5: Commit** — `feat: 날짜 유틸`

### Task 3: 레벨 곡선

**Files:** Create `src/domain/leveling.ts` · Test `tests/domain/leveling.test.ts`

**Interfaces:**
- Consumes: `BALANCE`
- Produces: `xpToNext(level: number): number`, `levelFromXp(totalXp: number): { level: number; into: number; need: number | null }` (30레벨이면 `need: null`, `into`는 남은 초과 경험치).

- [ ] **Step 1: 실패하는 테스트** — `xpToNext`: 1→100, 5→157, 10→277, 20→861, 29→2388. `levelFromXp(0)` → level 1, into 0, need 100. `levelFromXp(100)` → level 2, into 0. `levelFromXp(21456)` → level 30, need null. `levelFromXp(1e9).level === 30`.
- [ ] **Step 2~4:** FAIL → 구현(레벨을 올려 가며 차감) → PASS.
- [ ] **Step 5: Commit** — `feat: 기하급수 레벨 곡선`

### Task 4: 난수와 주간 테마 결정

**Files:** Create `src/domain/rng.ts`, `src/domain/difficulty.ts` · Test `tests/domain/difficulty.test.ts`

**Interfaces:**
- Produces: `mulberry32(seed: number): Rng`, `pickWeighted<T>(items: { item: T; weight: number }[], rng: Rng): T`,
  `themeProbabilities(prevClearRate: number | null): Record<ThemeId, number>`, `rollTheme(prevClearRate: number | null, rng: Rng): ThemeId`,
  `clearRateOf(days: DayRecord[]): number` (완료 수 ÷ 출제 수, 출제가 0이면 0).

- [ ] **Step 1: 실패하는 테스트** — `themeProbabilities(null)`은 30/40/25/5. `0.8`은 `themeProbHighClear`, `0.4`는 `themeProbLowClear`, `0.6`은 기본 확률. `rollTheme(null, mulberry32(1))`을 1만 번 돌린 분포가 기본 확률의 ±3%p 안. `clearRateOf`: 완료 2개/출제 5개 → 0.4. 같은 시드는 같은 결과.
- [ ] **Step 2~4:** FAIL → 구현 → PASS.
- [ ] **Step 5: Commit** — `feat: 난수와 주간 테마 결정`

### Task 5: 일일 퀘스트 출제

**Files:** Create `src/domain/quests.ts` · Test `tests/domain/quests.test.ts`

**Interfaces:**
- Consumes: `QuestDef`, `BALANCE`, `isWeekend`, `pickWeighted`, `levelFromXp`
- Produces: `dailyQuestCount(date: string): 5 | 7`,
  `isUnlocked(q: QuestDef, levels: Record<StatId, number>): boolean`,
  `generateDay(args: { date: string; theme: ThemeId; focus: [StatId, StatId]; levels: Record<StatId, number>; pool: QuestDef[]; previousIds: string[] }, rng: Rng): DayRecord`.

규칙: 고정 습관(`fixed`) 1개를 먼저 뽑고, 남은 슬롯은 주력 스탯 가중치 `focusShare`를 두 스탯에 균등 분배, 나머지를 3개 스탯에 균등 분배해 스탯을 정한 뒤 `themeTierWeights`로 티어를 뽑고 후보에서 고른다. 후보가 모자라면 이 순서로 완화한다: 어제 중복 허용 → 인접 티어 → 같은 스탯의 아무 티어 → 다른 스탯. 한 날 안에서 같은 퀘스트는 중복하지 않는다.

- [ ] **Step 1: 실패하는 테스트** — 테스트용 작은 풀을 만들어: ① 평일은 5개, 토요일은 7개, 고정 습관이 정확히 1개 포함 ② 잠긴 퀘스트(`requires.level` 미달)는 나오지 않는다 ③ `previousIds`의 퀘스트는 후보가 충분하면 나오지 않는다 ④ 한 날 안에 중복 없음 ⑤ 2000일을 돌린 변동 슬롯 중 주력 스탯 비율이 0.55~0.65 ⑥ **풀 고갈**: 풀이 3개뿐이어도 에러 없이 가능한 만큼 채우고(중복 없이 최대), 후보가 충분한 완화 경로에서는 정확히 5개를 채운다.
- [ ] **Step 2~4:** FAIL → 구현 → PASS.
- [ ] **Step 5: Commit** — `feat: 일일 퀘스트 출제`

### Task 6: 완료 처리와 경험치

**Files:** Create `src/domain/progress.ts` · Test `tests/domain/progress.test.ts`

**Interfaces:**
- Consumes: `PlayerState`, `QuestDef`, `BALANCE`, `levelFromXp`
- Produces: `completeQuest(state: PlayerState, date: string, questId: string, pool: QuestDef[]): PlayerState` (순수 함수, 새 객체 반환), `statLevels(state: PlayerState): Record<StatId, number>`.

규칙: 경험치 = `round(baseXp × 해당 주 테마 배율)`을 퀘스트의 스탯에 더하고 `totalCleared`를 1 올린다. 그날 퀘스트가 전부 완료되는 순간 각 퀘스트 경험치의 10%(`round`)를 같은 스탯에 추가로 주고 `allDoneBonus`를 true로 한다. 그 주에 전부 완료한 날이 5일째가 되는 순간 `weeklyBonusXp`를 주력 스탯 2개에 균등 분배하고 `weeklyBonus`를 true로 한다. 이 함수는 해금 판정을 하지 않는다(Task 7에서 합성).

- [ ] **Step 1: 실패하는 테스트** — ① 퀘스트(baseXp 20, 도전의 주) 완료 → 해당 스탯 +32, `totalCleared` 1 ② **같은 퀘스트를 두 번 완료해도** 상태가 동일(경험치·클리어 수 불변) ③ 마지막 퀘스트 완료 시 각 퀘스트 xp의 10%가 추가되고 `allDoneBonus === true` ④ 5번째 전부 완료 날에 `weeklyBonus === true`이고 주력 스탯에 50씩 ⑤ 원본 state는 변경되지 않는다 ⑥ 존재하지 않는 날짜/퀘스트 ID는 state를 그대로 반환.
- [ ] **Step 2~4:** FAIL → 구현 → PASS.
- [ ] **Step 5: Commit** — `feat: 퀘스트 완료와 보너스 경험치`

### Task 7: 해금 판정과 일/주 정산

**Files:** Create `src/domain/unlocks.ts`, `src/domain/rollover.ts` · Test `tests/domain/unlocks.test.ts`, `tests/domain/rollover.test.ts`

**Interfaces:**
- Consumes: `completeQuest`, `generateDay`, `rollTheme`, `clearRateOf`, `weekIdOf`, `addDays`, `daysBetween`
- Produces:
  `milestoneThreshold(i: number): number` (i는 1부터, 5·12·22·35·51·70),
  `evaluateUnlocks(state: PlayerState, cosmeticSequence: string[], statUnlockLevels: number[]): PlayerState` (`unlockedIds`만 갱신. 마일스톤 i번째 → `cosmeticSequence[i-1]`, 스탯 레벨 달성 → `story:{stat}:{level}`),
  `completeAndUnlock(state, date, questId, pool, cosmeticSequence): PlayerState` (`completeQuest` 후 `evaluateUnlocks`),
  `syncState(state: PlayerState, now: Date, pool: QuestDef[], rng: Rng): PlayerState`.

`syncState` 규칙: `characterId`나 `focusStats`가 없으면(온보딩 전) 그대로 반환. `today < lastDate`(시계가 과거로 감)면 그대로 반환. 처음이면 오늘만 출제하고, 아니면 `lastDate`다음 날부터 오늘까지 모든 날을 출제한다(미접속 날은 전부 미완료로 기록). 주가 바뀔 때마다 직전 주의 `clearRate`를 확정하고, 그 값으로 새 주 테마를 `rollTheme`한다(지난주가 통째로 비었으면 0이므로 쉬운 쪽으로 보정). 직전 날의 퀘스트 ID를 `previousIds`로 쓴다. `lastDate`는 오늘로 갱신한다.

- [ ] **Step 1: 실패하는 테스트 (unlocks)** — `milestoneThreshold`가 1~6에서 5,12,22,35,51,70. 누적 클리어 5에서 `cosmeticSequence[0]`, 12에서 `[1]`까지 해금, 4에서는 없음. 힘 레벨 5가 되면 `story:str:5`가 해금. 이미 해금된 것은 중복되지 않는다. 클리어 수가 갑자기 15가 되면 첫 두 개가 한꺼번에 해금.
- [ ] **Step 2: 실패하는 테스트 (rollover)** — ① 첫 실행(수요일): 오늘 하루만 출제, 지난 날 기록 없음(**설치 전 날짜는 세지 않는다**) ② 같은 날 두 번 `syncState`해도 결과가 같다(멱등) ③ 일요일→월요일: 직전 주 `clearRate`가 확정되고 새 주(`weekId` = 월요일) 기록이 생긴다 ④ **3주 건너뛰고 열기**: 빠진 날마다 미완료 기록이 있고 중간 주들의 `clearRate`는 0, 새 주 테마는 지난 클리어율 0 기준 확률로 결정 ⑤ `now`가 `lastDate`보다 과거면 상태 불변 ⑥ 온보딩 전 상태는 불변.
- [ ] **Step 3~5:** FAIL → 구현 → PASS.
- [ ] **Step 6: Commit** — `feat: 해금 판정과 일/주 정산`

### Task 8: 콘텐츠 데이터

**Files:** Create `src/data/questPool.ts`, `src/data/characters.ts`, `src/data/stories.ts`, `src/data/cosmetics.ts` · Test `tests/data/content.test.ts`

**Interfaces:**
- Produces: `QUEST_POOL: QuestDef[]`, `CHARACTERS: { id: string; name: string; startsUnlocked: boolean; palette: [string, string]; shape: 'knight'|'ninja'|'mage'|'monk'|'archer'|'rogue'|'bard'|'beast' }[]`, `STORIES: Record<string, { title: string; text: string }>` (키 `story:{stat}:{level}`), `COSMETIC_SEQUENCE: string[]` (장비·칭호·배경·남은 캐릭터 5종의 해금 ID, 최소 12개), `COSMETIC_LABELS: Record<string, string>`.

- [ ] **Step 1: 실패하는 데이터 검증 테스트** — 퀘스트 ID 고유, 스탯별 20개 이상, 스탯별 각 티어 4개 이상, 고정 습관 3개 이상, `baseXp`가 `tierBaseXp`와 일치, 티어 3은 `requires.level >= 5`, 티어 4는 `requires.level >= 10`이고 `requires.stat`이 자기 스탯. 캐릭터 8종, `startsUnlocked` 3종, ID 고유. 스토리는 스탯 5종 × 해금 레벨 6개 전부 존재하고 각 글이 비어 있지 않음. `COSMETIC_SEQUENCE`에 시작 캐릭터가 아닌 5종이 모두 포함되고 `COSMETIC_LABELS`에 모든 ID의 이름이 있다.
- [ ] **Step 2:** FAIL 확인.
- [ ] **Step 3:** 콘텐츠를 작성한다. 퀘스트는 한국어로 짧고 구체적이며 하루에 끝낼 수 있는 행동(예: 힘 "푸시업 20개", 지력 "책 10쪽 읽기", 정신력 "5분 호흡 명상", 행운 "안 가본 길로 걷기", 민첩 "10분 스트레칭")으로 쓴다. 캐릭터는 오리지널 8종으로, 실존 작품의 이름을 쓰지 않는다. 스토리는 스탯당 6편, 각 2~3문장.
- [ ] **Step 4:** PASS. **Step 5: Commit** — `feat: 퀘스트 풀, 캐릭터, 스토리, 해금 목록 초안`

### Task 9: 저장, 복구, 내보내기

**Files:** Create `src/storage/adapter.ts`, `src/storage/migrate.ts`, `src/storage/backup.ts` · Test `tests/storage/storage.test.ts`

**Interfaces:**
- Produces:
  `interface StorageAdapter { load(): { state: PlayerState | null; recovered: boolean }; save(state: PlayerState): boolean }`,
  `createLocalAdapter(storage?: Storage): StorageAdapter` (키 `lifegame:v1`; 저장소 접근이 던지면 `createMemoryAdapter()`로 대체하고 `save`는 false 반환),
  `createMemoryAdapter(): StorageAdapter`,
  `migrate(raw: unknown): PlayerState | null` (형태 검증 포함, 잘못되면 null),
  `exportJson(state: PlayerState): string`, `importJson(text: string): PlayerState` (실패 시 `Error('INVALID_SAVE')`).

깨진 데이터를 만나면 원본 문자열을 `lifegame:backup:{timestamp}` 키에 남기고 `{ state: null, recovered: true }`를 반환한다.

- [ ] **Step 1: 실패하는 테스트** — 가짜 `Storage` 객체로: ① save 후 load가 동일 상태 ② 키가 없으면 `{ state: null, recovered: false }` ③ **깨진 JSON**이면 `recovered: true`이고 백업 키가 생긴다 ④ **`getItem`/`setItem`이 던지는 저장소**(사생활 보호 모드)에서도 어댑터가 예외 없이 동작하고 `save`는 false ⑤ 용량 초과(`setItem`이 `QuotaExceededError`)도 예외 없이 false ⑥ `importJson(exportJson(s))`가 `s`와 같고, 임의의 JSON이나 `version`이 다른 데이터는 `INVALID_SAVE` ⑦ `migrate`가 `xp`에 음수나 NaN이 있으면 null.
- [ ] **Step 2~4:** FAIL → 구현 → PASS.
- [ ] **Step 5: Commit** — `feat: 로컬 저장, 복구, 내보내기/가져오기`

### Task 10: 공유 코덱

**Files:** Create `src/share/codec.ts` · Test `tests/share/codec.test.ts`

**Interfaces:**
- Consumes: `CHARACTERS`, `STAT_IDS`, `BALANCE.maxLevel`
- Produces: `interface SharePayload { nick: string; char: string; lv: Record<StatId, number>; focus: [StatId, StatId]; title: string | null; cleared: number }`,
  `buildPayload(state: PlayerState, levels: Record<StatId, number>, title: string | null): SharePayload`,
  `encodeShare(p: SharePayload): string` (배열 형태 JSON을 base64url로),
  `decodeShare(s: string): SharePayload | null`.

`decodeShare` 검증: 닉네임은 제어 문자를 제거하고 앞뒤 공백을 자른 뒤 20자로 자른다(비면 "이름 없음"). `char`는 `CHARACTERS`에 있어야 하고, 레벨은 1~30 정수, `focus`는 서로 다른 유효 스탯, `cleared`는 0 이상의 정수여야 한다. 하나라도 어기면 null. 입력 길이가 2000자를 넘어도 null.

- [ ] **Step 1: 실패하는 테스트** — 왕복(encode→decode)이 동일 ② 레벨 0·31·소수·문자열이면 null ③ 모르는 캐릭터 ID면 null ④ 닉네임 `'<img src=x onerror=alert(1)>' + 'a'.repeat(50)`은 20자로 잘리고 제어 문자 `'\u0000‮'`는 제거 ⑤ base64가 아닌 문자열, 빈 문자열, 3000자 입력은 null이며 예외를 던지지 않는다 ⑥ 인코딩 결과는 URL에 안전한 문자(`[A-Za-z0-9_-]`)만 사용하고 길이가 300자 이하.
- [ ] **Step 2~4:** FAIL → 구현 → PASS.
- [ ] **Step 5: Commit** — `feat: 공유 링크 인코딩과 검증`

### Task 11: 스토어와 앱 셸, 온보딩

**Files:** Create `src/ui/store.ts`, `src/ui/App.tsx`, `src/ui/screens/Onboarding.tsx`, `src/ui/components/CharacterAvatar.tsx` · Test `tests/ui/store.test.ts`

**Interfaces:**
- Consumes: 모든 domain·storage 함수, `QUEST_POOL`, `CHARACTERS`
- Produces: `type Action = { type: 'init'; now: Date } | { type: 'onboard'; characterId: string; focus: [StatId, StatId]; nickname: string } | { type: 'complete'; date: string; questId: string } | { type: 'changeProfile'; characterId: string; focus: [StatId, StatId]; now: Date } | { type: 'setNickname'; nickname: string } | { type: 'import'; state: PlayerState; now: Date } | { type: 'reset' }`,
  `reducer(state: PlayerState, action: Action): PlayerState`, `canChangeProfile(state: PlayerState, today: string): boolean`(온보딩 전이거나 월요일이면 true), `useGame(): { state; dispatch; todayKey; storageOk: boolean; recovered: boolean }`.
  `CharacterAvatar({ id, size }: { id: string; size?: number })`: `shape`·`palette` 기반 인라인 SVG.

`changeProfile`: `canChangeProfile`가 false면 상태 불변. 해금되지 않은 캐릭터는 거부. 월요일에 그날 완료한 퀘스트가 없으면 오늘 퀘스트를 새 주력 스탯으로 다시 출제한다. 상태가 바뀔 때마다 `useGame`이 저장한다.

- [ ] **Step 1: 실패하는 테스트** — ① `onboard` 후 `init`하면 오늘 퀘스트가 생긴다 ② 수요일에 `changeProfile`은 불변, 월요일에는 적용 ③ 월요일 변경 시 완료한 퀘스트가 0이면 오늘 퀘스트가 새 주력 스탯 기준으로 다시 생성되고, 1개라도 완료했으면 유지 ④ 잠긴 캐릭터 선택은 거부 ⑤ `complete`가 경험치와 해금을 반영 ⑥ `reset`은 `emptyState()`.
- [ ] **Step 2~4:** FAIL → 구현 → PASS. 온보딩 화면은 캐릭터 3종 선택, 주력 스탯 2개 선택, 닉네임 입력(최대 20자).
- [ ] **Step 5: Commit** — `feat: 스토어, 앱 셸, 온보딩`

### Task 12: 홈 화면 (오늘의 퀘스트)

**Files:** Create `src/ui/screens/Home.tsx`, `src/ui/components/{QuestCard,StatBar,WeekBanner}.tsx` · Modify `src/ui/App.tsx`

**Interfaces:** Consumes `useGame`, `levelFromXp`, `QUEST_POOL`. Produces: 홈에서 이번 주 테마 배너, 오늘 퀘스트 목록(체크 시 `complete` 디스패치), 스탯 5종 레벨·경험치 바, 레벨업 시 간단한 알림, 새 해금 알림(토스트).

- [ ] **Step 1:** 홈 화면 구현(모바일 폭 우선, 오늘 진행률 `n/5` 또는 `n/7` 표시, 완료한 카드는 비활성).
- [ ] **Step 2:** `npm run dev`로 띄워 퀘스트 체크 → 경험치 증가를 직접 확인하고, 모바일 폭(390px)에서 가로 스크롤이 없는지 확인한다.
- [ ] **Step 3: Commit** — `feat: 홈 화면`

### Task 13: 캐릭터·도감·설정 화면

**Files:** Create `src/ui/screens/{Character,Gallery,Settings}.tsx` · Modify `src/ui/App.tsx`

**Interfaces:** Consumes `canChangeProfile`, `COSMETIC_LABELS`, `STORIES`, `exportJson`, `importJson`.
- Character: 현재 캐릭터와 스탯 상세, 월요일이면 캐릭터·주력 스탯 변경 UI, 아니면 "다음 월요일에 변경할 수 있어요" 안내.
- Gallery: 해금된 항목과 잠긴 항목(다음 마일스톤까지 남은 클리어 수), 해금된 스토리 읽기.
- Settings: 닉네임, JSON 내보내기(파일 저장)와 가져오기, 초기화(확인 창). 저장소를 쓸 수 없으면 눈에 띄는 경고 배너를 띄운다.

- [ ] **Step 1:** 세 화면과 탭 내비게이션 구현. 가져오기 실패(`INVALID_SAVE`)는 오류 문구를 보여주고 기존 데이터를 유지한다.
- [ ] **Step 2:** 개발 서버에서 각 화면과 가져오기 실패 경로를 직접 확인한다.
- [ ] **Step 3: Commit** — `feat: 캐릭터, 도감, 설정 화면`

### Task 14: 공유와 비교 화면

**Files:** Create `src/ui/screens/Share.tsx`, `src/share/card.ts` · Modify `src/ui/App.tsx`
**Test:** `tests/share/card.test.ts`

**Interfaces:** Consumes `buildPayload`, `encodeShare`, `decodeShare`.
Produces: `shareUrl(origin: string, payload: SharePayload): string` (`{origin}/#/compare/{encoded}`), `parseCompareHash(hash: string): SharePayload | null`, `renderCardPng(payload: SharePayload): Promise<Blob>`(canvas).

- [ ] **Step 1: 실패하는 테스트** — `parseCompareHash(new URL(shareUrl('https://x.test', p)).hash)`가 `p`와 같다. `'#/compare/'`, `'#/compare/%%%'`, `'#/other'`는 null.
- [ ] **Step 2~4:** FAIL → 구현 → PASS.
- [ ] **Step 5:** Share 화면: 링크 복사, 카드 PNG 저장, 해시에 비교 링크가 있으면 내 카드와 스탯 5종을 나란히 비교(상대 닉네임은 텍스트로만 렌더링, 유효하지 않으면 오류 안내 후 홈으로).
- [ ] **Step 6: Commit** — `feat: 공유 카드와 비교 화면`

### Task 15: PWA

**Files:** Modify `vite.config.ts`, `index.html` · Create `public/icons/*`

- [ ] **Step 1:** `vite-plugin-pwa`(버전 고정)로 매니페스트(이름 "라이프 RPG", 단색 아이콘 192/512)와 오프라인 캐시를 설정한다.
- [ ] **Step 2:** `npm run build && npm run preview` 후 매니페스트와 서비스 워커 등록을 확인한다.
- [ ] **Step 3: Commit** — `feat: PWA 설정`

### Task 16: E2E 흐름 테스트

**Files:** Create `playwright.config.ts`, `tests/e2e/flow.spec.ts`

- [ ] **Step 1:** 설정에서 `executablePath: '/opt/pw-browsers/chromium'`, `webServer`로 `npm run preview`를 띄운다.
- [ ] **Step 2: 테스트** — `page.clock`으로 시간을 고정해: ① 온보딩(캐릭터 선택, 주력 스탯 2개, 닉네임) 후 홈에 퀘스트 5개가 보인다 ② 퀘스트를 체크하면 진행률이 `1/5`로 오르고 새로고침해도 유지된다 ③ 시계를 토요일로 옮기면 퀘스트가 7개 ④ 수요일에는 캐릭터 변경이 막히고 월요일에는 가능하다 ⑤ 공유 링크를 열면 비교 화면이 나오고, 깨진 링크는 오류 안내가 나온다 ⑥ 내보낸 JSON을 초기화 후 가져오면 복원된다.
- [ ] **Step 3:** `npx playwright test --trace off` → 모두 PASS.
- [ ] **Step 4: Commit** — `test: E2E 흐름 테스트`

### Task 17: 마무리 점검

- [ ] **Step 1:** `npm test && npm run build && npx playwright test --trace off`를 모두 실행해 통과를 확인한다.
- [ ] **Step 2:** 스펙 섹션 1~9를 훑어 빠진 기능이 없는지 대조하고, 모바일 폭에서 모든 화면을 직접 확인한다.
- [ ] **Step 3:** `README.md`에 실행·테스트·밸런스 조정(`src/data/balance.ts`)·콘텐츠 수정(`src/data/*`) 방법을 짧게 적고 Commit — `docs: README`

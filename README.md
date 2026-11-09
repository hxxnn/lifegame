# 라이프 RPG (lifegame)

삶을 RPG로 바꾸는 자기계발 웹앱. 매일 퀘스트를 깨며 스탯(힘·민첩·지력·정신력·행운)을 키우고, 클리어할 때마다 장비·칭호·캐릭터·스토리가 해금됩니다. 퀘스트 난이도는 매주 달라집니다.

- 서버 없이 브라우저에만 저장됩니다. 기기를 바꿀 때는 설정에서 JSON 내보내기/가져오기를 쓰세요.
- 공유 링크로 친구의 캐릭터와 나란히 비교할 수 있습니다(서버 없음).

## 실행

```bash
npm install
npm run dev        # 개발 서버
npm test           # 단위 테스트 (Vitest)
npm run e2e        # 화면 흐름 테스트 (Playwright, 빌드 후 preview 서버를 띄움)
npm run build      # 프로덕션 빌드 (PWA 포함)
```

### 로컬에서 E2E 실행하기

처음 한 번만 브라우저를 받아 두면 됩니다.

```bash
npx playwright install chromium
npm run e2e
```

미리 설치된 브라우저 경로가 있는 환경에서는 그 브라우저를 자동으로 씁니다.

## 조정하기

- 밸런스(경험치, 확률, 퀘스트 개수, 보너스): `src/data/balance.ts`
- 퀘스트 풀: `src/data/questPool.ts` (스탯별 `[티어, 제목, 설명]` 한 줄씩 추가)
- 캐릭터: `src/data/characters.ts`, 해금 순서와 이름: `src/data/cosmetics.ts`, 스토리: `src/data/stories.ts`

## 구조

- `src/domain/` 화면과 무관한 순수 로직 (날짜, 레벨, 난이도, 출제, 해금, 일/주 정산)
- `src/data/` 콘텐츠와 상수
- `src/storage/` 로컬 저장, 복구, 내보내기/가져오기
- `src/share/` 공유 링크 인코딩과 카드
- `src/ui/` React 화면

설계: `docs/superpowers/specs/2026-11-07-life-rpg-design.md`, 구현 계획: `docs/superpowers/plans/2026-11-07-life-rpg-mvp.md`

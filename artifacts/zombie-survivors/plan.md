# Zombie Survivors 구현 계획

## 아키텍처 결정

| 결정 | 선택 | 이유 |
|---|---|---|
| 게임 경로 | `app/game/page.tsx` (신규 App Router 페이지) | 기존 `app/page.tsx` 유지 |
| 게임 상태 관리 | `useRef` (mutable, React state 없음) | 60fps 루프에서 React re-render 금지 |
| UI 오버레이 | React `useState` — HUD·LevelUp·Result 한정 | 이벤트(레벨업·HP변화·게임종료)만 setState |
| Canvas 크기 | 800 × 600 고정, 맵 2400 × 1800 (3×3) | 단순 좌표계 |
| 스프라이트 | Canvas primitives (circle, rect) | 픽셀 아트 에셋 미확정 — 추후 교체 가능 |
| 캐릭터 해금 | `localStorage` (`zs:unlocked:v1`) — try/catch 필수 | incognito 환경 포함 안전 처리 |

## 인프라 리소스

None

## 데이터 모델

### Vec2
- x: number
- y: number

### Entity (base)
- id: string
- pos: Vec2
- vel: Vec2
- radius: number
- hp: number
- maxHp: number

### Player (Entity 확장)
- character: `'gunner' | 'swordsman'`
- exp: number
- level: number
- skills: SkillInstance[]
- invincibleUntil: number (ms timestamp)

### Enemy (Entity 확장)
- type: `'normal' | 'fast' | 'tank'`
- damage: number
- expDrop: number

### Projectile
- id: string
- pos: Vec2
- vel: Vec2
- damage: number
- radius: number

### ExpOrb
- id: string
- pos: Vec2
- value: number

### SkillDef
- id: SkillId (string union)
- name: string
- description: string
- character: `'gunner' | 'swordsman'`
- maxLevel: number

### GameState
- status: `'playing' | 'levelup' | 'gameover' | 'clear'`
- player: Player
- enemies: Enemy[]
- projectiles: Projectile[]
- expOrbs: ExpOrb[]
- camera: Vec2
- elapsedMs: number
- killCount: number
- waveIndex: number (0~9, 30초마다 증가)

## 필요 스킬

| 스킬 | 적용 Task | 용도 |
|---|---|---|
| vercel-react-best-practices | Task 2, 8 | useRef 게임 루프, localStorage try/catch |
| next-best-practices | Task 2, 12 | `'use client'`, dynamic import |
| shadcn | Task 7, 9 | Button, Card (레벨업·캐릭터 선택) |

## 영향 받는 파일

| 파일 경로 | 변경 유형 | 관련 Task |
|---|---|---|
| `types/game.ts` | New | Task 1 |
| `lib/game/constants.ts` | New | Task 1 |
| `lib/game/entities.ts` | New | Task 3, 6 |
| `lib/game/entities.test.ts` | New | Task 3, 6 |
| `lib/game/physics.ts` | New | Task 4 |
| `lib/game/physics.test.ts` | New | Task 4 |
| `lib/game/enemies.ts` | New | Task 4 |
| `lib/game/enemies.test.ts` | New | Task 4 |
| `lib/game/weapons.ts` | New | Task 5, 10 |
| `lib/game/weapons.test.ts` | New | Task 5, 10 |
| `lib/game/skills.ts` | New | Task 6, 10 |
| `lib/game/skills.test.ts` | New | Task 6, 10 |
| `lib/game/characters.ts` | New | Task 9, 10 |
| `lib/game/spawn.ts` | New | Task 11 |
| `lib/game/spawn.test.ts` | New | Task 11 |
| `hooks/useGameLoop.ts` | New | Task 2 |
| `hooks/useUnlock.ts` | New | Task 8 |
| `hooks/useUnlock.test.ts` | New | Task 8 |
| `components/game/GameCanvas.tsx` | New | Task 2, 3 |
| `components/game/GameCanvas.test.tsx` | New | Task 2 |
| `components/game/GameHUD.tsx` | New | Task 7 |
| `components/game/GameHUD.test.tsx` | New | Task 7 |
| `components/game/LevelUpModal.tsx` | New | Task 7 |
| `components/game/LevelUpModal.test.tsx` | New | Task 7 |
| `components/game/ResultScreen.tsx` | New | Task 8 |
| `components/game/ResultScreen.test.tsx` | New | Task 8 |
| `components/game/CharacterSelect.tsx` | New | Task 9 |
| `components/game/CharacterSelect.test.tsx` | New | Task 9 |
| `app/game/page.tsx` | New | Task 12 |
| `app/page.tsx` | Modify | Task 12 |
| `e2e/zombie-survivors.spec.ts` | New | Task 12 |

## Tasks

---

### Task 1: 게임 타입 & 상수 정의

- **담당 시나리오**: None (foundation)
- **크기**: S (2 파일)
- **의존성**: None
- **구현 대상**:
  - `types/game.ts` — Vec2, Entity, Player, Enemy, Projectile, ExpOrb, SkillDef, GameState, CharacterType, EnemyType, SkillId 타입
  - `lib/game/constants.ts` — CANVAS_W(800), CANVAS_H(600), MAP_W(2400), MAP_H(1800), GAME_DURATION_MS(300000), WAVE_INTERVAL_MS(30000), MAX_WAVES(9), EXP_COLLECT_RADIUS
- **수용 기준**:
  - [ ] TypeScript 컴파일 에러 없이 빌드된다
- **검증**: `bun run build`

---

### Task 2: Canvas 게임 루프 기반 (HIGH RISK)

- **담당 시나리오**: Scenario 2 (partial — 캔버스 렌더링 확인)
- **크기**: M (3 파일)
- **의존성**: Task 1
- **참조**:
  - next-best-practices — `'use client'`, dynamic import
  - vercel-react-best-practices — useRef 루프
- **구현 대상**:
  - `hooks/useGameLoop.ts` — `useRef<GameState>` + `requestAnimationFrame` tick, `deltaTime` 계산, start/stop
  - `components/game/GameCanvas.tsx` — `'use client'`, `<canvas>` 마운트, 배경 타일 그리드 렌더
  - `components/game/GameCanvas.test.tsx`
- **수용 기준**:
  - [ ] GameCanvas를 마운트하면 `<canvas>` 요소가 DOM에 존재한다
  - [ ] useGameLoop의 tick 콜백이 rAF를 통해 반복 호출된다 (vitest fake timers)
- **검증**:
  - `bun run test -- GameCanvas`
  - Browser MCP: `/game` 라우트에서 캔버스 요소가 렌더됨 확인, 증거 `artifacts/zombie-survivors/evidence/task-2.png` 저장

---

### Task 3: 플레이어 이동 + 카메라

- **담당 시나리오**: Scenario 3 (이동 + 카메라 추적 + 경계)
- **크기**: M (3 파일)
- **의존성**: Task 2
- **구현 대상**:
  - `lib/game/entities.ts` — `createPlayer`, `applyMovement(player, keys, dt)`, `clampToMap(pos, radius)`, `calcCamera(playerPos)`
  - `lib/game/entities.test.ts`
  - `hooks/useGameLoop.ts` (수정) — 키보드 keydown/keyup 리스너 통합, player 이동 tick 적용
- **수용 기준**:
  - [ ] 오른쪽 키 입력 후 player.pos.x가 증가한다
  - [ ] 왼쪽 키 입력 후 player.pos.x가 감소한다
  - [ ] 플레이어가 맵 왼쪽 경계(x=0)에 도달하면 더 이상 x가 감소하지 않는다
  - [ ] 플레이어가 맵 오른쪽 경계(x=MAP_W)에 도달하면 더 이상 x가 증가하지 않는다
  - [ ] 카메라 offset이 플레이어를 캔버스 중앙(CANVAS_W/2, CANVAS_H/2)에 위치시킨다
- **검증**:
  - `bun run test -- entities`
  - Browser MCP: 방향키 이동 확인, 맵 경계 막힘 확인

---

### Task 4: 적 스폰 + 이동 + 충돌

- **담당 시나리오**: Scenario 4, 5 (자동공격 전제), Scenario 9 (피격)
- **크기**: M (4 파일)
- **의존성**: Task 3
- **구현 대상**:
  - `lib/game/enemies.ts` — `ENEMY_DEFS` (normal/fast/tank 스탯), `spawnEnemy(mapBounds)`, `updateEnemies(enemies, playerPos, dt)`
  - `lib/game/enemies.test.ts`
  - `lib/game/physics.ts` — `circleCollision(a, b)`, `applyEnemyDamage(state, now)`
  - `lib/game/physics.test.ts`
- **수용 기준**:
  - [ ] 일반 좀비, 달리는 좀비, 탱커의 speed 값이 서로 다르다
  - [ ] `circleCollision`이 두 원이 겹칠 때 true, 아닐 때 false를 반환한다
  - [ ] `applyEnemyDamage` 호출 시 충돌한 적이 있으면 player.hp가 감소한다
  - [ ] invincibleUntil 이내 재호출 시 hp가 추가 감소하지 않는다
- **검증**: `bun run test -- enemies physics`

---

### Checkpoint: Tasks 1-4 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 플레이어가 맵 위를 이동하고, 좀비가 스폰돼 쫓아오며, 충돌 시 HP가 감소한다 (Browser MCP)

---

### Task 5: 총잡이 자동 공격 + 투사체 피해

- **담당 시나리오**: Scenario 4 (자동 공격), Scenario 5 (투사체 없는 검사와의 대비 근거)
- **크기**: M (2 파일)
- **의존성**: Task 4
- **구현 대상**:
  - `lib/game/weapons.ts` — `GUNNER_SKILLS` (권총·산탄총·화염방사기·수류탄·전기충격 SkillDef), `findNearestEnemy`, `createProjectile`, `updateProjectiles`, `applyProjectileDamage`
  - `lib/game/weapons.test.ts`
- **수용 기준**:
  - [ ] 공격 쿨다운이 지났고 범위 안에 적이 있으면 투사체가 생성된다
  - [ ] `findNearestEnemy`가 플레이어에서 가장 가까운 적을 반환한다
  - [ ] 투사체가 적 반경과 겹치면 적 hp가 감소한다
  - [ ] 피해가 적용된 투사체는 제거된다 (貫通 없음 — 기본 동작)
- **검증**: `bun run test -- weapons`

---

### Task 6: 경험치 드롭 + 레벨업 트리거

- **담당 시나리오**: Scenario 6 (EXP 수집 → 레벨업 트리거)
- **크기**: M (3 파일 수정 포함)
- **의존성**: Task 5
- **구현 대상**:
  - `lib/game/skills.ts` — `EXP_THRESHOLDS` (레벨별 필요 EXP), `getSkillCandidates(player, allDefs)` — 3장 무작위 후보 반환
  - `lib/game/skills.test.ts`
  - `lib/game/entities.ts` (수정) — `spawnExpOrb(pos, value)`, `collectExpOrbs(state)` — 플레이어 반경 접촉 시 수집 + levelup 트리거
- **수용 기준**:
  - [ ] `collectExpOrbs` 호출 시 플레이어 반경 안 ExpOrb가 제거되고 player.exp가 증가한다
  - [ ] player.exp가 임계값 이상이 되면 `state.status`가 `'levelup'`으로 변한다
  - [ ] `getSkillCandidates`가 해당 캐릭터 스킬 중 3개를 반환한다
  - [ ] 이미 maxLevel에 도달한 스킬은 후보에서 제외된다
- **검증**: `bun run test -- skills entities`

---

### Task 7: HUD + 레벨업 스킬 선택 UI

- **담당 시나리오**: Scenario 2 (HUD 초기), Scenario 6, 7 (레벨업 선택)
- **크기**: M (4 파일)
- **의존성**: Task 6
- **참조**:
  - shadcn — Button, Card
- **구현 대상**:
  - `components/game/GameHUD.tsx` — 타이머(mm:ss), HP 바, EXP 바, 스킬 목록 props 수신
  - `components/game/GameHUD.test.tsx`
  - `components/game/LevelUpModal.tsx` — 스킬 카드 3장, onSelect(skillId) 콜백
  - `components/game/LevelUpModal.test.tsx`
- **수용 기준**:
  - [ ] `<GameHUD remainingMs={300000} hp={100} maxHp={100} level={1} exp={0} expThreshold={100} skills={[]} />`가 "5:00", HP 바, "LV.1", 빈 스킬 목록을 렌더한다
  - [ ] `<LevelUpModal candidates={[...3개]} />`가 카드 3장을 렌더한다
  - [ ] 카드 클릭 시 `onSelect(skillId)`가 호출된다
  - [ ] 이미 보유한 스킬 카드에 "Lv.N→N+1" 텍스트가 표시된다
  - [ ] `status='levelup'`일 때 tick이 호출돼도 enemy 위치·projectile 위치·elapsedMs가 변하지 않는다 (불변 규칙 1)
- **검증**: `bun run test -- GameHUD LevelUpModal`

---

### Checkpoint: Tasks 5-7 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 총잡이로 적을 처치하고, EXP 수집 후 레벨업 카드를 선택하면 게임이 재개된다 (Browser MCP)

---

### Task 8: 게임오버 + 클리어 + 검사 해금

- **담당 시나리오**: Scenario 9 (HP 0), Scenario 10, 11, 12 (결과 + 해금)
- **크기**: M (4 파일)
- **의존성**: Task 7
- **참조**:
  - vercel-react-best-practices — localStorage try/catch, versioned key
- **구현 대상**:
  - `hooks/useUnlock.ts` — `isUnlocked()`, `setUnlocked()` — try/catch, key `zs:unlocked:v1`
  - `hooks/useUnlock.test.ts`
  - `components/game/ResultScreen.tsx` — GameOver/Clear 공용, 통계(생존시간·처치수·레벨), 해금 배너, 버튼 2개
  - `components/game/ResultScreen.test.tsx`
- **수용 기준**:
  - [ ] `status='gameover'`이면 "GAME OVER" 텍스트가 표시된다
  - [ ] `status='clear'`이면 "CLEAR!" 텍스트가 표시된다
  - [ ] 두 경우 모두 생존 시간·처치 수·달성 레벨이 표시된다
  - [ ] `setUnlocked()` 호출 시 `localStorage['zs:unlocked:v1']`이 `'true'`로 저장된다
  - [ ] `isUnlocked()`가 저장값이 있으면 true, 없으면 false를 반환한다
  - [ ] `firstPlay=true`이면 "검사 해금!" 배너가 표시된다
- **검증**: `bun run test -- ResultScreen useUnlock`

---

### Task 9: 캐릭터 선택 화면

- **담당 시나리오**: Scenario 1 (초기), Scenario 11, 13 (해금 후)
- **크기**: M (3 파일)
- **의존성**: Task 8
- **참조**:
  - shadcn — Card, Button
- **구현 대상**:
  - `lib/game/characters.ts` — `CHARACTER_DEFS` (총잡이/검사 스탯, hp, speed)
  - `components/game/CharacterSelect.tsx` — 캐릭터 카드 2종, 해금 상태 반영
  - `components/game/CharacterSelect.test.tsx`
- **수용 기준**:
  - [ ] `unlocked=false`이면 검사 카드에 잠금 아이콘과 "첫 플레이 후 해금" 텍스트가 표시된다
  - [ ] `unlocked=false`이면 검사 카드 클릭 시 onSelect가 호출되지 않는다
  - [ ] `unlocked=true`이면 검사 카드에 잠금 UI가 없고 "선택" 버튼이 활성이다
  - [ ] 총잡이 "선택" 클릭 시 `onSelect('gunner')`가 호출된다
- **검증**: `bun run test -- CharacterSelect`

---

### Checkpoint: Tasks 8-9 이후
- [ ] 모든 테스트 통과: `bun run test`
- [ ] 빌드 성공: `bun run build`
- [ ] 게임오버 → "검사 해금!" 배너 → "캐릭터 선택으로" → 검사 카드 활성 확인 (Browser MCP), 증거 `artifacts/zombie-survivors/evidence/task-9.png`

---

### Task 10: 검사 캐릭터 + 근접 공격

- **담당 시나리오**: Scenario 5 (근접·투사체 없음), Scenario 13 (검사 전용 스킬)
- **크기**: M (2 파일 수정)
- **의존성**: Task 9
- **구현 대상**:
  - `lib/game/weapons.ts` (수정) — `SWORDSMAN_SKILLS` (검 회전·돌진 베기·충격파·흡혈 베기·방패 강타 SkillDef), `applyMeleeAttack(player, enemies, now)` — 근접 반경 내 모든 적 피해
  - `lib/game/weapons.test.ts` (추가)
- **수용 기준**:
  - [ ] 검사 캐릭터에서 `applyMeleeAttack` 호출 시 근접 반경 안 적 전체 hp가 감소한다
  - [ ] 검사 캐릭터에서 투사체가 생성되지 않는다
  - [ ] `getSkillCandidates`가 검사에게 SWORDSMAN_SKILLS만 반환한다
  - [ ] 검사의 초기 maxHp가 120이다 (총잡이 100)
- **검증**: `bun run test -- weapons`

---

### Task 11: 스폰 강도 증가 (30초마다)

- **담당 시나리오**: Scenario 8 (스폰 강화)
- **크기**: S (2 파일)
- **의존성**: Task 10
- **구현 대상**:
  - `lib/game/spawn.ts` — `getWaveIndex(elapsedMs)`, `getWaveConfig(waveIndex)` — 스폰 간격·수·종류 비율 반환
  - `lib/game/spawn.test.ts`
- **수용 기준**:
  - [ ] `getWaveIndex(0)`이 0을 반환하고, `getWaveIndex(30000)`이 1을 반환한다
  - [ ] `getWaveConfig(9).spawnInterval`이 `getWaveConfig(0).spawnInterval`보다 작다 (더 빠른 스폰)
  - [ ] `getWaveConfig(9).maxEnemies`가 `getWaveConfig(0).maxEnemies`보다 크다
- **검증**: `bun run test -- spawn`

---

### Task 12: 게임 페이지 통합 + E2E

- **담당 시나리오**: 전체 시나리오 통합
- **크기**: M (3 파일)
- **의존성**: Task 11
- **참조**:
  - next-best-practices — `'use client'`, dynamic import (SSR 방지)
- **구현 대상**:
  - `app/game/page.tsx` — `'use client'`, screen state machine (`characterSelect → playing → gameover/clear`), 모든 컴포넌트 조립
  - `app/page.tsx` (수정) — `/game` 링크 추가
  - `e2e/zombie-survivors.spec.ts` — 캐릭터 선택 → 게임 시작 → HUD 확인
- **수용 기준**:
  - [ ] `/game` 진입 시 캐릭터 선택 화면이 표시된다
  - [ ] 총잡이 "선택" 클릭 시 HUD에 "5:00" 타이머가 표시된다
  - [ ] 게임 시작 시 HP 바, EXP 바, 스킬 목록이 HUD에 표시된다
  - [ ] `getWaveConfig(9).maxEnemies`가 100 이상이고, 해당 waveIndex에서 적 100마리를 루프에 넣어도 rAF 프레임이 16ms 이내를 유지한다 (불변 규칙 3 — Human review: 브라우저 Performance 탭에서 프레임 타임 확인)
- **검증**:
  - `bun run test:e2e -- zombie-survivors`
  - `bun run build`

---

### Checkpoint: Tasks 10-12 이후 (Final)
- [ ] 모든 테스트 통과: `bun run test`
- [ ] E2E 통과: `bun run test:e2e`
- [ ] 빌드 성공: `bun run build`
- [ ] 총잡이 + 검사 양쪽으로 게임 진행 및 결과 화면 확인 (Browser MCP), 증거 `artifacts/zombie-survivors/evidence/task-12.png`

---

## 미결정 항목

- 픽셀 아트 스프라이트 에셋 출처 — 현재 canvas primitives 대체. 에셋 확정 시 `lib/game/sprites.ts`에 로딩 로직 추가
- 맵 타일 디자인 (아포칼립스 세계관 묘사 수준) — 현재 grid 배경으로 대체

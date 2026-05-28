---
category: task-ordering
applied: not-yet
---
## Task 10 (검사)이 Task 5에서 선행 구현됨

**상황**: Step 3, Task 5 구현 중. weapons.ts에 SWORDSMAN_SKILLS와 applyMeleeAttack을 같이 작성했고, Task 10의 수용 기준이 이미 충족됨.
**판단**: Task 10을 별도 커밋 없이 Task 5 범위에서 처리. "먼저 만들어야 하는 것"과 "나중에 쓰는 것"이 같은 파일에 있을 때 계획보다 일찍 구현되는 패턴이다.
**다시 마주칠 가능성**: 중간 — 캐릭터 종류가 같은 파일에 있을 때 반복됨.

---
category: tooling
applied: not-yet
---
## vitest가 e2e/ Playwright 파일을 실행하려 함

**상황**: Checkpoint 1에서 `bun run test` 실패. `e2e/smoke.spec.ts`가 Playwright test() 호출로 vitest에서 오류.
**판단**: vitest.config.ts의 `exclude`에 `e2e/**` 추가로 해결. 신규 프로젝트 셋업 시 처음부터 제외 패턴 포함해야 한다.
**다시 마주칠 가능성**: 높음 — Next.js + Playwright 조합에서 항상 같은 문제 발생.

---
category: code-review
applied: not-yet
---
## rAF 모킹에서 즉시 재귀 호출 유발

**상황**: Task 2 GameCanvas.test.tsx에서 `requestAnimationFrame`을 `vi.fn().mockImplementation((cb) => { cb(); return 1; })`으로 모킹하면 tick → rAF → tick 무한 루프.
**판단**: `vi.fn().mockReturnValue(1)`으로 콜백을 즉시 실행하지 않도록 변경. 게임 루프 테스트에서 rAF는 "tick이 등록되는지"만 확인하고 실행은 시키지 않는 패턴이 올바르다.
**다시 마주칠 가능성**: 높음 — rAF 기반 컴포넌트 테스트마다 같은 함정.

---
category: spec-ambiguity
applied: not-yet
---
## tick.ts의 require() 사용 — 정적 import로 교체

**상황**: Task 12 빌드 시 tick.ts 내부의 `require('./enemies')` 호출이 Next.js 빌드에서 문제 소지.
**판단**: 정적 `import { spawnEnemy } from './enemies'`로 교체. 순환 의존 없으므로 안전했음. 게임 루프 코드에서는 동적 require를 쓰지 않는다.
**다시 마주칠 가능성**: 중간 — 초안 작성 시 require로 빠르게 쓴 뒤 잊는 패턴.

---
category: task-ordering
applied: not-yet
---
## 플레이어 좌표와 테스트 적 좌표 불일치

**상황**: Task 5 weapons.test.ts에서 플레이어 초기 위치(MAP_W/2=1200, MAP_H/2=900)와 적(100, 0) 거리가 ATTACK_RANGE(300)를 초과해 첫 실행에 실패.
**판단**: 테스트에서 `makeEnemy(player.pos.x + 100, player.pos.y)` 패턴으로 플레이어 기준 상대 좌표를 사용. 좌표 의존 테스트는 항상 플레이어 기준 상대값으로 작성한다.
**다시 마주칠 가능성**: 높음 — 게임 도메인에서 절대 좌표 테스트는 지속적으로 깨진다.

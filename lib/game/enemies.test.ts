import { describe, it, expect } from 'vitest';
import { ENEMY_DEFS, spawnEnemy, updateEnemies } from './enemies';

describe('ENEMY_DEFS', () => {
  it('normal/fast/tank의 speed가 서로 다르다', () => {
    const speeds = [ENEMY_DEFS.normal.speed, ENEMY_DEFS.fast.speed, ENEMY_DEFS.tank.speed];
    const unique = new Set(speeds);
    expect(unique.size).toBe(3);
  });
});

describe('spawnEnemy', () => {
  it('맵 경계 밖에서 스폰된다', () => {
    const enemy = spawnEnemy('normal', { x: 1200, y: 900 });
    const isOutside =
      enemy.pos.x < 0 || enemy.pos.x > 2400 ||
      enemy.pos.y < 0 || enemy.pos.y > 1800;
    expect(isOutside).toBe(true);
  });
});

describe('updateEnemies', () => {
  it('적이 플레이어 방향으로 이동한다', () => {
    const enemy = spawnEnemy('normal', { x: 2000, y: 900 });
    enemy.pos = { x: 500, y: 900 };
    const playerPos = { x: 1200, y: 900 };
    const [updated] = updateEnemies([enemy], playerPos, 0.1);
    expect(updated.pos.x).toBeGreaterThan(enemy.pos.x);
  });
});

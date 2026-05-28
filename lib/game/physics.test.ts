import { describe, it, expect } from 'vitest';
import { circleCollision, applyEnemyDamage } from './physics';
import { createPlayer } from './entities';
import type { GameState, Enemy } from '@/types/game';
import { nanoid } from 'nanoid';

const makeEnemy = (x: number, y: number): Enemy => ({
  id: nanoid(), pos: { x, y }, vel: { x: 0, y: 0 },
  radius: 16, hp: 30, maxHp: 30,
  type: 'normal', damage: 10, expDrop: 5, speed: 60,
});

const makeState = (enemies: Enemy[], now = 0): GameState => ({
  status: 'playing',
  player: { ...createPlayer('gunner'), pos: { x: 100, y: 100 }, invincibleUntil: 0 },
  enemies, projectiles: [], expOrbs: [],
  camera: { x: 0, y: 0 },
  elapsedMs: 0, killCount: 0, waveIndex: 0,
  lastSpawnAt: 0, pendingSkillCandidates: [],
});

describe('circleCollision', () => {
  it('두 원이 겹칠 때 true를 반환한다', () => {
    expect(circleCollision({ pos: { x: 0, y: 0 }, radius: 10 }, { pos: { x: 15, y: 0 }, radius: 10 })).toBe(true);
  });

  it('두 원이 겹치지 않을 때 false를 반환한다', () => {
    expect(circleCollision({ pos: { x: 0, y: 0 }, radius: 10 }, { pos: { x: 30, y: 0 }, radius: 10 })).toBe(false);
  });
});

describe('applyEnemyDamage', () => {
  it('충돌한 적이 있으면 player.hp가 감소한다', () => {
    const enemy = makeEnemy(100, 100); // same pos as player
    const state = makeState([enemy]);
    const next = applyEnemyDamage(state, 1000);
    expect(next.player.hp).toBeLessThan(state.player.hp);
  });

  it('invincibleUntil 이내 재호출 시 hp가 추가 감소하지 않는다', () => {
    const enemy = makeEnemy(100, 100);
    const state = makeState([enemy]);
    const after1 = applyEnemyDamage(state, 1000);
    const after2 = applyEnemyDamage(after1, 1100); // still within invincible window
    expect(after2.player.hp).toBe(after1.player.hp);
  });
});

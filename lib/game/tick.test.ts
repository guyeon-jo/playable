import { describe, it, expect } from 'vitest';
import { gameTick } from './tick';
import { createPlayer } from './entities';
import type { Enemy, GameState } from '@/types/game';
import { nanoid } from 'nanoid';

const makeEnemy = (): Enemy => ({
  id: nanoid(), pos: { x: 500, y: 500 }, vel: { x: 0, y: 0 },
  radius: 16, hp: 30, maxHp: 30,
  type: 'normal', damage: 10, expDrop: 5, speed: 60,
});

const makeState = (status: GameState['status'] = 'playing'): GameState => ({
  status,
  player: { ...createPlayer('gunner'), pos: { x: 1200, y: 900 } },
  enemies: [makeEnemy()],
  projectiles: [{ id: nanoid(), pos: { x: 300, y: 300 }, vel: { x: 10, y: 0 }, damage: 5, radius: 5 }],
  expOrbs: [],
  camera: { x: 0, y: 0 },
  elapsedMs: 0, killCount: 0, waveIndex: 0,
  lastSpawnAt: 0, pendingSkillCandidates: [],
});

describe('gameTick — levelup 일시정지 (불변 규칙 1)', () => {
  it('status=levelup 시 enemy 위치가 변하지 않는다', () => {
    const state = makeState('levelup');
    const before = { ...state.enemies[0].pos };
    const next = gameTick(state, 0.1, new Set(), 1000);
    expect(next.enemies[0].pos).toEqual(before);
  });

  it('status=levelup 시 projectile 위치가 변하지 않는다', () => {
    const state = makeState('levelup');
    const before = { ...state.projectiles[0].pos };
    const next = gameTick(state, 0.1, new Set(), 1000);
    expect(next.projectiles[0].pos).toEqual(before);
  });

  it('status=levelup 시 elapsedMs가 변하지 않는다', () => {
    const state = makeState('levelup');
    const next = gameTick(state, 0.1, new Set(), 1000);
    expect(next.elapsedMs).toBe(0);
  });
});

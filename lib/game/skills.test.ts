import { describe, it, expect } from 'vitest';
import { getSkillCandidates } from './skills';
import { createPlayer } from './entities';

describe('getSkillCandidates', () => {
  it('총잡이에게는 gunner 스킬 중 3개를 반환한다', () => {
    const player = createPlayer('gunner');
    const candidates = getSkillCandidates(player);
    expect(candidates).toHaveLength(3);
    expect(candidates.every(s => s.character === 'gunner')).toBe(true);
  });

  it('검사에게는 swordsman 스킬 중 3개를 반환한다', () => {
    const player = createPlayer('swordsman');
    const candidates = getSkillCandidates(player);
    expect(candidates).toHaveLength(3);
    expect(candidates.every(s => s.character === 'swordsman')).toBe(true);
  });

  it('이미 maxLevel에 도달한 스킬은 후보에서 제외된다', () => {
    const player = { ...createPlayer('gunner'), skills: [{ id: 'pistol' as const, level: 5 }] };
    const candidates = getSkillCandidates(player);
    expect(candidates.some(s => s.id === 'pistol')).toBe(false);
  });
});

describe('collectExpOrbs (entities)', () => {
  it('플레이어 반경 안 구슬이 제거되고 exp가 증가한다', async () => {
    const { collectExpOrbs, createPlayer, spawnExpOrb } = await import('./entities');
    const player = { ...createPlayer('gunner'), pos: { x: 100, y: 100 } };
    const nearOrb = spawnExpOrb({ x: 105, y: 100 }, 5);
    const farOrb  = spawnExpOrb({ x: 500, y: 100 }, 5);
    const state = {
      status: 'playing' as const,
      player, enemies: [], projectiles: [],
      expOrbs: [nearOrb, farOrb],
      camera: { x: 0, y: 0 },
      elapsedMs: 0, killCount: 0, waveIndex: 0,
      lastSpawnAt: 0, pendingSkillCandidates: [],
    };
    const next = collectExpOrbs(state);
    expect(next.player.exp).toBe(5);
    expect(next.expOrbs).toHaveLength(1);
  });

  it('exp가 임계값 이상이 되면 status가 levelup으로 변한다', async () => {
    const { collectExpOrbs, createPlayer, spawnExpOrb, expThreshold } = await import('./entities');
    const player = { ...createPlayer('gunner'), pos: { x: 100, y: 100 }, exp: expThreshold(1) - 3 };
    const orb = spawnExpOrb({ x: 105, y: 100 }, 5);
    const state = {
      status: 'playing' as const,
      player, enemies: [], projectiles: [],
      expOrbs: [orb],
      camera: { x: 0, y: 0 },
      elapsedMs: 0, killCount: 0, waveIndex: 0,
      lastSpawnAt: 0, pendingSkillCandidates: [],
    };
    const next = collectExpOrbs(state);
    expect(next.status).toBe('levelup');
  });
});

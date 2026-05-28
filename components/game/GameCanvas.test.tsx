import { render } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { GameCanvas } from './GameCanvas';
import type { GameState } from '@/types/game';

const makeState = (): GameState => ({
  status: 'playing',
  player: {
    id: 'player',
    pos: { x: 1200, y: 900 },
    vel: { x: 0, y: 0 },
    radius: 16,
    hp: 100, maxHp: 100,
    character: 'gunner',
    exp: 0, level: 1,
    skills: [],
    invincibleUntil: 0,
    attackCooldownUntil: 0,
  },
  enemies: [], projectiles: [], expOrbs: [],
  camera: { x: 0, y: 0 },
  elapsedMs: 0, killCount: 0, waveIndex: 0,
  lastSpawnAt: 0, pendingSkillCandidates: [],
});

describe('GameCanvas', () => {
  beforeEach(() => {
    vi.spyOn(window, 'requestAnimationFrame').mockReturnValue(1);
    vi.spyOn(window, 'cancelAnimationFrame').mockImplementation(() => {});
    // stub canvas context
    HTMLCanvasElement.prototype.getContext = vi.fn().mockReturnValue({
      clearRect: vi.fn(), fillRect: vi.fn(), strokeRect: vi.fn(),
      beginPath: vi.fn(), arc: vi.fn(), fill: vi.fn(), stroke: vi.fn(),
      moveTo: vi.fn(), lineTo: vi.fn(),
      save: vi.fn(), restore: vi.fn(), translate: vi.fn(),
      fillText: vi.fn(), measureText: vi.fn().mockReturnValue({ width: 0 }),
      createLinearGradient: vi.fn().mockReturnValue({ addColorStop: vi.fn() }),
    });
  });

  afterEach(() => { vi.restoreAllMocks(); });

  it('canvas 요소가 DOM에 존재한다', () => {
    const state = makeState();
    const { container } = render(
      <GameCanvas gameStateRef={{ current: state }} keysRef={{ current: new Set() }} onTick={(s) => s} />
    );
    expect(container.querySelector('canvas')).not.toBeNull();
  });
});

import type { GameState } from '@/types/game';
import { INVINCIBLE_DURATION_MS } from './constants';

interface CircleA { pos: { x: number; y: number }; radius: number }

export function circleCollision(a: CircleA, b: CircleA): boolean {
  const dx = a.pos.x - b.pos.x;
  const dy = a.pos.y - b.pos.y;
  return Math.sqrt(dx * dx + dy * dy) < a.radius + b.radius;
}

export function applyEnemyDamage(state: GameState, now: number): GameState {
  const { player, enemies } = state;
  if (now < player.invincibleUntil) return state;

  for (const enemy of enemies) {
    if (circleCollision(player, enemy)) {
      const newHp = Math.max(0, player.hp - enemy.damage);
      return {
        ...state,
        player: {
          ...player,
          hp: newHp,
          invincibleUntil: now + INVINCIBLE_DURATION_MS,
        },
        status: newHp === 0 ? 'gameover' : state.status,
      };
    }
  }
  return state;
}

import type { Enemy, EnemyType, Vec2 } from '@/types/game';
import { MAP_W, MAP_H } from './constants';
import { nanoid } from 'nanoid';

interface EnemyDef {
  speed: number;
  radius: number;
  hp: number;
  damage: number;
  expDrop: number;
}

export const ENEMY_DEFS: Record<EnemyType, EnemyDef> = {
  normal: { speed: 60,  radius: 16, hp: 30,  damage: 10, expDrop: 5  },
  fast:   { speed: 120, radius: 12, hp: 15,  damage: 8,  expDrop: 4  },
  tank:   { speed: 30,  radius: 28, hp: 120, damage: 20, expDrop: 15 },
};

export function spawnEnemy(type: EnemyType, playerPos: Vec2): Enemy {
  const def = ENEMY_DEFS[type];
  const side = Math.floor(Math.random() * 4);
  let pos: Vec2;
  const margin = 60;

  if (side === 0) pos = { x: Math.random() * MAP_W, y: -margin };
  else if (side === 1) pos = { x: Math.random() * MAP_W, y: MAP_H + margin };
  else if (side === 2) pos = { x: -margin, y: Math.random() * MAP_H };
  else pos = { x: MAP_W + margin, y: Math.random() * MAP_H };

  return {
    id: nanoid(),
    pos,
    vel: { x: 0, y: 0 },
    radius: def.radius,
    hp: def.hp, maxHp: def.hp,
    type, damage: def.damage,
    expDrop: def.expDrop,
    speed: def.speed,
  };
}

export function updateEnemies(enemies: Enemy[], playerPos: Vec2, dt: number): Enemy[] {
  return enemies.map(enemy => {
    const dx = playerPos.x - enemy.pos.x;
    const dy = playerPos.y - enemy.pos.y;
    const len = Math.sqrt(dx * dx + dy * dy);
    if (len === 0) return enemy;
    return {
      ...enemy,
      pos: {
        x: enemy.pos.x + (dx / len) * enemy.speed * dt,
        y: enemy.pos.y + (dy / len) * enemy.speed * dt,
      },
    };
  });
}

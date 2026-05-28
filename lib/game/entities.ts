import type { Player, Enemy, ExpOrb, GameState, Vec2, CharacterType, SkillId } from '@/types/game';
import {
  MAP_W, MAP_H, PLAYER_SPEED,
  CANVAS_W, CANVAS_H, EXP_COLLECT_RADIUS,
} from './constants';
import { nanoid } from 'nanoid';

const DEFAULT_SKILL: Record<CharacterType, SkillId> = {
  gunner: 'pistol',
  swordsman: 'spin_slash',
};

export function createPlayer(character: CharacterType): Player {
  const maxHp = character === 'swordsman' ? 120 : 100;
  return {
    id: 'player',
    pos: { x: MAP_W / 2, y: MAP_H / 2 },
    vel: { x: 0, y: 0 },
    radius: 16,
    hp: maxHp,
    maxHp,
    character,
    exp: 0,
    level: 1,
    skills: [{ id: DEFAULT_SKILL[character], level: 1, cooldownUntil: 0 }],
    invincibleUntil: 0,
    attackCooldownUntil: 0,
  };
}

const KEY_MAP: Record<string, Vec2> = {
  ArrowRight: { x: 1, y: 0 }, d: { x: 1, y: 0 },
  ArrowLeft:  { x: -1, y: 0 }, a: { x: -1, y: 0 },
  ArrowDown:  { x: 0, y: 1 }, s: { x: 0, y: 1 },
  ArrowUp:    { x: 0, y: -1 }, w: { x: 0, y: -1 },
};

export function applyMovement(player: Player, keys: Set<string>, dt: number): Player {
  let dx = 0, dy = 0;
  for (const key of keys) {
    const dir = KEY_MAP[key];
    if (dir) { dx += dir.x; dy += dir.y; }
  }
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len > 0) { dx /= len; dy /= len; }

  const newPos = clampToMap(
    { x: player.pos.x + dx * PLAYER_SPEED * dt, y: player.pos.y + dy * PLAYER_SPEED * dt },
    player.radius,
  );
  return { ...player, pos: newPos };
}

export function clampToMap(pos: Vec2, radius: number): Vec2 {
  return {
    x: Math.max(radius, Math.min(MAP_W - radius, pos.x)),
    y: Math.max(radius, Math.min(MAP_H - radius, pos.y)),
  };
}

// camera.x/y = player world position; renderer subtracts and adds CANVAS/2 to center
export function calcCamera(playerPos: Vec2): Vec2 {
  return { x: playerPos.x, y: playerPos.y };
}

export function spawnExpOrb(pos: Vec2, value: number): ExpOrb {
  return { id: nanoid(), pos: { ...pos }, value };
}

export function collectExpOrbs(state: GameState): GameState {
  const { player, expOrbs } = state;
  let gained = 0;
  const remaining: ExpOrb[] = [];

  for (const orb of expOrbs) {
    const dx = orb.pos.x - player.pos.x;
    const dy = orb.pos.y - player.pos.y;
    if (Math.sqrt(dx * dx + dy * dy) <= EXP_COLLECT_RADIUS) {
      gained += orb.value;
    } else {
      remaining.push(orb);
    }
  }

  if (gained === 0) return state;

  const newExp = player.exp + gained;
  const threshold = expThreshold(player.level);

  if (newExp >= threshold) {
    return {
      ...state,
      expOrbs: remaining,
      player: { ...player, exp: newExp },
      status: 'levelup',
    };
  }

  return {
    ...state,
    expOrbs: remaining,
    player: { ...player, exp: newExp },
  };
}

export function expThreshold(level: number): number {
  return 20 + (level - 1) * 15;
}

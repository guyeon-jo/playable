import type { SkillDef, Enemy, Player, Projectile } from '@/types/game';
import { ATTACK_RANGE, BASE_ATTACK_INTERVAL_MS, MELEE_RADIUS } from './constants';
import { circleCollision } from './physics';
import { nanoid } from 'nanoid';

export const GUNNER_SKILLS: SkillDef[] = [
  { id: 'pistol',       name: '권총',       description: '단발 투사체 공격',      character: 'gunner',    maxLevel: 5 },
  { id: 'shotgun',      name: '산탄총',     description: '부채꼴 산탄 공격',      character: 'gunner',    maxLevel: 5 },
  { id: 'flamethrower', name: '화염방사기', description: '전방 연속 화염 공격',   character: 'gunner',    maxLevel: 5 },
  { id: 'grenade',      name: '수류탄',     description: '범위 폭발 피해',        character: 'gunner',    maxLevel: 5 },
  { id: 'lightning',    name: '전기 충격',  description: '연쇄 번개 공격',        character: 'gunner',    maxLevel: 5 },
];

export const SWORDSMAN_SKILLS: SkillDef[] = [
  { id: 'spin_slash',   name: '검 회전',    description: '주변 전체 베기',        character: 'swordsman', maxLevel: 5 },
  { id: 'dash_slash',   name: '돌진 베기',  description: '전방 돌진 베기',        character: 'swordsman', maxLevel: 5 },
  { id: 'shockwave',    name: '충격파',     description: '원형 충격파 방출',      character: 'swordsman', maxLevel: 5 },
  { id: 'lifesteal',    name: '흡혈 베기',  description: '피해량의 일부 회복',    character: 'swordsman', maxLevel: 5 },
  { id: 'shield_bash',  name: '방패 강타',  description: '전방 적 밀쳐내기',      character: 'swordsman', maxLevel: 5 },
];

export const ALL_SKILLS: SkillDef[] = [...GUNNER_SKILLS, ...SWORDSMAN_SKILLS];

export function findNearestEnemy(playerPos: { x: number; y: number }, enemies: Enemy[]): Enemy | null {
  if (enemies.length === 0) return null;
  let nearest = enemies[0];
  let minDist = dist(playerPos, nearest.pos);
  for (let i = 1; i < enemies.length; i++) {
    const d = dist(playerPos, enemies[i].pos);
    if (d < minDist) { minDist = d; nearest = enemies[i]; }
  }
  return nearest;
}

export function tryFireProjectile(
  player: Player,
  enemies: Enemy[],
  now: number,
): { projectile: Projectile | null; updatedPlayer: Player } {
  if (now < player.attackCooldownUntil) return { projectile: null, updatedPlayer: player };

  const target = findNearestEnemy(player.pos, enemies);
  if (!target) return { projectile: null, updatedPlayer: player };

  const d = dist(player.pos, target.pos);
  if (d > ATTACK_RANGE) return { projectile: null, updatedPlayer: player };

  const dx = target.pos.x - player.pos.x;
  const dy = target.pos.y - player.pos.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  const speed = 400;

  const projectile: Projectile = {
    id: nanoid(),
    pos: { ...player.pos },
    vel: { x: (dx / len) * speed, y: (dy / len) * speed },
    damage: baseDamage(player),
    radius: 5,
  };

  return {
    projectile,
    updatedPlayer: { ...player, attackCooldownUntil: now + BASE_ATTACK_INTERVAL_MS },
  };
}

export function updateProjectiles(projectiles: Projectile[], dt: number): Projectile[] {
  return projectiles.map(p => ({
    ...p,
    pos: { x: p.pos.x + p.vel.x * dt, y: p.pos.y + p.vel.y * dt },
  }));
}

export function applyProjectileDamage(
  projectiles: Projectile[],
  enemies: Enemy[],
): { projectiles: Projectile[]; enemies: Enemy[]; killed: number } {
  const hitProjectileIds = new Set<string>();
  let killed = 0;

  const updatedEnemies = enemies.map(enemy => {
    for (const proj of projectiles) {
      if (!hitProjectileIds.has(proj.id) && circleCollision(proj, enemy)) {
        hitProjectileIds.add(proj.id);
        const newHp = enemy.hp - proj.damage;
        if (newHp <= 0) killed++;
        return { ...enemy, hp: Math.max(0, newHp) };
      }
    }
    return enemy;
  });

  return {
    projectiles: projectiles.filter(p => !hitProjectileIds.has(p.id)),
    enemies: updatedEnemies.filter(e => e.hp > 0),
    killed,
  };
}

export function applyMeleeAttack(
  player: Player,
  enemies: Enemy[],
  now: number,
): { enemies: Enemy[]; projectile: null; updatedPlayer: Player; killed: number } {
  if (now < player.attackCooldownUntil) {
    return { enemies, projectile: null, updatedPlayer: player, killed: 0 };
  }

  const damage = baseDamage(player);
  let killed = 0;

  const updatedEnemies = enemies.map(enemy => {
    const d = dist(player.pos, enemy.pos);
    if (d <= MELEE_RADIUS + enemy.radius) {
      const newHp = enemy.hp - damage;
      if (newHp <= 0) killed++;
      return { ...enemy, hp: Math.max(0, newHp) };
    }
    return enemy;
  });

  return {
    enemies: updatedEnemies.filter(e => e.hp > 0),
    projectile: null,
    updatedPlayer: { ...player, attackCooldownUntil: now + BASE_ATTACK_INTERVAL_MS },
    killed,
  };
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function baseDamage(player: Player): number {
  const level = player.skills.find(s =>
    GUNNER_SKILLS.concat(SWORDSMAN_SKILLS).some(def => def.id === s.id)
  )?.level ?? 1;
  return 10 + (level - 1) * 5;
}

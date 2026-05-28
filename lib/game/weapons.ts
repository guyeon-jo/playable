import type { SkillDef, SkillInstance, Enemy, Player, Projectile } from '@/types/game';
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
  { id: 'shield_bash',  name: '방패 강타',  description: '전방 넓은 범위 피해',   character: 'swordsman', maxLevel: 5 },
];

export const ALL_SKILLS: SkillDef[] = [...GUNNER_SKILLS, ...SWORDSMAN_SKILLS];

// Attack range (px) per gunner skill
const SKILL_RANGES: Partial<Record<string, number>> = {
  pistol:       300,
  shotgun:      220,
  flamethrower: 135,
  grenade:      420,
  lightning:    260,
};

// Attack interval (ms) per skill — used to determine fire rate
const SKILL_INTERVALS: Partial<Record<string, number>> = {
  pistol:       400,
  shotgun:      900,
  flamethrower: 150,
  grenade:      1400,
  lightning:    600,
  spin_slash:   500,
  dash_slash:   700,
  shockwave:    1100,
  lifesteal:    400,
  shield_bash:  650,
};

function effectiveInterval(player: Player): number {
  const intervals = player.skills.map(s => SKILL_INTERVALS[s.id] ?? BASE_ATTACK_INTERVAL_MS);
  return intervals.length > 0 ? Math.min(...intervals) : BASE_ATTACK_INTERVAL_MS;
}

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

/** @deprecated use tryFireProjectiles */
export function tryFireProjectile(
  player: Player,
  enemies: Enemy[],
  now: number,
): { projectile: Projectile | null; updatedPlayer: Player } {
  const result = tryFireProjectiles(player, enemies, now);
  return {
    projectile: result.projectiles[0] ?? null,
    updatedPlayer: result.updatedPlayer,
  };
}

export function tryFireProjectiles(
  player: Player,
  enemies: Enemy[],
  now: number,
): { projectiles: Projectile[]; updatedPlayer: Player } {
  const target = findNearestEnemy(player.pos, enemies);
  if (!target) return { projectiles: [], updatedPlayer: player };

  const base = baseDamage(player);
  const projectiles: Projectile[] = [];

  const updatedSkills = player.skills.map(skill => {
    if (now < skill.cooldownUntil) return skill;
    const fired = fireSkill(player, skill, target, enemies, base);
    if (fired.length === 0) return skill;
    projectiles.push(...fired);
    return { ...skill, cooldownUntil: now + (SKILL_INTERVALS[skill.id] ?? BASE_ATTACK_INTERVAL_MS) };
  });

  if (projectiles.length === 0) return { projectiles: [], updatedPlayer: player };

  return {
    projectiles,
    updatedPlayer: { ...player, skills: updatedSkills },
  };
}

function fireSkill(
  player: Player,
  skill: SkillInstance,
  target: Enemy,
  enemies: Enemy[],
  base: number,
): Projectile[] {
  const { id, level } = skill;
  const d = dist(player.pos, target.pos);

  switch (id) {
    case 'pistol': {
      if (d > (SKILL_RANGES.pistol ?? ATTACK_RANGE)) return [];
      return [makeProjectile(player.pos, target.pos, base * (1 + level * 0.25), 5, 450)];
    }

    case 'shotgun': {
      if (d > (SKILL_RANGES.shotgun ?? ATTACK_RANGE)) return [];
      const count = 3 + level;
      const spread = Math.PI / 6;
      const baseAngle = Math.atan2(target.pos.y - player.pos.y, target.pos.x - player.pos.x);
      return Array.from({ length: count }, (_, i) => {
        const angle = baseAngle + (i / (count - 1) - 0.5) * spread;
        return makeProjectileDir(player.pos, { x: Math.cos(angle), y: Math.sin(angle) },
          base * 0.7 * (1 + level * 0.15), 4, 380);
      });
    }

    case 'flamethrower': {
      if (d > (SKILL_RANGES.flamethrower ?? ATTACK_RANGE)) return [];
      const count = 2 + level;
      const baseAngle = Math.atan2(target.pos.y - player.pos.y, target.pos.x - player.pos.x);
      return Array.from({ length: Math.min(count, 6) }, (_, i) => {
        const jitter = (Math.random() - 0.5) * (Math.PI / 8);
        const angle = baseAngle + jitter;
        return makeProjectileDir(player.pos, { x: Math.cos(angle), y: Math.sin(angle) },
          base * 0.4 * (1 + level * 0.1), 3, 520);
      });
    }

    case 'grenade': {
      if (d > (SKILL_RANGES.grenade ?? ATTACK_RANGE)) return [];
      return [makeProjectile(player.pos, target.pos, base * 2.5 * (1 + level * 0.3), 14, 280)];
    }

    case 'lightning': {
      if (d > (SKILL_RANGES.lightning ?? ATTACK_RANGE)) return [];
      // Hits target + up to level additional nearby enemies
      const chainTargets = [
        target,
        ...enemies
          .filter(e => e.id !== target.id)
          .sort((a, b) => dist(player.pos, a.pos) - dist(player.pos, b.pos))
          .slice(0, level),
      ];
      return chainTargets.map(t =>
        makeProjectile(player.pos, t.pos, base * 0.9 * (1 + level * 0.15), 6, 620)
      );
    }

    default:
      return [];
  }
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

  // Calculate effective radius and damage based on skills
  let effectiveRadius = player.skills.length === 0 ? MELEE_RADIUS : 0;
  let dmgMult = 1;
  let lifestealLevel = 0;

  for (const skill of player.skills) {
    switch (skill.id) {
      case 'spin_slash':
        effectiveRadius = Math.max(effectiveRadius, MELEE_RADIUS * (1 + skill.level * 0.3));
        dmgMult += 0.2 * skill.level;
        break;
      case 'dash_slash':
        effectiveRadius = Math.max(effectiveRadius, MELEE_RADIUS * 0.7);
        dmgMult += 0.25 * skill.level;
        break;
      case 'shockwave':
        effectiveRadius = Math.max(effectiveRadius, MELEE_RADIUS * (1.5 + skill.level * 0.3));
        break;
      case 'lifesteal':
        effectiveRadius = Math.max(effectiveRadius, MELEE_RADIUS);
        lifestealLevel = skill.level;
        break;
      case 'shield_bash':
        effectiveRadius = Math.max(effectiveRadius, MELEE_RADIUS * (1 + skill.level * 0.2));
        dmgMult += 0.1 * skill.level;
        break;
    }
  }

  const damage = baseDamage(player) * dmgMult;
  let killed = 0;
  let totalDmg = 0;

  const updatedEnemies = enemies.map(enemy => {
    const d = dist(player.pos, enemy.pos);
    if (d <= effectiveRadius + enemy.radius) {
      const actualDmg = Math.min(enemy.hp, damage);
      totalDmg += actualDmg;
      const newHp = enemy.hp - damage;
      if (newHp <= 0) killed++;
      return { ...enemy, hp: Math.max(0, newHp) };
    }
    return enemy;
  });

  // Lifesteal: recover HP proportional to damage dealt
  const heal = lifestealLevel > 0 ? Math.floor(totalDmg * 0.15 * lifestealLevel) : 0;
  const newPlayerHp = Math.min(player.maxHp, player.hp + heal);

  return {
    enemies: updatedEnemies.filter(e => e.hp > 0),
    projectile: null,
    updatedPlayer: {
      ...player,
      hp: newPlayerHp,
      attackCooldownUntil: now + effectiveInterval(player),
    },
    killed,
  };
}

function makeProjectile(from: { x: number; y: number }, to: { x: number; y: number }, damage: number, radius: number, speed: number): Projectile {
  const dx = to.x - from.x;
  const dy = to.y - from.y;
  const len = Math.sqrt(dx * dx + dy * dy) || 1;
  return { id: nanoid(), pos: { x: from.x, y: from.y }, vel: { x: (dx / len) * speed, y: (dy / len) * speed }, damage, radius };
}

function makeProjectileDir(from: { x: number; y: number }, dir: { x: number; y: number }, damage: number, radius: number, speed: number): Projectile {
  return { id: nanoid(), pos: { x: from.x, y: from.y }, vel: { x: dir.x * speed, y: dir.y * speed }, damage, radius };
}

function dist(a: { x: number; y: number }, b: { x: number; y: number }): number {
  return Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2);
}

function baseDamage(player: Player): number {
  return 10 + (player.level - 1) * 3;
}

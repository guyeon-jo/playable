import { describe, it, expect } from 'vitest';
import {
  findNearestEnemy, tryFireProjectile, tryFireProjectiles, updateProjectiles, applyProjectileDamage,
  applyMeleeAttack, GUNNER_SKILLS, SWORDSMAN_SKILLS,
} from './weapons';
import type { Enemy, Player, Projectile } from '@/types/game';
import { createPlayer } from './entities';
import { nanoid } from 'nanoid';

const makeEnemy = (x: number, y: number, hp = 30): Enemy => ({
  id: nanoid(), pos: { x, y }, vel: { x: 0, y: 0 },
  radius: 16, hp, maxHp: hp,
  type: 'normal', damage: 10, expDrop: 5, speed: 60,
});

describe('findNearestEnemy', () => {
  it('플레이어에서 가장 가까운 적을 반환한다', () => {
    const playerPos = { x: 0, y: 0 };
    const near = makeEnemy(100, 0);
    const far  = makeEnemy(500, 0);
    const result = findNearestEnemy(playerPos, [far, near]);
    expect(result?.id).toBe(near.id);
  });

  it('적이 없으면 null을 반환한다', () => {
    expect(findNearestEnemy({ x: 0, y: 0 }, [])).toBeNull();
  });
});

describe('tryFireProjectile', () => {
  it('쿨다운이 지났고 범위 안에 적이 있으면 투사체가 생성된다', () => {
    const player: Player = { ...createPlayer('gunner'), attackCooldownUntil: 0 };
    const enemy = makeEnemy(player.pos.x + 100, player.pos.y); // within ATTACK_RANGE(300)
    const result = tryFireProjectile(player, [enemy], 1000);
    expect(result.projectile).not.toBeNull();
  });

  it('쿨다운 내에는 투사체가 생성되지 않는다', () => {
    const player: Player = { ...createPlayer('gunner'), attackCooldownUntil: 9999 };
    const enemy = makeEnemy(player.pos.x + 100, player.pos.y);
    const result = tryFireProjectile(player, [enemy], 1000);
    expect(result.projectile).toBeNull();
  });
});

describe('tryFireProjectiles (스킬 기반)', () => {
  it('산탄총 스킬: 복수 투사체가 생성된다', () => {
    const player: Player = {
      ...createPlayer('gunner'),
      attackCooldownUntil: 0,
      skills: [{ id: 'shotgun', level: 1 }],
    };
    const enemy = makeEnemy(player.pos.x + 100, player.pos.y);
    const { projectiles } = tryFireProjectiles(player, [enemy], 1000);
    expect(projectiles.length).toBeGreaterThan(1);
  });

  it('수류탄 스킬: 큰 반경의 투사체가 생성된다', () => {
    const player: Player = {
      ...createPlayer('gunner'),
      attackCooldownUntil: 0,
      skills: [{ id: 'grenade', level: 1 }],
    };
    const enemy = makeEnemy(player.pos.x + 100, player.pos.y);
    const { projectiles } = tryFireProjectiles(player, [enemy], 1000);
    expect(projectiles[0].radius).toBeGreaterThan(10);
  });

  it('화염방사기 스킬: 범위 외 적에게는 발사하지 않는다', () => {
    const player: Player = {
      ...createPlayer('gunner'),
      attackCooldownUntil: 0,
      skills: [{ id: 'flamethrower', level: 1 }],
    };
    // Flamethrower range ~45% of ATTACK_RANGE(300) = ~135px; enemy at 200px
    const enemy = makeEnemy(player.pos.x + 200, player.pos.y);
    const { projectiles } = tryFireProjectiles(player, [enemy], 1000);
    expect(projectiles).toHaveLength(0);
  });
});

describe('applyProjectileDamage', () => {
  it('투사체가 적과 겹치면 적 hp가 감소한다', () => {
    const enemy = makeEnemy(0, 0);
    const proj: Projectile = { id: nanoid(), pos: { x: 0, y: 0 }, vel: { x: 0, y: 0 }, damage: 10, radius: 5 };
    const { enemies, projectiles } = applyProjectileDamage([proj], [enemy]);
    expect(enemies[0].hp).toBe(20);
    expect(projectiles).toHaveLength(0);
  });
});

describe('applyMeleeAttack (검사)', () => {
  it('근접 반경 안의 적 전체 hp가 감소한다', () => {
    const player: Player = { ...createPlayer('swordsman'), pos: { x: 0, y: 0 }, attackCooldownUntil: 0 };
    const inRange  = makeEnemy(50, 0);
    const outRange = makeEnemy(500, 0);
    const { enemies } = applyMeleeAttack(player, [inRange, outRange], 1000);
    expect(enemies[0].hp).toBeLessThan(inRange.hp);
    expect(enemies[1].hp).toBe(outRange.hp);
  });

  it('검사는 투사체가 생성되지 않는다', () => {
    const player: Player = { ...createPlayer('swordsman'), pos: { x: 0, y: 0 }, attackCooldownUntil: 0 };
    const { projectile } = applyMeleeAttack(player, [makeEnemy(50, 0)], 1000);
    expect(projectile).toBeNull();
  });
});

describe('GUNNER_SKILLS / SWORDSMAN_SKILLS', () => {
  it('총잡이 스킬은 모두 character=gunner이다', () => {
    expect(GUNNER_SKILLS.every(s => s.character === 'gunner')).toBe(true);
  });

  it('검사 스킬은 모두 character=swordsman이다', () => {
    expect(SWORDSMAN_SKILLS.every(s => s.character === 'swordsman')).toBe(true);
  });
});

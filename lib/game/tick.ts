import type { GameState, SkillId } from '@/types/game';
import { applyMovement, calcCamera, collectExpOrbs, spawnExpOrb } from './entities';
import { updateEnemies } from './enemies';
import { applyEnemyDamage } from './physics';
import { tryFireProjectiles, updateProjectiles, applyProjectileDamage, applyMeleeAttack } from './weapons';
import { getSkillCandidates } from './skills';
import { GAME_DURATION_MS } from './constants';
import { getWaveIndex, getWaveConfig } from './spawn';
import { spawnEnemy } from './enemies';

export function gameTick(
  state: GameState,
  dt: number,
  keys: Set<string>,
  now: number,
): GameState {
  // Frozen states: don't advance simulation
  if (state.status === 'levelup' || state.status === 'gameover' || state.status === 'clear') {
    return state;
  }

  let s = { ...state };

  // Timer
  const newElapsed = s.elapsedMs + dt * 1000;
  if (newElapsed >= GAME_DURATION_MS) {
    return { ...s, elapsedMs: GAME_DURATION_MS, status: 'clear' };
  }
  s = { ...s, elapsedMs: newElapsed };

  // Wave index
  s = { ...s, waveIndex: getWaveIndex(s.elapsedMs) };

  // Spawn enemies
  const waveConfig = getWaveConfig(s.waveIndex);
  if (now - s.lastSpawnAt >= waveConfig.spawnInterval && s.enemies.length < waveConfig.maxEnemies) {
    const type = pickEnemyType(s.waveIndex);
    s = { ...s, enemies: [...s.enemies, spawnEnemy(type, s.player.pos)], lastSpawnAt: now };
  }

  // Player movement
  const movedPlayer = applyMovement(s.player, keys, dt);
  s = { ...s, player: movedPlayer, camera: calcCamera(movedPlayer.pos) };

  // Enemy movement
  s = { ...s, enemies: updateEnemies(s.enemies, s.player.pos, dt) };

  // Attack
  if (s.player.character === 'gunner') {
    const { projectiles: newProjs, updatedPlayer } = tryFireProjectiles(s.player, s.enemies, now);
    if (newProjs.length > 0) {
      s = { ...s, player: updatedPlayer, projectiles: [...s.projectiles, ...newProjs] };
    }
  } else {
    const beforeEnemies = s.enemies;
    const { enemies: afterMelee, updatedPlayer, killed } = applyMeleeAttack(s.player, s.enemies, now);
    s = { ...s, player: updatedPlayer, enemies: afterMelee, killCount: s.killCount + killed };
    if (killed > 0) {
      const afterIds = new Set(afterMelee.map(e => e.id));
      const deadEnemies = beforeEnemies.filter(e => !afterIds.has(e.id));
      const orbs = deadEnemies.map(e => spawnExpOrb(e.pos, e.expDrop));
      s = { ...s, expOrbs: [...s.expOrbs, ...orbs] };
    }
  }

  // Projectile update + damage
  s = { ...s, projectiles: updateProjectiles(s.projectiles, dt) };
  const { projectiles, enemies: afterDmg, killed } = applyProjectileDamage(s.projectiles, s.enemies);
  if (killed > 0) {
    const deadEnemies = s.enemies.filter(e => !afterDmg.find(a => a.id === e.id));
    const orbs = deadEnemies.map(e => spawnExpOrb(e.pos, e.expDrop));
    s = { ...s, expOrbs: [...s.expOrbs, ...orbs] };
  }
  s = { ...s, projectiles, enemies: afterDmg, killCount: s.killCount + killed };

  // EXP collection
  s = collectExpOrbs(s);
  if (s.status === 'levelup') {
    const candidates = getSkillCandidates(s.player);
    return { ...s, pendingSkillCandidates: candidates };
  }

  // Enemy damage to player
  s = applyEnemyDamage(s, now);

  return s;
}

export function applySkillChoice(state: GameState, skillId: SkillId): GameState {
  const { player } = state;
  const existing = player.skills.find(s => s.id === skillId);
  const newSkills = existing
    ? player.skills.map(s => s.id === skillId ? { ...s, level: s.level + 1 } : s)
    : [...player.skills, { id: skillId, level: 1 }];

  return {
    ...state,
    status: 'playing',
    player: { ...player, level: player.level + 1, exp: 0, skills: newSkills },
    pendingSkillCandidates: [],
  };
}

function pickEnemyType(waveIndex: number): 'normal' | 'fast' | 'tank' {
  const r = Math.random();
  if (waveIndex < 3) return r < 0.8 ? 'normal' : 'fast';
  if (waveIndex < 6) return r < 0.6 ? 'normal' : r < 0.9 ? 'fast' : 'tank';
  return r < 0.4 ? 'normal' : r < 0.75 ? 'fast' : 'tank';
}

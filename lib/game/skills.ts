import type { Player, SkillDef } from '@/types/game';
import { GUNNER_SKILLS, SWORDSMAN_SKILLS } from './weapons';

export const MAX_SKILLS = 4;

export function getSkillCandidates(player: Player): SkillDef[] {
  const pool = player.character === 'gunner' ? GUNNER_SKILLS : SWORDSMAN_SKILLS;
  const uniqueCount = player.skills.length;

  const available = pool.filter(def => {
    const owned = player.skills.find(s => s.id === def.id);
    if (owned) return owned.level < def.maxLevel;
    return uniqueCount < MAX_SKILLS;
  });

  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

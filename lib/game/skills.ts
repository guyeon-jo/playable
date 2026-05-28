import type { Player, SkillDef } from '@/types/game';
import { GUNNER_SKILLS, SWORDSMAN_SKILLS } from './weapons';

export function getSkillCandidates(player: Player): SkillDef[] {
  const pool = player.character === 'gunner' ? GUNNER_SKILLS : SWORDSMAN_SKILLS;

  const available = pool.filter(def => {
    const owned = player.skills.find(s => s.id === def.id);
    return !owned || owned.level < def.maxLevel;
  });

  const shuffled = [...available].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, 3);
}

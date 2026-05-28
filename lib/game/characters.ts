import type { CharacterType } from '@/types/game';

export interface CharacterDef {
  type: CharacterType;
  name: string;
  description: string;
  hp: number;
  speed: number;
  speedStars: number;
  hpStars: number;
}

export const CHARACTER_DEFS: Record<CharacterType, CharacterDef> = {
  gunner: {
    type: 'gunner',
    name: '총잡이',
    description: '원거리 자동 공격',
    hp: 100,
    speed: 200,
    speedStars: 3,
    hpStars: 3,
  },
  swordsman: {
    type: 'swordsman',
    name: '검사',
    description: '근접 범위 자동 공격',
    hp: 120,
    speed: 260,
    speedStars: 5,
    hpStars: 5,
  },
};

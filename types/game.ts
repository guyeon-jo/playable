export type CharacterType = 'gunner' | 'swordsman';
export type EnemyType = 'normal' | 'fast' | 'tank';
export type GameStatus = 'playing' | 'levelup' | 'gameover' | 'clear';

export type SkillId =
  | 'pistol' | 'shotgun' | 'flamethrower' | 'grenade' | 'lightning'
  | 'spin_slash' | 'dash_slash' | 'shockwave' | 'lifesteal' | 'shield_bash';

export interface Vec2 {
  x: number;
  y: number;
}

export interface Entity {
  id: string;
  pos: Vec2;
  vel: Vec2;
  radius: number;
  hp: number;
  maxHp: number;
}

export interface SkillInstance {
  id: SkillId;
  level: number;
}

export interface Player extends Entity {
  character: CharacterType;
  exp: number;
  level: number;
  skills: SkillInstance[];
  invincibleUntil: number;
  attackCooldownUntil: number;
}

export interface Enemy extends Entity {
  type: EnemyType;
  damage: number;
  expDrop: number;
  speed: number;
}

export interface Projectile {
  id: string;
  pos: Vec2;
  vel: Vec2;
  damage: number;
  radius: number;
}

export interface ExpOrb {
  id: string;
  pos: Vec2;
  value: number;
}

export interface SkillDef {
  id: SkillId;
  name: string;
  description: string;
  character: CharacterType;
  maxLevel: number;
}

export interface GameState {
  status: GameStatus;
  player: Player;
  enemies: Enemy[];
  projectiles: Projectile[];
  expOrbs: ExpOrb[];
  camera: Vec2;
  elapsedMs: number;
  killCount: number;
  waveIndex: number;
  lastSpawnAt: number;
  pendingSkillCandidates: SkillDef[];
}

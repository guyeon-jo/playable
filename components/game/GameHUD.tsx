'use client';

import { ALL_SKILLS } from '@/lib/game/weapons';
import type { SkillInstance } from '@/types/game';

interface Props {
  remainingMs: number;
  hp: number;
  maxHp: number;
  level: number;
  exp: number;
  expThreshold: number;
  skills: SkillInstance[];
}

const MAX_SKILL_SLOTS = 4;

function formatTime(ms: number): string {
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function GameHUD({ remainingMs, hp, maxHp, level, exp, expThreshold, skills }: Props) {
  const hpPct = maxHp > 0 ? (hp / maxHp) * 100 : 0;
  const expPct = expThreshold > 0 ? (exp / expThreshold) * 100 : 0;

  return (
    <div style={{ width: '100%', maxWidth: '100vh', background: '#111', padding: '6px 12px', display: 'flex', alignItems: 'center', gap: 12, color: '#eee', fontSize: 13 }}>
      {/* HP */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1 }}>
        <span style={{ fontSize: 11, color: '#aaa', whiteSpace: 'nowrap' }}>HP</span>
        <div style={{ flex: 1, height: 10, background: '#333', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${hpPct}%`, height: '100%', background: '#ff4444', transition: 'width 0.1s' }} />
        </div>
        <span style={{ fontSize: 11, color: '#aaa', whiteSpace: 'nowrap' }}>{hp}/{maxHp}</span>
      </div>

      {/* Timer */}
      <div style={{ fontSize: 20, fontWeight: 'bold', letterSpacing: '0.05em', minWidth: 60, textAlign: 'center' }}>
        {formatTime(remainingMs)}
      </div>

      {/* Level + EXP */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flex: 1, justifyContent: 'flex-end' }}>
        <span style={{ fontSize: 11, fontWeight: 'bold', whiteSpace: 'nowrap' }}>LV.{level}</span>
        <div style={{ width: 100, height: 10, background: '#333', borderRadius: 2, overflow: 'hidden' }}>
          <div style={{ width: `${expPct}%`, height: '100%', background: '#7ec8e3', transition: 'width 0.1s' }} />
        </div>
      </div>

      {/* Skills */}
      <div style={{ display: 'flex', gap: 4, marginLeft: 8 }}>
        {Array.from({ length: MAX_SKILL_SLOTS }).map((_, i) => {
          const skill = skills[i];
          if (!skill) {
            return (
              <div key={i} data-empty="true" style={{ width: 56, height: 32, border: '1px dashed #444', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ color: '#555', fontSize: 11 }}>—</span>
              </div>
            );
          }
          const def = ALL_SKILLS.find(s => s.id === skill.id);
          return (
            <div key={skill.id} style={{ width: 56, height: 32, border: '1px solid #666', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, textAlign: 'center', padding: '0 2px' }}>
              {def?.name ?? skill.id}
              {skill.level > 1 && <span style={{ color: '#aaa', marginLeft: 2 }}>L{skill.level}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}

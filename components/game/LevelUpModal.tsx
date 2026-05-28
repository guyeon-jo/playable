'use client';

import type { SkillDef, SkillId, Player } from '@/types/game';

interface Props {
  candidates: SkillDef[];
  player: Player;
  onSelect: (id: SkillId) => void;
}

export function LevelUpModal({ candidates, player, onSelect }: Props) {
  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)',
      display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', zIndex: 20,
    }}>
      <div style={{ color: '#fff', fontSize: 22, fontWeight: 'bold', marginBottom: 24, letterSpacing: '0.08em' }}>
        LEVEL UP!  LV.{player.level + 1}
      </div>
      <div style={{ display: 'flex', gap: 16 }}>
        {candidates.map(def => {
          const owned = player.skills.find(s => s.id === def.id);
          const isUpgrade = !!owned;
          return (
            <button
              key={def.id}
              onClick={() => onSelect(def.id)}
              style={{
                width: 160, minHeight: 120, background: '#1e1e2e',
                border: `1px solid ${isUpgrade ? '#7ec8e3' : '#555'}`,
                borderRadius: 4, color: '#eee', cursor: 'pointer',
                padding: 16, textAlign: 'left', display: 'flex', flexDirection: 'column', gap: 8,
              }}
            >
              <div style={{ fontWeight: 'bold', fontSize: 14 }}>
                {def.name}
                {isUpgrade && (
                  <span style={{ fontSize: 11, color: '#7ec8e3', marginLeft: 8 }}>
                    Lv.{owned!.level}→{owned!.level + 1}
                  </span>
                )}
              </div>
              <div style={{ fontSize: 12, color: '#aaa' }}>{def.description}</div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

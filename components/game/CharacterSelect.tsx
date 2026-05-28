'use client';

import type { CharacterType } from '@/types/game';
import { CHARACTER_DEFS } from '@/lib/game/characters';

interface Props {
  unlocked: boolean;
  onSelect: (type: CharacterType) => void;
}

function Stars({ count, total = 5 }: { count: number; total?: number }) {
  return (
    <span>
      {'★'.repeat(count)}{'☆'.repeat(total - count)}
    </span>
  );
}

export function CharacterSelect({ unlocked, onSelect }: Props) {
  const chars = [CHARACTER_DEFS.gunner, CHARACTER_DEFS.swordsman];

  return (
    <div style={{ minHeight: '100vh', background: '#0d0d0d', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', color: '#eee', fontFamily: 'monospace' }}>
      <h1 style={{ fontSize: 32, fontWeight: 'bold', letterSpacing: '0.1em', marginBottom: 8 }}>ZOMBIE SURVIVORS</h1>
      <p style={{ color: '#aaa', fontSize: 14, marginBottom: 40 }}>캐릭터를 선택하세요</p>

      <div style={{ display: 'flex', gap: 24 }}>
        {chars.map(char => {
          const isLocked = char.type === 'swordsman' && !unlocked;
          return (
            <div
              key={char.type}
              data-locked={isLocked ? 'true' : undefined}
              onClick={() => !isLocked && onSelect(char.type)}
              style={{
                width: 200, border: `2px solid ${isLocked ? '#333' : '#555'}`,
                background: '#1a1a1a', padding: 20, textAlign: 'center',
                cursor: isLocked ? 'default' : 'pointer',
                opacity: isLocked ? 0.55 : 1,
                borderRadius: 4,
                transition: 'border-color 0.2s',
              }}
            >
              {/* Character sprite */}
              <div style={{
                width: 72, height: 72, margin: '0 auto 12px',
                backgroundImage: 'url(/zombie-characters.png)',
                backgroundSize: '288px 432px',
                backgroundPosition: char.type === 'gunner' ? '0px 0px' : '-144px 0px',
                imageRendering: 'pixelated',
                borderRadius: 4,
                position: 'relative',
                filter: isLocked ? 'grayscale(1) brightness(0.4)' : 'none',
              }}>
                {isLocked && (
                  <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🔒</div>
                )}
              </div>

              <div style={{ fontWeight: 'bold', fontSize: 16, marginBottom: 4 }}>{char.name}</div>
              <div style={{ fontSize: 12, color: '#aaa', marginBottom: 12 }}>{char.description}</div>

              <div style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                <span style={{ color: '#888' }}>이동속도</span>
                <Stars count={char.speedStars} />
              </div>
              <div style={{ fontSize: 12, display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <span style={{ color: '#888' }}>체력</span>
                <Stars count={char.hpStars} />
              </div>

              {isLocked ? (
                <div style={{ fontSize: 12, color: '#666' }}>첫 플레이 후 해금</div>
              ) : (
                <button
                  onClick={e => { e.stopPropagation(); onSelect(char.type); }}
                  style={{ padding: '8px 20px', background: '#eee', color: '#111', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit', borderRadius: 2, width: '100%' }}
                >
                  선택
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

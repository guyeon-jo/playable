'use client';

import { useEffect, useState } from 'react';

interface Props {
  onStart: () => void;
}

export function TitleScreen({ onStart }: Props) {
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const interval = setInterval(() => setBlink(b => !b), 600);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Enter' || e.key === ' ') onStart();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onStart]);

  return (
    <div
      onClick={onStart}
      style={{
        minHeight: '100vh',
        background: '#0d0d0d',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        color: '#eee',
        fontFamily: 'monospace',
        cursor: 'pointer',
        userSelect: 'none',
      }}
    >
      {/* 좀비 장식 */}
      <div style={{ fontSize: 48, marginBottom: 16, letterSpacing: '0.3em' }}>🧟‍♂️🧟‍♀️🧟</div>

      <h1 style={{
        fontSize: 48,
        fontWeight: 'bold',
        letterSpacing: '0.15em',
        margin: 0,
        color: '#ff4444',
        textShadow: '0 0 20px rgba(255,68,68,0.6), 0 0 40px rgba(255,68,68,0.3)',
      }}>
        ZOMBIE
      </h1>
      <h1 style={{
        fontSize: 48,
        fontWeight: 'bold',
        letterSpacing: '0.15em',
        margin: '0 0 8px',
        color: '#eee',
        textShadow: '0 0 20px rgba(255,255,255,0.2)',
      }}>
        SURVIVORS
      </h1>

      <p style={{ color: '#666', fontSize: 12, marginBottom: 60, letterSpacing: '0.05em' }}>
        ── 살아남아라 ──
      </p>

      <p style={{
        fontSize: 16,
        color: blink ? '#eee' : 'transparent',
        letterSpacing: '0.1em',
        transition: 'color 0.1s',
      }}>
        PRESS ANY KEY
      </p>

      <p style={{ position: 'absolute', bottom: 24, color: '#444', fontSize: 11, letterSpacing: '0.05em' }}>
        ENTER · SPACE · CLICK
      </p>
    </div>
  );
}

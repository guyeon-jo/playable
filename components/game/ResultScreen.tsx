'use client';

interface Props {
  status: 'gameover' | 'clear';
  survivalMs: number;
  killCount: number;
  level: number;
  firstPlay: boolean;
  onRestart: () => void;
  onCharacterSelect: () => void;
}

function formatTime(ms: number): string {
  const sec = Math.floor(ms / 1000);
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

export function ResultScreen({ status, survivalMs, killCount, level, firstPlay, onRestart, onCharacterSelect }: Props) {
  const isGameover = status === 'gameover';

  return (
    <div style={{
      position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.88)',
      display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 30,
    }}>
      <div style={{ background: '#111', border: '1px solid #444', padding: 40, maxWidth: 480, width: '100%', color: '#eee' }}>
        <div style={{ textAlign: 'center', marginBottom: 24 }}>
          <h1 style={{ fontSize: 36, fontWeight: 'bold', letterSpacing: '0.1em', margin: 0 }}>
            {isGameover ? 'GAME OVER' : 'CLEAR!'}
          </h1>
          <p style={{ color: '#aaa', fontSize: 13, marginTop: 6 }}>
            {isGameover ? '좀비에게 쓰러졌습니다' : '생존 성공! 5분을 버텼습니다'}
          </p>
        </div>

        {firstPlay && (
          <div style={{ border: '2px dashed #7ec8e3', padding: '10px 16px', textAlign: 'center', marginBottom: 20, borderRadius: 4 }}>
            <span style={{ fontSize: 15, fontWeight: 'bold' }}>⭐ 검사 해금!</span>
            <p style={{ fontSize: 12, color: '#aaa', margin: '4px 0 0' }}>캐릭터 선택에서 검사를 고를 수 있습니다</p>
          </div>
        )}

        <div style={{ border: '1px dashed #333', marginBottom: 24 }}>
          {isGameover && (
            <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid #222' }}>
              <span style={{ fontSize: 13, color: '#aaa' }}>생존 시간</span>
              <span style={{ fontWeight: 'bold' }}>{formatTime(survivalMs)}</span>
            </div>
          )}
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px', borderBottom: '1px solid #222' }}>
            <span style={{ fontSize: 13, color: '#aaa' }}>처치한 좀비</span>
            <span style={{ fontWeight: 'bold' }}>{killCount}마리</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 16px' }}>
            <span style={{ fontSize: 13, color: '#aaa' }}>달성 레벨</span>
            <span style={{ fontWeight: 'bold' }}>{level}</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
          <button onClick={onRestart} style={{ padding: '8px 24px', background: '#eee', color: '#111', border: 'none', cursor: 'pointer', fontWeight: 'bold', fontFamily: 'inherit' }}>
            다시 시작
          </button>
          <button onClick={onCharacterSelect} style={{ padding: '8px 24px', background: 'transparent', color: '#eee', border: '1px solid #555', cursor: 'pointer', fontFamily: 'inherit' }}>
            캐릭터 선택으로
          </button>
        </div>
      </div>
    </div>
  );
}

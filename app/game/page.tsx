'use client';

import { useState, useCallback, useRef } from 'react';
import dynamic from 'next/dynamic';
import type { CharacterType, GameState, SkillId } from '@/types/game';
import { createPlayer } from '@/lib/game/entities';
import { calcCamera } from '@/lib/game/entities';
import { gameTick, applySkillChoice } from '@/lib/game/tick';
import { getSkillCandidates } from '@/lib/game/skills';
import { GAME_DURATION_MS } from '@/lib/game/constants';
import { expThreshold } from '@/lib/game/entities';
import { CharacterSelect } from '@/components/game/CharacterSelect';
import { TitleScreen } from '@/components/game/TitleScreen';
import { GameHUD } from '@/components/game/GameHUD';
import { LevelUpModal } from '@/components/game/LevelUpModal';
import { ResultScreen } from '@/components/game/ResultScreen';
import { useUnlock } from '@/hooks/useUnlock';
import { ALL_SKILLS } from '@/lib/game/weapons';

const GameCanvas = dynamic(
  () => import('@/components/game/GameCanvas').then(m => ({ default: m.GameCanvas })),
  { ssr: false },
);

type Screen = 'title' | 'characterSelect' | 'playing';

function makeInitialState(character: CharacterType): GameState {
  const player = createPlayer(character);
  return {
    status: 'playing',
    player,
    enemies: [],
    projectiles: [],
    expOrbs: [],
    camera: calcCamera(player.pos),
    elapsedMs: 0,
    killCount: 0,
    waveIndex: 0,
    lastSpawnAt: 0,
    pendingSkillCandidates: [],
  };
}

export default function GamePage() {
  const { unlocked, unlock } = useUnlock();
  const [screen, setScreen] = useState<Screen>('title');
  const [character, setCharacter] = useState<CharacterType>('gunner');

  // React UI state — only what HUD/overlays need
  const [hudState, setHudState] = useState({
    remainingMs: GAME_DURATION_MS,
    hp: 100, maxHp: 100,
    level: 1, exp: 0, expThreshold: expThreshold(1),
    skills: [] as GameState['player']['skills'],
    status: 'playing' as GameState['status'],
    killCount: 0,
    survivalMs: 0,
  });

  const initialStateRef = useRef<GameState | null>(null);
  const gameStateRef = useRef<GameState>(makeInitialState('gunner'));
  const keysRef = useRef<Set<string>>(new Set());
  const firstPlayRef = useRef(true);

  const handleSelectCharacter = useCallback((type: CharacterType) => {
    setCharacter(type);
    const state = makeInitialState(type);
    gameStateRef.current = state;
    initialStateRef.current = state;
    setHudState({
      remainingMs: GAME_DURATION_MS,
      hp: state.player.hp,
      maxHp: state.player.maxHp,
      level: 1, exp: 0, expThreshold: expThreshold(1),
      skills: [],
      status: 'playing',
      killCount: 0,
      survivalMs: 0,
    });
    setScreen('playing');
  }, []);

  const handleTick = useCallback((state: GameState, dt: number, keys: Set<string>): GameState => {
    const next = gameTick(state, dt, keys, Date.now());

    // Sync UI state on significant changes only
    const hpChanged = next.player.hp !== state.player.hp;
    const levelChanged = next.player.level !== state.player.level;
    const statusChanged = next.status !== state.status;
    const killChanged = next.killCount !== state.killCount;

    if (hpChanged || levelChanged || statusChanged || killChanged || next.elapsedMs % 1000 < dt * 1000 + 50) {
      const remaining = Math.max(0, GAME_DURATION_MS - next.elapsedMs);

      if ((next.status === 'gameover' || next.status === 'clear') && firstPlayRef.current) {
        firstPlayRef.current = false;
        unlock();
      }

      setHudState({
        remainingMs: remaining,
        hp: next.player.hp,
        maxHp: next.player.maxHp,
        level: next.player.level,
        exp: next.player.exp,
        expThreshold: expThreshold(next.player.level),
        skills: next.player.skills,
        status: next.status,
        killCount: next.killCount,
        survivalMs: next.elapsedMs,
      });
    }

    return next;
  }, [unlock]);

  const handleSkillSelect = useCallback((skillId: SkillId) => {
    const current = gameStateRef.current;
    const updated = applySkillChoice(current, skillId);
    gameStateRef.current = updated;
    setHudState(prev => ({
      ...prev,
      status: 'playing',
      level: updated.player.level,
      exp: 0,
      expThreshold: expThreshold(updated.player.level),
      skills: updated.player.skills,
    }));
  }, []);

  const handleRestart = useCallback(() => {
    firstPlayRef.current = false;
    const state = makeInitialState(character);
    gameStateRef.current = state;
    setHudState({
      remainingMs: GAME_DURATION_MS,
      hp: state.player.hp,
      maxHp: state.player.maxHp,
      level: 1, exp: 0, expThreshold: expThreshold(1),
      skills: [],
      status: 'playing',
      killCount: 0,
      survivalMs: 0,
    });
  }, [character]);

  const handleGoToCharacterSelect = useCallback(() => {
    firstPlayRef.current = false;
    setScreen('characterSelect');
  }, []);

  if (screen === 'title') {
    return <TitleScreen onStart={() => setScreen('characterSelect')} />;
  }

  if (screen === 'characterSelect') {
    return <CharacterSelect unlocked={unlocked} onSelect={handleSelectCharacter} />;
  }

  const isResult = hudState.status === 'gameover' || hudState.status === 'clear';
  const isLevelUp = hudState.status === 'levelup';

  return (
    <div style={{ width: '100vw', height: '100vh', background: '#0d0d0d', userSelect: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', overflow: 'hidden' }}>
      <GameHUD
        remainingMs={hudState.remainingMs}
        hp={hudState.hp}
        maxHp={hudState.maxHp}
        level={hudState.level}
        exp={hudState.exp}
        expThreshold={hudState.expThreshold}
        skills={hudState.skills}
      />

      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: 0, width: '100%' }}>
        <div style={{ position: 'relative', height: '100%', aspectRatio: '1 / 1', maxWidth: '100%' }}>
          <GameCanvas
            gameStateRef={gameStateRef}
            keysRef={keysRef}
            onTick={handleTick}
          />

          {isLevelUp && gameStateRef.current.pendingSkillCandidates.length > 0 && (
            <LevelUpModal
              candidates={gameStateRef.current.pendingSkillCandidates}
              player={gameStateRef.current.player}
              onSelect={handleSkillSelect}
            />
          )}

          {isResult && (
            <ResultScreen
              status={hudState.status as 'gameover' | 'clear'}
              survivalMs={hudState.survivalMs}
              killCount={hudState.killCount}
              level={hudState.level}
              firstPlay={!unlocked}
              onRestart={handleRestart}
              onCharacterSelect={handleGoToCharacterSelect}
            />
          )}
        </div>
      </div>
    </div>
  );
}

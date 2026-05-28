'use client';

import { useRef, useCallback } from 'react';
import type { GameState } from '@/types/game';

export type TickFn = (state: GameState, dt: number, keys: Set<string>) => GameState;

export function useGameLoop(onTick: TickFn) {
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const gameStateRef = useRef<GameState | null>(null);
  const keysRef = useRef<Set<string>>(new Set());

  const start = useCallback((initialState: GameState) => {
    gameStateRef.current = initialState;

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key);
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const tick = (time: number) => {
      const dt = Math.min((time - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = time;

      if (gameStateRef.current) {
        gameStateRef.current = onTick(gameStateRef.current, dt, keysRef.current);
      }

      rafRef.current = requestAnimationFrame(tick);
    };

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [onTick]);

  return { start, gameStateRef, keysRef };
}

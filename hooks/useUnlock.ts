'use client';

import { useState, useEffect, useCallback } from 'react';

const KEY = 'zs:unlocked:v1';

export function isUnlocked(): boolean {
  try { return localStorage.getItem(KEY) === 'true'; }
  catch { return false; }
}

export function setUnlocked(): void {
  try { localStorage.setItem(KEY, 'true'); }
  catch { /* incognito / quota exceeded */ }
}

export function useUnlock() {
  const [unlocked, setUnlockedState] = useState(false);

  useEffect(() => {
    setUnlockedState(isUnlocked());
  }, []);

  const unlock = useCallback(() => {
    setUnlocked();
    setUnlockedState(true);
  }, []);

  return { unlocked, unlock };
}

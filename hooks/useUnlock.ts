'use client';

import { useState, useEffect } from 'react';

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

  const unlock = () => {
    setUnlocked();
    setUnlockedState(true);
  };

  return { unlocked, unlock };
}

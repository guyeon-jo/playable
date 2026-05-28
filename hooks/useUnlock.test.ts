import { describe, it, expect, beforeEach } from 'vitest';
import { isUnlocked, setUnlocked } from './useUnlock';

describe('useUnlock', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('setUnlocked 호출 시 localStorage에 저장된다', () => {
    setUnlocked();
    expect(localStorage.getItem('zs:unlocked:v1')).toBe('true');
  });

  it('저장값이 있으면 isUnlocked가 true를 반환한다', () => {
    setUnlocked();
    expect(isUnlocked()).toBe(true);
  });

  it('저장값이 없으면 isUnlocked가 false를 반환한다', () => {
    expect(isUnlocked()).toBe(false);
  });
});

import { describe, it, expect } from 'vitest';
import { getWaveIndex, getWaveConfig } from './spawn';
import { WAVE_INTERVAL_MS } from './constants';

describe('getWaveIndex', () => {
  it('getWaveIndex(0)이 0을 반환한다', () => {
    expect(getWaveIndex(0)).toBe(0);
  });

  it('getWaveIndex(30000)이 1을 반환한다', () => {
    expect(getWaveIndex(WAVE_INTERVAL_MS)).toBe(1);
  });

  it('최대 9를 초과하지 않는다', () => {
    expect(getWaveIndex(9999999)).toBe(9);
  });
});

describe('getWaveConfig', () => {
  it('waveIndex 9의 spawnInterval이 waveIndex 0보다 작다', () => {
    expect(getWaveConfig(9).spawnInterval).toBeLessThan(getWaveConfig(0).spawnInterval);
  });

  it('waveIndex 9의 maxEnemies가 waveIndex 0보다 크다', () => {
    expect(getWaveConfig(9).maxEnemies).toBeGreaterThan(getWaveConfig(0).maxEnemies);
  });

  it('waveIndex 9의 maxEnemies가 100 이상이다 (불변 규칙 3)', () => {
    expect(getWaveConfig(9).maxEnemies).toBeGreaterThanOrEqual(100);
  });
});

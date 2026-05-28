import { WAVE_INTERVAL_MS, MAX_WAVES } from './constants';

export interface WaveConfig {
  spawnInterval: number;
  maxEnemies: number;
}

export function getWaveIndex(elapsedMs: number): number {
  return Math.min(Math.floor(elapsedMs / WAVE_INTERVAL_MS), MAX_WAVES);
}

export function getWaveConfig(waveIndex: number): WaveConfig {
  const t = Math.min(waveIndex, MAX_WAVES);
  return {
    spawnInterval: Math.max(400, 2000 - t * 180),
    maxEnemies:    20 + t * 15,
  };
}

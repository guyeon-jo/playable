import { describe, it, expect } from 'vitest';
import { createPlayer, applyMovement, clampToMap, calcCamera } from './entities';
import { MAP_W, MAP_H, CANVAS_W, CANVAS_H } from './constants';

describe('createPlayer', () => {
  it('총잡이 기본 HP는 100이다', () => {
    const p = createPlayer('gunner');
    expect(p.maxHp).toBe(100);
    expect(p.hp).toBe(100);
  });

  it('검사 기본 HP는 120이다', () => {
    const p = createPlayer('swordsman');
    expect(p.maxHp).toBe(120);
  });
});

describe('applyMovement', () => {
  it('오른쪽 키 입력 후 pos.x가 증가한다', () => {
    const player = createPlayer('gunner');
    const keys = new Set(['ArrowRight']);
    const moved = applyMovement(player, keys, 0.1);
    expect(moved.pos.x).toBeGreaterThan(player.pos.x);
  });

  it('왼쪽 키 입력 후 pos.x가 감소한다', () => {
    const player = createPlayer('gunner');
    const keys = new Set(['ArrowLeft']);
    const moved = applyMovement(player, keys, 0.1);
    expect(moved.pos.x).toBeLessThan(player.pos.x);
  });
});

describe('clampToMap', () => {
  it('맵 왼쪽 경계에서 x가 더 감소하지 않는다', () => {
    const pos = { x: 0, y: 900 };
    const clamped = clampToMap(pos, 16);
    expect(clamped.x).toBeGreaterThanOrEqual(16);
  });

  it('맵 오른쪽 경계에서 x가 더 증가하지 않는다', () => {
    const pos = { x: MAP_W, y: 900 };
    const clamped = clampToMap(pos, 16);
    expect(clamped.x).toBeLessThanOrEqual(MAP_W - 16);
  });

  it('맵 위쪽 경계에서 y가 더 감소하지 않는다', () => {
    const pos = { x: 1200, y: 0 };
    const clamped = clampToMap(pos, 16);
    expect(clamped.y).toBeGreaterThanOrEqual(16);
  });

  it('맵 아래쪽 경계에서 y가 더 증가하지 않는다', () => {
    const pos = { x: 1200, y: MAP_H };
    const clamped = clampToMap(pos, 16);
    expect(clamped.y).toBeLessThanOrEqual(MAP_H - 16);
  });
});

describe('calcCamera', () => {
  it('카메라가 플레이어 world 좌표를 그대로 반환한다 (렌더러가 CANVAS/2 offset 적용)', () => {
    const playerPos = { x: 500, y: 400 };
    const camera = calcCamera(playerPos);
    // renderer: screenX = worldX - camera.x + CANVAS_W/2 = 500 - 500 + 300 = 300 = CANVAS_W/2 ✓
    expect(camera.x).toBe(500);
    expect(camera.y).toBe(400);
  });
});

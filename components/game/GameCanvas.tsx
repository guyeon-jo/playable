'use client';

import { useRef, useEffect, MutableRefObject, RefObject } from 'react';
import type { GameState, EnemyType } from '@/types/game';
import { CANVAS_W, CANVAS_H, MAP_W, MAP_H } from '@/lib/game/constants';

interface Props {
  gameStateRef: MutableRefObject<GameState>;
  keysRef: RefObject<Set<string>>;
  onTick: (state: GameState, dt: number, keys: Set<string>) => GameState;
}

// ─── Map data ─────────────────────────────────────────────────────────────────

interface MapObject { x: number; y: number; path: string; w: number; h: number }

const MAP_OBJECTS: MapObject[] = [
  // barrels
  { x: 280,  y: 180,  path: '/images/map/barrel_red.png',   w: 48, h: 64 },
  { x: 345,  y: 210,  path: '/images/map/barrel_blue.png',  w: 48, h: 64 },
  { x: 2000, y: 310,  path: '/images/map/barrel_red.png',   w: 48, h: 64 },
  { x: 2110, y: 1490, path: '/images/map/barrel_blue.png',  w: 48, h: 64 },
  { x: 2210, y: 910,  path: '/images/map/barrel_red.png',   w: 48, h: 64 },
  { x: 1050, y: 1600, path: '/images/map/barrel_blue.png',  w: 48, h: 64 },
  // garbage bins
  { x: 600,  y: 390,  path: '/images/map/garbage_bin.png',  w: 87, h: 69 },
  { x: 855,  y: 160,  path: '/images/map/garbage_bin.png',  w: 87, h: 69 },
  { x: 500,  y: 1390, path: '/images/map/garbage_bin.png',  w: 87, h: 69 },
  { x: 1310, y: 1490, path: '/images/map/garbage_bin.png',  w: 87, h: 69 },
  // traffic cones
  { x: 420,  y: 320,  path: '/images/map/traffic_cone.png', w: 36, h: 44 },
  { x: 1200, y: 580,  path: '/images/map/traffic_cone.png', w: 36, h: 44 },
  { x: 1660, y: 250,  path: '/images/map/traffic_cone.png', w: 36, h: 44 },
  { x: 1610, y: 1590, path: '/images/map/traffic_cone.png', w: 36, h: 44 },
  { x: 700,  y: 1100, path: '/images/map/traffic_cone.png', w: 36, h: 44 },
  // tires
  { x: 980,  y: 280,  path: '/images/map/tire.png',         w: 60, h: 52 },
  { x: 1480, y: 890,  path: '/images/map/tire.png',         w: 60, h: 52 },
  { x: 300,  y: 1300, path: '/images/map/tire.png',         w: 60, h: 52 },
  // manholes
  { x: 750,  y: 750,  path: '/images/map/manhole.png',      w: 48, h: 48 },
  { x: 1800, y: 510,  path: '/images/map/manhole.png',      w: 48, h: 48 },
  { x: 1200, y: 1200, path: '/images/map/manhole.png',      w: 48, h: 48 },
  { x: 400,  y: 1600, path: '/images/map/manhole.png',      w: 48, h: 48 },
  // metal plates
  { x: 190,  y: 930,  path: '/images/map/metal_plates.png', w: 69, h: 54 },
  { x: 1100, y: 1190, path: '/images/map/metal_plates.png', w: 69, h: 54 },
  { x: 1850, y: 1400, path: '/images/map/metal_plates.png', w: 69, h: 54 },
  // brick debris
  { x: 500,  y: 600,  path: '/images/map/brick_debris.png', w: 68, h: 60 },
  { x: 1400, y: 350,  path: '/images/map/brick_debris.png', w: 68, h: 60 },
  { x: 2000, y: 1200, path: '/images/map/brick_debris.png', w: 68, h: 60 },
  // street lights
  { x: 900,  y: 100,  path: '/images/map/street_light.png', w: 69, h: 114 },
  { x: 1700, y: 800,  path: '/images/map/street_light.png', w: 69, h: 114 },
  { x: 200,  y: 1700, path: '/images/map/street_light.png', w: 69, h: 114 },
  // stop signs
  { x: 1500, y: 1300, path: '/images/map/stop_sign.png',    w: 48, h: 75 },
  { x: 600,  y: 1700, path: '/images/map/stop_sign.png',    w: 48, h: 75 },
  // cardboard litter
  { x: 350,  y: 450,  path: '/images/map/cardboard.png',    w: 44, h: 36 },
  { x: 1100, y: 900,  path: '/images/map/cardboard.png',    w: 44, h: 36 },
  { x: 1900, y: 650,  path: '/images/map/cardboard.png',    w: 44, h: 36 },
];

// ─── Sprite cache ──────────────────────────────────────────────────────────────

interface Sheet { img: HTMLImageElement; frames: number }
const sheetCache = new Map<string, Sheet>();

function getSheet(path: string, frames: number): Sheet {
  if (!sheetCache.has(path)) {
    const img = new Image();
    img.src = path;
    sheetCache.set(path, { img, frames });
  }
  return sheetCache.get(path)!;
}

function blit(
  ctx: CanvasRenderingContext2D, s: Sheet,
  fi: number, x: number, y: number, w: number, h: number,
): boolean {
  if (!s.img.complete || s.img.naturalWidth === 0) return false;
  const fw = s.img.naturalWidth / s.frames;
  ctx.drawImage(s.img, fi * fw, 0, fw, s.img.naturalHeight, x, y, w, h);
  return true;
}

type Dir = 'down' | 'side' | 'side-left' | 'up';

function toDir(dx: number, dy: number): Dir {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'side' : 'side-left';
  return dy >= 0 ? 'down' : 'up';
}

function animFrame(elapsedMs: number, frames: number, fps = 8): number {
  return Math.floor((elapsedMs / 1000) * fps) % frames;
}

// ─── Sprite definitions ────────────────────────────────────────────────────────

const PLAYER_SHEETS: Record<Dir, { idle: [string, number]; run: [string, number] }> = {
  down:        { idle: ['/images/character/idle_down.png', 6],      run: ['/images/character/run_down.png', 6] },
  side:        { idle: ['/images/character/idle_side.png', 6],      run: ['/images/character/run_side.png', 6] },
  'side-left': { idle: ['/images/character/idle_side_left.png', 6], run: ['/images/character/run_side_left.png', 6] },
  up:          { idle: ['/images/character/idle_up.png', 6],        run: ['/images/character/run_up.png', 6] },
};

const ENEMY_SHEETS: Record<EnemyType, Record<Dir, [string, number]>> = {
  normal: {
    down:        ['/images/zombie_small/walk_down.png', 6],
    side:        ['/images/zombie_small/walk_side.png', 6],
    'side-left': ['/images/zombie_small/walk_side_left.png', 6],
    up:          ['/images/zombie_small/walk_up.png', 6],
  },
  fast: {
    down:        ['/images/zombie_axe/walk_down.png', 8],
    side:        ['/images/zombie_axe/walk_side.png', 8],
    'side-left': ['/images/zombie_axe/walk_side_left.png', 8],
    up:          ['/images/zombie_axe/walk_up.png', 8],
  },
  tank: {
    down:        ['/images/zombie_big/walk_down.png', 8],
    side:        ['/images/zombie_big/walk_side.png', 8],
    'side-left': ['/images/zombie_big/walk_side_left.png', 8],
    up:          ['/images/zombie_big/walk_up.png', 8],
  },
};

const ENEMY_HP_COLOR: Record<EnemyType, string> = {
  normal: '#44dd44',
  fast:   '#ffaa00',
  tank:   '#ff3333',
};

const ENEMY_FALLBACK_COLOR: Record<EnemyType, string> = {
  normal: '#cc3333',
  fast:   '#ff6600',
  tank:   '#8b4513',
};

function preload() {
  for (const dirs of Object.values(PLAYER_SHEETS)) {
    getSheet(dirs.idle[0], dirs.idle[1]);
    getSheet(dirs.run[0], dirs.run[1]);
  }
  for (const types of Object.values(ENEMY_SHEETS)) {
    for (const spec of Object.values(types)) getSheet(spec[0], spec[1]);
  }
  getSheet('/images/map/floor_tileset.png', 1);
  for (const obj of MAP_OBJECTS) getSheet(obj.path, 1);
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GameCanvas({ gameStateRef, keysRef, onTick }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const onTickRef = useRef(onTick);
  useEffect(() => { onTickRef.current = onTick; });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    preload();

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current?.add(e.key);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) e.preventDefault();
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current?.delete(e.key); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    let playerDir: Dir = 'down';
    let playerMoving = false;
    let prevPlayerPos = { ...gameStateRef.current.player.pos };

    const tick = (time: number) => {
      const dt = Math.min((time - (lastTimeRef.current || time)) / 1000, 0.05);
      lastTimeRef.current = time;

      gameStateRef.current = onTickRef.current(gameStateRef.current, dt, keysRef.current ?? new Set());
      const state = gameStateRef.current;

      const pdx = state.player.pos.x - prevPlayerPos.x;
      const pdy = state.player.pos.y - prevPlayerPos.y;
      playerMoving = Math.abs(pdx) > 0.01 || Math.abs(pdy) > 0.01;
      if (playerMoving) playerDir = toDir(pdx, pdy);
      prevPlayerPos = { ...state.player.pos };

      render(ctx, state, playerDir, playerMoving);
      rafRef.current = requestAnimationFrame(tick);
    };

    rafRef.current = requestAnimationFrame(tick);
    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ display: 'block', background: '#1a1a1a', width: '100%', height: '100%' }}
    />
  );
}

// ─── Render ───────────────────────────────────────────────────────────────────

function render(
  ctx: CanvasRenderingContext2D,
  state: GameState,
  playerDir: Dir,
  playerMoving: boolean,
) {
  const { camera, player, enemies, projectiles, expOrbs, elapsedMs } = state;
  const ox = -camera.x + CANVAS_W / 2;
  const oy = -camera.y + CANVAS_H / 2;

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);
  ctx.imageSmoothingEnabled = false;

  drawFloor(ctx, ox, oy);
  drawMapObjects(ctx, ox, oy);

  // exp orbs
  ctx.fillStyle = '#7ec8e3';
  for (const orb of expOrbs) {
    ctx.beginPath();
    ctx.arc(orb.pos.x + ox, orb.pos.y + oy, 5, 0, Math.PI * 2);
    ctx.fill();
  }

  // enemies
  for (const enemy of enemies) {
    const ex = enemy.pos.x + ox;
    const ey = enemy.pos.y + oy;
    const er = enemy.radius;

    // direction toward player
    const edx = player.pos.x - enemy.pos.x;
    const edy = player.pos.y - enemy.pos.y;
    const eDir = Math.abs(edx) > 0.01 || Math.abs(edy) > 0.01 ? toDir(edx, edy) : 'down';

    const [ePath, eFrames] = ENEMY_SHEETS[enemy.type][eDir];
    const eSheet = getSheet(ePath, eFrames);
    const eFi = animFrame(elapsedMs, eFrames);

    if (!blit(ctx, eSheet, eFi, ex - er, ey - er, er * 2, er * 2)) {
      ctx.fillStyle = ENEMY_FALLBACK_COLOR[enemy.type];
      ctx.beginPath();
      ctx.arc(ex, ey, er, 0, Math.PI * 2);
      ctx.fill();
    }

    // hp bar — color varies by enemy type
    const bw = er * 2;
    const hpRatio = enemy.hp / enemy.maxHp;
    ctx.fillStyle = '#222';
    ctx.fillRect(ex - er, ey - er - 7, bw, 4);
    ctx.fillStyle = ENEMY_HP_COLOR[enemy.type];
    ctx.fillRect(ex - er, ey - er - 7, bw * hpRatio, 4);
  }

  // projectiles
  for (const p of projectiles) {
    ctx.fillStyle = p.radius >= 12 ? '#ff4400' : p.radius <= 3 ? '#ff8800' : '#ffff00';
    ctx.beginPath();
    ctx.arc(p.pos.x + ox, p.pos.y + oy, p.radius, 0, Math.PI * 2);
    ctx.fill();
  }

  // player
  const isInvincible = Date.now() < player.invincibleUntil;
  ctx.save();
  ctx.globalAlpha = isInvincible && Math.floor(Date.now() / 100) % 2 === 0 ? 0.3 : 1;
  ctx.imageSmoothingEnabled = false;

  const px = player.pos.x + ox;
  const py = player.pos.y + oy;
  const pr = player.radius;
  const { idle, run } = PLAYER_SHEETS[playerDir];
  const [pPath, pFrames] = playerMoving ? run : idle;
  const pSheet = getSheet(pPath, pFrames);
  const pFi = animFrame(elapsedMs, pFrames);

  if (!blit(ctx, pSheet, pFi, px - pr, py - pr, pr * 2, pr * 2)) {
    ctx.fillStyle = player.character === 'swordsman' ? '#4488ff' : '#44ff88';
    ctx.beginPath();
    ctx.arc(px, py, pr, 0, Math.PI * 2);
    ctx.fill();
  }

  if (player.character === 'swordsman') {
    ctx.strokeStyle = 'rgba(100,150,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.arc(px, py, 80, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

// ─── Map rendering ────────────────────────────────────────────────────────────

const FLOOR_SRC_TILE = 16; // px to crop from tileset per tile
const FLOOR_DST_TILE = 48; // px to draw per tile

function drawFloor(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
  // void outside map
  ctx.fillStyle = '#0c0c0c';
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // visible map slice in screen space
  const mx = Math.max(0, ox);
  const my = Math.max(0, oy);
  const mw = Math.min(CANVAS_W, ox + MAP_W) - mx;
  const mh = Math.min(CANVAS_H, oy + MAP_H) - my;
  if (mw <= 0 || mh <= 0) return;

  ctx.save();
  ctx.beginPath();
  ctx.rect(mx, my, mw, mh);
  ctx.clip();

  const floorImg = getSheet('/images/map/floor_tileset.png', 1).img;
  const T = FLOOR_DST_TILE;
  const S = FLOOR_SRC_TILE;

  if (floorImg.complete && floorImg.naturalWidth > 0) {
    // first tile (0,0,S,S) from tileset scaled to T×T, tiled across map
    const startX = Math.floor((mx - ox) / T) * T + ox;
    const startY = Math.floor((my - oy) / T) * T + oy;
    for (let tx = startX; tx < mx + mw; tx += T) {
      for (let ty = startY; ty < my + mh; ty += T) {
        ctx.drawImage(floorImg, 0, 0, S, S, tx, ty, T, T);
      }
    }
    // second tile (S,0) for subtle checkerboard variation
    for (let tx = startX; tx < mx + mw; tx += T * 2) {
      for (let ty = startY + T; ty < my + mh; ty += T * 2) {
        ctx.drawImage(floorImg, S, 0, S, S, tx, ty, T, T);
      }
    }
    for (let tx = startX + T; tx < mx + mw; tx += T * 2) {
      for (let ty = startY; ty < my + mh; ty += T * 2) {
        ctx.drawImage(floorImg, S, 0, S, S, tx, ty, T, T);
      }
    }
  } else {
    ctx.fillStyle = '#2a2b2c';
    ctx.fillRect(mx, my, mw, mh);
  }

  // subtle tile seams
  ctx.strokeStyle = 'rgba(0,0,0,0.25)';
  ctx.lineWidth = 1;
  const gx0 = Math.floor((mx - ox) / T) * T + ox;
  const gy0 = Math.floor((my - oy) / T) * T + oy;
  for (let tx = gx0; tx <= mx + mw; tx += T) {
    ctx.beginPath(); ctx.moveTo(tx, my); ctx.lineTo(tx, my + mh); ctx.stroke();
  }
  for (let ty = gy0; ty <= my + mh; ty += T) {
    ctx.beginPath(); ctx.moveTo(mx, ty); ctx.lineTo(mx + mw, ty); ctx.stroke();
  }

  ctx.restore();

  // map boundary
  ctx.save();
  ctx.strokeStyle = 'rgba(200,50,50,0.35)';
  ctx.lineWidth = 3;
  ctx.setLineDash([10, 5]);
  ctx.strokeRect(ox, oy, MAP_W, MAP_H);
  ctx.setLineDash([]);
  ctx.restore();
}

function drawMapObjects(ctx: CanvasRenderingContext2D, ox: number, oy: number) {
  ctx.imageSmoothingEnabled = false;
  for (const obj of MAP_OBJECTS) {
    const sx = obj.x + ox - obj.w / 2;
    const sy = obj.y + oy - obj.h / 2;
    if (sx + obj.w < 0 || sx > CANVAS_W || sy + obj.h < 0 || sy > CANVAS_H) continue;
    blit(ctx, getSheet(obj.path, 1), 0, sx, sy, obj.w, obj.h);
  }
}

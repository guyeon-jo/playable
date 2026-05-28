'use client';

import { useRef, useEffect, MutableRefObject, RefObject } from 'react';
import type { GameState } from '@/types/game';
import { CANVAS_W, CANVAS_H } from '@/lib/game/constants';

interface Props {
  gameStateRef: MutableRefObject<GameState>;
  keysRef: RefObject<Set<string>>;
  onTick: (state: GameState, dt: number, keys: Set<string>) => GameState;
}

let spriteSheet: HTMLImageElement | null = null;
function getSpriteSheet(): HTMLImageElement {
  if (!spriteSheet) {
    spriteSheet = new Image();
    spriteSheet.src = '/zombie-characters.png';
  }
  return spriteSheet;
}

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

    getSpriteSheet();

    const handleKeyDown = (e: KeyboardEvent) => {
      keysRef.current?.add(e.key);
      if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) e.preventDefault();
    };
    const handleKeyUp = (e: KeyboardEvent) => { keysRef.current?.delete(e.key); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    const tick = (time: number) => {
      const dt = Math.min((time - (lastTimeRef.current || time)) / 1000, 0.05);
      lastTimeRef.current = time;

      // Use gameStateRef.current directly so handleSkillSelect / handleRestart changes are visible
      gameStateRef.current = onTickRef.current(gameStateRef.current, dt, keysRef.current ?? new Set());

      render(ctx, gameStateRef.current);
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

function render(ctx: CanvasRenderingContext2D, state: GameState) {
  const { camera, player, enemies, projectiles, expOrbs } = state;
  const ox = -camera.x + CANVAS_W / 2;
  const oy = -camera.y + CANVAS_H / 2;

  ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

  // map grid
  ctx.save();
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 1;
  const TILE = 48;
  for (let x = (ox % TILE); x < CANVAS_W; x += TILE) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, CANVAS_H); ctx.stroke();
  }
  for (let y = (oy % TILE); y < CANVAS_H; y += TILE) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(CANVAS_W, y); ctx.stroke();
  }
  ctx.restore();

  // exp orbs
  for (const orb of expOrbs) {
    ctx.save();
    ctx.fillStyle = '#7ec8e3';
    ctx.beginPath();
    ctx.arc(orb.pos.x + ox, orb.pos.y + oy, 5, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // enemies
  for (const enemy of enemies) {
    ctx.save();
    ctx.fillStyle = enemy.type === 'tank' ? '#8b4513' : enemy.type === 'fast' ? '#ff6600' : '#cc3333';
    ctx.beginPath();
    ctx.arc(enemy.pos.x + ox, enemy.pos.y + oy, enemy.radius, 0, Math.PI * 2);
    ctx.fill();
    // hp bar
    const bw = enemy.radius * 2;
    ctx.fillStyle = '#333';
    ctx.fillRect(enemy.pos.x + ox - enemy.radius, enemy.pos.y + oy - enemy.radius - 8, bw, 4);
    ctx.fillStyle = '#ff4444';
    ctx.fillRect(enemy.pos.x + ox - enemy.radius, enemy.pos.y + oy - enemy.radius - 8, bw * (enemy.hp / enemy.maxHp), 4);
    ctx.restore();
  }

  // projectiles (color by size: small=flame orange, medium=yellow, large=red grenade)
  for (const p of projectiles) {
    ctx.save();
    ctx.fillStyle = p.radius >= 12 ? '#ff4400' : p.radius <= 3 ? '#ff8800' : '#ffff00';
    ctx.beginPath();
    ctx.arc(p.pos.x + ox, p.pos.y + oy, p.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  // player
  const isInvincible = Date.now() < player.invincibleUntil;
  ctx.save();
  ctx.globalAlpha = isInvincible && Math.floor(Date.now() / 100) % 2 === 0 ? 0.3 : 1;

  const sheet = spriteSheet;
  const px = player.pos.x + ox;
  const py = player.pos.y + oy;
  const spriteSize = 32;
  const spriteCol = player.character === 'gunner' ? 0 : 2;

  if (sheet?.complete && sheet.naturalWidth > 0) {
    ctx.imageSmoothingEnabled = false;
    ctx.drawImage(sheet, spriteCol * spriteSize, 0, spriteSize, spriteSize,
      px - player.radius, py - player.radius, player.radius * 2, player.radius * 2);
  } else {
    ctx.fillStyle = player.character === 'swordsman' ? '#4488ff' : '#44ff88';
    ctx.beginPath();
    ctx.arc(px, py, player.radius, 0, Math.PI * 2);
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

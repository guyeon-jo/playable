import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { LevelUpModal } from './LevelUpModal';
import type { SkillDef, Player } from '@/types/game';
import { createPlayer } from '@/lib/game/entities';

const candidates: SkillDef[] = [
  { id: 'pistol',    name: '권총',   description: '단발',  character: 'gunner', maxLevel: 5 },
  { id: 'shotgun',   name: '산탄총', description: '산탄',  character: 'gunner', maxLevel: 5 },
  { id: 'lightning', name: '전기',   description: '번개',  character: 'gunner', maxLevel: 5 },
];

describe('LevelUpModal', () => {
  it('스킬 카드 3장이 렌더된다', () => {
    render(<LevelUpModal candidates={candidates} player={createPlayer('gunner')} onSelect={vi.fn()} />);
    expect(screen.getByText('권총')).toBeDefined();
    expect(screen.getByText('산탄총')).toBeDefined();
    expect(screen.getByText('전기')).toBeDefined();
  });

  it('카드 클릭 시 onSelect(skillId)가 호출된다', () => {
    const onSelect = vi.fn();
    render(<LevelUpModal candidates={candidates} player={createPlayer('gunner')} onSelect={onSelect} />);
    fireEvent.click(screen.getByText('권총').closest('button')!);
    expect(onSelect).toHaveBeenCalledWith('pistol');
  });

  it('이미 보유한 스킬 카드에 "Lv.1→2" 텍스트가 표시된다', () => {
    const player: Player = { ...createPlayer('gunner'), skills: [{ id: 'pistol', level: 1 }] };
    render(<LevelUpModal candidates={candidates} player={player} onSelect={vi.fn()} />);
    expect(screen.getByText('Lv.1→2')).toBeDefined();
  });
});

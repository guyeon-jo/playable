import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { GameHUD } from './GameHUD';

const defaultProps = {
  remainingMs: 300_000,
  hp: 100, maxHp: 100,
  level: 1, exp: 0, expThreshold: 20,
  skills: [],
};

describe('GameHUD', () => {
  it('"5:00" 타이머가 표시된다', () => {
    render(<GameHUD {...defaultProps} />);
    expect(screen.getByText('5:00')).toBeDefined();
  });

  it('"LV.1" 레벨이 표시된다', () => {
    render(<GameHUD {...defaultProps} />);
    expect(screen.getByText('LV.1')).toBeDefined();
  });

  it('스킬 목록이 비어있으면 빈 슬롯이 표시된다', () => {
    const { container } = render(<GameHUD {...defaultProps} />);
    const emptySlots = container.querySelectorAll('[data-empty="true"]');
    expect(emptySlots.length).toBeGreaterThan(0);
  });

  it('획득한 스킬 이름이 표시된다', () => {
    render(<GameHUD {...defaultProps} skills={[{ id: 'pistol', level: 1 }]} />);
    expect(screen.getByText('권총')).toBeDefined();
  });
});

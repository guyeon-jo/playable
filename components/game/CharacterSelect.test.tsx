import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { CharacterSelect } from './CharacterSelect';

describe('CharacterSelect', () => {
  it('unlocked=false이면 검사 카드에 "첫 플레이 후 해금" 텍스트가 표시된다', () => {
    render(<CharacterSelect unlocked={false} onSelect={vi.fn()} />);
    expect(screen.getByText(/첫 플레이 후 해금/)).toBeDefined();
  });

  it('unlocked=false이면 검사 카드 클릭 시 onSelect가 호출되지 않는다', () => {
    const onSelect = vi.fn();
    render(<CharacterSelect unlocked={false} onSelect={onSelect} />);
    const lockedCard = screen.getByText(/첫 플레이 후 해금/).closest('[data-locked="true"]')!;
    fireEvent.click(lockedCard);
    expect(onSelect).not.toHaveBeenCalled();
  });

  it('unlocked=true이면 검사 카드에 잠금 텍스트가 없다', () => {
    render(<CharacterSelect unlocked={true} onSelect={vi.fn()} />);
    expect(screen.queryByText(/첫 플레이 후 해금/)).toBeNull();
  });

  it('총잡이 "선택" 클릭 시 onSelect("gunner")가 호출된다', () => {
    const onSelect = vi.fn();
    render(<CharacterSelect unlocked={false} onSelect={onSelect} />);
    fireEvent.click(screen.getAllByText('선택')[0]);
    expect(onSelect).toHaveBeenCalledWith('gunner');
  });
});

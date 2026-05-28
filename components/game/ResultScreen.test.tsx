import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ResultScreen } from './ResultScreen';

const baseProps = {
  status: 'gameover' as const,
  survivalMs: 167_000,
  killCount: 83,
  level: 5,
  firstPlay: false,
  onRestart: vi.fn(),
  onCharacterSelect: vi.fn(),
};

describe('ResultScreen', () => {
  it('status=gameover이면 "GAME OVER" 텍스트가 표시된다', () => {
    render(<ResultScreen {...baseProps} />);
    expect(screen.getByText('GAME OVER')).toBeDefined();
  });

  it('status=clear이면 "CLEAR!" 텍스트가 표시된다', () => {
    render(<ResultScreen {...baseProps} status="clear" survivalMs={300_000} killCount={247} level={12} />);
    expect(screen.getByText('CLEAR!')).toBeDefined();
  });

  it('처치 수와 달성 레벨이 표시된다', () => {
    render(<ResultScreen {...baseProps} />);
    expect(screen.getByText('83마리')).toBeDefined();
    expect(screen.getByText('5')).toBeDefined();
  });

  it('firstPlay=true이면 "검사 해금!" 배너가 표시된다', () => {
    render(<ResultScreen {...baseProps} firstPlay />);
    expect(screen.getByText(/검사 해금/)).toBeDefined();
  });

  it('"다시 시작" 클릭 시 onRestart가 호출된다', () => {
    const onRestart = vi.fn();
    render(<ResultScreen {...baseProps} onRestart={onRestart} />);
    fireEvent.click(screen.getByText('다시 시작'));
    expect(onRestart).toHaveBeenCalled();
  });
});

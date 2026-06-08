import { act, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ChatAiStatus from './ChatAiStatus';

describe('ChatAiStatus', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('delays the status to avoid flicker and then shows the compact runner', () => {
    vi.useFakeTimers();
    const { container } = render(<ChatAiStatus message="Nexo AI sedang menganalisis" />);

    expect(screen.queryByRole('status')).not.toBeInTheDocument();

    act(() => {
      vi.advanceTimersByTime(180);
    });

    expect(screen.getByRole('status')).toHaveTextContent('Nexo AI sedang menganalisis...');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Nexo AI sedang menganalisis');
    expect(container.querySelector('.nexo-data-track-compact')).toBeInTheDocument();
    expect(container.querySelectorAll('.chat-ai-ellipsis span')).toHaveLength(3);
  });

  it('can render immediately for deterministic states', () => {
    render(<ChatAiStatus message="Nexo AI sedang menyiapkan percakapan" delayMs={0} />);
    expect(screen.getByRole('status')).toBeInTheDocument();
  });
});

import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import AiInsightState from './AiInsightState';

describe('AiInsightState', () => {
  it('announces an accessible indeterminate loading state', () => {
    const { container } = render(
      <AiInsightState
        status="loading"
        message="Mengolah data tren produk..."
      />,
    );

    expect(screen.getByRole('status')).toHaveTextContent('Mengolah data tren produk...');
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-label', 'Mengolah data tren produk...');
    expect(container.querySelector('.nexo-data-runner')).toBeInTheDocument();
    expect(container.querySelector('.shimmer')).not.toBeInTheDocument();
    expect(container.firstElementChild).toHaveAttribute('aria-busy', 'true');
  });

  it('shows a labelled fallback and invokes retry after an error', () => {
    const onRetry = vi.fn();
    render(
      <AiInsightState
        status="error"
        message="Mengolah data tren produk..."
        errorMessage="Layanan AI sedang tidak tersedia."
        onRetry={onRetry}
        fallback={<p>Gunakan rekomendasi lokal.</p>}
      />,
    );

    expect(screen.getByRole('alert')).toHaveTextContent('Layanan AI sedang tidak tersedia.');
    expect(screen.getByText('Insight sementara')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Coba lagi' }));
    expect(onRetry).toHaveBeenCalledOnce();
  });

  it('renders the completed insight without a loading announcement', () => {
    render(
      <AiInsightState status="success" message="Mengolah data tren konten...">
        <p>Insight selesai.</p>
      </AiInsightState>,
    );

    expect(screen.getByText('Insight selesai.')).toBeInTheDocument();
    expect(screen.queryByRole('status')).not.toBeInTheDocument();
  });
});

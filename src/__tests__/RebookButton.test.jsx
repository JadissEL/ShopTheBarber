import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RebookButton from '@/components/booking/RebookButton';

const mockRebook = vi.fn();
vi.mock('@/hooks/useRebook', () => ({
  useRebook: () => ({
    rebook: mockRebook,
    isRebooking: false,
    canRebook: () => true,
  }),
}));

describe('RebookButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and triggers one-click rebook', async () => {
    const booking = { id: 'bk1', barber_id: 'barber-1', barber_name: 'Alex' };
    render(
      <MemoryRouter>
        <RebookButton booking={booking} />
      </MemoryRouter>
    );
    const btn = screen.getByRole('button', { name: /book again/i });
    fireEvent.click(btn);
    await waitFor(() => {
      expect(mockRebook).toHaveBeenCalledWith(booking);
    });
  });

  it('hides when barber_id missing', () => {
    const { container } = render(
      <MemoryRouter>
        <RebookButton booking={{ id: 'x' }} />
      </MemoryRouter>
    );
    expect(container).toBeEmptyDOMElement();
  });
});

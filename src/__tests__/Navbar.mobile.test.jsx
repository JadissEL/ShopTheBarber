import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';

vi.mock('@/lib/AuthContext', () => ({
  useAuth: () => ({ isAuthenticated: false, user: null }),
}));

describe('Navbar (mobile)', () => {
  beforeEach(() => {
    document.body.style.overflow = '';
  });

  afterEach(() => {
    document.body.style.overflow = '';
  });

  it('opens mobile menu and locks body scroll', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByRole('button', { name: 'Toggle menu' }));

    expect(screen.getAllByRole('link', { name: 'Sign In' }).length).toBeGreaterThanOrEqual(1);
    expect(document.body.style.overflow).toBe('hidden');
  });

  it('restores body scroll when menu closes', () => {
    render(
      <MemoryRouter>
        <Navbar />
      </MemoryRouter>,
    );

    const toggle = screen.getByRole('button', { name: 'Toggle menu' });
    fireEvent.click(toggle);
    fireEvent.click(toggle);

    expect(document.body.style.overflow).toBe('');
  });
});

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Navbar from '@/components/layout/Navbar';

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

    expect(screen.getByRole('link', { name: 'Sign In' })).toBeInTheDocument();
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

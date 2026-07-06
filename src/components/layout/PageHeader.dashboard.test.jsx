import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import PageHeader from '@/components/layout/PageHeader';
import { DashboardShellProvider } from '@/components/layout/DashboardShellContext';

describe('PageHeader dashboard shell', () => {
  it('uses app chrome inside the dashboard shell', () => {
    render(
      <DashboardShellProvider>
        <PageHeader title="Marketplace" subtitle="Shop grooming essentials" />
      </DashboardShellProvider>,
    );

    const heading = screen.getByRole('heading', { name: 'Marketplace' });
    expect(heading.className).toMatch(/stb-ui-heading/);
    expect(heading.closest('header')?.className).toMatch(/bg-background/);
    expect(heading.closest('header')?.className).not.toMatch(/stb-explore-hero/);
  });

  it('keeps marketing chrome on the public site', () => {
    render(<PageHeader title="Marketplace" subtitle="Shop grooming essentials" />);

    const heading = screen.getByRole('heading', { name: 'Marketplace' });
    expect(heading.closest('header')?.className).toMatch(/stb-explore-hero/);
  });
});

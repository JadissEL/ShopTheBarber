import { render } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';

/**
 * Minimal router wrapper for component tests.
 * @param {React.ReactElement} ui
 * @param {{ initialEntries?: string[], route?: string }} options
 */
export function renderWithRouter(ui, { initialEntries = ['/'], route } = {}) {
  const entries = route ? [route] : initialEntries;
  return render(<MemoryRouter initialEntries={entries}>{ui}</MemoryRouter>);
}

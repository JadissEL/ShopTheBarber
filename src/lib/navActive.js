/**
 * Shared nav active-state helper for sidebars and bottom nav.
 * Segment-aware matching avoids partial path false positives.
 */

function normalizePage(page) {
  if (!page) return '';
  const raw = String(page).replace(/^\//, '').split('?')[0];
  return raw.toLowerCase();
}

function pathSegments(pathname) {
  return (pathname || '')
    .split('?')[0]
    .split('/')
    .filter(Boolean)
    .map((s) => s.toLowerCase());
}

/**
 * @param {string} pathname - current location.pathname
 * @param {string} page - nav item page key (e.g. "Dashboard", "BookingFlow")
 * @param {{ exact?: boolean, aliases?: string[] }} [options]
 */
export function isNavActive(pathname, page, options = {}) {
  const { exact = false, aliases = [] } = options;
  const target = normalizePage(page);
  if (!target) return false;

  const segments = pathSegments(pathname);
  const current = segments.join('/');

  const candidates = [target, ...aliases.map(normalizePage)].filter(Boolean);

  for (const candidate of candidates) {
    if (exact) {
      if (current === candidate || segments[segments.length - 1] === candidate) return true;
      continue;
    }

    if (current === candidate) return true;
    if (segments.includes(candidate)) return true;

    if (candidate === 'careerhub' && segments[0] === 'careerhub') return true;
    if (candidate === 'dashboard' && (segments[0] === 'dashboard' || current === '')) return true;
    if (candidate === 'providerdashboard' && segments[0] === 'providerdashboard') return true;
  }

  return false;
}

export function navItemClassName(isActive, { compact = false } = {}) {
  const base = compact
    ? 'flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold tracking-wide transition-colors duration-fast font-sans normal-case'
    : 'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-fast font-sans normal-case';

  return isActive
    ? `${base} stb-nav-item-active`
    : `${base} stb-nav-item text-muted-foreground`;
}

export function roleLabel(role) {
  switch (role) {
    case 'admin':
      return 'Admin';
    case 'shop_owner':
      return 'Shop owner';
    case 'barber':
    case 'provider':
      return 'Barber';
    case 'client':
    default:
      return 'Client';
  }
}

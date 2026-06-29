/**
 * Copy, SEO, and layout config for Explore discovery modes (Top Rated, Mobile, etc.).
 */
export function resolveExploreMode({ mobileOnly, shopOnly, groupOnly, activeFilter }) {
  if (mobileOnly && groupOnly) return 'mobileGroup';
  if (mobileOnly) return 'mobile';
  if (shopOnly) return 'shop';
  if (groupOnly) return 'group';
  if (activeFilter === 'Deals') return 'deals';
  return 'topRated';
}

function cityTitle(base, city) {
  return city ? `${base} in ${city}` : base;
}

export const EXPLORE_PAGE_CONFIG = {
  topRated: {
    schemaName: 'Top Rated Barbers',
    metaTitle: (city, search) =>
      city ? `Top barbers in ${city}` : search ? `Search: ${search}` : 'Top Rated Barbers',
    metaDescription: (city) =>
      city
        ? `Find and book top-rated barbers in ${city}. Compare reviews, deals, and at-home options.`
        : 'Discover the highest-rated grooming professionals near you.',
    heroBadge: 'Marketplace',
    heroTitle: (city) => cityTitle('Top Rated Barbers', city),
    heroSubtitle: (city) =>
      city
        ? `The highest-rated grooming professionals in ${city}.`
        : 'Discover the highest-rated grooming professionals near you.',
    resultsHeading: 'All professionals',
    resultsSubtext: ', sorted by rating',
    searchPlaceholder: 'Search barbers, neighborhoods, services…',
    heroTheme: 'emerald',
    lockProfessionals: false,
    showInspiration: true,
    bookingLocation: null,
    emptyFilteredMessage:
      'Try changing your search or filter (e.g. "All" or a different service).',
  },
  mobile: {
    schemaName: 'Mobile Barbers',
    metaTitle: (city, search) =>
      city ? `Mobile barbers in ${city}` : search ? `Search: ${search}` : 'Mobile Barbers',
    metaDescription: (city) =>
      city
        ? `Book barbers who come to you in ${city}. At-home cuts, beard trims, and grooming on your schedule.`
        : 'Book barbers who come to your home, office, or hotel. At-home grooming on your schedule.',
    heroBadge: 'At your door',
    heroTitle: (city) => cityTitle('Mobile Barbers', city),
    heroSubtitle: (city) =>
      city
        ? `Trusted professionals who travel to you in ${city}.`
        : 'Trusted professionals who come to your home, office, or hotel.',
    resultsHeading: 'Mobile professionals',
    resultsSubtext: ' who offer at-home visits, sorted by rating',
    searchPlaceholder: 'Search mobile barbers, areas, services…',
    heroTheme: 'violet',
    lockProfessionals: true,
    showInspiration: false,
    bookingLocation: 'mobile',
    emptyFilteredMessage:
      'No mobile barbers match your filters. Try a different service or clear the language filter.',
  },
  mobileGroup: {
    schemaName: 'Mobile Group Barbers',
    metaTitle: (city) =>
      city ? `Mobile group barbers in ${city}` : 'Mobile Group Barbers',
    metaDescription: () =>
      'Book mobile barbers for groups, events, and parties. At-home service for friends and family.',
    heroBadge: 'Groups & events',
    heroTitle: (city) => cityTitle('Mobile Group Barbers', city),
    heroSubtitle: () =>
      'Barbers who travel to you and handle group bookings for events and celebrations.',
    resultsHeading: 'Mobile group professionals',
    resultsSubtext: ', sorted by rating',
    searchPlaceholder: 'Search group mobile barbers…',
    heroTheme: 'amber',
    lockProfessionals: true,
    showInspiration: false,
    bookingLocation: 'mobile',
    emptyFilteredMessage:
      'No mobile group barbers match your filters. Try clearing preferences or browse all mobile barbers.',
  },
  shop: {
    schemaName: 'Barbershops',
    metaTitle: (city) => (city ? `Barbershops in ${city}` : 'Barbershops'),
    metaDescription: (city) =>
      city
        ? `Find top barbershops in ${city}. Book in-shop appointments with rated professionals.`
        : 'Find top barbershops near you. Book in-shop appointments with rated professionals.',
    heroBadge: 'In-shop',
    heroTitle: (city) => cityTitle('Barbershops', city),
    heroSubtitle: (city) =>
      city
        ? `Visit rated barbershops and studios in ${city}.`
        : 'Visit rated barbershops and studios near you.',
    resultsHeading: 'In-shop professionals',
    resultsSubtext: ', sorted by rating',
    searchPlaceholder: 'Search barbershops, neighborhoods…',
    heroTheme: 'slate',
    lockProfessionals: true,
    showInspiration: false,
    bookingLocation: 'shop',
    emptyFilteredMessage: 'No in-shop barbers match your filters. Try adjusting your search.',
  },
  group: {
    schemaName: 'Group Booking Barbers',
    metaTitle: () => 'Group Booking Barbers',
    metaDescription: () =>
      'Book barbers for weddings, groomsmen, parties, and group events.',
    heroBadge: 'Friends & family',
    heroTitle: () => 'Group Booking Barbers',
    heroSubtitle: () =>
      'Professionals who handle weddings, groomsmen, parties, and group grooming.',
    resultsHeading: 'Group booking professionals',
    resultsSubtext: ', sorted by rating',
    searchPlaceholder: 'Search group barbers, events…',
    heroTheme: 'amber',
    lockProfessionals: true,
    showInspiration: false,
    bookingLocation: null,
    emptyFilteredMessage:
      'No group barbers match your filters. Try a different service or clear preferences.',
  },
  deals: {
    schemaName: 'Barber Deals',
    metaTitle: () => 'Barber Deals & Offers',
    metaDescription: () =>
      'Browse live deals, combos, and promotions from top barbers and shops.',
    heroBadge: 'Live offers',
    heroTitle: () => 'Deals & Offers',
    heroSubtitle: () => 'Save on haircuts, beard trims, and grooming packages near you.',
    resultsHeading: 'Deals available now',
    resultsSubtext: ', sorted by rating',
    searchPlaceholder: 'Search deals, barbers, services…',
    heroTheme: 'rose',
    lockProfessionals: false,
    showInspiration: false,
    bookingLocation: null,
    emptyFilteredMessage:
      'No deals match your filters right now. Check back soon or browse all professionals.',
  },
};

export const HERO_THEMES = {
  emerald: {
    section: 'bg-gradient-to-b from-emerald-50/80 via-white to-slate-50',
    accentBar: 'bg-emerald-500',
    badge: 'text-emerald-800 bg-emerald-100',
    countPill: 'text-emerald-800 bg-emerald-100/80',
    ring: 'focus-visible:ring-emerald-500',
  },
  violet: {
    section: 'bg-gradient-to-b from-violet-50/80 via-white to-slate-50',
    accentBar: 'bg-violet-500',
    badge: 'text-violet-800 bg-violet-100',
    countPill: 'text-violet-800 bg-violet-100/80',
    ring: 'focus-visible:ring-violet-500',
  },
  amber: {
    section: 'bg-gradient-to-b from-amber-50/80 via-white to-slate-50',
    accentBar: 'bg-amber-500',
    badge: 'text-amber-900 bg-amber-100',
    countPill: 'text-amber-900 bg-amber-100/80',
    ring: 'focus-visible:ring-amber-500',
  },
  slate: {
    section: 'bg-gradient-to-b from-slate-100 via-white to-slate-50',
    accentBar: 'bg-slate-600',
    badge: 'text-foreground bg-slate-200',
    countPill: 'text-foreground bg-slate-200/80',
    ring: 'focus-visible:ring-slate-500',
  },
  rose: {
    section: 'bg-gradient-to-b from-rose-50/80 via-white to-slate-50',
    accentBar: 'bg-rose-500',
    badge: 'text-rose-800 bg-rose-100',
    countPill: 'text-rose-800 bg-rose-100/80',
    ring: 'focus-visible:ring-rose-500',
  },
};

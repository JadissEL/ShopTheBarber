/**
 * ShopTheBarber — Complete Visual System (v2)
 *
 * CREATIVE DIRECTION
 * Premium grooming marketplace: trust in seconds, warm, precise, never noisy.
 * Benchmark: Linear clarity (app) + Stripe form craft + Apple spacing + STB brand energy (marketing).
 *
 * TYPOGRAPHY TIERS
 * - Display (Bebas): marketing heroes, dark section titles, catalog product names
 * - UI (DM Sans semibold): app page titles, dashboard headers, settings — sentence case
 * - Body (DM Sans): paragraphs, descriptions, table cells
 * - Caption / Overline: labels, eyebrows, metadata
 *
 * COLOR DISCIPLINE
 * Orange = CTAs, prices, active nav, display eyebrows ONLY
 * Black (navy) = catalog action bars, dark marketing bands
 * No decorative chart colors on marketing UI
 *
 * SURFACE LEVELS (0–4)
 * 0 page bg | 1 cards | 2 hover/dropdown | 3 modal | 4 toast
 *
 * ZONE HEADER TIERS (layout/PageHeader)
 * - display + dark: public marketing (Marketplace, GiftCards, Championship)
 * - app + light: client/provider/admin pages (Dashboard, Bookings, Settings)
 * - immersive: profile heroes only (BarberProfile, ShopProfile)
 *
 * MOTION: 150–250ms ease-out; respect prefers-reduced-motion
 */
import { cn } from '@/lib/utils';

/** @typedef {'display' | 'app' | 'immersive'} HeaderTier */
/** @typedef {'public' | 'client' | 'provider' | 'admin' | 'auth'} AppZone */

export const HEADER_TIER = {
  DISPLAY: 'display',
  APP: 'app',
  IMMERSIVE: 'immersive',
};

/** Semantic chart palette — use in Recharts fill/stroke (not Tailwind classes). */
export const CHART_COLORS = {
  1: 'hsl(var(--chart-1))',
  2: 'hsl(var(--chart-2))',
  3: 'hsl(var(--chart-3))',
  4: 'hsl(var(--chart-4))',
  5: 'hsl(var(--chart-5))',
};

/** @param {1|2|3|4|5} n */
export function chartColor(n) {
  return CHART_COLORS[n] ?? CHART_COLORS[1];
}

/** @param {1|2|3|4|5} n @param {number} [alpha=0.15] */
export function chartFill(n, alpha = 0.15) {
  return `hsl(var(--chart-${n}) / ${alpha})`;
}

export const stb = {
  // —— Surfaces ——
  page: 'stb-page',
  surface: 'stb-surface',
  surfaceRaised: 'stb-surface-raised',
  surfaceHover: 'stb-surface-hover',
  surfaceInteractive: 'stb-surface-interactive',
  surfaceOverlay: 'stb-surface-overlay',
  surfaceMuted: 'stb-surface-muted',
  panel: 'stb-panel',
  panelHover: 'stb-panel-hover',
  /** @deprecated */ card: 'stb-card',
  /** @deprecated */ cardInteractive: 'stb-card-interactive',
  /** @deprecated */ cardLift: 'stb-card-lift',

  // —— Typography ——
  displayXl: 'stb-display-xl',
  display: 'stb-heading-display',
  /** @deprecated alias */ heading: 'stb-heading-display',
  title: 'stb-title',
  uiHeading: 'stb-ui-heading',
  uiSubheading: 'stb-ui-subheading',
  body: 'stb-body',
  caption: 'stb-caption',
  /** @deprecated alias */ label: 'stb-overline',
  overline: 'stb-overline',

  // —— Layout ——
  section: 'stb-section',
  sectionDark: 'stb-section-dark stb-section',
  sectionCream: 'stb-section-cream',
  container: 'container mx-auto px-4 md:px-6 lg:px-8 max-w-7xl',
  containerNarrow: 'container mx-auto px-4 md:px-6 max-w-3xl',
  gridMarketing: 'grid gap-6 md:gap-8',
  gridCards: 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5',

  // —— Actions ——
  btn: 'stb-btn-primary',
  /** @deprecated */ btnGlow: 'stb-btn-glow',
  cardCta: 'stb-card-cta-bar',
  catalogCard: 'stb-catalog-card',
  catalogMedia: 'stb-catalog-media',
  catalogBody: 'stb-catalog-body',
  catalogCta: 'stb-catalog-cta',

  // —— Forms & search ——
  searchWrap: 'stb-search-wrap',
  searchInput: 'stb-search-input',
  formSection: 'stb-form-section',
  formLabel: 'stb-form-label',
  focusRing: 'stb-focus-ring',

  // —— Feedback ——
  notice: 'stb-notice',
  noticeWarm: 'stb-notice-warm',
  skeleton: 'stb-skeleton',
  chip: 'stb-chip',
  chipActive: 'stb-chip-active',
  iconBox: 'stb-icon-box',

  // —— Nav ——
  navTab:
    'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors duration-200 tap-highlight-none touch-target max-w-[72px]',
  navTabActive: 'text-primary border-b-2 border-primary',
  navTabIdle: 'text-muted-foreground active:bg-muted/80',
  navItem: 'stb-nav-item',
  navItemActive: 'stb-nav-item-active',
  listItem: 'stb-list-item',

  // —— Data ——
  dataTable: 'stb-data-table',
  metricValue: 'stb-metric-value',

  // —— Marketing ——
  exploreHero: 'stb-explore-hero',
  siteBg: 'stb-site-bg',
  glass: 'stb-glass',
  textAccent: 'stb-text-accent',
  /** @deprecated use textAccent */
  textGradient: 'stb-text-accent',

  // —— Motion ——
  animateFadeUp: 'stb-animate-fade-up',
  animateIn: 'stb-animate-in',

  // —— Booking ——
  stepActive: 'stb-step-active',
  stepDone: 'stb-step-done',
  slotSelected: 'stb-slot-selected',
};

export function stbCn(...classes) {
  return cn(...classes);
}

/** Catalog card shell: image + body + black CTA bar */
export function catalogCardClasses(className) {
  return cn(stb.catalogCard, stb.surfaceInteractive, className);
}

/** Page header typography by tier */
export function headerTitleClasses(tier = HEADER_TIER.DISPLAY, compact = false) {
  if (tier === HEADER_TIER.APP) {
    return cn(stb.uiHeading, compact ? 'text-2xl md:text-3xl' : 'text-3xl md:text-4xl');
  }
  return cn(stb.display, compact ? 'text-3xl md:text-4xl' : 'text-4xl md:text-5xl lg:text-6xl', 'text-white');
}

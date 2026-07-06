/**
 * Per-account-type visual identity — solid platform palette only.
 * Orange · black · white · grey · dark purple · royal dark green
 * @typedef {'client'|'solo_barber'|'shop'|'seller'|'company'|'blogger'} AccountType
 */

/** Canonical solid brand colors (match index.css + brand accents) */
export const STB_SOLID_COLORS = {
  orange: '#F05A1A',
  black: '#0D0D0D',
  white: '#FFFFFF',
  grey: '#E8E4DE',
  greyMuted: '#6B7280',
  darkPurple: '#4A1F7A',
  royalDarkGreen: '#0F5C36',
};

/**
 * @typedef {{
 *   image: string;
 *   imageAlt: string;
 *   cardBg: string;
 *   titleColor: string;
 *   subtitleColor: string;
 *   bodyColor: string;
 *   accentBar: string;
 *   buttonBg: string;
 *   buttonText: string;
 *   buttonBorder?: string;
 *   ring: string;
 *   imageOverlay?: string;
 * }} AccountTypeVisual
 */

/** Shared white-card surface (seller, company, blogger). */
const WHITE_CARD_VISUAL = {
  cardBg: STB_SOLID_COLORS.white,
  titleColor: STB_SOLID_COLORS.black,
  subtitleColor: STB_SOLID_COLORS.greyMuted,
  bodyColor: '#3D3D3D',
  accentBar: STB_SOLID_COLORS.black,
  buttonBg: STB_SOLID_COLORS.white,
  buttonText: STB_SOLID_COLORS.black,
  buttonBorder: STB_SOLID_COLORS.black,
  ring: STB_SOLID_COLORS.black,
  imageOverlay: 'linear-gradient(to top, rgba(255,255,255,0.15), transparent)',
};

/** @type {Record<AccountType, AccountTypeVisual>} */
export const ACCOUNT_TYPE_VISUALS = {
  client: {
    image:
      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=900&auto=format&fit=crop',
    imageAlt: 'Client relaxing after a grooming appointment',
    cardBg: STB_SOLID_COLORS.grey,
    titleColor: STB_SOLID_COLORS.black,
    subtitleColor: STB_SOLID_COLORS.greyMuted,
    bodyColor: '#3D3D3D',
    accentBar: STB_SOLID_COLORS.greyMuted,
    buttonBg: STB_SOLID_COLORS.black,
    buttonText: STB_SOLID_COLORS.white,
    ring: STB_SOLID_COLORS.black,
  },
  solo_barber: {
    image:
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=900&auto=format&fit=crop',
    imageAlt: 'Solo barber at work in the chair',
    cardBg: STB_SOLID_COLORS.orange,
    titleColor: STB_SOLID_COLORS.black,
    subtitleColor: 'rgba(13, 13, 13, 0.65)',
    bodyColor: STB_SOLID_COLORS.black,
    accentBar: STB_SOLID_COLORS.black,
    buttonBg: STB_SOLID_COLORS.black,
    buttonText: STB_SOLID_COLORS.white,
    ring: STB_SOLID_COLORS.black,
    imageOverlay: 'linear-gradient(to top, rgba(13,13,13,0.25), transparent)',
  },
  shop: {
    image:
      'https://images.unsplash.com/photo-1503951914875-0ac7b1a3dffc?q=80&w=900&auto=format&fit=crop',
    imageAlt: 'Busy barbershop with multiple chairs',
    cardBg: STB_SOLID_COLORS.black,
    titleColor: STB_SOLID_COLORS.white,
    subtitleColor: 'rgba(255, 255, 255, 0.65)',
    bodyColor: 'rgba(255, 255, 255, 0.88)',
    accentBar: STB_SOLID_COLORS.orange,
    buttonBg: STB_SOLID_COLORS.white,
    buttonText: STB_SOLID_COLORS.black,
    ring: STB_SOLID_COLORS.orange,
    imageOverlay: 'linear-gradient(to top, rgba(0,0,0,0.55), transparent)',
  },
  seller: {
    image:
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=900&auto=format&fit=crop',
    imageAlt: 'Grooming products on display',
    ...WHITE_CARD_VISUAL,
  },
  company: {
    image:
      'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=900&auto=format&fit=crop',
    imageAlt: 'Team collaborating in a modern office',
    ...WHITE_CARD_VISUAL,
  },
  blogger: {
    image:
      'https://images.unsplash.com/photo-1455390582260-0447de3cbe5d?q=80&w=900&auto=format&fit=crop',
    imageAlt: 'Creator writing at a desk',
    ...WHITE_CARD_VISUAL,
  },
};

/** Grouped layout for clearer scanning on the chooser page. */
export const ACCOUNT_TYPE_SECTIONS = [
  {
    id: 'book',
    label: 'Book & discover',
    description: 'Find barbers, book visits, and shop products.',
    types: ['client'],
  },
  {
    id: 'provide',
    label: 'Run appointments',
    description: 'Calendar, clients, payouts, and chair or shop operations.',
    types: ['solo_barber', 'shop'],
  },
  {
    id: 'grow',
    label: 'Sell, hire & create',
    description: 'Marketplace, recruitment, and content — without chair bookings.',
    types: ['seller', 'company', 'blogger'],
  },
];

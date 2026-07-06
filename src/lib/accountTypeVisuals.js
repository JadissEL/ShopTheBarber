/**
 * Per-account-type visual identity — accents stay in the warm brand family with distinct hues.
 * @typedef {'client'|'solo_barber'|'shop'|'seller'|'company'|'blogger'} AccountType
 */

/** @type {Record<AccountType, { image: string; imageAlt: string; accent: string; iconBg: string; iconText: string; tagBg: string; tagText: string; gradient: string; ring: string; border: string }>} */
export const ACCOUNT_TYPE_VISUALS = {
  client: {
    image:
      'https://images.unsplash.com/photo-1622286342621-4bd786c2447c?q=80&w=800&auto=format&fit=crop',
    imageAlt: 'Client relaxing after a grooming appointment',
    accent: 'Client',
    iconBg: 'bg-sky-500/12',
    iconText: 'text-sky-700 dark:text-sky-300',
    tagBg: 'bg-sky-500/10',
    tagText: 'text-sky-800 dark:text-sky-200',
    gradient: 'from-sky-950/75 via-sky-900/40 to-transparent',
    ring: 'ring-sky-500/35',
    border: 'border-sky-500',
  },
  solo_barber: {
    image:
      'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?q=80&w=800&auto=format&fit=crop',
    imageAlt: 'Solo barber at work in the chair',
    accent: 'Solo barber',
    iconBg: 'bg-primary/15',
    iconText: 'text-primary',
    tagBg: 'bg-primary/10',
    tagText: 'text-primary',
    gradient: 'from-stone-950/80 via-primary/30 to-transparent',
    ring: 'ring-primary/35',
    border: 'border-primary',
  },
  shop: {
    image:
      'https://images.unsplash.com/photo-1503951914875-0ac7b1a3dffc?q=80&w=800&auto=format&fit=crop',
    imageAlt: 'Busy barbershop with multiple chairs',
    accent: 'Shop',
    iconBg: 'bg-amber-700/12',
    iconText: 'text-amber-900 dark:text-amber-200',
    tagBg: 'bg-amber-700/10',
    tagText: 'text-amber-900 dark:text-amber-100',
    gradient: 'from-amber-950/75 via-amber-900/35 to-transparent',
    ring: 'ring-amber-600/35',
    border: 'border-amber-600',
  },
  seller: {
    image:
      'https://images.unsplash.com/photo-1621605815971-fbc98d665033?q=80&w=800&auto=format&fit=crop',
    imageAlt: 'Grooming products on display',
    accent: 'Seller',
    iconBg: 'bg-emerald-600/12',
    iconText: 'text-emerald-800 dark:text-emerald-200',
    tagBg: 'bg-emerald-600/10',
    tagText: 'text-emerald-900 dark:text-emerald-100',
    gradient: 'from-emerald-950/75 via-emerald-900/30 to-transparent',
    ring: 'ring-emerald-600/35',
    border: 'border-emerald-600',
  },
  company: {
    image:
      'https://images.unsplash.com/photo-1521737711867-e3b97375f902?q=80&w=800&auto=format&fit=crop',
    imageAlt: 'Team collaborating in a modern office',
    accent: 'Company',
    iconBg: 'bg-indigo-600/12',
    iconText: 'text-indigo-800 dark:text-indigo-200',
    tagBg: 'bg-indigo-600/10',
    tagText: 'text-indigo-900 dark:text-indigo-100',
    gradient: 'from-indigo-950/75 via-indigo-900/30 to-transparent',
    ring: 'ring-indigo-500/35',
    border: 'border-indigo-500',
  },
  blogger: {
    image:
      'https://images.unsplash.com/photo-1455390582260-0447de3cbe5d?q=80&w=800&auto=format&fit=crop',
    imageAlt: 'Creator writing at a desk',
    accent: 'Blogger',
    iconBg: 'bg-violet-600/12',
    iconText: 'text-violet-800 dark:text-violet-200',
    tagBg: 'bg-violet-600/10',
    tagText: 'text-violet-900 dark:text-violet-100',
    gradient: 'from-violet-950/75 via-violet-900/30 to-transparent',
    ring: 'ring-violet-500/35',
    border: 'border-violet-500',
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

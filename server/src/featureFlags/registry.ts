/** Module keys aligned with frontend `FEATURE_MODULES` (excluding always-on core/admin). */
export const RUNTIME_FEATURE_MODULES = [
    { key: 'marketplace', label: 'Marketplace', description: 'Shop products, cart, checkout, orders' },
    { key: 'careers', label: 'Careers', description: 'Job board and applications' },
    { key: 'content', label: 'Content & inspiration', description: 'Blog, articles, inspiration feed' },
    { key: 'engagement', label: 'Engagement', description: 'Loyalty, referrals, gift cards, tombola' },
    { key: 'communication', label: 'Messaging', description: 'Client chat, provider inbox, support' },
    { key: 'programs', label: 'Programs', description: 'Events and language programs' },
    { key: 'shop_ops', label: 'Shop operations', description: 'Inventory, expenses, team tools' },
] as const;

export type RuntimeFeatureKey = (typeof RUNTIME_FEATURE_MODULES)[number]['key'];

export const ALWAYS_ON_FEATURE_KEYS = new Set(['core', 'admin']);

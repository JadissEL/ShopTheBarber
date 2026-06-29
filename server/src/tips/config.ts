/** Post-service tip presets (% of service price) and bounds */
export const TIP_CONFIG = {
    presetPercents: [15, 18, 20, 25] as const,
    minAmount: 1,
    maxAmount: 500,
    currency: 'usd',
} as const;

/** Minimal showcase when API is unavailable but profile has created_at / bio / skills. */
export function buildFallbackShowcase(createdAt) {
    if (!createdAt) return null;
    const d = new Date(createdAt);
    if (Number.isNaN(d.getTime())) return null;
    const memberSinceLabel = d.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    return {
        member_since_label: memberSinceLabel,
        career_timeline: [],
        auto_milestones: [
            {
                label: 'Joined ShopTheBarber',
                year: String(d.getFullYear()),
                detail: `Profile active since ${memberSinceLabel}`,
            },
        ],
        profile_highlights: [],
        portfolio: [],
    };
}

export function mergeShowcaseWithFallback(showcase, createdAt) {
    if (showcase) return showcase;
    return buildFallbackShowcase(createdAt);
}

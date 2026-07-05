/** Mirrors frontend exploreServiceTags.js for server-side Explore filtering. */

export const EXPLORE_SERVICE_SYNONYMS: Record<string, string[]> = {
    haircut: [
        'hair',
        'haircut',
        'cut',
        'trim',
        'fade',
        'buzz',
        'clipper',
        'grooming',
        'barber',
        'barbershop',
        'scissor',
        'taper',
        'line up',
        'lineup',
        'shape up',
        'shapeup',
        'executive',
        'classic cut',
        'skin fade',
    ],
    beard: [
        'beard',
        'facial hair',
        'mustache',
        'moustache',
        'goatee',
        'stubble',
        'beard trim',
        'beard shaping',
    ],
    beardtrim: ['beard', 'beard trim', 'trim', 'shape', 'line up', 'lineup'],
    shave: ['shave', 'razor', 'hot towel', 'straight razor', 'wet shave'],
    styling: ['style', 'styling', 'pompadour', 'quiff', 'blow dry', 'finish'],
    facial: ['facial', 'skincare', 'face mask', 'cleansing'],
    deals: [],
};

const FILTER_TO_CATEGORY: Record<string, string> = {
    haircut: 'haircut',
    hair: 'haircut',
    beard: 'beard',
    beardtrim: 'beard',
    'beard trim': 'beard',
    shave: 'shave',
    styling: 'styling',
    facial: 'facial',
};

export function normalizeExploreFilterTag(activeFilter?: string | null): string | null {
    if (!activeFilter || activeFilter === 'All' || activeFilter === 'Deals') return null;
    const key = activeFilter.toLowerCase().replace(/\s+/g, '');
    if (key === 'beardtrim') return 'beard';
    if (key === 'haircut') return 'haircut';
    return FILTER_TO_CATEGORY[key] || key;
}

export function serviceTextMatchesExploreFilter(
    category: string | null | undefined,
    name: string | null | undefined,
    activeFilter: string
): boolean {
    const filterCategory = normalizeExploreFilterTag(activeFilter);
    if (!filterCategory) return false;

    const haystack = `${(category || '').toLowerCase()} ${(name || '').toLowerCase()}`;
    const synonyms = EXPLORE_SERVICE_SYNONYMS[filterCategory] || [filterCategory];
    return synonyms.some((term) => haystack.includes(term));
}

export function barberServicesMatchExploreFilter(barberServices: string[], activeFilter: string): boolean {
    if (!Array.isArray(barberServices) || !activeFilter || activeFilter === 'All') return false;
    const needle = activeFilter.toLowerCase();
    const filterCategory = normalizeExploreFilterTag(activeFilter);
    const synonyms = filterCategory ? EXPLORE_SERVICE_SYNONYMS[filterCategory] || [filterCategory] : [needle];

    return barberServices.some((s) => {
        const text = (typeof s === 'string' ? s : '').toLowerCase();
        if (!text) return false;
        if (text.includes(needle)) return true;
        return synonyms.some((term) => text.includes(term));
    });
}

export function buildShopIdsByService(
    servicesList: Array<{ shop_id?: string | null; category?: string | null; name?: string | null }>
): Record<string, Set<string>> {
    const map: Record<string, Set<string>> = {};

    const addShop = (key: string, shopId: string | null | undefined) => {
        if (!shopId || !key) return;
        if (!map[key]) map[key] = new Set();
        map[key].add(shopId);
    };

    for (const svc of servicesList) {
        const shopId = svc.shop_id;
        if (!shopId) continue;

        const cat = (svc.category || '').toLowerCase();
        const name = (svc.name || '').toLowerCase();

        for (const [categoryKey, synonyms] of Object.entries(EXPLORE_SERVICE_SYNONYMS)) {
            const terms = synonyms.length ? synonyms : [categoryKey];
            if (terms.some((term) => cat.includes(term) || name.includes(term))) {
                addShop(categoryKey, shopId);
                if (categoryKey === 'haircut') addShop('hair', shopId);
                if (categoryKey === 'beard') addShop('beardtrim', shopId);
            }
        }
    }

    return map;
}

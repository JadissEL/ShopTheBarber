/**
 * Maps Explore filter chips to keywords found in service names/categories.
 * Custom names like "Executive Grooming" still match core haircut filters.
 */
export const EXPLORE_SERVICE_SYNONYMS = {
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

const FILTER_TO_CATEGORY = {
  haircut: 'haircut',
  hair: 'haircut',
  beard: 'beard',
  beardtrim: 'beard',
  'beard trim': 'beard',
  shave: 'shave',
  styling: 'styling',
  facial: 'facial',
};

export function normalizeExploreFilterTag(activeFilter) {
  if (!activeFilter || activeFilter === 'All' || activeFilter === 'Deals') return null;
  const key = activeFilter.toLowerCase().replace(/\s+/g, '');
  if (key === 'beardtrim') return 'beard';
  if (key === 'haircut') return 'haircut';
  return FILTER_TO_CATEGORY[key] || key;
}

export function serviceTextMatchesExploreFilter(category, name, activeFilter) {
  const filterCategory = normalizeExploreFilterTag(activeFilter);
  if (!filterCategory) return false;

  const cat = (category || '').toLowerCase();
  const svcName = (name || '').toLowerCase();
  const haystack = `${cat} ${svcName}`;

  const synonyms = EXPLORE_SERVICE_SYNONYMS[filterCategory] || [filterCategory];
  return synonyms.some((term) => haystack.includes(term));
}

export function barberServicesMatchExploreFilter(barberServices, activeFilter) {
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

/**
 * Shop IDs that offer services matching each explore category key.
 */
export function buildShopIdsByService(servicesList) {
  const map = {};
  const list = Array.isArray(servicesList) ? servicesList : [];

  const addShop = (key, shopId) => {
    if (!shopId || !key) return;
    if (!map[key]) map[key] = new Set();
    map[key].add(shopId);
  };

  for (const svc of list) {
    const shopId = svc.shop_id ?? svc.data?.shop_id;
    if (!shopId) continue;

    const cat = (svc.category || svc.data?.category || '').toLowerCase();
    const name = (svc.name || svc.data?.name || '').toLowerCase();

    for (const [categoryKey, synonyms] of Object.entries(EXPLORE_SERVICE_SYNONYMS)) {
      const terms = synonyms.length ? synonyms : [categoryKey];
      if (terms.some((term) => cat.includes(term) || name.includes(term))) {
        addShop(categoryKey, shopId);
        if (categoryKey === 'haircut') {
          addShop('hair', shopId);
        }
        if (categoryKey === 'beard') {
          addShop('beardtrim', shopId);
        }
      }
    }
  }

  return map;
}

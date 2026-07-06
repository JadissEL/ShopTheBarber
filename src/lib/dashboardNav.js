import {
  getProviderNavGroups,
  getAdminNavGroups,
} from '@/lib/featureRegistry';

/**
 * Flatten sidebar nav groups into a single ordered list (deduped by page).
 */
export function flattenNavGroups(groups) {
  const seen = new Set();
  const items = [];
  for (const group of groups) {
    for (const item of group.items) {
      if (seen.has(item.page)) continue;
      seen.add(item.page);
      items.push(item);
    }
  }
  return items;
}

/** Provider mobile bar — Daily group primaries + More for Grow/Programs/Shop team. */
export function getProviderMobileNav({ isManager = false, isSolo = false } = {}) {
  const groups = getProviderNavGroups({ isManager, isSolo });
  const dailyGroup = groups.find((g) => g.title === 'Daily' || g.title === 'Your brand') ?? groups[0];
  const dailyItems = dailyGroup?.items ?? [];

  const primaryPageOrder = [
    'ProviderDashboard',
    'ProviderBookings',
    'ProviderMessages',
    'ProviderPayouts',
  ];

  const primary = primaryPageOrder
    .map((page) => dailyItems.find((item) => item.page === page))
    .filter(Boolean);

  const primaryPages = new Set(primary.map((item) => item.page));
  const more = flattenNavGroups(groups).filter((item) => !primaryPages.has(item.page));

  return { primary, more, groups };
}

/** Admin mobile bar — Platform group primaries + More for Catalog/Programs/System. */
export function getAdminMobileNav() {
  const groups = getAdminNavGroups();
  const platformGroup = groups.find((g) => g.title === 'Platform') ?? groups[0];
  const platformItems = platformGroup?.items ?? [];

  const primary = platformItems.slice(0, 4);

  const primaryPages = new Set(primary.map((item) => item.page));
  const more = flattenNavGroups(groups).filter((item) => !primaryPages.has(item.page));

  return { primary, more, groups };
}

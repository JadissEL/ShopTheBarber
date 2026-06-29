/** Parse "Paris, Le Marais" { locality, region, country } for schema markup. */
export function parseLocationParts(location, city, countryHint) {
  const raw = (city || location || '').trim();
  if (!raw) {
    return { locality: 'Unknown', region: undefined, country: countryHint || 'US' };
  }
  const parts = raw.split(',').map((p) => p.trim()).filter(Boolean);
  const locality = parts[0] || raw;
  const region = parts[1];
  let country = countryHint;
  if (!country) {
    const lower = raw.toLowerCase();
    if (lower.includes('paris') || lower.includes('lyon') || lower.includes('marseille') || lower.includes('france')) country = 'FR';
    else if (lower.includes('london') || lower.includes('uk')) country = 'GB';
    else if (lower.includes('brussels') || lower.includes('belgium')) country = 'BE';
    else if (lower.includes('montreal') || lower.includes('canada')) country = 'CA';
    else if (lower.includes('athens') || lower.includes('thessaloniki') || lower.includes('greece')) country = 'GR';
    else country = 'US';
  }
  return { locality, region, country };
}

export function siteOrigin() {
  if (typeof window !== 'undefined') return window.location.origin;
  return import.meta.env.VITE_SITE_URL || 'https://shop-the-barber.vercel.app';
}

export function barberProfileUrl(barberId) {
  return `${siteOrigin()}/BarberProfile?id=${encodeURIComponent(barberId)}`;
}

export function shopProfileUrl(shopId) {
  return `${siteOrigin()}/ShopProfile?id=${encodeURIComponent(shopId)}`;
}

export function cityLandingUrl(slug) {
  return `${siteOrigin()}/barbers-in/${encodeURIComponent(slug)}`;
}

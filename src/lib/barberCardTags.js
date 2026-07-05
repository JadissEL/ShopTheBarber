import { Home, Store, Star, Tag, Baby, Users, Sparkles } from 'lucide-react';
import { getServiceLocationModes } from '@/lib/serviceLocation';

/**
 * Icon tags for marketplace barber cards (max 4 visible).
 */
export function buildBarberCardTags(barber, { hasPromo = false, exploreMode = 'topRated' } = {}) {
  const tags = [];
  const hideLocationMode = ['mobile', 'shop', 'mobileGroup', 'group'].includes(exploreMode);
  const modes = getServiceLocationModes(barber);

  if (!hideLocationMode) {
    if (modes.mobile_only || modes.both) {
      tags.push({ key: 'home', icon: Home, label: 'At-home visits' });
    } else if (modes.shop) {
      tags.push({ key: 'shop', icon: Store, label: 'In shop' });
    }
  }

  if (hasPromo) tags.push({ key: 'deal', icon: Tag, label: 'Deal available' });

  if (barber.offers_group_booking && !['group', 'mobileGroup'].includes(exploreMode)) {
    tags.push({ key: 'group', icon: Users, label: 'Group booking' });
  }

  if (barber.children_friendly) {
    tags.push({ key: 'kids', icon: Baby, label: 'Kids welcome' });
  }

  const rating = barber.rating ?? 0;
  const reviews = barber.review_count ?? 0;
  if (rating >= 4.5 && reviews >= 5) {
    tags.push({ key: 'top', icon: Star, label: 'Top rated' });
  }

  if (reviews === 0 && rating === 0) {
    tags.push({ key: 'new', icon: Sparkles, label: 'New' });
  }

  return tags;
}

export function formatBarberLocation(barber) {
  const city = barber.city?.trim();
  const location = barber.location?.trim();
  if (city && location && !location.toLowerCase().includes(city.toLowerCase())) {
    return `${city} · ${location}`;
  }
  return city || location || null;
}

export function formatBarberRatingLine(rating, reviewCount) {
  if (rating > 0) {
    const reviews =
      reviewCount > 0
        ? `${reviewCount} review${reviewCount === 1 ? '' : 's'}`
        : 'No reviews yet';
    return { value: rating.toFixed(1), reviews };
  }
  return { value: 'New', reviews: null };
}

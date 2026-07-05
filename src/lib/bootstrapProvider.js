/**
 * Create barber + shop workspace for new providers (client barber/shop_owner).
 */

import { sovereign } from '@/api/apiClient';

const PROVIDER_INTENT_KEY = 'stb_provider_intent';

/** @typedef {'barber'|'shop'} ProviderIntent */

export function getProviderIntent() {
  try {
    const v = localStorage.getItem(PROVIDER_INTENT_KEY);
    if (v === 'shop' || v === 'barber') return v;
  } catch {
    /* ignore */
  }
  return null;
}

export function setProviderIntent(intent) {
  localStorage.setItem(PROVIDER_INTENT_KEY, intent);
}

export function clearProviderIntent() {
  localStorage.removeItem(PROVIDER_INTENT_KEY);
}

/**
 * @param {{ user: { id: string, email: string, full_name?: string }, intent?: ProviderIntent }} params
 */
export async function bootstrapProviderWorkspace({ user, intent = 'barber' }) {
  if (!user?.id) throw new Error('Sign in required');

  const role = intent === 'shop' ? 'shop_owner' : 'barber';
  await sovereign.entities.User.update(user.id, { role });

  let barber = null;
  const byUser = await sovereign.entities.Barber.filter({ user_id: user.id });
  if (byUser.length > 0) {
    barber = byUser[0];
  } else {
    barber = await sovereign.entities.Barber.create({
      user_id: user.id,
      name: user.full_name?.trim() || 'Your Barber Profile',
      title: intent === 'shop' ? 'Shop Owner' : 'Independent Barber',
      location: '',
      status: 'active',
    });
  }

  const members = await sovereign.entities.ShopMember.filter({ user_id: user.id });
  let shop = null;
  if (members.length > 0) {
    shop = await sovereign.entities.Shop.get(members[0].shop_id).catch(() => null);
  } else {
    const shopName =
      intent === 'shop'
        ? `${user.full_name?.trim() || 'My'} Barbershop`
        : `${user.full_name?.trim() || 'My'} Chair`;
    shop = await sovereign.entities.Shop.create({
      name: shopName,
      location: 'Add your address in the next step',
      description: '',
      owner_id: user.id,
    });
    await sovereign.entities.ShopMember.create({
      shop_id: shop.id,
      user_id: user.id,
      barber_id: barber.id,
      role: 'owner',
      status: 'active',
      booking_enabled: true,
    });
    if (!barber.shop_id) {
      await sovereign.entities.Barber.update(barber.id, { shop_id: shop.id });
    }
  }

  return { barber, shop, role };
}

export function invalidateOnboardingQueries(queryClient) {
  const keys = [
    ['onboarding-barber'],
    ['onboarding-shop-member'],
    ['onboarding-shop'],
    ['onboarding-services'],
    ['onboarding-shifts'],
    ['onboarding-bookings'],
    ['currentUser'],
    ['my-barber-profile'],
    ['my-shop-membership'],
    ['my-shop'],
  ];
  for (const key of keys) {
    queryClient.invalidateQueries({ queryKey: key });
  }
  queryClient.invalidateQueries({ queryKey: ['provider-workspace'] });
  queryClient.invalidateQueries({ queryKey: ['currentUser'] });
}

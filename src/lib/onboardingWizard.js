/**
 * Role-based onboarding wizard, step definitions, storage, and completion rules.
 */

import { createPageUrl } from '@/utils';
import { isFeatureEnabled } from '@/lib/featureRegistry';
import { dashboardPageForAccountType, accountTypeFromRole } from '@/lib/accountType';

/** @typedef {'client'|'barber'|'shop_owner'|'provider'|'admin'} OnboardingRole */

/** @typedef {{ id: string, title: string, description: string, required?: boolean, optional?: boolean, icon?: string, href?: string, settingsTab?: string, embed?: string }} OnboardingStep */

const STORAGE_VERSION = 'v1';

/** Normalize auth role to onboarding role */
export function normalizeOnboardingRole(role) {
  if (role === 'admin') return 'admin';
  if (role === 'shop_owner') return 'shop_owner';
  if (role === 'barber' || role === 'provider') return 'provider';
  if (role === 'seller') return 'seller';
  if (role === 'company') return 'company';
  if (role === 'blogger') return 'blogger';
  return 'client';
}

/** Stable key segment for localStorage (shop_owner kept distinct from provider) */
export function canonicalOnboardingRole(role) {
  if (role === 'shop_owner') return 'shop_owner';
  return normalizeOnboardingRole(role);
}

export function onboardingStorageKey(userId, role) {
  return `stb_onboarding_${STORAGE_VERSION}_${userId || 'anon'}_${canonicalOnboardingRole(role)}`;
}

export function resetOnboarding(userId, role) {
  try {
    localStorage.removeItem(onboardingStorageKey(userId, role));
    sessionStorage.removeItem(ONBOARDING_REDIRECT_ONCE_KEY);
  } catch {
    /* ignore */
  }
}

/** @returns {{ dismissed: boolean, finishedAt?: string, lastStepId?: string }} */
export function readOnboardingState(userId, role) {
  try {
    const raw = localStorage.getItem(onboardingStorageKey(userId, role));
    if (!raw) return { dismissed: false };
    return JSON.parse(raw);
  } catch {
    return { dismissed: false };
  }
}

export function writeOnboardingState(userId, role, patch) {
  const prev = readOnboardingState(userId, role);
  localStorage.setItem(
    onboardingStorageKey(userId, role),
    JSON.stringify({ ...prev, ...patch }),
  );
}

export function dismissOnboarding(userId, role) {
  writeOnboardingState(userId, role, {
    dismissed: true,
    finishedAt: new Date().toISOString(),
  });
}

export function markOnboardingFinished(userId, role, lastStepId) {
  writeOnboardingState(userId, role, {
    dismissed: true,
    finishedAt: new Date().toISOString(),
    lastStepId,
  });
}

/** Prevent post-finish bounce back to SetupGuide when required steps are still open. */
export function markOnboardingRedirectComplete() {
  try {
    sessionStorage.setItem(ONBOARDING_REDIRECT_ONCE_KEY, 'completed');
  } catch {
    /* ignore */
  }
}

export function isOnboardingRedirectComplete() {
  try {
    return sessionStorage.getItem(ONBOARDING_REDIRECT_ONCE_KEY) === 'completed';
  } catch {
    return false;
  }
}

/** Mark a guide step visited (client/admin tours + resume) */
export function markGuideStepVisited(userId, role, stepId) {
  const state = readOnboardingState(userId, role);
  const visited = new Set(state.visitedSteps ?? []);
  visited.add(stepId);
  writeOnboardingState(userId, role, { visitedSteps: [...visited] });
}

export function isPlaceholderAddress(value) {
  if (!value?.trim()) return true;
  const v = String(value).toLowerCase();
  return v.includes('add your address');
}

const PLACEHOLDER_COMPANY_DESCRIPTION = 'Complete your company profile to start hiring.';

export function isPlaceholderCompanyDescription(value) {
  if (!value?.trim()) return true;
  return value.trim() === PLACEHOLDER_COMPANY_DESCRIPTION;
}

export function isDefaultSellerStoreName(value) {
  if (!value?.trim()) return true;
  return value.trim() === 'My Store';
}

/** @param {OnboardingStep[]} steps */
export function getResumeStepIndex(steps, completion, storageState) {
  if (storageState?.finishedAt || storageState?.dismissed) {
    return Math.max(0, steps.length - 1);
  }
  if (storageState?.lastStepId) {
    const savedIdx = steps.findIndex((s) => s.id === storageState.lastStepId);
    if (savedIdx >= 0) return savedIdx;
  }
  return getInitialStepIndex(steps, completion);
}

export function persistOnboardingStep(userId, role, stepId) {
  if (!userId || !stepId) return;
  writeOnboardingState(userId, role, { lastStepId: stepId });
}

/** Whether user can leave a required step without completing embed */
export function canAdvanceFromStep(step, completion) {
  if (!step) return false;
  if (step.optional) return true;
  if (!step.required) return true;
  return Boolean(completion[step.id]);
}

/**
 * First incomplete required step, else first incomplete optional, else 0.
 * @param {OnboardingStep[]} steps
 * @param {Record<string, boolean>} completion
 */
export function getInitialStepIndex(steps, completion) {
  const requiredIdx = steps.findIndex(
    (s) => s.required && s.id !== 'welcome' && !completion[s.id],
  );
  if (requiredIdx >= 0) return requiredIdx;

  const anyIdx = steps.findIndex((s) => s.id !== 'welcome' && !completion[s.id]);
  return anyIdx >= 0 ? anyIdx : 0;
}

/** Resolve onboarding role from account type (canonical) or legacy role */
export function resolveOnboardingRole(userRole, authRole, _providerIntent, accountType) {
  const dbRole = userRole || authRole || 'client';
  if (['admin', 'barber', 'shop_owner', 'provider', 'seller', 'company', 'blogger'].includes(dbRole)) {
    return normalizeOnboardingRole(dbRole);
  }
  if (accountType === 'shop') return 'shop_owner';
  if (accountType === 'solo_barber') return 'provider';
  if (accountType === 'seller') return 'seller';
  if (accountType === 'company') return 'company';
  if (accountType === 'blogger') return 'blogger';
  return 'client';
}

/** @param {OnboardingRole} role */
export function getOnboardingSteps(role) {
  const normalized = role === 'barber' ? 'provider' : role;

  if (normalized === 'admin') {
    return /** @type {OnboardingStep[]} */ ([
      {
        id: 'welcome',
        title: 'Welcome to the admin console',
        description: 'You manage platform health, finances, users, and disputes from here. This short guide shows where everything lives.',
      },
      {
        id: 'financials',
        title: 'Platform financials',
        description: 'Review revenue, commissions, payouts, and fixed-fee plans across the network.',
        href: 'GlobalFinancials',
      },
      {
        id: 'users',
        title: 'Users & moderation',
        description: 'Flag, suspend, or restore accounts. Open a user to see booking history and notes.',
        href: 'AdminUserModeration',
      },
      {
        id: 'orders',
        title: 'Orders & marketplace',
        description: 'Track product orders, seller fulfillment, and marketplace catalog approvals.',
        href: 'AdminOrders',
        optional: !isFeatureEnabled('marketplace'),
      },
      {
        id: 'analytics',
        title: 'Product analytics',
        description: 'Funnels, cohorts, and fee adoption, use this to measure onboarding and booking conversion.',
        href: 'AdminProductAnalytics',
      },
      {
        id: 'health',
        title: 'Support & platform health',
        description: 'Support inbox, backups, and readiness checks keep production stable.',
        href: 'AdminPlatformHealth',
      },
    ]).filter((s) => !s.optional);
  }

  if (normalized === 'provider' || normalized === 'shop_owner') {
    return /** @type {OnboardingStep[]} */ ([
      {
        id: 'welcome',
        title: 'Open for bookings in ~5 minutes',
        description: 'Four quick steps, profile, services, hours, and Stripe payouts, then clients can book and pay you online.',
      },
      {
        id: 'profile',
        title: 'Profile & business details',
        description: 'Add your name, shop or chair name, address, and a short bio so clients trust your listing.',
        href: 'ProviderSettings',
        settingsTab: 'general',
        embed: 'profile',
        required: true,
      },
      {
        id: 'services',
        title: 'Services & pricing',
        description: 'List haircuts, beard trims, and packages with duration and price, clients book from this menu.',
        href: 'ProviderSettings',
        settingsTab: 'services',
        embed: 'services',
        required: true,
      },
      {
        id: 'availability',
        title: 'Availability & hours',
        description: 'Set weekly hours and time off so the booking calendar only shows real open slots.',
        href: 'ProviderSettings',
        settingsTab: 'hours',
        embed: 'availability',
        required: true,
      },
      {
        id: 'stripe',
        title: 'Stripe Connect payouts',
        description: 'Link your bank account via Stripe to receive card payments and automatic payouts after appointments.',
        href: 'ProviderSettings',
        settingsTab: 'payments',
        embed: 'stripe',
        required: true,
      },
      {
        id: 'fixed_fee',
        title: 'Optional fixed-fee plan',
        description: 'Instead of per-booking commission, enroll in a monthly or annual fixed fee and waive commission for the coverage period.',
        href: 'ProviderPayouts',
        optional: true,
      },
      {
        id: 'dashboard',
        title: 'Your dashboard',
        description: 'Track bookings, messages, payouts, and reviews from the provider home screen.',
        href: 'ProviderDashboard',
      },
    ]);
  }

  if (normalized === 'seller') {
    return /** @type {OnboardingStep[]} */ ([
      {
        id: 'welcome',
        title: 'Welcome to your seller workspace',
        description: 'List grooming products, manage orders, and track sales — without appointment booking tools.',
      },
      {
        id: 'profile',
        title: 'Seller profile',
        description: 'Add your business name and contact details so buyers recognize your brand on the marketplace.',
        href: 'SellerDashboard',
        embed: 'profile',
        required: true,
      },
      {
        id: 'products',
        title: 'Add your first product',
        description: 'Create a draft listing with name, price, and category before submitting for review.',
        href: 'MarketplaceProductEditor',
        embed: 'products',
        optional: !isFeatureEnabled('marketplace'),
      },
      {
        id: 'stripe',
        title: 'Payout setup',
        description: 'Connect Stripe so you receive payouts when orders ship.',
        href: 'SellerDashboard',
        embed: 'stripe',
        optional: true,
      },
      {
        id: 'dashboard',
        title: 'Seller dashboard',
        description: 'Orders, analytics, and catalog management live on your seller home.',
        href: 'SellerDashboard',
      },
    ]).filter((s) => !s.optional);
  }

  if (normalized === 'company') {
    return /** @type {OnboardingStep[]} */ ([
      {
        id: 'welcome',
        title: 'Welcome to your company workspace',
        description: 'Build your employer brand, post open roles, and manage candidates in one place.',
      },
      {
        id: 'profile',
        title: 'Company profile',
        description: 'Add your company name, logo, and description so candidates know who you are.',
        href: 'CompanyDashboard',
        embed: 'profile',
        required: true,
      },
      {
        id: 'jobs',
        title: 'Post your first job',
        description: 'Create a role listing with requirements, location, and compensation details.',
        href: 'CreateJob',
        embed: 'jobs',
        optional: !isFeatureEnabled('careers'),
      },
      {
        id: 'products',
        title: 'Optional product sales',
        description: 'Companies can also sell products on the marketplace alongside recruitment.',
        href: 'ProviderMarketplaceProducts',
        optional: !isFeatureEnabled('marketplace'),
      },
      {
        id: 'dashboard',
        title: 'Company dashboard',
        description: 'Track applications, job performance, and employer analytics from home.',
        href: 'CompanyDashboard',
      },
    ]).filter((s) => !s.optional);
  }

  if (normalized === 'blogger') {
    return /** @type {OnboardingStep[]} */ ([
      {
        id: 'welcome',
        title: 'Welcome, creator',
        description: 'Publish articles, grow your audience, and optionally sell products — with full client booking abilities.',
      },
      {
        id: 'profile',
        title: 'Author profile',
        description: 'Set your pen name and bio so readers recognize your byline across the blog.',
        href: 'BloggerDashboard',
        embed: 'profile',
        required: true,
      },
      {
        id: 'article',
        title: 'Write your first article',
        description: 'Draft a post with photos and categories, then submit for editorial review.',
        href: 'BlogArticleEditor',
        embed: 'article',
        optional: !isFeatureEnabled('content'),
      },
      {
        id: 'explore',
        title: 'Book services as a client',
        description: 'Blogger accounts include client booking — find barbers and manage your own appointments.',
        href: 'Explore',
      },
      {
        id: 'dashboard',
        title: 'Blogger dashboard',
        description: 'Content stats, drafts, and quick actions live on your creator home.',
        href: 'BloggerDashboard',
      },
    ]).filter((s) => !s.optional);
  }

  // Client
  const clientSteps = /** @type {OnboardingStep[]} */ ([
    {
      id: 'welcome',
      title: 'Welcome to ShopTheBarber',
      description: 'Your personal hub for booking barbers, tracking appointments, and earning loyalty rewards.',
    },
    {
      id: 'profile',
      title: 'Complete your profile',
      description: 'Add your name and phone so barbers can confirm appointments and send reminders.',
      href: 'AccountSettings',
      required: true,
    },
    {
      id: 'explore',
      title: 'Find a barber',
      description: 'Browse on the map or list, filter by city, specialty, and ratings, then view profiles before you book.',
      href: 'Explore',
    },
    {
      id: 'book',
      title: 'Book an appointment',
      description: 'Pick services, choose a time, and pay a deposit or save your card, all in a guided flow.',
      href: 'BookingFlow',
    },
    {
      id: 'bookings',
      title: 'Manage bookings',
      description: 'Upcoming and past visits live under Bookings. Reschedule or review from one place.',
      href: 'UserBookings',
    },
    {
      id: 'loyalty',
      title: 'Loyalty & rewards',
      description: 'Earn points on completed visits and redeem them at checkout for discounts.',
      href: 'Loyalty',
      optional: !isFeatureEnabled('engagement'),
    },
    {
      id: 'marketplace',
      title: 'Marketplace & bag',
      description: 'Shop grooming products, save favorites, and check out from your shopping bag.',
      href: 'Marketplace',
      optional: !isFeatureEnabled('marketplace'),
    },
    {
      id: 'dashboard',
      title: 'Your dashboard',
      description: 'Home shows your next appointment, quick actions, and personalized barber picks.',
      href: 'Dashboard',
    },
  ]);

  return clientSteps.filter((s) => !s.optional);
}

/**
 * Compute per-step completion from live account data.
 * @param {object} ctx
 */
export function computeStepCompletion(ctx) {
  const {
    role,
    user,
    barber,
    shop,
    servicesCount = 0,
    shiftsCount = 0,
    bookingsCount = 0,
    sellerProfile,
    companyProfile,
    authorProfile,
    productsCount = 0,
    jobsCount = 0,
    articlesCount = 0,
  } = ctx;

  const normalized = normalizeOnboardingRole(role);

  if (normalized === 'admin') {
    const visited = new Set(readOnboardingState(user?.id, role).visitedSteps ?? []);
    return {
      welcome: true,
      financials: visited.has('financials'),
      users: visited.has('users'),
      orders: visited.has('orders'),
      analytics: visited.has('analytics'),
      health: visited.has('health'),
    };
  }

  if (normalized === 'provider' || role === 'shop_owner') {
    const shopProfileOk =
      Boolean(shop?.name?.trim()) && !isPlaceholderAddress(shop?.location);
    const barberProfileOk =
      Boolean(barber?.name?.trim()) && !isPlaceholderAddress(barber?.location);
    const profileOk = shopProfileOk || barberProfileOk;
    const stripeOk = user?.stripe_connect_status === 'active';

    return {
      welcome: true,
      profile: profileOk,
      services: servicesCount > 0,
      availability: shiftsCount > 0,
      stripe: stripeOk,
      fixed_fee: true, // optional, always passable
      dashboard: profileOk && servicesCount > 0,
    };
  }

  const profileOk = Boolean(user?.full_name?.trim()) && Boolean(user?.phone?.trim());
  const visited = new Set(readOnboardingState(user?.id, role).visitedSteps ?? []);

  if (normalized === 'seller') {
    const sellerProfileOk =
      Boolean(sellerProfile?.display_name?.trim()) &&
      !isDefaultSellerStoreName(sellerProfile.display_name) &&
      Boolean(user?.phone?.trim());
    return {
      welcome: true,
      profile: sellerProfileOk,
      products: productsCount > 0,
      stripe: user?.stripe_connect_status === 'active',
      dashboard: sellerProfileOk && productsCount > 0,
    };
  }

  if (normalized === 'company') {
    const companyProfileOk =
      Boolean(companyProfile?.name?.trim()) &&
      Boolean(companyProfile?.description?.trim()) &&
      !isPlaceholderCompanyDescription(companyProfile.description);
    return {
      welcome: true,
      profile: companyProfileOk,
      jobs: jobsCount > 0,
      products: visited.has('products'),
      dashboard: companyProfileOk && jobsCount > 0,
    };
  }

  if (normalized === 'blogger') {
    const authorProfileOk =
      Boolean(authorProfile?.pen_name?.trim()) &&
      Boolean(authorProfile?.bio?.trim()) &&
      authorProfile.bio.trim().length >= 20;
    return {
      welcome: true,
      profile: authorProfileOk,
      article: articlesCount > 0,
      explore: visited.has('explore') || bookingsCount > 0,
      dashboard: authorProfileOk && articlesCount > 0,
    };
  }

  return {
    welcome: true,
    profile: profileOk,
    explore: visited.has('explore') || bookingsCount > 0,
    book: visited.has('book') || bookingsCount > 0,
    bookings: visited.has('bookings') || bookingsCount > 0,
    loyalty: visited.has('loyalty') || true,
    marketplace: visited.has('marketplace') || true,
    dashboard: visited.has('dashboard') || profileOk,
  };
}

export function getStepHref(step) {
  if (!step.href) return null;
  const base = createPageUrl(step.href);
  if (step.settingsTab) {
    return `${base}?tab=${step.settingsTab}`;
  }
  return base;
}

/**
 * @param {OnboardingStep[]} steps
 * @param {Record<string, boolean>} completion
 */
export function getOnboardingProgress(steps, completion) {
  const required = steps.filter((s) => s.required && s.id !== 'welcome');
  const requiredDone = required.filter((s) => completion[s.id]).length;
  const total = steps.length;
  const done = steps.filter((s) => completion[s.id]).length;
  const allRequiredDone = required.length === 0 || required.every((s) => completion[s.id]);
  const percent = total > 0 ? Math.round((done / total) * 100) : 100;

  return {
    total,
    done,
    requiredTotal: required.length,
    requiredDone,
    allRequiredDone,
    percent,
  };
}

/** Steps required before Stripe can pay out (Booksy/Squire-style fast path). */
export const PAYOUT_READY_STEP_IDS = ['profile', 'services', 'availability', 'stripe'];

/** @param {Record<string, boolean>} completion */
export function isPayoutReady(completion) {
  return PAYOUT_READY_STEP_IDS.every((id) => Boolean(completion[id]));
}

/**
 * Progress toward first payout, only the four required setup steps.
 * @param {OnboardingStep[]} steps
 * @param {Record<string, boolean>} completion
 */
export function getPayoutReadyProgress(steps, completion) {
  const payoutSteps = steps.filter((s) => PAYOUT_READY_STEP_IDS.includes(s.id));
  const done = payoutSteps.filter((s) => completion[s.id]).length;
  const total = payoutSteps.length;
  const percent = total > 0 ? Math.round((done / total) * 100) : 100;
  const nextStepRaw = payoutSteps.find((s) => !completion[s.id]) ?? null;
  const nextStep = nextStepRaw
    ? { ...nextStepRaw, href: getStepHref(nextStepRaw) }
    : null;

  return {
    total,
    done,
    percent,
    allDone: done >= total,
    nextStep,
    steps: payoutSteps.map((s) => ({
      id: s.id,
      title: s.title,
      done: Boolean(completion[s.id]),
      href: getStepHref(s),
    })),
  };
}

/** Show payout setup widget on provider dashboard until Stripe Connect is active. */
export function shouldShowPayoutSetupOnDashboard(role, completion) {
  if (role === 'shop_owner') return !isPayoutReady(completion);
  return normalizeOnboardingRole(role) === 'provider' && !isPayoutReady(completion);
}

export function shouldShowOnboardingPrompt(userId, role, progress) {
  if (!userId) return false;
  const state = readOnboardingState(userId, role);
  if (state.dismissed || state.finishedAt) return false;
  if (progress.requiredTotal > 0) return !progress.allRequiredDone;
  // Guide-only flows (client discovery, admin tour): show until finished or dismissed
  return true;
}

export function getDashboardPathForRole(role) {
  const normalized = role === 'provider' ? 'barber' : role;
  return createPageUrl(dashboardPageForAccountType(accountTypeFromRole(normalized)));
}

export function getDashboardPathForAccountType(accountType) {
  return createPageUrl(dashboardPageForAccountType(accountType));
}

export function getSetupGuidePath() {
  return createPageUrl('SetupGuide');
}

/** Role-specific subtitle for the setup guide page header */
export function getSetupGuideSubtitle(role) {
  const normalized = normalizeOnboardingRole(role);
  if (normalized === 'provider' || role === 'shop_owner') {
    return 'Complete your profile and payout details to start earning';
  }
  if (normalized === 'seller') {
    return 'Set up your seller profile and catalog to start selling';
  }
  if (normalized === 'company') {
    return 'Build your company profile and post roles to attract talent';
  }
  if (normalized === 'blogger') {
    return 'Complete your author profile and publish your first story';
  }
  if (normalized === 'admin') {
    return 'Tour the admin console and key tools';
  }
  return 'Complete your profile to get the most from ShopTheBarber';
}

/** Human-readable role label for the setup guide badge */
export function getSetupGuideRoleLabel(role) {
  const normalized = normalizeOnboardingRole(role);
  if (normalized === 'admin') return 'Admin';
  if (normalized === 'provider' || role === 'shop_owner') return 'Provider';
  if (normalized === 'seller') return 'Seller';
  if (normalized === 'company') return 'Company';
  if (normalized === 'blogger') return 'Blogger';
  return 'Client';
}

export const ONBOARDING_REDIRECT_ONCE_KEY = 'stb_onboarding_redirect_once';

export function clearOnboardingRedirectSession() {
  try {
    sessionStorage.removeItem(ONBOARDING_REDIRECT_ONCE_KEY);
  } catch {
    /* ignore */
  }
}

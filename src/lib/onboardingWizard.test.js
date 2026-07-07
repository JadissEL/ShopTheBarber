import { describe, it, expect, beforeEach } from 'vitest';
import {
  getOnboardingSteps,
  computeStepCompletion,
  getOnboardingProgress,
  normalizeOnboardingRole,
  onboardingStorageKey,
  readOnboardingState,
  dismissOnboarding,
  markOnboardingFinished,
  shouldShowOnboardingPrompt,
  resolveOnboardingRole,
  getInitialStepIndex,
  markGuideStepVisited,
  resetOnboarding,
  canonicalOnboardingRole,
  isPlaceholderAddress,
  getResumeStepIndex,
  persistOnboardingStep,
  canAdvanceFromStep,
  isPayoutReady,
  getPayoutReadyProgress,
  shouldShowPayoutSetupOnDashboard,
  PAYOUT_READY_STEP_IDS,
  getSetupGuideSubtitle,
  getSetupGuideRoleLabel,
  isPlaceholderCompanyDescription,
  isDefaultSellerStoreName,
} from '@/lib/onboardingWizard';

describe('onboardingWizard', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('normalizes roles', () => {
    expect(normalizeOnboardingRole('barber')).toBe('provider');
    expect(normalizeOnboardingRole('client')).toBe('client');
    expect(normalizeOnboardingRole('admin')).toBe('admin');
  });

  it('returns provider steps with required setup items', () => {
    const steps = getOnboardingSteps('provider');
    const ids = steps.map((s) => s.id);
    expect(ids).toContain('profile');
    expect(ids).toContain('services');
    expect(ids).toContain('availability');
    expect(ids).toContain('stripe');
    expect(ids).toContain('fixed_fee');
  });

  it('returns client discovery steps', () => {
    const steps = getOnboardingSteps('client');
    expect(steps.some((s) => s.id === 'explore')).toBe(true);
    expect(steps.some((s) => s.id === 'book')).toBe(true);
  });

  it('computes provider completion from data', () => {
    const completion = computeStepCompletion({
      role: 'provider',
      user: { stripe_connect_status: 'active' },
      barber: { name: 'Alex Cuts', location: '123 Main St' },
      shop: { name: 'Studio', location: 'Add your address in the next step' },
      servicesCount: 2,
      shiftsCount: 5,
    });
    expect(completion.profile).toBe(true);
    expect(completion.services).toBe(true);
    expect(completion.availability).toBe(true);
    expect(completion.stripe).toBe(true);
  });

  it('rejects placeholder addresses', () => {
    expect(isPlaceholderAddress('Add your address in the next step')).toBe(true);
    expect(isPlaceholderAddress('42 King St, Athens')).toBe(false);
  });

  it('resumes from lastStepId when saved', () => {
    const steps = getOnboardingSteps('client');
    persistOnboardingStep('u4', 'client', 'book');
    const state = readOnboardingState('u4', 'client');
    const completion = { welcome: true, profile: false };
    expect(getResumeStepIndex(steps, completion, state)).toBe(
      steps.findIndex((s) => s.id === 'book'),
    );
  });

  it('blocks advance on incomplete required steps', () => {
    const steps = getOnboardingSteps('provider');
    const profile = steps.find((s) => s.id === 'profile');
    expect(canAdvanceFromStep(profile, { profile: false })).toBe(false);
    expect(canAdvanceFromStep(profile, { profile: true })).toBe(true);
  });

  it('tracks progress percent', () => {
    const steps = getOnboardingSteps('client');
    const completion = Object.fromEntries(steps.map((s) => [s.id, s.id === 'welcome']));
    const progress = getOnboardingProgress(steps, completion);
    expect(progress.percent).toBeGreaterThan(0);
    expect(progress.total).toBe(steps.length);
  });

  it('persists dismiss state', () => {
    dismissOnboarding('user-1', 'client');
    expect(readOnboardingState('user-1', 'client').dismissed).toBe(true);
    expect(onboardingStorageKey('user-1', 'client')).toContain('user-1');
  });

  it('hides prompt when dismissed', () => {
    const steps = getOnboardingSteps('client');
    const completion = computeStepCompletion({ role: 'client', user: { id: 'u1' } });
    const progress = getOnboardingProgress(steps, completion);
    expect(shouldShowOnboardingPrompt('u1', 'client', progress)).toBe(true);
    dismissOnboarding('u1', 'client');
    expect(shouldShowOnboardingPrompt('u1', 'client', progress)).toBe(false);
  });

  it('hides prompt when onboarding is marked finished', () => {
    const steps = getOnboardingSteps('provider');
    const completion = computeStepCompletion({
      role: 'provider',
      user: { id: 'p1' },
      barber: { name: 'Alex', location: '1 Main' },
      shop: { name: 'Shop', location: '1 Main' },
      servicesCount: 0,
      shiftsCount: 0,
    });
    const progress = getOnboardingProgress(steps, completion);
    expect(shouldShowOnboardingPrompt('p1', 'provider', progress)).toBe(true);
    markOnboardingFinished('p1', 'provider', 'dashboard');
    expect(shouldShowOnboardingPrompt('p1', 'provider', progress)).toBe(false);
  });

  it('shows admin tour until finished', () => {
    const steps = getOnboardingSteps('admin');
    const completion = computeStepCompletion({ role: 'admin', user: { id: 'a1' } });
    const progress = getOnboardingProgress(steps, completion);
    expect(progress.requiredTotal).toBe(0);
    expect(shouldShowOnboardingPrompt('a1', 'admin', progress)).toBe(true);
  });

  it('resolves account type for onboarding role', () => {
    expect(resolveOnboardingRole('client', 'client', null, 'solo_barber')).toBe('provider');
    expect(resolveOnboardingRole('client', 'client', null, 'shop')).toBe('shop_owner');
    expect(resolveOnboardingRole('barber', 'barber', null, 'solo_barber')).toBe('provider');
    expect(resolveOnboardingRole('client', 'client', null, 'seller')).toBe('seller');
    expect(resolveOnboardingRole('client', 'client', null, 'blogger')).toBe('blogger');
  });

  it('returns seller-specific onboarding steps', () => {
    const steps = getOnboardingSteps('seller');
    expect(steps.some((s) => s.id === 'products')).toBe(true);
    expect(steps[0].id).toBe('welcome');
  });

  it('computes seller completion from typed profile and products', () => {
    const completion = computeStepCompletion({
      role: 'seller',
      user: { id: 's1', phone: '+15551234', stripe_connect_status: 'active' },
      sellerProfile: { display_name: 'Groom Co' },
      productsCount: 1,
    });
    expect(completion.profile).toBe(true);
    expect(completion.products).toBe(true);
    expect(completion.stripe).toBe(true);
  });

  it('rejects default seller store name for profile completion', () => {
    expect(isDefaultSellerStoreName('My Store')).toBe(true);
    const completion = computeStepCompletion({
      role: 'seller',
      user: { id: 's2', phone: '+15551234' },
      sellerProfile: { display_name: 'My Store' },
    });
    expect(completion.profile).toBe(false);
  });

  it('computes company completion from company profile and jobs', () => {
    expect(isPlaceholderCompanyDescription('Complete your company profile to start hiring.')).toBe(true);
    const completion = computeStepCompletion({
      role: 'company',
      user: { id: 'c1' },
      companyProfile: {
        name: 'Acme Salon',
        description: 'We operate premium barbershops across the region with strong benefits.',
      },
      jobsCount: 1,
    });
    expect(completion.profile).toBe(true);
    expect(completion.jobs).toBe(true);
  });

  it('computes blogger completion from author profile and articles', () => {
    const completion = computeStepCompletion({
      role: 'blogger',
      user: { id: 'b1' },
      authorProfile: {
        pen_name: 'Clip Chronicles',
        bio: 'I write about grooming trends, chair culture, and product reviews for modern barbers.',
      },
      articlesCount: 1,
      bookingsCount: 1,
    });
    expect(completion.profile).toBe(true);
    expect(completion.article).toBe(true);
    expect(completion.explore).toBe(true);
  });

  it('returns role-specific setup guide labels', () => {
    expect(getSetupGuideRoleLabel('seller')).toBe('Seller');
    expect(getSetupGuideRoleLabel('company')).toBe('Company');
    expect(getSetupGuideRoleLabel('blogger')).toBe('Blogger');
    expect(getSetupGuideRoleLabel('barber')).toBe('Provider');
  });

  it('returns role-specific setup guide subtitles', () => {
    expect(getSetupGuideSubtitle('seller')).toMatch(/seller/i);
    expect(getSetupGuideSubtitle('company')).toMatch(/company/i);
    expect(getSetupGuideSubtitle('blogger')).toMatch(/author/i);
    expect(getSetupGuideSubtitle('barber')).toMatch(/payout/i);
  });

  it('resumes at first incomplete step', () => {
    const steps = getOnboardingSteps('client');
    const completion = { welcome: true, profile: false, explore: false };
    expect(getInitialStepIndex(steps, completion)).toBe(steps.findIndex((s) => s.id === 'profile'));
  });

  it('tracks visited guide steps', () => {
    markGuideStepVisited('u2', 'client', 'explore');
    const state = readOnboardingState('u2', 'client');
    expect(state.visitedSteps).toContain('explore');
  });

  it('resets onboarding for replay', () => {
    dismissOnboarding('u3', 'client');
    expect(readOnboardingState('u3', 'client').dismissed).toBe(true);
    resetOnboarding('u3', 'client');
    expect(readOnboardingState('u3', 'client').dismissed).toBe(false);
  });

  it('uses canonical storage role', () => {
    expect(canonicalOnboardingRole('shop_owner')).toBe('shop_owner');
    expect(canonicalOnboardingRole('barber')).toBe('provider');
    expect(onboardingStorageKey('x', 'barber')).toContain('_provider');
  });

  it('computes payout-ready progress from four required steps', () => {
    const steps = getOnboardingSteps('provider');
    expect(PAYOUT_READY_STEP_IDS).toEqual(['profile', 'services', 'availability', 'stripe']);

    const partial = computeStepCompletion({
      role: 'provider',
      user: { stripe_connect_status: 'pending' },
      barber: { name: 'Alex', location: '1 Main' },
      servicesCount: 1,
      shiftsCount: 0,
    });
    const payoutPartial = getPayoutReadyProgress(steps, partial);
    expect(payoutPartial.total).toBe(4);
    expect(payoutPartial.done).toBe(2);
    expect(payoutPartial.percent).toBe(50);
    expect(isPayoutReady(partial)).toBe(false);
    expect(shouldShowPayoutSetupOnDashboard('provider', partial)).toBe(true);

    const ready = computeStepCompletion({
      role: 'provider',
      user: { stripe_connect_status: 'active' },
      barber: { name: 'Alex', location: '1 Main' },
      servicesCount: 2,
      shiftsCount: 3,
    });
    expect(isPayoutReady(ready)).toBe(true);
    expect(getPayoutReadyProgress(steps, ready).percent).toBe(100);
    expect(shouldShowPayoutSetupOnDashboard('provider', ready)).toBe(false);
  });
});

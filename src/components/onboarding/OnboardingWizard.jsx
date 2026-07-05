import { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  Circle,
  X,
  ExternalLink,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MetaTags } from '@/components/seo/MetaTags';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';
import { useAuth } from '@/lib/AuthContext';
import { sovereign } from '@/api/apiClient';
import {
  dismissOnboarding,
  markOnboardingFinished,
  markGuideStepVisited,
  getStepHref,
  getDashboardPathForRole,
  getResumeStepIndex,
  readOnboardingState,
  persistOnboardingStep,
  canAdvanceFromStep,
  markOnboardingRedirectComplete,
} from '@/lib/onboardingWizard';
import { OnboardingProviderEmbed } from '@/components/onboarding/OnboardingProviderEmbed';
import { OnboardingClientEmbed } from '@/components/onboarding/OnboardingClientEmbed';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';
import { toast } from 'sonner';

/** Embed steps ship their own save/back/continue controls — hide wizard footer to avoid duplicates. */
const EMBED_STEPS_WITH_OWN_NAV = new Set(['profile', 'services', 'availability']);

/**
 * @param {{ mode?: 'page' | 'dialog', onClose?: () => void, initialStep?: number }} props
 */
export default function OnboardingWizard({ mode = 'page', onClose, initialStep }) {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { refreshUser } = useAuth();
  const {
    role,
    steps,
    completion,
    progress,
    payoutReady,
    user,
    refresh,
    isLoading,
    syncBlocked,
    syncError,
    retrySync,
  } = useOnboardingProgress();

  const initKeyRef = useRef(null);
  const [stepIndex, setStepIndex] = useState(0);

  const step = steps[stepIndex];
  const isLast = stepIndex >= steps.length - 1;
  const isFirst = stepIndex === 0;
  const stepComplete = step ? completion[step.id] : false;
  const href = step ? getStepHref(step) : null;
  const isProviderFlow = role === 'provider' || role === 'shop_owner';
  const _canAdvance = canAdvanceFromStep(step, completion);

  // Resume once per user/role, never jump when completion updates mid-step
  useEffect(() => {
    if (isLoading || !user?.id || steps.length === 0) return;

    const key = `${user.id}:${role}:${steps.length}`;
    if (initKeyRef.current === key) return;

    const state = readOnboardingState(user.id, role);
    const idx =
      typeof initialStep === 'number'
        ? initialStep
        : getResumeStepIndex(steps, completion, state);

    setStepIndex(Math.min(Math.max(0, idx), steps.length - 1));
    initKeyRef.current = key;
  }, [isLoading, user?.id, role, steps, completion, initialStep]);

  useEffect(() => {
    if (step?.id && user?.id) {
      persistOnboardingStep(user.id, role, step.id);
    }
  }, [step?.id, user?.id, role]);

  useEffect(() => {
    const stripeReturn = searchParams.get('stripe');
    if (stripeReturn !== 'return' || !user?.id) return;

    const run = async () => {
      try {
        await sovereign.functions.invoke('checkStripeConnectStatus', { userId: user.id });
      } catch {
        /* refresh still runs */
      }
      await refreshUser?.();
      refresh();
      const stripeIdx = steps.findIndex((s) => s.id === 'stripe');
      if (stripeIdx >= 0) setStepIndex(stripeIdx);
      toast.success('Welcome back, your Stripe Connect status has been updated.');
      searchParams.delete('stripe');
      setSearchParams(searchParams, { replace: true });
    };
    run();
  }, [searchParams, setSearchParams, steps, refreshUser, refresh, user?.id]);

  const trackStep = useCallback(
    (eventName, stepId) => {
      sovereign.analytics.track?.({
        eventName,
        properties: { step_id: stepId, role, mode },
      });
    },
    [role, mode],
  );

  const markVisited = (stepId) => {
    if (user?.id && stepId && stepId !== 'welcome') {
      markGuideStepVisited(user.id, role, stepId);
    }
  };

  const goToStep = (idx) => {
    setStepIndex(Math.min(Math.max(0, idx), steps.length - 1));
  };

  const goNext = async () => {
    if (!step) return;

    if (step.required && !stepComplete && step.embed) {
      toast.info('Complete this step using the form above, then continue.');
      return;
    }

    markVisited(step.id);
    trackStep('onboarding_step_continue', step.id);

    if (isLast) {
      if (user?.id) markOnboardingFinished(user.id, role, step.id);
      trackStep('onboarding_finished', step.id);
      markOnboardingRedirectComplete();
      await refreshUser?.();
      if (mode === 'page') navigate(getDashboardPathForRole(role), { replace: true });
      else onClose?.();
      return;
    }
    goToStep(stepIndex + 1);
  };

  const goBack = () => goToStep(stepIndex - 1);

  const handleSkip = () => {
    trackStep('onboarding_skipped', step?.id);
    if (user?.id) dismissOnboarding(user.id, role);
    markOnboardingRedirectComplete();
    if (mode === 'page') navigate(getDashboardPathForRole(role), { replace: true });
    else onClose?.();
  };

  if (syncBlocked || (!isLoading && !user?.id)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-4 px-4 text-center">
        <div className="w-12 h-12 rounded-full bg-destructive/10 flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-destructive" />
        </div>
        <div className="space-y-2 max-w-md">
          <h2 className="text-lg font-semibold">Finishing account setup</h2>
          <p className="text-sm text-muted-foreground">
            {syncError ||
              'We could not load your profile from the server. Check that the API is running and try again.'}
          </p>
        </div>
        <Button type="button" onClick={() => void retrySync?.()} className="">
          <RefreshCw className="w-4 h-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[40vh] gap-3 text-muted-foreground">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
        <p className="text-sm">Loading your setup progress…</p>
      </div>
    );
  }

  if (!step) return null;

  const roleLabel =
    role === 'admin' ? 'Admin' : isProviderFlow ? 'Provider' : 'Client';

  const shell = (
    <div className={cn('flex flex-col', mode === 'page' ? 'min-h-[calc(100vh-4rem)]' : '')}>
      <div className="flex flex-col lg:flex-row gap-8 max-w-6xl mx-auto w-full px-4 py-6 md:py-10">
        <aside className="lg:w-72 shrink-0 space-y-4">
          <div>
            <Badge variant="secondary" className="mb-2">{roleLabel} setup</Badge>
            <h1 className="text-2xl font-bold tracking-tight">
              {isProviderFlow ? 'Open in ~5 minutes' : 'Getting started'}
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              {isProviderFlow
                ? `${payoutReady.done}/${payoutReady.total} payout-ready, ${payoutReady.percent}%`
                : `${progress.requiredDone}/${progress.requiredTotal || progress.total} required steps`}
            </p>
            <Progress value={isProviderFlow ? payoutReady.percent : progress.percent} className="mt-3 h-2" />
          </div>

          {/* Mobile step dots */}
          <div className="flex lg:hidden gap-1.5 flex-wrap">
            {steps.map((s, idx) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Step ${idx + 1}: ${s.title}`}
                onClick={() => goToStep(idx)}
                className={cn(
                  'h-2 rounded-full transition-all',
                  idx === stepIndex ? 'w-6 bg-primary' : 'w-2 bg-muted-foreground/30',
                  completion[s.id] && idx !== stepIndex && 'bg-primary/70',
                )}
              />
            ))}
          </div>
          <p className="lg:hidden text-xs text-muted-foreground">
            Step {stepIndex + 1} of {steps.length}: {step.title}
          </p>

          <nav className="hidden lg:block space-y-1">
            {steps.map((s, idx) => {
              const done = completion[s.id];
              const active = idx === stepIndex;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => goToStep(idx)}
                  className={cn(
                    stb.listItem,
                    'w-full justify-start',
                    active ? 'bg-primary/10 text-primary font-bold' : 'text-muted-foreground',
                  )}
                >
                  {done ? (
                    <Check className="w-4 h-4 text-primary shrink-0" />
                  ) : (
                    <Circle className="w-4 h-4 shrink-0 opacity-40" />
                  )}
                  <span className="truncate">{s.title}</span>
                  {s.optional && (
                    <Badge variant="outline" className="ml-auto text-[10px]">Optional</Badge>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: 12 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -12 }}
              transition={{ duration: 0.2 }}
              className="space-y-6"
            >
              <Card className="stb-panel overflow-hidden">
                <CardContent className="p-6 md:p-8 space-y-4">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
                        Step {stepIndex + 1} of {steps.length}
                        {step.optional && ', Optional'}
                      </p>
                      <h2 className={cn(stb.title, 'text-2xl md:text-3xl')}>{step.title}</h2>
                    </div>
                    {stepComplete && (
                      <Badge className="stb-chip stb-chip-active shrink-0">Done</Badge>
                    )}
                  </div>
                  <p className="text-muted-foreground text-base leading-relaxed max-w-2xl">
                    {step.description}
                  </p>

                  {step.required && !stepComplete && step.embed && (
                    <p className="stb-notice-warm text-sm">
                      Required, complete the section below before continuing.
                    </p>
                  )}

                  {step.id === 'fixed_fee' && (
                    <div className=" bg-muted/50 border p-4 text-sm space-y-2">
                      <p className="font-medium">When it makes sense</p>
                      <ul className="list-disc pl-5 text-muted-foreground space-y-1">
                        <li>High booking volume, fixed fee can cost less than commission</li>
                        <li>Monthly or annual billing with 0% commission while active</li>
                        <li>Enroll below or from Payouts Fixed-fee panel anytime</li>
                      </ul>
                    </div>
                  )}

                  {href && step.id !== 'welcome' && !step.embed && step.id !== 'profile' && (
                    <Button asChild variant="outline" className="">
                      <Link to={href} onClick={() => trackStep('onboarding_open_in_app', step.id)}>
                        Open in app <ExternalLink className="w-4 h-4 ml-2" />
                      </Link>
                    </Button>
                  )}
                </CardContent>
              </Card>

              {role === 'client' && step.id === 'profile' && user && (
                <OnboardingClientEmbed user={user} onSaved={() => refresh()} />
              )}

              {step.embed && isProviderFlow && (
                <OnboardingProviderEmbed
                  stepId={step.id}
                  user={user}
                  onAdvance={goNext}
                  onBack={goBack}
                  onWorkspaceReady={() => {
                    refresh();
                    refreshUser?.();
                  }}
                />
              )}

              {!(step.embed && EMBED_STEPS_WITH_OWN_NAV.has(step.id)) && (
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex gap-2">
                  {!isFirst && (
                    <Button type="button" variant="ghost" onClick={goBack} className="">
                      <ArrowLeft className="w-4 h-4 mr-1" /> Back
                    </Button>
                  )}
                  <Button type="button" variant="ghost" onClick={handleSkip} className=" text-muted-foreground">
                    Skip for now
                  </Button>
                </div>
                <Button
                  type="button"
                  onClick={goNext}
                  className=" px-6"
                  disabled={step.required && !stepComplete && !isLast}
                >
                  {isLast ? 'Finish' : 'Continue'}
                  {!isLast && <ArrowRight className="w-4 h-4 ml-2" />}
                </Button>
              </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );

  if (mode === 'dialog') {
    return (
      <div className="relative bg-background stb-panel max-h-[90vh] overflow-y-auto">
        <button
          type="button"
          onClick={handleSkip}
          className="absolute top-3 right-3 z-10 p-2 rounded-full hover:bg-muted"
          aria-label="Close guide"
        >
          <X className="w-5 h-5" />
        </button>
        {shell}
      </div>
    );
  }

  return (
    <>
      <MetaTags title="Setup guide" description="Get started with ShopTheBarber." />
      {shell}
    </>
  );
}

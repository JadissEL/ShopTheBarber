import { Link } from 'react-router-dom';

import { ArrowRight, CheckCircle2, Circle, Clock, Sparkles } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';

import { Button } from '@/components/ui/button';

import { Progress } from '@/components/ui/progress';

import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';

import { getSetupGuidePath, shouldShowPayoutSetupOnDashboard } from '@/lib/onboardingWizard';

import { cn } from '@/lib/utils';

import { stb } from '@/lib/stbUi';



const STEP_LABELS = {

  profile: 'Profile & location',

  services: 'Services & pricing',

  availability: 'Hours & availability',

  stripe: 'Stripe payouts',

};



/**

 * Persistent provider dashboard card, payout-ready progress until Stripe Connect is active.

 */

export default function ProviderSetupProgressCard() {

  const { role, completion, payoutReady, isLoading } = useOnboardingProgress();



  if (isLoading || !shouldShowPayoutSetupOnDashboard(role, completion)) {

    return null;

  }



  const { percent, done, total, nextStep, steps } = payoutReady;

  const minutesLeft = Math.max(1, Math.ceil(((100 - percent) / 100) * 5));



  return (

    <Card className={cn('mb-6 stb-notice-warm overflow-hidden')}>

      <CardContent className="p-5 md:p-6">

        <div className="flex flex-col lg:flex-row lg:items-center gap-6">

          <div className="flex items-center gap-4 shrink-0">

            <div

              className={cn(stb.iconBox, 'h-16 w-16 bg-primary text-primary-foreground stb.uiSubheading text-lg')}

              aria-label={`${percent} percent payout ready`}

            >

              {percent}%

            </div>

            <div>

              <p className="stb-section-label flex items-center gap-1 mb-1">

                <Clock className="w-3.5 h-3.5" />

                ~{minutesLeft} min left

              </p>

              <p className={cn(stb.title, 'text-lg')}>Open for bookings</p>

              <p className="stb-body">

                {done}/{total} steps to payout-ready

              </p>

            </div>

          </div>



          <div className="flex-1 min-w-0 space-y-3">

            <Progress value={percent} className="h-2" />

            <ul className="grid sm:grid-cols-2 gap-2">

              {steps.map((s) => (

                <li key={s.id} className="flex items-center gap-2 text-sm font-sans normal-case">

                  {s.done ? (

                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />

                  ) : (

                    <Circle className="w-4 h-4 text-muted-foreground/50 shrink-0" />

                  )}

                  <span className={cn(s.done ? 'text-muted-foreground line-through' : 'text-foreground font-medium')}>

                    {STEP_LABELS[s.id] || s.title}

                  </span>

                </li>

              ))}

            </ul>

            {nextStep && (

              <p className="stb-body text-xs">

                Next: <span className="text-foreground font-medium">{STEP_LABELS[nextStep.id] || nextStep.title}</span>

              </p>

            )}

          </div>



          <div className="flex flex-col sm:flex-row lg:flex-col gap-2 shrink-0">

            <Button asChild>

              <Link to={getSetupGuidePath()}>

                <Sparkles className="w-4 h-4 mr-2" />

                Continue setup

                <ArrowRight className="w-4 h-4 ml-1" />

              </Link>

            </Button>

            {nextStep?.href && (

              <Button asChild variant="outline">

                <Link to={nextStep.href}>Jump to next step</Link>

              </Button>

            )}

          </div>

        </div>

      </CardContent>

    </Card>

  );

}


import { Link } from 'react-router-dom';
import { Scissors, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { getDashboardPathForRole } from '@/lib/onboardingWizard';
import { useOnboardingProgress } from '@/hooks/useOnboardingProgress';

export default function SetupGuideHeader() {
  const { role, payoutReady } = useOnboardingProgress();
  const isProvider = role === 'provider' || role === 'shop_owner';

  return (
    <header className="sticky top-0 z-20 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between gap-4">
        <Link to={createPageUrl('Home')} className="flex items-center gap-2 font-bold text-foreground shrink-0">
          <Scissors className="w-5 h-5 text-primary" />
          <span className="hidden sm:inline">ShopTheBarber</span>
        </Link>
        <p className="text-sm text-muted-foreground truncate text-center">
          {isProvider ? (
            <>
              Setup guide, <span className="text-foreground font-medium">{payoutReady.percent}% payout-ready</span>
            </>
          ) : (
            'Setup guide'
          )}
        </p>
        <Button asChild variant="ghost" size="sm" className="shrink-0 rounded-lg text-muted-foreground">
          <Link to={getDashboardPathForRole(role)}>
            <X className="w-4 h-4 mr-1" />
            Exit
          </Link>
        </Button>
      </div>
    </header>
  );
}

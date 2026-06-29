import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { LayoutDashboard, Calendar, MessageSquare, Settings, DollarSign } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isNavActive } from '@/lib/navActive';
import { shouldHideBottomNav } from '@/lib/mobileLayout';

const items = [
  { label: 'Home', icon: LayoutDashboard, path: 'ProviderDashboard' },
  { label: 'Bookings', icon: Calendar, path: 'ProviderBookings' },
  { label: 'Messages', icon: MessageSquare, path: 'ProviderMessages' },
  { label: 'Payouts', icon: DollarSign, path: 'ProviderPayouts' },
  { label: 'Settings', icon: Settings, path: 'ProviderSettings' },
];

export default function ProviderBottomNav() {
  const isDesktop = useIsDesktop();
  const location = useLocation();
  if (isDesktop) return null;
  if (shouldHideBottomNav(location.pathname)) return null;

  return (
    <nav
      aria-label="Provider navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-border lg:hidden safe-area-pb"
    >
      <div className="flex h-16 items-center justify-around px-1">
        {items.map((item) => {
          const href = createPageUrl(item.path);
          const isActive = isNavActive(location.pathname, item.path);
          return (
            <Link
              key={item.path}
              to={href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 py-2 text-[11px] font-medium transition-colors tap-highlight-none touch-target max-w-[72px] rounded-xl',
                isActive ? 'text-primary bg-primary/10' : 'text-muted-foreground active:bg-muted/80',
              )}
            >
              <item.icon className="h-5 w-5" strokeWidth={isActive ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

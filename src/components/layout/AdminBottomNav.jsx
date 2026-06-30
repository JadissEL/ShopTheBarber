import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { getAdminNavGroups } from '@/lib/featureRegistry';
import { BarChart3, Users, AlertTriangle, Headphones, HeartPulse } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';
import { isNavActive } from '@/lib/navActive';
import { shouldHideBottomNav } from '@/lib/mobileLayout';

const MOBILE_ITEMS = [
  { label: 'Financials', icon: BarChart3, page: 'GlobalFinancials' },
  { label: 'Users', icon: Users, page: 'AdminUserModeration' },
  { label: 'Disputes', icon: AlertTriangle, page: 'AdminDisputes' },
  { label: 'Support', icon: Headphones, page: 'AdminSupportInbox' },
  { label: 'Health', icon: HeartPulse, page: 'AdminPlatformHealth' },
];

export default function AdminBottomNav() {
  const isDesktop = useIsDesktop();
  const location = useLocation();
  if (isDesktop) return null;
  if (shouldHideBottomNav(location.pathname)) return null;

  const navGroups = getAdminNavGroups();

  return (
    <nav
      aria-label="Admin navigation"
      className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-foreground lg:hidden safe-area-pb font-sans"
    >
      <div className="flex h-16 items-center justify-around px-1">
        {MOBILE_ITEMS.map((item) => {
          const href = createPageUrl(item.page);
          const active = isNavActive(location.pathname, item.page);
          return (
            <Link
              key={item.page}
              to={href}
              className={cn(
                stb.navTab,
                active ? stb.navTabActive : stb.navTabIdle,
              )}
            >
              <item.icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
      {navGroups.length > 0 && (
        <p className="sr-only">Full admin menu available on desktop sidebar</p>
      )}
    </nav>
  );
}

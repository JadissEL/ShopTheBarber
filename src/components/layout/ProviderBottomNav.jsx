import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  DollarSign,
  Menu,
  Users,
  Settings,
  Store,
  Truck,
  FileText,
  Briefcase,
  Gift,
  Presentation,
  Languages,
  UserCog,
  CalendarClock,
  BarChart3,
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { useAuth } from '@/lib/AuthContext';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { useManagedShop } from '@/hooks/useManagedShop';
import { shouldShowProviderBottomNav } from '@/lib/mobileLayout';
import { getProviderMobileNav } from '@/lib/dashboardNav';
import { useCapabilityContext } from '@/hooks/useCapabilityContext';
import { isNavActive } from '@/lib/navActive';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const ICON_BY_PAGE = {
  ProviderDashboard: LayoutDashboard,
  ProviderBookings: Calendar,
  ProviderMessages: MessageSquare,
  ProviderPayouts: DollarSign,
  ClientList: Users,
  ProviderSettings: Settings,
  ProviderMarketplaceProducts: Store,
  SellerOrders: Truck,
  ProviderBlogArticles: FileText,
  MyJobs: Briefcase,
  TombolaLive: Gift,
  ProviderEvents: Presentation,
  ProviderLanguagePrograms: Languages,
  NetworkOwnerDashboard: BarChart3,
  StaffRoster: UserCog,
  StaffSchedule: CalendarClock,
  ShopEmployeeManagement: UserCog,
  ShopInventoryManagement: Store,
  ShopExpenseTracking: DollarSign,
  ShopBrandingManagement: Settings,
  ShopAnalytics: BarChart3,
  CreateJob: Briefcase,
  CareerHub: Briefcase,
  Explore: LayoutDashboard,
  Marketplace: Store,
  HelpCenter: MessageSquare,
};

function NavTab({ to, active, children }) {
  return (
    <Link
      to={to}
      className={cn(stb.navTab, active ? stb.navTabActive : stb.navTabIdle)}
    >
      {children}
    </Link>
  );
}

export default function ProviderBottomNav() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();
  const isDesktop = useIsDesktop();
  const { isAuthenticated } = useAuth();
  const { effectiveRole } = useEffectiveRole();
  const { isManager, shopId } = useManagedShop();
  const capabilityContext = useCapabilityContext();
  const [moreOpen, setMoreOpen] = useState(false);

  const { primary, more, groups } = getProviderMobileNav({
    isManager,
    isSolo: !shopId,
    capabilityContext,
  });

  if (
    !shouldShowProviderBottomNav({
      pathname: path,
      isAuthenticated,
      isDesktop,
      role: effectiveRole,
    })
  ) {
    return null;
  }

  const isActive = (page) => isNavActive(location.pathname, page);
  const isMoreActive = more.some((item) => isActive(item.page));

  return (
    <>
      <nav
        aria-label="Provider navigation"
        className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-foreground lg:hidden safe-area-pb font-sans"
      >
        <div className="mx-auto flex h-16 max-w-lg items-end justify-around px-1">
          {primary.map((item) => {
            const Icon = ICON_BY_PAGE[item.page] ?? LayoutDashboard;
            const active = isActive(item.page);
            return (
              <NavTab key={item.page} to={createPageUrl(item.page)} active={active}>
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                <span className="text-[11px] font-medium">{item.label.split(' ')[0]}</span>
              </NavTab>
            );
          })}

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(stb.navTab, isMoreActive ? stb.navTabActive : stb.navTabIdle)}
            aria-label="More provider options"
            aria-expanded={moreOpen}
          >
            <Menu className="h-5 w-5" strokeWidth={isMoreActive ? 2.5 : 2} />
            <span className="text-[11px] font-medium">More</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl safe-area-pb border-t border-foreground font-sans max-h-[85vh] overflow-y-auto">
          <SheetHeader className="text-left pb-2">
            <SheetTitle>Provider menu</SheetTitle>
          </SheetHeader>
          <div className="space-y-4 pb-2">
            {groups.map((group) => {
              const groupMore = group.items.filter(
                (item) => !primary.some((p) => p.page === item.page),
              );
              if (groupMore.length === 0) return null;
              return (
                <div key={group.title}>
                  <p className={cn(stb.overline, 'px-3 pb-1.5 text-muted-foreground')}>
                    {group.title}
                  </p>
                  <div className="grid gap-1">
                    {groupMore.map((item) => {
                      const Icon = ICON_BY_PAGE[item.page] ?? Settings;
                      const active = isActive(item.page);
                      return (
                        <Link
                          key={item.page}
                          to={createPageUrl(item.page)}
                          onClick={() => setMoreOpen(false)}
                          className={cn(
                            stb.listItem,
                            'text-base font-sans',
                            active && stb.navItemActive,
                          )}
                        >
                          <Icon className="h-5 w-5 shrink-0" />
                          {item.label}
                        </Link>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}

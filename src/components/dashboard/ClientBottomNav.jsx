import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Home,
  Calendar,
  User,
  Plus,
  ShoppingBag,
  Menu,
  MessageCircle,
  Search,
  Gift,
  HelpCircle,
  Heart,
  Trophy,
  Wallet,
  Bell,
  Users,
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { useCart } from '@/components/context/CartContext';
import { useAuth } from '@/lib/AuthContext';
import { shouldShowClientBottomNav } from '@/lib/mobileLayout';
import { getClientMoreItems, isFeatureEnabled } from '@/lib/featureRegistry';
import { isNavActive } from '@/lib/navActive';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';

const MORE_ICON_BY_PAGE = {
  Explore: Search,
  Favorites: Heart,
  Loyalty: Gift,
  Referral: Users,
  GiftCards: Gift,
  ChampionshipLeaderboard: Trophy,
  ClientWallet: Wallet,
  Wishlist: Heart,
  NotificationSettings: Bell,
  SupportChat: MessageCircle,
  HelpCenter: HelpCircle,
};

function NavTab({ to, active, children, className }) {
  return (
    <Link
      to={to}
      className={cn(
        stb.navTab,
        active ? stb.navTabActive : stb.navTabIdle,
        className,
      )}
    >
      {children}
    </Link>
  );
}

export default function ClientBottomNav() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();
  const isDesktop = useIsDesktop();
  const { itemCount } = useCart();
  const { isAuthenticated } = useAuth();
  const [moreOpen, setMoreOpen] = useState(false);
  const marketplaceEnabled = isFeatureEnabled('marketplace');
  const moreLinks = getClientMoreItems();

  if (
    !shouldShowClientBottomNav({
      pathname: path,
      isAuthenticated,
      isDesktop,
    })
  ) {
    return null;
  }

  const isActive = (page) =>
    isNavActive(location.pathname, page, {
      aliases: page === 'Dashboard' ? ['dashboard'] : [],
    });

  const isMoreActive = moreLinks.some((item) => isActive(item.page));
  const fourthTabPage = marketplaceEnabled ? 'ShoppingBag' : 'Explore';
  const fourthTabLabel = marketplaceEnabled ? 'Bag' : 'Explore';
  const fourthTabActive = isActive(fourthTabPage);

  return (
    <>
      <nav
        aria-label="Main navigation"
        className="fixed bottom-0 left-0 right-0 z-50 bg-card/95 backdrop-blur-md border-t border-foreground lg:hidden safe-area-pb font-sans"
      >
        <div className="mx-auto flex h-16 max-w-lg items-end justify-around px-1">
          <NavTab to={createPageUrl('Dashboard')} active={isActive('Dashboard')}>
            <Home className="h-5 w-5" strokeWidth={isActive('Dashboard') ? 2.5 : 2} />
            <span className="text-[11px] font-medium">Home</span>
          </NavTab>

          <NavTab to={createPageUrl('UserBookings')} active={isActive('UserBookings')}>
            <Calendar className="h-5 w-5" strokeWidth={isActive('UserBookings') ? 2.5 : 2} />
            <span className="text-[11px] font-medium">Bookings</span>
          </NavTab>

          <Link
            to={createPageUrl('BookingFlow')}
            className="relative -mt-5 flex flex-col items-center tap-highlight-none touch-target"
            aria-label="Book appointment"
          >
            <div className="flex h-[52px] w-[52px] items-center justify-center rounded-full bg-primary text-primary-foreground transition-transform active:translate-y-px border border-foreground ring-4 ring-background">
              <Plus className="h-6 w-6" strokeWidth={2.5} />
            </div>
            <span className="mt-1 text-[11px] font-medium text-muted-foreground">Book</span>
          </Link>

          <NavTab to={createPageUrl(fourthTabPage)} active={fourthTabActive}>
            {marketplaceEnabled ? (
              <span className="relative inline-flex">
                <ShoppingBag className="h-5 w-5" strokeWidth={fourthTabActive ? 2.5 : 2} />
                {itemCount > 0 && (
                  <span className="absolute -right-2 -top-1.5 flex h-[16px] min-w-[16px] items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold text-primary-foreground">
                    {itemCount > 99 ? '99+' : itemCount}
                  </span>
                )}
              </span>
            ) : (
              <Search className="h-5 w-5" strokeWidth={fourthTabActive ? 2.5 : 2} />
            )}
            <span className="text-[11px] font-medium">{fourthTabLabel}</span>
          </NavTab>

          <button
            type="button"
            onClick={() => setMoreOpen(true)}
            className={cn(
              stb.navTab,
              isMoreActive ? stb.navTabActive : stb.navTabIdle,
            )}
            aria-label="More options"
            aria-expanded={moreOpen}
          >
            <Menu className="h-5 w-5" strokeWidth={isMoreActive ? 2.5 : 2} />
            <span className="text-[11px] font-medium">More</span>
          </button>
        </div>
      </nav>

      <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
        <SheetContent side="bottom" className="rounded-t-2xl safe-area-pb border-t border-foreground font-sans">
          <SheetHeader className="text-left pb-2">
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <div className="grid gap-1 pb-2">
            {moreLinks.map((item) => {
              const Icon = MORE_ICON_BY_PAGE[item.page] ?? User;
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
        </SheetContent>
      </Sheet>
    </>
  );
}

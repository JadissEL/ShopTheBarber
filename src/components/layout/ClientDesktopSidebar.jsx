import { Link, useLocation } from 'react-router-dom';
import {
  Home, Calendar, MessageCircle, User, Plus, Store, ShoppingBag, Package, Lock, Scissors, Briefcase,
  Search, Heart, Trophy, Gift, Wallet, Star, Bell, Headphones,
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useCart } from '@/components/context/CartContext';
import {
  getClientNavItems,
  getClientMoreItems,
  CAREER_PATH_SEGMENTS,
} from '@/lib/featureRegistry';
import { isNavActive, navItemClassName } from '@/lib/navActive';

const ICON_BY_PAGE = {
  Dashboard: Home,
  UserBookings: Calendar,
  Marketplace: Store,
  ShoppingBag,
  GroomingVault: Lock,
  MyOrders: Package,
  CareerHub: Briefcase,
  Chat: MessageCircle,
  AccountSettings: User,
  Explore: Search,
  Favorites: Heart,
  Loyalty: Star,
  Referral: Gift,
  GiftCards: Gift,
  ChampionshipLeaderboard: Trophy,
  ClientWallet: Wallet,
  Wishlist: Heart,
  NotificationSettings: Bell,
  SupportChat: Headphones,
  HelpCenter: Headphones,
};

export default function ClientDesktopSidebar() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();
  const { itemCount } = useCart();

  const primaryItems = getClientNavItems({ primaryOnly: true });
  const secondaryItems = getClientNavItems().filter((item) => !item.primary);
  const moreItems = getClientMoreItems().filter(
    (item) => !primaryItems.some((p) => p.page === item.page) && !secondaryItems.some((s) => s.page === item.page),
  );

  const isActive = (page) => {
    if (page === 'CareerHub') {
      const firstSegment = path.replace(/^\//, '').split('/')[0] || '';
      return CAREER_PATH_SEGMENTS.includes(firstSegment);
    }
    return isNavActive(location.pathname, page, {
      aliases: page === 'Dashboard' ? ['dashboard'] : [],
    });
  };

  const renderLink = (item) => {
    const Icon = ICON_BY_PAGE[item.page] ?? Home;
    const active = isActive(item.page);
    return (
      <Link
        key={item.page}
        to={createPageUrl(item.page)}
        className={navItemClassName(active)}
      >
        <Icon className="w-5 h-5 shrink-0" />
        {item.label}
        {item.page === 'ShoppingBag' && itemCount > 0 && (
          <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-primary/15 text-primary' : 'bg-primary/10 text-primary'}`}>
            {itemCount > 99 ? '99+' : itemCount}
          </span>
        )}
      </Link>
    );
  };

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-card border-r border-border">
      <div className="p-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Scissors className="w-4 h-4 text-primary-foreground" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-foreground">ShopTheBarber</span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {primaryItems.map(renderLink)}

        {secondaryItems.length > 0 && (
          <div className="pt-3 mt-3 border-t border-border space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Account
            </p>
            {secondaryItems.map(renderLink)}
          </div>
        )}

        {moreItems.length > 0 && (
          <div className="pt-3 mt-3 border-t border-border space-y-1">
            <p className="px-3 pb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Discover &amp; rewards
            </p>
            {moreItems.map(renderLink)}
          </div>
        )}

        <div className="pt-4 mt-4 border-t border-border">
          <Link
            to={createPageUrl('BookingFlow')}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-[13px] bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors shadow-sm shadow-primary/15"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            Book appointment
          </Link>
        </div>
      </nav>
    </aside>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { useManagedShop } from '@/hooks/useManagedShop';
import { getProviderNavGroups } from '@/lib/featureRegistry';
import { stb } from '@/lib/stbUi';
import {
  LayoutDashboard,
  Calendar,
  MessageSquare,
  DollarSign,
  Settings,
  Briefcase,
  Users,
  BarChart3,
  LogOut,
  FileText,
  Store,
  UserCog,
  CalendarClock,
  Truck,
  Headphones,
  Gift,
  Presentation,
  GraduationCap,
  Languages,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { isNavActive, roleLabel } from '@/lib/navActive';

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
  CareerHub: GraduationCap,
  TombolaLive: Gift,
  ProviderEvents: Presentation,
  ProviderLanguagePrograms: Languages,
  SupportChat: Headphones,
  StaffRoster: UserCog,
  StaffSchedule: CalendarClock,
  NetworkOwnerDashboard: BarChart3,
  ShopEmployeeManagement: UserCog,
  ShopInventoryManagement: Store,
  ShopExpenseTracking: DollarSign,
  ShopBrandingManagement: Settings,
  ShopAnalytics: BarChart3,
};

export default function ProviderDesktopSidebar() {
  const location = useLocation();
  const { logout, user, role } = useAuth();
  const { isManager } = useManagedShop();
  const isDesktop = useIsDesktop();

  if (!isDesktop) return null;

  const navGroups = getProviderNavGroups({ isManager });

  return (
    <aside className="w-64 shrink-0 border-r border-white/10 bg-[hsl(var(--navy))] text-white flex flex-col min-h-screen sticky top-0 font-sans">
      <div className="p-4 border-b border-white/10">
        <Link to={createPageUrl('ProviderDashboard')} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary border border-white/20 flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-primary-foreground" />
          </div>
          <span className="stb.overline uppercase tracking-wider text-sm text-white">ShopTheBarber</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className={cn(stb.overline, 'px-3 pb-1.5 text-white/45')}>
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const href = createPageUrl(item.page);
                const isActive = isNavActive(location.pathname, item.page);
                const Icon = ICON_BY_PAGE[item.page] ?? LayoutDashboard;
                return (
                  <Link
                    key={item.page}
                    to={href}
                    className={cn(
                      stb.navItem,
                      isActive ? stb.navItemActive : 'text-white/65 hover:bg-white/10 hover:text-white',
                    )}
                  >
                    <Icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      <div className="p-3 border-t border-white/10">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs font-bold uppercase tracking-wider text-white truncate">{user?.full_name || 'Provider'}</p>
          <p className="text-[11px] text-white/50 truncate font-sans normal-case">{roleLabel(isManager ? 'shop_owner' : role)}</p>
          <p className="text-[11px] text-white/50 truncate font-sans normal-case">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-white/65 hover:bg-destructive/20 hover:text-destructive transition-colors w-full font-sans"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

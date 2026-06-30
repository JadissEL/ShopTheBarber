import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { getAdminNavGroups } from '@/lib/featureRegistry';
import {
  BarChart3,
  Shield,
  Package,
  Users,
  TrendingUp,
  Activity,
  Database,
  AlertTriangle,
  LogOut,
  FileText,
  Store,
  Briefcase,
  Headphones,
  Gift,
  Presentation,
  Languages,
  ToggleLeft,
  HeartPulse,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';
import { isNavActive, roleLabel } from '@/lib/navActive';

const ICON_BY_PAGE = {
  GlobalFinancials: BarChart3,
  AdminProductAnalytics: Activity,
  AdminProviderInsights: TrendingUp,
  AdminUserModeration: Users,
  AdminDisputes: AlertTriangle,
  AdminAuditLogs: FileText,
  AdminOrders: Package,
  AdminContentManagement: FileText,
  AdminMarketplaceManagement: Store,
  AdminJobsManagement: Briefcase,
  AdminSupportInbox: Headphones,
  AdminTombola: Gift,
  AdminEvents: Presentation,
  AdminLanguagePrograms: Languages,
  AdminBackups: Database,
  AdminPlatformHealth: HeartPulse,
  AdminKeysWalkthrough: Shield,
  AdminFeatureToggles: ToggleLeft,
};

export default function AdminDesktopSidebar() {
  const location = useLocation();
  const { logout, user, role } = useAuth();
  const isDesktop = useIsDesktop();

  if (!isDesktop) return null;

  const navGroups = getAdminNavGroups();

  return (
    <aside className="w-64 shrink-0 border-r border-border bg-card flex flex-col min-h-screen sticky top-0 font-sans">
      <div className="p-4 border-b border-border">
        <Link to={createPageUrl('GlobalFinancials')} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <span className={cn(stb.uiSubheading, 'text-sm')}>Admin Panel</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-4 overflow-y-auto">
        {navGroups.map((group) => (
          <div key={group.title}>
            <p className={cn(stb.overline, 'px-3 pb-1.5 text-muted-foreground')}>
              {group.title}
            </p>
            <div className="space-y-1">
              {group.items.map((item) => {
                const href = createPageUrl(item.page);
                const isActive = isNavActive(location.pathname, item.page);
                const Icon = ICON_BY_PAGE[item.page] ?? Shield;
                return (
                  <Link
                    key={item.page}
                    to={href}
                    className={cn(stb.navItem, isActive && stb.navItemActive)}
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

      <div className="p-3 border-t border-border">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs font-medium text-foreground truncate">{user?.full_name || 'Admin'}</p>
          <p className="text-[11px] text-muted-foreground truncate">{roleLabel(role)}</p>
          <p className="text-[11px] text-muted-foreground truncate">{user?.email}</p>
        </div>
        <button
          type="button"
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full font-sans"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

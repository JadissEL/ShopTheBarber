import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { useIsDesktop } from '@/hooks/useMediaQuery';
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
} from 'lucide-react';
import { cn } from '@/components/utils';

const providerNavItems = [
  { label: 'Dashboard', icon: LayoutDashboard, path: 'ProviderDashboard' },
  { label: 'Bookings', icon: Calendar, path: 'ProviderBookings' },
  { label: 'Messages', icon: MessageSquare, path: 'ProviderMessages' },
  { label: 'Payouts', icon: DollarSign, path: 'ProviderPayouts' },
  { label: 'My Jobs', icon: Briefcase, path: 'MyJobs' },
  { label: 'Clients', icon: Users, path: 'ClientList' },
  { label: 'Settings', icon: Settings, path: 'ProviderSettings' },
];

export default function ProviderDesktopSidebar() {
  const location = useLocation();
  const { logout, user } = useAuth();
  const isDesktop = useIsDesktop();

  if (!isDesktop) return null;

  const currentPath = location.pathname.toLowerCase();

  return (
    <aside className="w-[220px] shrink-0 border-r border-border bg-card flex flex-col min-h-screen sticky top-0">
      <div className="p-4 border-b border-border">
        <Link to={createPageUrl('ProviderDashboard')} className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
            <BarChart3 className="w-4 h-4 text-white" />
          </div>
          <span className="font-bold text-foreground text-sm">ShopTheBarber</span>
        </Link>
      </div>

      <nav className="flex-1 p-3 space-y-1">
        {providerNavItems.map((item) => {
          const href = createPageUrl(item.path);
          const isActive = currentPath.includes(item.path.toLowerCase());
          return (
            <Link
              key={item.path}
              to={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="p-3 border-t border-border">
        <div className="px-3 py-2 mb-2">
          <p className="text-xs font-medium text-foreground truncate">{user?.full_name || 'Provider'}</p>
          <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
        </div>
        <button
          onClick={logout}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors w-full"
        >
          <LogOut className="w-4 h-4" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

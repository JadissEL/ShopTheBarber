import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { LayoutDashboard, Calendar, MessageSquare, Settings, DollarSign } from 'lucide-react';
import { cn } from '@/components/utils';

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

  const currentPath = location.pathname.toLowerCase();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex justify-around items-center h-16 px-2 safe-area-pb">
      {items.map((item) => {
        const href = createPageUrl(item.path);
        const isActive = currentPath.includes(item.path.toLowerCase());
        return (
          <Link
            key={item.path}
            to={href}
            className={cn(
              "flex flex-col items-center justify-center gap-0.5 flex-1 py-2 text-xs font-medium transition-colors",
              isActive ? "text-primary" : "text-muted-foreground"
            )}
          >
            <item.icon className="w-5 h-5" />
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

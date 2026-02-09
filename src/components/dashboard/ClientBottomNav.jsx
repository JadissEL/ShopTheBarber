import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, MessageCircle, User, Plus, ShoppingBag } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { useCart } from '@/components/context/CartContext';

export default function ClientBottomNav() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();
  const isDesktop = useIsDesktop();
  const { itemCount } = useCart();

  const isActive = (page) => {
    const pagePath = createPageUrl(page).toLowerCase().replace(/^\//, '');
    return path === '/' + pagePath || path === '/' || (page === 'Dashboard' && (path.includes('dashboard') || path === '/'));
  };

  if (isDesktop) return null;
  if (path === '/careerhub') return null;

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-[0_-4px_20px_rgba(0,0,0,0.06)] rounded-t-3xl safe-area-pb lg:hidden">
      <div className="max-w-lg mx-auto px-2 flex items-center justify-around h-16">
        <Link
          to={createPageUrl('Dashboard')}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 rounded-xl transition-colors ${isActive('Dashboard') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
        >
          <Home className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </Link>

        <Link
          to={createPageUrl('UserBookings')}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 rounded-xl transition-colors ${isActive('UserBookings') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
        >
          <Calendar className="w-5 h-5" />
          <span className="text-[10px] font-medium">Bookings</span>
        </Link>

        <Link
          to={createPageUrl('BookingFlow')}
          className="flex flex-col items-center justify-center -mt-5 min-w-[56px]"
        >
          <div className="w-14 h-14 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30 hover:bg-primary/90 transition-colors text-primary-foreground">
            <Plus className="w-7 h-7" strokeWidth={2.5} />
          </div>
          <span className="text-[10px] font-medium text-muted-foreground mt-1">Book</span>
        </Link>

        <Link
          to={createPageUrl('ShoppingBag')}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[48px] py-2 rounded-xl transition-colors ${isActive('ShoppingBag') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
        >
          <span className="relative inline-flex">
            <ShoppingBag className="w-5 h-5" />
            {itemCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[14px] h-[14px] rounded-full bg-primary text-[9px] font-bold text-primary-foreground flex items-center justify-center px-0.5">
                {itemCount > 99 ? '99+' : itemCount}
              </span>
            )}
          </span>
          <span className="text-[10px] font-medium">Bag</span>
        </Link>

        <Link
          to={createPageUrl('Chat')}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 rounded-xl transition-colors ${isActive('Chat') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
        >
          <MessageCircle className="w-5 h-5" />
          <span className="text-[10px] font-medium">Chat</span>
        </Link>

        <Link
          to={createPageUrl('AccountSettings')}
          className={`flex flex-col items-center justify-center gap-0.5 min-w-[56px] py-2 rounded-xl transition-colors ${isActive('AccountSettings') ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}
        >
          <User className="w-5 h-5" />
          <span className="text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </nav>
  );
}

import { Link, useLocation } from 'react-router-dom';
import { Home, Calendar, MessageCircle, User, Plus, Store, ShoppingBag, Package, Lock, Scissors, Briefcase } from 'lucide-react';
import { createPageUrl } from '@/utils';
import { useCart } from '@/components/context/CartContext';

const navItems = [
  { icon: Home, label: 'Home', page: 'Dashboard' },
  { icon: Calendar, label: 'Bookings', page: 'UserBookings' },
  { icon: Store, label: 'Marketplace', page: 'Marketplace' },
  { icon: ShoppingBag, label: 'Shopping Bag', page: 'ShoppingBag' },
  { icon: Lock, label: 'Grooming Vault', page: 'GroomingVault' },
  { icon: Package, label: 'My Orders', page: 'MyOrders' },
  { icon: Briefcase, label: 'Career Hub', page: 'CareerHub' },
  { icon: MessageCircle, label: 'Chat', page: 'Chat' },
  { icon: User, label: 'Profile', page: 'AccountSettings' },
];

export default function ClientDesktopSidebar() {
  const location = useLocation();
  const path = location.pathname.toLowerCase();
  const { itemCount } = useCart();

  const isActive = (page) => {
    const pagePath = createPageUrl(page).toLowerCase().replace(/^\//, '');
    if (page === 'CareerHub') {
      const careerSegments = ['careerhub', 'jobdetail', 'applytojob', 'professionalportfolio', 'portfoliocredentials', 'myjobs', 'createjob', 'applicantreview', 'scheduleinterview'];
      const firstSegment = path.replace(/^\//, '').split('/')[0] || '';
      return careerSegments.includes(firstSegment);
    }
    return path === '/' + pagePath || path === '/' || (page === 'Dashboard' && (path.includes('dashboard') || path === '/'));
  };

  return (
    <aside className="hidden lg:flex lg:flex-col w-64 shrink-0 bg-white border-r border-slate-200">
      <div className="p-4 border-b border-slate-200">
        <Link to="/" className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center shrink-0">
            <Scissors className="w-4 h-4 text-white" strokeWidth={2.5} />
          </div>
          <span className="font-semibold text-foreground">ShopTheBarber</span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.page);
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              {item.label}
              {item.page === 'ShoppingBag' && itemCount > 0 && (
                <span className={`ml-auto text-xs font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/20' : 'bg-primary text-white'}`}>
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>
          );
        })}
        <div className="pt-4 mt-4 border-t border-slate-200">
          <Link
            to={createPageUrl('BookingFlow')}
            className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-primary text-white font-semibold text-sm hover:bg-primary/90 transition-colors"
          >
            <Plus className="w-5 h-5" strokeWidth={2.5} />
            Book appointment
          </Link>
        </div>
      </nav>
    </aside>
  );
}

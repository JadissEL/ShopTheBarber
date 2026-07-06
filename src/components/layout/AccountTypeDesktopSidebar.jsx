import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Scissors } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isNavActive } from '@/lib/navActive';

/**
 * Compact desktop sidebar for seller / company / blogger account types.
 */
export default function AccountTypeDesktopSidebar({ navItems, brandLabel = 'ShopTheBarber' }) {
  const location = useLocation();

  return (
    <aside className="hidden lg:flex flex-col w-64 shrink-0 border-r border-border bg-card/80">
      <div className="h-14 flex items-center px-4 border-b border-border">
        <Link to="/" className="flex items-center gap-2 font-bold text-foreground">
          <Scissors className="w-5 h-5 text-primary" />
          <span className="truncate">{brandLabel}</span>
        </Link>
      </div>
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(location.pathname, item.page);
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground',
              )}
            >
              {Icon ? <Icon className="w-4 h-4 shrink-0" /> : null}
              {item.label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

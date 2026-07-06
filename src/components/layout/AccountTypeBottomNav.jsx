import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { isNavActive } from '@/lib/navActive';

export default function AccountTypeBottomNav({ navItems }) {
  const location = useLocation();
  const primary = navItems.slice(0, 4);

  return (
    <nav
      className="lg:hidden fixed bottom-0 inset-x-0 z-40 border-t border-border bg-background/95 backdrop-blur pb-safe"
      aria-label="Account navigation"
    >
      <div className="flex items-stretch justify-around h-16 max-w-lg mx-auto">
        {primary.map((item) => {
          const Icon = item.icon;
          const active = isNavActive(location.pathname, item.page);
          return (
            <Link
              key={item.page}
              to={createPageUrl(item.page)}
              className={cn(
                'flex flex-1 flex-col items-center justify-center gap-0.5 text-[10px] font-medium',
                active ? 'text-primary' : 'text-muted-foreground',
              )}
            >
              {Icon ? <Icon className="w-5 h-5" /> : null}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

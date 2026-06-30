import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

export default function SidebarNav({ menuItems, onItemClick }) {
  const location = useLocation();

  return (
    <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1 font-sans">
      {menuItems.map((item) => {
        const isActive = location.pathname.includes(item.path);
        return (
          <Link
            key={item.path}
            to={createPageUrl(item.path)}
            onClick={onItemClick}
            className={cn(stb.navItem, isActive && stb.navItemActive)}
          >
            {item.icon && (
              <item.icon
                className={cn(
                  'w-5 h-5 shrink-0',
                  isActive ? 'text-primary' : 'text-muted-foreground',
                )}
              />
            )}
            <span>{item.label}</span>
          </Link>
        );
      })}
    </div>
  );
}

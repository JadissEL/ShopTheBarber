import { useQuery } from '@tanstack/react-query';
import { Link, useLocation } from 'react-router-dom';
import { Headphones } from 'lucide-react';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { APP_ZONES, getZoneFromPath } from '@/components/navigationConfig';

/**
 * Floating support entry, routes to SupportChat (same inbox as AdminSupportInbox).
 */
export default function InAppSupportWidget() {
    const { isAuthenticated, user } = useAuth();
    const { effectiveRole } = useEffectiveRole();
    const location = useLocation();
    const zone = getZoneFromPath(location.pathname, {
        isAuthenticated: isAuthenticated && !!user,
        role: effectiveRole,
    });
    const path = location.pathname.toLowerCase();

    const hidden =
        !isAuthenticated ||
        zone === APP_ZONES.ADMIN ||
        zone === APP_ZONES.AUTH ||
        path.includes('/supportchat') ||
        path.includes('/adminsupportinbox');

    const { data: unread } = useQuery({
        queryKey: ['support-unread', user?.id],
        queryFn: () => sovereign.support.getUnread(),
        enabled: !!user?.id && !hidden,
        refetchInterval: 30_000,
    });

    if (hidden) return null;

    const count = unread?.unread_messages ?? 0;

    return (
        <Link
            to={createPageUrl('SupportChat')}
            className={cn(
                'fixed z-40 bottom-20 lg:bottom-6 right-4 lg:right-6',
                'flex items-center gap-2 rounded-full shadow-lg',
                'bg-primary text-primary-foreground px-4 py-3',
                'hover:opacity-95 transition-opacity',
                'safe-area-pb'
            )}
            aria-label={count > 0 ? `Support, ${count} unread messages` : 'Contact support'}
        >
            <Headphones className="w-5 h-5 shrink-0" />
            <span className="text-sm font-medium hidden sm:inline">Support</span>
            {count > 0 && (
                <span className="min-w-5 h-5 px-1.5 rounded-full bg-background text-primary text-xs font-bold flex items-center justify-center">
                    {count > 9 ? '9+' : count}
                </span>
            )}
        </Link>
    );
}

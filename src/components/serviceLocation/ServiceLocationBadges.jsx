import MobileServiceBadge from '@/components/mobileService/MobileServiceBadge';
import ShopServiceBadge from '@/components/serviceLocation/ShopServiceBadge';
import { Badge } from '@/components/ui/badge';
import { Store, Home } from 'lucide-react';
import { getServiceLocationModes } from '@/lib/serviceLocation';

/** Compact badges for shop / at-home / both modes on cards and profiles. */
export default function ServiceLocationBadges({ barber, className = '', size = 'default' }) {
    const modes = getServiceLocationModes(barber);
    if (!modes.shop && !modes.mobile) return null;

    const compact = size === 'xs' || size === 'sm';

    if (modes.both) {
        if (compact) {
            return (
                <Badge variant="outline" className={`text-[10px] border-primary/30 text-foreground bg-primary/10 gap-1 ${className}`}>
                    <Store className="w-3 h-3" />
                    <Home className="w-3 h-3" />
                    Shop &amp; at-home
                </Badge>
            );
        }
        return (
            <div className={`flex flex-wrap gap-2 ${className}`}>
                <ShopServiceBadge />
                <MobileServiceBadge />
            </div>
        );
    }

    if (modes.mobile_only) {
        return <MobileServiceBadge className={className} />;
    }

    return <ShopServiceBadge className={className} />;
}

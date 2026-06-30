import { Badge } from '@/components/ui/badge';
import { Crown } from 'lucide-react';
import { VIP_BADGE_LABEL } from '@/lib/groupBooking';

export default function VipBarberBadge({ className = '' }) {
    return (
        <Badge
            className={`gap-1 font-semibold ${className}`}
            variant="vip"
        >
            <Crown className="w-3 h-3" />
            {VIP_BADGE_LABEL}
        </Badge>
    );
}

export function GroupBookingBadge({ discountPercent, className = '' }) {
    const label =
        discountPercent > 0 ? `Group, ${discountPercent}% off` : 'Group booking';
    return (
        <Badge
            className={`bg-primary/90 text-white border-0 font-semibold ${className}`}
            variant="secondary"
        >
            {label}
        </Badge>
    );
}

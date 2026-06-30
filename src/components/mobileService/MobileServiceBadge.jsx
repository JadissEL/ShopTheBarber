import { Home } from 'lucide-react';
import { MOBILE_SERVICE_LABEL } from '@/lib/mobileService';

export default function MobileServiceBadge({ className = '', size = 'sm' }) {
    const sizeClass = size === 'xs' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-0.5';
    return (
        <span
            className={`inline-flex items-center gap-1 rounded-full bg-primary/10 text-foreground font-semibold ${sizeClass} ${className}`}
        >
            <Home className={size === 'xs' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />
            {MOBILE_SERVICE_LABEL}
        </span>
    );
}

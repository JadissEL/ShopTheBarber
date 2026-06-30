import { Baby } from 'lucide-react';
import { cn } from '@/lib/utils';
import { CHILDREN_FRIENDLY_LABEL } from '@/lib/childrenFriendly';

export function ChildrenFriendlyBadge({ className, size = 'sm' }) {
    const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

    return (
        <span
            className={cn(
                'inline-flex items-center gap-1 rounded-full stb-chip stb-chip-active border border-primary/30 font-medium',
                sizeClass,
                className
            )}
        >
            <Baby className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
            {CHILDREN_FRIENDLY_LABEL}
        </span>
    );
}

export default ChildrenFriendlyBadge;

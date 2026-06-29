import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { FALLBACK_LANGUAGE_OPTIONS, getLanguageLabel } from '@/lib/languages';
import { Languages } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SpokenLanguagesBadges({
    languages = [],
    options,
    className,
    max = 4,
    size = 'sm',
}) {
    const { data: apiOptions } = useQuery({
        queryKey: ['language-options'],
        queryFn: () => sovereign.languages.getOptions(),
        staleTime: 1000 * 60 * 60,
    });
    const opts = options || apiOptions || FALLBACK_LANGUAGE_OPTIONS;
    const codes = Array.isArray(languages) ? languages : [];
    if (codes.length === 0) return null;

    const sizeClass = size === 'xs' ? 'text-[10px] px-1.5 py-0.5' : 'text-xs px-2 py-0.5';

    return (
        <div className={cn('flex flex-wrap gap-1', className)}>
            {codes.slice(0, max).map((code) => (
                <span
                    key={code}
                    className={cn(
                        'inline-flex items-center gap-1 rounded-full bg-primary/10 text-primary border border-primary/20 font-medium',
                        sizeClass
                    )}
                >
                    <Languages className={size === 'xs' ? 'w-2.5 h-2.5' : 'w-3 h-3'} />
                    {getLanguageLabel(code, opts)}
                </span>
            ))}
            {codes.length > max && (
                <span className={cn('text-muted-foreground', sizeClass)}>+{codes.length - max}</span>
            )}
        </div>
    );
}

export default SpokenLanguagesBadges;

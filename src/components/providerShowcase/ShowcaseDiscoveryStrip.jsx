import { OptimizedImage } from '@/components/ui/optimized-image';
import { Badge } from '@/components/ui/badge';
import { Briefcase, Images } from 'lucide-react';

/**
 * Compact story preview for discovery cards (Explore, home picks).
 * preview shape matches GET /api/showcase/discovery-previews values.
 */
export default function ShowcaseDiscoveryStrip({ preview, compact = false, className = '' }) {
    if (!preview?.has_story) return null;

    const { thumbnails = [], highlights = [], portfolio_count = 0, years_experience, story_snippet } =
        preview;

    const hasThumbs = thumbnails.length > 0;
    const hasHighlights = highlights.length > 0;
    const hasSnippet = Boolean(story_snippet?.trim());

    if (!hasThumbs && !hasHighlights && !hasSnippet && !years_experience) return null;

    return (
        <div className={`space-y-2 ${className}`}>
            {hasSnippet && !compact && (
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">{story_snippet}</p>
            )}

            {hasThumbs && (
                <div className="flex items-center gap-2">
                    <div className="flex -space-x-2">
                        {thumbnails.slice(0, 3).map((url, i) => (
                            <div
                                key={`${url}-${i}`}
                                className="relative w-10 h-10 rounded-lg overflow-hidden border-2 border-background bg-muted shrink-0"
                            >
                                <OptimizedImage src={url} alt="" fill width={40} height={40} />
                            </div>
                        ))}
                    </div>
                    {portfolio_count > 0 && (
                        <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                            <Images className="w-3 h-3" />
                            {portfolio_count} {portfolio_count === 1 ? 'photo' : 'photos'}
                        </span>
                    )}
                </div>
            )}

            <div className="flex flex-wrap items-center gap-1.5">
                {years_experience != null && years_experience > 0 && (
                    <span className="text-[10px] font-medium text-muted-foreground flex items-center gap-1">
                        <Briefcase className="w-3 h-3" />
                        {years_experience}+ yrs
                    </span>
                )}
                {hasHighlights &&
                    highlights.slice(0, compact ? 2 : 3).map((tag) => (
                        <Badge
                            key={tag}
                            variant="secondary"
                            className="text-[10px] px-2 py-0 h-5 rounded-full font-normal"
                        >
                            {tag}
                        </Badge>
                    ))}
            </div>
        </div>
    );
}

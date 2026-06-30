import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trophy, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

export default function ExploreChampionshipLink() {
    return (
        <Link
            to={createPageUrl('ChampionshipLeaderboard')}
            className={cn('flex items-center justify-between gap-3 rounded-lg border border-primary/30 bg-primary/10 px-4 py-3 mb-4 hover:bg-primary/15 transition-colors group', stb.surfaceHover)}
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-primary/15 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div className="min-w-0">
                    <p className={cn(stb.uiHeading, 'text-sm')}>Barber Championships</p>
                    <p className="text-xs text-muted-foreground truncate">See this season&apos;s top-ranked pros</p>
                </div>
            </div>
            <ArrowRight className="w-4 h-4 text-primary shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </Link>
    );
}

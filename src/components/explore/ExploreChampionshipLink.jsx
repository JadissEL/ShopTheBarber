import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Trophy, ArrowRight } from 'lucide-react';

export default function ExploreChampionshipLink() {
    return (
        <Link
            to={createPageUrl('ChampionshipLeaderboard')}
            className="flex items-center justify-between gap-3 rounded-xl border border-amber-200/80 bg-amber-50/50 dark:bg-amber-950/20 px-4 py-3 mb-4 hover:bg-amber-50 transition-colors group"
        >
            <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center shrink-0">
                    <Trophy className="w-5 h-5 text-amber-600" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-bold text-foreground">Barber Championships</p>
                    <p className="text-xs text-muted-foreground truncate">See this season&apos;s top-ranked pros</p>
                </div>
            </div>
            <ArrowRight className="w-4 h-4 text-amber-600 shrink-0 group-hover:translate-x-0.5 transition-transform" />
        </Link>
    );
}

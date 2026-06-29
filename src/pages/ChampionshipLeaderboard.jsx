import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { MetaTags } from '@/components/seo/MetaTags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Star } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { OptimizedImage } from '@/components/ui/optimized-image';

function RankBadge({ rank }) {
    if (rank === 1) return <Trophy className="w-5 h-5 text-amber-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-slate-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-amber-700" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
}

export default function ChampionshipLeaderboard() {
    const { data: board, isLoading: boardLoading } = useQuery({
        queryKey: ['championship-leaderboard'],
        queryFn: () => sovereign.trust.getChampionshipLeaderboard({ limit: 25 }),
    });

    const { data: hof } = useQuery({
        queryKey: ['championship-hof'],
        queryFn: () => sovereign.trust.getHallOfFame(),
    });

    if (boardLoading) return <PageLoading message="Loading championships…" />;

    const season = board?.season;
    const leaderboard = board?.leaderboard ?? [];

    return (
        <div className="stb-page pb-16">
            <MetaTags
                title="Barber Championships"
                description="Season rankings and Hall of Fame — ShopTheBarber trust ecosystem"
            />
            <div className="max-w-3xl mx-auto px-4 py-10">
                <div className="text-center mb-10">
                    <Trophy className="w-14 h-14 text-primary mx-auto mb-4" />
                    <h1 className="text-3xl font-bold tracking-tight">Barber Championships</h1>
                    <p className="text-muted-foreground mt-2">
                        {season?.name ?? 'Current season'} — ranked by reviews, bookings, revenue, and reliability
                    </p>
                </div>

                <Tabs defaultValue="leaderboard" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-6">
                        <TabsTrigger value="leaderboard">Live leaderboard</TabsTrigger>
                        <TabsTrigger value="hof">Hall of Fame</TabsTrigger>
                    </TabsList>

                    <TabsContent value="leaderboard" className="space-y-3">
                        {leaderboard.length === 0 ? (
                            <Card>
                                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                                    Rankings refresh on the next championship cron run. Check back soon.
                                </CardContent>
                            </Card>
                        ) : (
                            leaderboard.map((entry) => (
                                <Card key={entry.id} className={entry.rank <= 3 ? 'border-primary/30' : ''}>
                                    <CardContent className="p-4 flex items-center gap-4">
                                        <RankBadge rank={entry.rank} />
                                        {entry.barber?.image_url ? (
                                            <OptimizedImage
                                                src={entry.barber.image_url}
                                                alt=""
                                                className="w-12 h-12 rounded-full object-cover"
                                            />
                                        ) : (
                                            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                                                <Star className="w-5 h-5 text-muted-foreground" />
                                            </div>
                                        )}
                                        <div className="flex-1 min-w-0">
                                            <p className="font-semibold truncate">{entry.barber?.name ?? 'Barber'}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {[entry.barber?.city, entry.country_code].filter(Boolean).join(' · ')}
                                                {entry.barber?.availability_score != null && (
                                                    <span> · Availability {Math.round(entry.barber.availability_score)}</span>
                                                )}
                                            </p>
                                        </div>
                                        <div className="text-right shrink-0">
                                            <p className="font-bold tabular-nums">{entry.composite_score?.toFixed(1)}</p>
                                            <p className="text-xs text-muted-foreground">score</p>
                                        </div>
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="hof" className="space-y-3">
                        {(hof?.entries ?? []).length === 0 ? (
                            <Card>
                                <CardContent className="py-10 text-center text-muted-foreground text-sm">
                                    Hall of Fame inductees appear when a season is finalized.
                                </CardContent>
                            </Card>
                        ) : (
                            (hof.entries ?? []).map((entry) => (
                                <Card key={entry.id}>
                                    <CardHeader className="pb-2 flex flex-row items-center justify-between">
                                        <CardTitle className="text-base">{entry.barber?.name ?? 'Barber'}</CardTitle>
                                        <Badge variant="secondary">{entry.season?.name}</Badge>
                                    </CardHeader>
                                    <CardContent className="text-sm text-muted-foreground">
                                        Rank #{entry.rank}
                                        {entry.badge && <span className="ml-2 capitalize">· {entry.badge.replace(/_/g, ' ')}</span>}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>
                </Tabs>
            </div>
        </div>
    );
}

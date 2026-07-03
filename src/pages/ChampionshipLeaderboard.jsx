import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { MetaTags } from '@/components/seo/MetaTags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Trophy, Medal, Star } from 'lucide-react';
import { PageLoading } from '@/components/ui/page-loading';
import { OptimizedImage } from '@/components/ui/optimized-image';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';

function RankBadge({ rank }) {
    if (rank === 1) return <Trophy className="w-5 h-5 text-primary" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-muted-foreground" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-muted-foreground" />;
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
            <PageHeader
                label="Rankings"
                title="Barber championships"
                subtitle={season?.name ? `${season.name} — ranked by reviews, bookings, revenue, and reliability` : 'Ranked by reviews, bookings, revenue, and reliability'}
            />

            <PageContent narrow>
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
            </PageContent>
        </div>
    );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { useTombolaStream } from '@/hooks/useTombolaStream';
import { createPageUrl } from '@/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Plane, Trophy, Ticket, Users, Sparkles, Loader2, Gift, CheckCircle2, AlertCircle,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';
import { cn } from '@/lib/utils';

function formatCountdown(totalSeconds) {
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = totalSeconds % 60;
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function formatDate(iso) {
    if (!iso) return '';
    const d = parseISO(iso);
    return isValid(d) ? format(d, 'PPp') : '';
}

export default function TombolaLive() {
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const [roleTab, setRoleTab] = useState('client');
    const [skillAnswer, setSkillAnswer] = useState('');

    useTombolaStream(true);

    const { data: live, isLoading } = useQuery({
        queryKey: ['tombola-current'],
        queryFn: () => sovereign.tombola.getCurrent(),
        refetchInterval: 3000,
    });

    const { data: myStatus } = useQuery({
        queryKey: ['tombola-me', user?.id, roleTab],
        queryFn: () => sovereign.tombola.getMe(roleTab),
        enabled: !!user?.id,
    });

    const syncMutation = useMutation({
        mutationFn: () => sovereign.tombola.syncEntry(roleTab),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tombola-me'] });
            queryClient.invalidateQueries({ queryKey: ['tombola-current'] });
            toast.success('Your entries are synced for this week!');
        },
        onError: (e) => toast.error(e.message),
    });

    const freeEntryMutation = useMutation({
        mutationFn: () => sovereign.tombola.claimFreeEntry(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['tombola-me'] });
            queryClient.invalidateQueries({ queryKey: ['tombola-current'] });
            toast.success('Free alternate entry registered (no purchase necessary).');
        },
        onError: (e) => toast.error(e.message),
    });

    const claimMutation = useMutation({
        mutationFn: () => sovereign.tombola.claimPrize(live?.draw?.id, skillAnswer),
        onSuccess: (data) => {
            toast.success(data.message || 'Prize claimed!');
            queryClient.invalidateQueries({ queryKey: ['tombola-me'] });
        },
        onError: (e) => toast.error(e.message),
    });

    const draw = live?.draw;
    const phase = live?.phase ?? 'open';
    const isLive = phase === 'live';
    const isCompleted = phase === 'completed';
    const countdown = isLive ? (live?.seconds_until_winner ?? 0) : (live?.seconds_until_draw ?? 0);

    const isBarber = user?.role === 'barber' || user?.role === 'provider' || user?.role === 'shop_owner';

    return (
        <div className={cn(stb.page, 'pb-24')}>
            <MetaTags
                title="Weekly Trip Tombola, Live Draw"
                description="Win a dream getaway for two. Watch the live draw every Sunday."
            />

            <PageHeader
                tier="display"
                variant="dark"
                label="Weekly live event"
                title="Trip Tombola"
                subtitle={`${draw?.prize_title ?? 'Dream Getaway for Two'} — clients & barbers eligible each week.`}
            />

            <PageContent narrow>
                {isLoading ? (
                    <div className="flex justify-center py-16"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
                ) : (
                    <>
                        {/* Live stage */}
                        <Card className="mb-6 border-primary/30 bg-[hsl(var(--navy))]/80 backdrop-blur overflow-hidden">
                            <CardContent className="p-8 text-center relative">
                                <AnimatePresence mode="wait">
                                    {isCompleted && draw?.winner_display_name ? (
                                        <motion.div
                                            key="winner"
                                            initial={{ scale: 0.8, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className="space-y-4"
                                        >
                                            <Trophy className="w-16 h-16 text-primary mx-auto" />
                                            <p className="text-sm uppercase tracking-widest text-primary">Winner</p>
                                            <p className="text-3xl font-bold text-white">{draw.winner_display_name}</p>
                                            <p className="text-white/75/70 text-sm">{draw.prize_title}</p>
                                            {draw.draw_hash && (
                                                <p className="text-[10px] text-primary font-mono truncate max-w-xs mx-auto">
                                                    Audit: {draw.draw_hash.slice(0, 16)}…
                                                </p>
                                            )}
                                        </motion.div>
                                    ) : isLive ? (
                                        <motion.div key="live" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                            <Badge className="bg-destructive/100 animate-pulse">LIVE</Badge>
                                            <p className="text-2xl font-bold text-white">Drawing winner…</p>
                                            <p className="text-5xl font-mono font-bold text-white/75 tabular-nums">
                                                {formatCountdown(countdown)}
                                            </p>
                                            <p className="text-sm text-primary">
                                                {draw?.total_tickets ?? 0} tickets, {draw?.participant_count ?? 0} participants
                                            </p>
                                        </motion.div>
                                    ) : (
                                        <motion.div key="waiting" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                                            <Plane className="w-14 h-14 text-primary mx-auto" />
                                            <p className="text-lg text-white/75">Next live draw</p>
                                            <p className="text-4xl font-mono font-bold text-white tabular-nums">
                                                {formatCountdown(countdown)}
                                            </p>
                                            <p className="text-sm text-primary">{formatDate(draw?.draw_at)}</p>
                                            <div className="flex justify-center gap-6 text-sm text-white/75 pt-2">
                                                <span className="flex items-center gap-1"><Ticket className="w-4 h-4" />{draw?.total_tickets ?? 0} tickets</span>
                                                <span className="flex items-center gap-1"><Users className="w-4 h-4" />{draw?.participant_count ?? 0} players</span>
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </CardContent>
                        </Card>

                        {/* Participation */}
                        {isAuthenticated ? (
                            <Card className="mb-6">
                                <CardHeader>
                                    <CardTitle className="flex items-center gap-2 text-lg">
                                        <Ticket className="w-5 h-5 text-primary" /> Your participation
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-4">
                                    {isBarber && (
                                        <Tabs value={roleTab} onValueChange={setRoleTab}>
                                            <TabsList>
                                                <TabsTrigger value="client">As client</TabsTrigger>
                                                <TabsTrigger value="barber">As barber</TabsTrigger>
                                            </TabsList>
                                        </Tabs>
                                    )}

                                    {myStatus?.entry ? (
                                        <div className="flex items-center gap-3 p-4 rounded-lg bg-primary/10 bg-primary/10 border border-primary/30">
                                            <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                                            <div>
                                                <p className="font-semibold">{myStatus.entry.entry_count} ticket(s) this week</p>
                                                <p className="text-sm text-muted-foreground capitalize">Role: {myStatus.entry.participant_role}</p>
                                            </div>
                                        </div>
                                    ) : myStatus?.eligibility?.eligible ? (
                                        <p className="text-sm text-muted-foreground">You qualify, sync your entries below.</p>
                                    ) : (
                                        <div className="flex gap-2 p-4 rounded-lg bg-primary/10 dark:bg-primary/10 border border-primary/30">
                                            <AlertCircle className="w-5 h-5 text-primary shrink-0" />
                                            <ul className="text-sm space-y-1">
                                                {(myStatus?.eligibility?.reasons ?? ['Complete eligibility requirements to enter.']).map((r) => (
                                                    <li key={r}>{r}</li>
                                                ))}
                                            </ul>
                                        </div>
                                    )}

                                    {myStatus?.eligibility?.breakdown && Object.keys(myStatus.eligibility.breakdown).length > 0 && (
                                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
                                            {Object.entries(myStatus.eligibility.breakdown).map(([k, v]) => (
                                                <div key={k} className="p-2 rounded-lg bg-muted capitalize">
                                                    {k.replace(/_/g, ' ')}: <strong>+{v}</strong>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <div className="flex flex-wrap gap-2">
                                        <Button onClick={() => syncMutation.mutate()} disabled={syncMutation.isPending || isCompleted}>
                                            {syncMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Sync my entries'}
                                        </Button>
                                        <Button variant="outline" onClick={() => freeEntryMutation.mutate()} disabled={freeEntryMutation.isPending || isCompleted}>
                                            Free entry (no purchase)
                                        </Button>
                                    </div>

                                    {myStatus?.is_winner && myStatus?.claim?.status !== 'verified' && (
                                        <div className="p-4 rounded-lg border-2 border-amber-400 bg-primary/10 dark:bg-primary/10 space-y-3">
                                            <p className="font-bold flex items-center gap-2"><Gift className="w-5 h-5" /> You won! Answer to claim:</p>
                                            <p className="text-sm">{myStatus.skill_question}</p>
                                            <div className="flex gap-2">
                                                <Input value={skillAnswer} onChange={(e) => setSkillAnswer(e.target.value)} placeholder="Your answer" />
                                                <Button onClick={() => claimMutation.mutate()} disabled={claimMutation.isPending}>Claim</Button>
                                            </div>
                                        </div>
                                    )}
                                    {myStatus?.claim?.status === 'verified' && (
                                        <p className="text-primary font-medium flex items-center gap-2">
                                            <CheckCircle2 className="w-5 h-5" /> Prize claim verified, our team will contact you.
                                        </p>
                                    )}
                                </CardContent>
                            </Card>
                        ) : (
                            <Card className="mb-6">
                                <CardContent className="p-6 text-center">
                                    <p className="text-muted-foreground mb-4">Sign in to sync your entries and watch as a participant.</p>
                                    <Link to={createPageUrl('Auth')}>
                                        <Button>Sign in to participate</Button>
                                    </Link>
                                </CardContent>
                            </Card>
                        )}

                        {/* Eligibility rules */}
                        <div className="grid md:grid-cols-2 gap-4 mb-6">
                            <Card>
                                <CardHeader><CardTitle className="text-base">Clients</CardTitle></CardHeader>
                                <CardContent className="text-sm text-muted-foreground space-y-1">
                                    <p>• 1+ completed booking in last 30 days</p>
                                    <p>• Bonus tickets for bookings, marketplace orders ($25+), reviews & tips</p>
                                    <p>• Max {live?.config?.client?.maxEntries ?? 5} tickets/week</p>
                                </CardContent>
                            </Card>
                            <Card>
                                <CardHeader><CardTitle className="text-base">Barbers</CardTitle></CardHeader>
                                <CardContent className="text-sm text-muted-foreground space-y-1">
                                    <p>• 4+ completed appointments this week</p>
                                    <p>• Rating ≥ 4.0 with 5+ reviews</p>
                                    <p>• Max {live?.config?.barber?.maxEntries ?? 5} tickets/week</p>
                                </CardContent>
                            </Card>
                        </div>

                        {/* Recent winners */}
                        {(live?.recent_winners?.length ?? 0) > 0 && (
                            <Card>
                                <CardHeader><CardTitle className="text-base flex items-center gap-2"><Trophy className="w-4 h-4" /> Recent winners</CardTitle></CardHeader>
                                <CardContent>
                                    <ul className="space-y-2">
                                        {live.recent_winners.map((w) => (
                                            <li key={w.id} className="flex justify-between text-sm border-b border-border pb-2 last:border-0">
                                                <span className="font-medium">{w.winner_display_name}</span>
                                                <span className="text-muted-foreground">{formatDate(w.completed_at)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </CardContent>
                            </Card>
                        )}

                        <p className="text-center text-xs text-muted-foreground mt-8 max-w-xl mx-auto">
                            18+ only. No purchase necessary, use free entry. Skill-testing question required for winners.
                            Official rules available in Help Center. Trip for two subject to availability.
                        </p>
                    </>
                )}
            </PageContent>
        </div>
    );
}

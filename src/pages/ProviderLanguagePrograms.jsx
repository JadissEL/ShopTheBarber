import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { MetaTags } from '@/components/seo/MetaTags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
    Languages, Loader2, CheckCircle2, Clock, AlertCircle, GraduationCap, Users, Euro,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { toast } from 'sonner';
import { PageLoading } from '@/components/ui/page-loading';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';
import { SpokenLanguagesBadges } from '@/components/languages/SpokenLanguagesBadges';

function fmt(iso) {
    if (!iso) return '';
    const d = parseISO(iso);
    return isValid(d) ? format(d, 'PP') : iso;
}

function ProgramCard({ program, config, onJoin, onCancel, busy, termsAccepted, setTermsAccepted }) {
    const wl = program.my_waitlist;
    const isWaitlisted = wl?.status === 'waitlisted';
    const isEnrolled = wl?.status === 'enrolled';
    const isPending = wl?.status === 'pending_payment';
    const isCancelled = wl?.status === 'cancelled';

    return (
        <Card className="overflow-hidden">
            {program.image_url && (
                <div className="h-32 bg-muted bg-cover bg-center" style={{ backgroundImage: `url(${program.image_url})` }} />
            )}
            <CardHeader className="pb-2">
                <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="secondary" className="gap-1">
                        <Languages className="w-3 h-3" />
                        {program.language_label}
                    </Badge>
                    {program.suggested && !program.already_speaks_target && (
                        <Badge className="bg-primary/10 text-foreground">Suggested for you</Badge>
                    )}
                    <Badge variant="outline" className="capitalize">{program.format?.replace('_', ' ')}</Badge>
                </div>
                <CardTitle className="text-lg">{program.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {program.description && (
                    <p className="text-sm text-muted-foreground line-clamp-3">{program.description}</p>
                )}
                <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                        <Euro className="w-3.5 h-3.5" />
                        {program.total_price} {program.currency} total
                    </span>
                    <span className="font-medium text-foreground">
                        {program.deposit_percent}% deposit: {program.deposit_amount} {program.currency}
                    </span>
                </div>
                {program.estimated_start_at && (
                    <p className="text-xs text-muted-foreground">Estimated start: {fmt(program.estimated_start_at)}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    {program.waitlist_count ?? 0} on waitlist
                    {program.max_waitlist != null && `, ${program.spots_left ?? 0} spots left`}
                </div>

                <div className="pt-2 space-y-3">
                    {isEnrolled ? (
                        <Badge className="stb-chip stb-chip-active">
                            <GraduationCap className="w-3 h-3 mr-1" />Enrolled
                        </Badge>
                    ) : isWaitlisted ? (
                        <div className="space-y-2">
                            <Badge className="stb-chip stb-chip-active">
                                <CheckCircle2 className="w-3 h-3 mr-1" />
                                Waitlist #{wl.position ?? '-'}, deposit paid
                            </Badge>
                            <Button size="sm" variant="outline" disabled={busy} onClick={() => onCancel(program.id)}>
                                Leave waitlist
                            </Button>
                            <p className="text-xs text-muted-foreground">{config?.non_refundable_terms}</p>
                        </div>
                    ) : isPending && wl?.payment_status !== 'paid' ? (
                        <div className="space-y-2">
                            <Badge className="bg-warning/15 text-foreground">
                                <Clock className="w-3 h-3 mr-1" />Payment pending
                            </Badge>
                            <div className="flex items-start gap-2">
                                <Checkbox
                                    id={`terms-${program.id}`}
                                    checked={termsAccepted}
                                    onCheckedChange={(v) => setTermsAccepted(!!v)}
                                />
                                <Label htmlFor={`terms-${program.id}`} className="text-xs leading-snug cursor-pointer">
                                    I accept the non-refundable {program.deposit_percent}% deposit terms
                                </Label>
                            </div>
                            <Button size="sm" disabled={busy || !termsAccepted} onClick={() => onJoin(program.id)}>
                                Complete payment
                            </Button>
                        </div>
                    ) : isCancelled ? (
                        <p className="text-xs text-muted-foreground">Previously cancelled, deposit non-refundable.</p>
                    ) : program.registration_open ? (
                        <div className="space-y-2">
                            <div className="flex items-start gap-2">
                                <Checkbox
                                    id={`terms-new-${program.id}`}
                                    checked={termsAccepted}
                                    onCheckedChange={(v) => setTermsAccepted(!!v)}
                                />
                                <Label htmlFor={`terms-new-${program.id}`} className="text-xs leading-snug cursor-pointer">
                                    {config?.non_refundable_terms}
                                </Label>
                            </div>
                            <Button size="sm" disabled={busy || !termsAccepted} onClick={() => onJoin(program.id)}>
                                Join waitlist, pay {program.deposit_amount} {program.currency}
                            </Button>
                        </div>
                    ) : (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5" />
                            {program.registration_reason || 'Not available'}
                        </p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function ProviderLanguagePrograms() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [termsByProgram, setTermsByProgram] = useState({});
    const [busyProgram, setBusyProgram] = useState(null);

    const { data: config } = useQuery({
        queryKey: ['language-programs-config'],
        queryFn: () => sovereign.languagePrograms.getConfig(),
    });

    const { data, isLoading } = useQuery({
        queryKey: ['language-programs-provider'],
        queryFn: () => sovereign.languagePrograms.listProvider(),
        enabled: !!user,
    });

    const { data: myWaitlist = [], isLoading: mineLoading } = useQuery({
        queryKey: ['language-programs-mine'],
        queryFn: () => sovereign.languagePrograms.listMine(),
        enabled: !!user,
    });

    useEffect(() => {
        const status = searchParams.get('waitlist');
        if (status === 'success') {
            toast.success('Deposit received, you are on the waitlist!');
            queryClient.invalidateQueries({ queryKey: ['language-programs-provider'] });
            queryClient.invalidateQueries({ queryKey: ['language-programs-mine'] });
            setSearchParams({}, { replace: true });
        } else if (status === 'cancelled') {
            toast.info('Payment cancelled, complete checkout to join the waitlist.');
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, queryClient, setSearchParams]);

    const joinMutation = useMutation({
        mutationFn: async (programId) => {
            setBusyProgram(programId);
            const terms = termsByProgram[programId] === true;
            return sovereign.languagePrograms.joinWaitlist(programId, terms);
        },
        onSuccess: (result) => {
            if (result.checkout_url) {
                window.location.href = result.checkout_url;
            } else {
                toast.success('Waitlist updated');
                queryClient.invalidateQueries({ queryKey: ['language-programs-provider'] });
            }
        },
        onError: (e) => toast.error(e.message),
        onSettled: () => setBusyProgram(null),
    });

    const cancelMutation = useMutation({
        mutationFn: (programId) => sovereign.languagePrograms.cancelWaitlist(programId),
        onSuccess: (result) => {
            toast.success(result.message || 'Waitlist cancelled');
            queryClient.invalidateQueries({ queryKey: ['language-programs-provider'] });
            queryClient.invalidateQueries({ queryKey: ['language-programs-mine'] });
        },
        onError: (e) => toast.error(e.message),
    });

    if (isLoading) return <PageLoading />;

    const programs = data?.programs ?? [];
    const spoken = data?.spoken_languages ?? [];
    const suggested = programs.filter((p) => p.suggested && p.registration_open);
    const other = programs.filter((p) => !p.suggested || !p.registration_open);

    const setTerms = (programId, val) => {
        setTermsByProgram((prev) => ({ ...prev, [programId]: val }));
    };

    return (
        <div className={stb.page + ' lg:pb-8'}>
            <MetaTags title="Language Learning Programs" description="Join waitlists for barber language training" />
            <PageHeader
                label="Provider"
                title="Language learning programs"
                subtitle={`Enroll on a waitlist for languages you want to learn. A ${config?.deposit_percent ?? 20}% deposit is required and is non-refundable.`}
                compact
                variant="light"
                tier="app"
            />
            <PageContent narrow className="space-y-6">

            {spoken.length > 0 && (
                <Card>
                    <CardContent className="pt-4">
                        <p className="text-sm text-muted-foreground mb-2">Languages you already speak:</p>
                        <SpokenLanguagesBadges codes={spoken} />
                    </CardContent>
                </Card>
            )}

            <Tabs defaultValue="browse">
                <TabsList>
                    <TabsTrigger value="browse">Browse programs</TabsTrigger>
                    <TabsTrigger value="mine">My waitlist ({myWaitlist.length})</TabsTrigger>
                </TabsList>

                <TabsContent value="browse" className="space-y-6 mt-4">
                    {suggested.length > 0 && (
                        <section>
                            <h2 className={stb.uiSubheading + ' mb-3'}>Recommended for you</h2>
                            <div className="grid gap-4 md:grid-cols-2">
                                {suggested.map((p) => (
                                    <ProgramCard
                                        key={p.id}
                                        program={p}
                                        config={config}
                                        busy={busyProgram === p.id}
                                        termsAccepted={termsByProgram[p.id] === true}
                                        setTermsAccepted={(v) => setTerms(p.id, v)}
                                        onJoin={(id) => joinMutation.mutate(id)}
                                        onCancel={(id) => cancelMutation.mutate(id)}
                                    />
                                ))}
                            </div>
                        </section>
                    )}
                    <section>
                        <h2 className={stb.uiSubheading + ' mb-3'}>{suggested.length ? 'All programs' : 'Programs'}</h2>
                        {other.length === 0 && suggested.length === 0 ? (
                            <p className="text-muted-foreground text-sm">No programs available yet.</p>
                        ) : (
                            <div className="grid gap-4 md:grid-cols-2">
                                {other.map((p) => (
                                    <ProgramCard
                                        key={p.id}
                                        program={p}
                                        config={config}
                                        busy={busyProgram === p.id}
                                        termsAccepted={termsByProgram[p.id] === true}
                                        setTermsAccepted={(v) => setTerms(p.id, v)}
                                        onJoin={(id) => joinMutation.mutate(id)}
                                        onCancel={(id) => cancelMutation.mutate(id)}
                                    />
                                ))}
                            </div>
                        )}
                    </section>
                </TabsContent>

                <TabsContent value="mine" className="mt-4">
                    {mineLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                    ) : myWaitlist.length === 0 ? (
                        <p className="text-muted-foreground text-sm">You have not joined any program waitlists yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {myWaitlist.map((entry) => (
                                <Card key={entry.id}>
                                    <CardContent className="pt-4 flex flex-wrap justify-between gap-3">
                                        <div>
                                            <p className="font-medium">{entry.program?.title ?? 'Program'}</p>
                                            <p className="text-sm text-muted-foreground">
                                                {entry.target_language_label}, deposit {entry.deposit_amount} {entry.program?.currency ?? 'EUR'}
                                            </p>
                                            <Badge variant="outline" className="mt-2 capitalize">{entry.status?.replace('_', ' ')}</Badge>
                                            {entry.position != null && entry.status === 'waitlisted' && (
                                                <span className="ml-2 text-xs text-muted-foreground">Position #{entry.position}</span>
                                            )}
                                        </div>
                                        {entry.status === 'waitlisted' && (
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => cancelMutation.mutate(entry.program_id)}
                                            >
                                                Leave waitlist
                                            </Button>
                                        )}
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>
            </PageContent>
        </div>
    );
}

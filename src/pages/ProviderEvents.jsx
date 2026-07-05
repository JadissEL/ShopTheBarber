import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { canAccessProviderTools } from '@/lib/userRole';
import { MetaTags } from '@/components/seo/MetaTags';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Calendar, Video, MapPin, Users, CheckCircle2, Clock, ExternalLink, AlertCircle,
} from 'lucide-react';
import { format, parseISO, isValid, isPast } from 'date-fns';
import { toast } from 'sonner';
import { PageLoading } from '@/components/ui/page-loading';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';

const TYPE_LABELS = { webinar: 'Webinar', workshop: 'Workshop', training: 'Training', networking: 'Networking', conference: 'Conference' };
const FORMAT_ICONS = { online: Video, in_person: MapPin, hybrid: Calendar };

function fmt(iso) {
    if (!iso) return '';
    const d = parseISO(iso);
    return isValid(d) ? format(d, 'PPp') : iso;
}

function EventCard({ event, onRegister, onCancel, busy }) {
    const FormatIcon = FORMAT_ICONS[event.format] || Video;
    const reg = event.my_registration;
    const isRegistered = reg?.status === 'registered';
    const isWaitlist = reg?.status === 'waitlist';
    const past = isPast(parseISO(event.start_at));

    return (
        <Card className="overflow-hidden">
            {event.image_url && (
                <div className="h-36 bg-muted bg-cover bg-center" style={{ backgroundImage: `url(${event.image_url})` }} />
            )}
            <CardHeader className="pb-2">
                <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="secondary">{TYPE_LABELS[event.event_type] ?? event.event_type}</Badge>
                    <Badge variant="outline" className="capitalize">{event.format?.replace('_', ' ')}</Badge>
                    {past && <Badge variant="secondary">Past</Badge>}
                </div>
                <CardTitle className="text-lg">{event.title}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
                {event.description && <p className="text-sm text-muted-foreground line-clamp-3">{event.description}</p>}
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <FormatIcon className="w-4 h-4 shrink-0" />
                    <span>{fmt(event.start_at)}</span>
                </div>
                {event.location && event.format !== 'online' && (
                    <p className="text-sm text-muted-foreground flex items-center gap-2"><MapPin className="w-4 h-4" />{event.location}</p>
                )}
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Users className="w-3.5 h-3.5" />
                    {event.registered_count ?? 0} registered
                    {event.max_capacity != null && `, ${event.spots_left ?? 0} spots left`}
                </div>

                {isRegistered && event.meeting_url && (
                    <a href={event.meeting_url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-sm text-primary font-medium">
                        Join webinar <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                )}

                <div className="pt-2">
                    {isRegistered ? (
                        <div className="flex flex-wrap gap-2 items-center">
                            <Badge className="stb-chip stb-chip-active"><CheckCircle2 className="w-3 h-3 mr-1" />Registered</Badge>
                            {!past && (
                                <Button size="sm" variant="outline" disabled={busy} onClick={() => onCancel(event.id)}>Cancel</Button>
                            )}
                        </div>
                    ) : isWaitlist ? (
                        <Badge className="bg-warning/15 text-foreground"><Clock className="w-3 h-3 mr-1" />Waitlist</Badge>
                    ) : event.registration_open && !past ? (
                        <Button size="sm" disabled={busy} onClick={() => onRegister(event.id)}>Register</Button>
                    ) : (
                        <p className="text-xs text-muted-foreground">{event.registration_reason || 'Registration unavailable'}</p>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}

export default function ProviderEvents() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [tab, setTab] = useState('upcoming');

    const isProvider = canAccessProviderTools(user?.role);

    const { data: events = [], isLoading } = useQuery({
        queryKey: ['provider-events'],
        queryFn: () => sovereign.events.listProvider(),
        enabled: isProvider,
    });

    const { data: mine = [] } = useQuery({
        queryKey: ['my-event-registrations'],
        queryFn: () => sovereign.events.listMine(),
        enabled: isProvider,
    });

    const registerMutation = useMutation({
        mutationFn: (id) => sovereign.events.register(id),
        onSuccess: (data) => {
            toast.success(data.message || 'Registered!');
            queryClient.invalidateQueries({ queryKey: ['provider-events'] });
            queryClient.invalidateQueries({ queryKey: ['my-event-registrations'] });
        },
        onError: (e) => toast.error(e.message),
    });

    const cancelMutation = useMutation({
        mutationFn: (id) => sovereign.events.cancelRegistration(id),
        onSuccess: () => {
            toast.success('Registration cancelled');
            queryClient.invalidateQueries({ queryKey: ['provider-events'] });
            queryClient.invalidateQueries({ queryKey: ['my-event-registrations'] });
        },
        onError: (e) => toast.error(e.message),
    });

    const busy = registerMutation.isPending || cancelMutation.isPending;
    const upcoming = events.filter((e) => !isPast(parseISO(e.start_at)));
    const past = events.filter((e) => isPast(parseISO(e.start_at)));

    if (!isProvider) {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <Card><CardContent className="py-8 text-center">
                    <AlertCircle className="w-10 h-10 text-muted-foreground mx-auto mb-2" />
                    <p>Events & webinars are for barbers and shop owners.</p>
                </CardContent></Card>
            </div>
        );
    }

    if (isLoading) return <PageLoading message="Loading events…" />;

    return (
        <div className={`${stb.page  } lg:pb-8`}>
            <MetaTags title="Events & Webinars" description="Register for grooming industry events and webinars" />
            <PageHeader
                label="Provider"
                title="Events & webinars"
                subtitle="Workshops, training sessions, and live webinars for professionals."
                compact
                variant="light"
                tier="app"
            />
            <PageContent narrow>
                <Tabs value={tab} onValueChange={setTab}>
                    <TabsList className="mb-6">
                        <TabsTrigger value="upcoming">Upcoming ({upcoming.length})</TabsTrigger>
                        <TabsTrigger value="mine">My registrations ({mine.length})</TabsTrigger>
                        <TabsTrigger value="past">Past</TabsTrigger>
                    </TabsList>

                    <TabsContent value="upcoming" className="grid gap-4 sm:grid-cols-2">
                        {upcoming.length === 0 ? (
                            <p className="text-muted-foreground col-span-2 text-center py-12">No upcoming events, check back soon.</p>
                        ) : (
                            upcoming.map((e) => (
                                <EventCard key={e.id} event={e} busy={busy} onRegister={registerMutation.mutate} onCancel={cancelMutation.mutate} />
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="mine" className="space-y-4">
                        {mine.length === 0 ? (
                            <p className="text-muted-foreground text-center py-12">You have not registered for any events yet.</p>
                        ) : (
                            mine.map((r) => (
                                <Card key={r.id}>
                                    <CardContent className="p-4 flex flex-wrap justify-between gap-3 items-center">
                                        <div>
                                            <p className="font-semibold">{r.event?.title}</p>
                                            <p className="text-sm text-muted-foreground">{fmt(r.event?.start_at)}</p>
                                            <Badge variant="secondary" className="mt-1 capitalize">{r.status}</Badge>
                                        </div>
                                        {r.meeting_url && (
                                            <a href={r.meeting_url} target="_blank" rel="noopener noreferrer">
                                                <Button size="sm" variant="outline" className="gap-1">Join <ExternalLink className="w-3.5 h-3.5" /></Button>
                                            </a>
                                        )}
                                    </CardContent>
                                </Card>
                            ))
                        )}
                    </TabsContent>

                    <TabsContent value="past" className="grid gap-4 sm:grid-cols-2">
                        {past.map((e) => (
                            <EventCard key={e.id} event={e} busy={busy} onRegister={registerMutation.mutate} onCancel={cancelMutation.mutate} />
                        ))}
                    </TabsContent>
                </Tabs>
            </PageContent>
        </div>
    );
}

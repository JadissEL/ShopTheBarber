import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { MetaTags } from '@/components/seo/MetaTags';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import {
    AlertCircle, Loader2, Plus, Users, CheckCircle2, Pencil,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { toast } from 'sonner';
import { PageLoading } from '@/components/ui/page-loading';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';

const EMPTY = {
    title: '',
    description: '',
    event_type: 'webinar',
    format: 'online',
    start_at: '',
    end_at: '',
    timezone: 'UTC',
    location: '',
    meeting_url: '',
    max_capacity: '',
    target_audience: 'all_providers',
    status: 'draft',
};

function fmt(iso) {
    if (!iso) return '';
    const d = parseISO(iso);
    return isValid(d) ? format(d, 'PPp') : iso;
}

function toLocalInput(iso) {
    if (!iso) return '';
    const d = parseISO(iso);
    if (!isValid(d)) return '';
    const pad = (n) => String(n).padStart(2, '0');
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function fromLocalInput(val) {
    if (!val) return '';
    return new Date(val).toISOString();
}

export default function AdminEvents() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [registrationsFor, setRegistrationsFor] = useState(null);

    const { data: config } = useQuery({
        queryKey: ['events-config'],
        queryFn: () => sovereign.events.getConfig(),
        enabled: user?.role === 'admin',
    });

    const { data: events = [], isLoading } = useQuery({
        queryKey: ['admin-events'],
        queryFn: () => sovereign.events.adminList(),
        enabled: user?.role === 'admin',
    });

    const { data: registrations = [], isLoading: regsLoading } = useQuery({
        queryKey: ['admin-event-registrations', registrationsFor],
        queryFn: () => sovereign.events.adminRegistrations(registrationsFor),
        enabled: !!registrationsFor && user?.role === 'admin',
    });

    const saveMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                title: form.title,
                description: form.description || undefined,
                event_type: form.event_type,
                format: form.format,
                start_at: fromLocalInput(form.start_at),
                end_at: form.end_at ? fromLocalInput(form.end_at) : undefined,
                timezone: form.timezone || 'UTC',
                location: form.location || undefined,
                meeting_url: form.meeting_url || undefined,
                max_capacity: form.max_capacity ? Number(form.max_capacity) : undefined,
                target_audience: form.target_audience,
                status: form.status,
            };
            if (editing) return sovereign.events.adminUpdate(editing, payload);
            return sovereign.events.adminCreate(payload);
        },
        onSuccess: () => {
            toast.success(editing ? 'Event updated' : 'Event created');
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
            setOpen(false);
            setEditing(null);
            setForm(EMPTY);
        },
        onError: (e) => toast.error(e.message),
    });

    const publishMutation = useMutation({
        mutationFn: (eventId) => sovereign.events.adminUpdate(eventId, { status: 'published' }),
        onSuccess: () => {
            toast.success('Event published');
            queryClient.invalidateQueries({ queryKey: ['admin-events'] });
        },
        onError: (e) => toast.error(e.message),
    });

    const attendedMutation = useMutation({
        mutationFn: (registrationId) => sovereign.events.adminMarkAttended(registrationId),
        onSuccess: () => {
            toast.success('Marked as attended');
            queryClient.invalidateQueries({ queryKey: ['admin-event-registrations', registrationsFor] });
        },
        onError: (e) => toast.error(e.message),
    });

    const openCreate = () => {
        setEditing(null);
        const start = new Date();
        start.setDate(start.getDate() + 7);
        setForm({
            ...EMPTY,
            start_at: toLocalInput(start.toISOString()),
            status: 'draft',
        });
        setOpen(true);
    };

    const openEdit = (ev) => {
        setEditing(ev.id);
        setForm({
            title: ev.title ?? '',
            description: ev.description ?? '',
            event_type: ev.event_type ?? 'webinar',
            format: ev.format ?? 'online',
            start_at: toLocalInput(ev.start_at),
            end_at: ev.end_at ? toLocalInput(ev.end_at) : '',
            timezone: ev.timezone ?? 'UTC',
            location: ev.location ?? '',
            meeting_url: ev.meeting_url ?? '',
            max_capacity: ev.max_capacity != null ? String(ev.max_capacity) : '',
            target_audience: ev.target_audience ?? 'all_providers',
            status: ev.status ?? 'draft',
        });
        setOpen(true);
    };

    if (user?.role !== 'admin') {
        return (
            <div className={`${stb.page  } flex items-center justify-center p-4`}>
                <div className={`${stb.panel  } p-8 text-center`}>
                    <AlertCircle className="w-10 h-10 text-destructive mx-auto mb-2" />
                    <p className={stb.uiSubheading}>Admin access required</p>
                </div>
            </div>
        );
    }

    if (isLoading) return <PageLoading message="Loading events…" />;

    return (
        <div className={`${stb.page  } lg:pb-8`}>
            <MetaTags title="Events Admin" />
            <PageHeader
                label="Admin"
                title="Events & webinars"
                subtitle="Create and manage platform events"
                compact
                variant="light"
                tier="app"
            >
                <Button onClick={openCreate} className="gap-1"><Plus className="w-4 h-4" /> New event</Button>
            </PageHeader>
            <PageContent narrow>
                <ul className="space-y-3">
                    {events.map((ev) => (
                        <li key={ev.id}>
                            <Card>
                                <CardContent className="p-4 flex flex-wrap items-start gap-3 justify-between">
                                    <div className="min-w-0 flex-1">
                                        <p className="font-medium">{ev.title}</p>
                                        <p className="text-sm text-muted-foreground">{fmt(ev.start_at)}</p>
                                        <div className="flex flex-wrap gap-2 mt-2">
                                            <Badge variant="secondary" className="capitalize">{ev.status}</Badge>
                                            <Badge variant="outline">{ev.event_type}</Badge>
                                            <span className="text-xs text-muted-foreground flex items-center gap-1">
                                                <Users className="w-3.5 h-3.5" />
                                                {ev.registered_count ?? 0} registered
                                                {(ev.waitlist_count ?? 0) > 0 && `, ${ev.waitlist_count} waitlist`}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex flex-wrap gap-2">
                                        <Button size="sm" variant="outline" onClick={() => setRegistrationsFor(ev.id)}>
                                            Registrations
                                        </Button>
                                        <Button size="sm" variant="outline" onClick={() => openEdit(ev)}>
                                            <Pencil className="w-4 h-4" />
                                        </Button>
                                        {ev.status === 'draft' && (
                                            <Button size="sm" onClick={() => publishMutation.mutate(ev.id)} disabled={publishMutation.isPending}>
                                                Publish
                                            </Button>
                                        )}
                                    </div>
                                </CardContent>
                            </Card>
                        </li>
                    ))}
                </ul>
            </PageContent>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>{editing ? 'Edit event' : 'Create event'}</DialogTitle></DialogHeader>
                    <div className="space-y-4 py-2">
                        <div><Label>Title</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} /></div>
                        <div><Label>Description</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={3} /></div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Type</Label>
                                <Select value={form.event_type} onValueChange={(v) => setForm({ ...form, event_type: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(config?.event_types ?? []).map((t) => (
                                            <SelectItem key={t.id} value={t.id}>{t.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Format</Label>
                                <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(config?.formats ?? []).map((f) => (
                                            <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div><Label>Start</Label><Input type="datetime-local" value={form.start_at} onChange={(e) => setForm({ ...form, start_at: e.target.value })} /></div>
                        <div><Label>Meeting URL</Label><Input value={form.meeting_url} onChange={(e) => setForm({ ...form, meeting_url: e.target.value })} placeholder="https://zoom.us/..." /></div>
                        <div><Label>Max capacity</Label><Input type="number" min={1} value={form.max_capacity} onChange={(e) => setForm({ ...form, max_capacity: e.target.value })} /></div>
                        <div>
                            <Label>Audience</Label>
                            <Select value={form.target_audience} onValueChange={(v) => setForm({ ...form, target_audience: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {(config?.audiences ?? []).map((a) => (
                                        <SelectItem key={a.id} value={a.id}>{a.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Status</Label>
                            <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {(config?.statuses ?? ['draft', 'published']).map((s) => (
                                        <SelectItem key={s} value={s}>{s}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button onClick={() => saveMutation.mutate()} disabled={saveMutation.isPending || !form.title || !form.start_at}>
                            {saveMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!registrationsFor} onOpenChange={(v) => !v && setRegistrationsFor(null)}>
                <DialogContent className="max-w-md max-h-[80vh] overflow-y-auto">
                    <DialogHeader><DialogTitle>Registrations</DialogTitle></DialogHeader>
                    {regsLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin mx-auto" />
                    ) : registrations.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-6">No registrations yet.</p>
                    ) : (
                        <ul className="space-y-2">
                            {registrations.map((r) => (
                                <li key={r.id} className="flex items-center justify-between gap-2 border rounded-lg p-3">
                                    <div>
                                        <p className="text-sm font-medium">{r.user?.full_name || r.user?.email}</p>
                                        <Badge variant="secondary" className="text-xs capitalize mt-1">{r.status}</Badge>
                                    </div>
                                    {r.status === 'registered' && (
                                        <Button size="sm" variant="outline" onClick={() => attendedMutation.mutate(r.id)} disabled={attendedMutation.isPending}>
                                            <CheckCircle2 className="w-4 h-4" />
                                        </Button>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

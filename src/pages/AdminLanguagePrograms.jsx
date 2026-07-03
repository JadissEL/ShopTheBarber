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
import { Loader2, Plus, Users, Pencil, GraduationCap } from 'lucide-react';
import { toast } from 'sonner';
import { PageLoading } from '@/components/ui/page-loading';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';

const EMPTY = {
    title: '',
    description: '',
    language_code: 'en',
    total_price: '',
    currency: 'EUR',
    max_waitlist: '',
    status: 'draft',
    estimated_start_at: '',
    duration_weeks: '',
    format: 'online',
    image_url: '',
};

export default function AdminLanguagePrograms() {
    const { user } = useAuth();
    const queryClient = useQueryClient();
    const [open, setOpen] = useState(false);
    const [editing, setEditing] = useState(null);
    const [form, setForm] = useState(EMPTY);
    const [waitlistFor, setWaitlistFor] = useState(null);

    const { data: config } = useQuery({
        queryKey: ['language-programs-config'],
        queryFn: () => sovereign.languagePrograms.getConfig(),
        enabled: user?.role === 'admin',
    });

    const { data: programs = [], isLoading } = useQuery({
        queryKey: ['admin-language-programs'],
        queryFn: () => sovereign.languagePrograms.adminList(),
        enabled: user?.role === 'admin',
    });

    const { data: waitlist = [], isLoading: wlLoading } = useQuery({
        queryKey: ['admin-language-program-waitlist', waitlistFor],
        queryFn: () => sovereign.languagePrograms.adminWaitlist(waitlistFor),
        enabled: !!waitlistFor && user?.role === 'admin',
    });

    const saveMutation = useMutation({
        mutationFn: async () => {
            const payload = {
                title: form.title,
                description: form.description || undefined,
                language_code: form.language_code,
                total_price: Number(form.total_price),
                currency: form.currency || 'EUR',
                max_waitlist: form.max_waitlist ? Number(form.max_waitlist) : undefined,
                status: form.status,
                estimated_start_at: form.estimated_start_at || undefined,
                duration_weeks: form.duration_weeks ? Number(form.duration_weeks) : undefined,
                format: form.format,
                image_url: form.image_url || undefined,
            };
            if (editing) return sovereign.languagePrograms.adminUpdate(editing, payload);
            return sovereign.languagePrograms.adminCreate(payload);
        },
        onSuccess: () => {
            toast.success(editing ? 'Program updated' : 'Program created');
            queryClient.invalidateQueries({ queryKey: ['admin-language-programs'] });
            setOpen(false);
            setEditing(null);
            setForm(EMPTY);
        },
        onError: (e) => toast.error(e.message),
    });

    const enrollMutation = useMutation({
        mutationFn: (waitlistId) => sovereign.languagePrograms.adminEnroll(waitlistId),
        onSuccess: () => {
            toast.success('Barber enrolled');
            queryClient.invalidateQueries({ queryKey: ['admin-language-program-waitlist', waitlistFor] });
            queryClient.invalidateQueries({ queryKey: ['admin-language-programs'] });
        },
        onError: (e) => toast.error(e.message),
    });

    const openCreate = () => {
        setEditing(null);
        setForm(EMPTY);
        setOpen(true);
    };

    const openEdit = (p) => {
        setEditing(p.id);
        setForm({
            title: p.title,
            description: p.description ?? '',
            language_code: p.language_code,
            total_price: String(p.total_price),
            currency: p.currency ?? 'EUR',
            max_waitlist: p.max_waitlist != null ? String(p.max_waitlist) : '',
            status: p.status ?? 'draft',
            estimated_start_at: p.estimated_start_at ?? '',
            duration_weeks: p.duration_weeks != null ? String(p.duration_weeks) : '',
            format: p.format ?? 'online',
            image_url: p.image_url ?? '',
        });
        setOpen(true);
    };

    if (user?.role !== 'admin') {
        return (
            <div className={`${stb.page  } p-6`}>
                <p className="text-muted-foreground">Admin access required.</p>
            </div>
        );
    }
    if (isLoading) return <PageLoading />;

    return (
        <div className={`${stb.page  } lg:pb-8`}>
            <MetaTags title="Admin, Language Programs" />
            <PageHeader
                label="Admin"
                title="Language programs"
                subtitle={`Manage training programs and paid waitlists (${config?.deposit_percent ?? 20}% non-refundable deposit).`}
                compact
                variant="light"
                tier="app"
            >
                <Button onClick={openCreate}><Plus className="w-4 h-4 mr-2" />New program</Button>
            </PageHeader>
            <PageContent narrow className="space-y-6">

            <div className="space-y-3">
                {programs.map((p) => (
                    <Card key={p.id}>
                        <CardContent className="pt-4 flex flex-wrap justify-between gap-3">
                            <div>
                                <div className="flex flex-wrap gap-2 mb-1">
                                    <Badge>{p.language_label}</Badge>
                                    <Badge variant="outline" className="capitalize">{p.status}</Badge>
                                </div>
                                <p className="font-medium">{p.title}</p>
                                <p className="text-sm text-muted-foreground">
                                    {p.total_price} {p.currency}, deposit {p.deposit_amount} {p.currency}
                                </p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    {p.waitlist_count ?? 0} paid waitlist
                                    {p.pending_count ? `, ${p.pending_count} pending payment` : ''}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <Button size="sm" variant="outline" onClick={() => setWaitlistFor(p.id)}>
                                    <Users className="w-4 h-4 mr-1" />Waitlist
                                </Button>
                                <Button size="sm" variant="outline" onClick={() => openEdit(p)}>
                                    <Pencil className="w-4 h-4" />
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
            </PageContent>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>{editing ? 'Edit program' : 'Create program'}</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-3 py-2">
                        <div>
                            <Label>Title</Label>
                            <Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
                        </div>
                        <div>
                            <Label>Description</Label>
                            <Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Target language</Label>
                                <Select value={form.language_code} onValueChange={(v) => setForm({ ...form, language_code: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(config?.languages ?? []).map((l) => (
                                            <SelectItem key={l.code} value={l.code}>{l.label}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <Label>Status</Label>
                                <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        {(config?.program_statuses ?? []).map((s) => (
                                            <SelectItem key={s} value={s}>{s}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Total price</Label>
                                <Input type="number" min="0" step="0.01" value={form.total_price} onChange={(e) => setForm({ ...form, total_price: e.target.value })} />
                            </div>
                            <div>
                                <Label>Currency</Label>
                                <Input value={form.currency} onChange={(e) => setForm({ ...form, currency: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                            <div>
                                <Label>Max waitlist</Label>
                                <Input type="number" min="1" value={form.max_waitlist} onChange={(e) => setForm({ ...form, max_waitlist: e.target.value })} />
                            </div>
                            <div>
                                <Label>Duration (weeks)</Label>
                                <Input type="number" min="1" value={form.duration_weeks} onChange={(e) => setForm({ ...form, duration_weeks: e.target.value })} />
                            </div>
                        </div>
                        <div>
                            <Label>Format</Label>
                            <Select value={form.format} onValueChange={(v) => setForm({ ...form, format: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {(config?.program_formats ?? []).map((f) => (
                                        <SelectItem key={f.id} value={f.id}>{f.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label>Estimated start (ISO date)</Label>
                            <Input value={form.estimated_start_at} onChange={(e) => setForm({ ...form, estimated_start_at: e.target.value })} placeholder="2026-09-01T00:00:00.000Z" />
                        </div>
                        <div>
                            <Label>Image URL</Label>
                            <Input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} />
                        </div>
                        {form.total_price && (
                            <p className="text-xs text-muted-foreground">
                                Waitlist deposit ({config?.deposit_percent ?? 20}%):{' '}
                                {(Number(form.total_price) * (config?.deposit_percent ?? 20)) / 100} {form.currency}, non-refundable
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                        <Button disabled={saveMutation.isPending} onClick={() => saveMutation.mutate()}>
                            {saveMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                            Save
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <Dialog open={!!waitlistFor} onOpenChange={(v) => !v && setWaitlistFor(null)}>
                <DialogContent className="max-w-lg max-h-[85vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Waitlist</DialogTitle>
                    </DialogHeader>
                    {wlLoading ? (
                        <Loader2 className="w-6 h-6 animate-spin" />
                    ) : waitlist.length === 0 ? (
                        <p className="text-sm text-muted-foreground">No waitlist entries yet.</p>
                    ) : (
                        <div className="space-y-2">
                            {waitlist.map((entry) => (
                                <div key={entry.id} className="flex flex-wrap justify-between gap-2 border rounded-lg p-3">
                                    <div>
                                        <p className="font-medium text-sm">{entry.user?.full_name ?? entry.user?.email}</p>
                                        <p className="text-xs text-muted-foreground capitalize">
                                            {entry.status?.replace('_', ' ')}, {entry.payment_status}
                                            {entry.position != null && `, #${entry.position}`}
                                        </p>
                                    </div>
                                    {entry.status === 'waitlisted' && (
                                        <Button size="sm" disabled={enrollMutation.isPending} onClick={() => enrollMutation.mutate(entry.id)}>
                                            <GraduationCap className="w-4 h-4 mr-1" />Enroll
                                        </Button>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
}

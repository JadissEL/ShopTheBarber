import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { useMessageStream } from '@/hooks/useMessageStream';
import { MetaTags } from '@/components/seo/MetaTags';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { AlertCircle, Headphones, Loader2, Send, Inbox, Clock, CheckCircle2 } from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { PageLoading } from '@/components/ui/page-loading';

const STATUS_COLORS = {
    open: 'bg-amber-100 text-amber-800',
    in_progress: 'bg-sky-100 text-sky-800',
    resolved: 'bg-emerald-100 text-emerald-800',
    closed: 'bg-muted text-muted-foreground',
};

function formatTime(value) {
    if (!value) return '';
    const d = parseISO(value);
    return isValid(d) ? format(d, 'PPp') : '';
}

export default function AdminSupportInbox() {
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const scrollRef = useRef(null);
    const [filterStatus, setFilterStatus] = useState('all');
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [search, setSearch] = useState('');

    useMessageStream(user?.id, isAuthenticated);

    const { data: stats } = useQuery({
        queryKey: ['support-admin-stats'],
        queryFn: () => sovereign.support.adminStats(),
        enabled: user?.role === 'admin',
    });

    const { data: tickets = [], isLoading } = useQuery({
        queryKey: ['support-admin-tickets', filterStatus],
        queryFn: () => sovereign.support.adminListTickets({ status: filterStatus }),
        enabled: user?.role === 'admin',
        refetchInterval: 10000,
    });

    const { data: messages = [], isLoading: messagesLoading } = useQuery({
        queryKey: ['support-messages', selectedTicketId],
        queryFn: () => sovereign.support.getTicketMessages(selectedTicketId),
        enabled: !!selectedTicketId && user?.role === 'admin',
        refetchInterval: 5000,
    });

    const selectedTicket = useMemo(
        () => tickets.find((t) => t.id === selectedTicketId) ?? null,
        [tickets, selectedTicketId]
    );

    const filteredTickets = useMemo(() => {
        if (!search.trim()) return tickets;
        const q = search.toLowerCase();
        return tickets.filter(
            (t) =>
                t.subject?.toLowerCase().includes(q) ||
                t.user?.full_name?.toLowerCase().includes(q) ||
                t.user?.email?.toLowerCase().includes(q)
        );
    }, [tickets, search]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const sendMutation = useMutation({
        mutationFn: ({ ticketId, content }) => sovereign.support.sendMessage(ticketId, content),
        onSuccess: () => {
            setMessageText('');
            queryClient.invalidateQueries({ queryKey: ['support-messages', selectedTicketId] });
            queryClient.invalidateQueries({ queryKey: ['support-admin-tickets'] });
            queryClient.invalidateQueries({ queryKey: ['support-admin-stats'] });
        },
        onError: (e) => toast.error(e.message),
    });

    const statusMutation = useMutation({
        mutationFn: ({ ticketId, status }) => sovereign.support.updateTicket(ticketId, { status }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support-admin-tickets'] });
            queryClient.invalidateQueries({ queryKey: ['support-admin-stats'] });
            toast.success('Ticket updated');
        },
        onError: (e) => toast.error(e.message),
    });

    if (!isAuthenticated || user?.role !== 'admin') {
        return (
            <div className="min-h-screen flex items-center justify-center p-4">
                <MetaTags title="Access Denied" />
                <Card>
                    <CardContent className="py-8 text-center">
                        <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
                        <p className="font-semibold">Admin access required</p>
                    </CardContent>
                </Card>
            </div>
        );
    }

    if (isLoading && !tickets.length) return <PageLoading message="Loading support inbox…" />;

    return (
        <div className="stb-page flex flex-col">
            <MetaTags title="Support Inbox" description="Platform support tickets" />

            <header className="border-b border-border bg-card px-4 lg:px-8 py-4">
                <div className="flex items-center gap-3 mb-4">
                    <Inbox className="w-6 h-6 text-primary" />
                    <h1 className="text-xl font-bold">Support Inbox</h1>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    <Card><CardContent className="p-3 flex items-center gap-2"><Clock className="w-4 h-4 text-amber-600" /><div><p className="text-xs text-muted-foreground">Open</p><p className="font-bold">{stats?.open ?? 0}</p></div></CardContent></Card>
                    <Card><CardContent className="p-3 flex items-center gap-2"><Headphones className="w-4 h-4 text-sky-600" /><div><p className="text-xs text-muted-foreground">In progress</p><p className="font-bold">{stats?.in_progress ?? 0}</p></div></CardContent></Card>
                    <Card><CardContent className="p-3 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><div><p className="text-xs text-muted-foreground">Resolved</p><p className="font-bold">{stats?.resolved ?? 0}</p></div></CardContent></Card>
                    <Card><CardContent className="p-3"><p className="text-xs text-muted-foreground">Total</p><p className="font-bold">{stats?.total ?? 0}</p></CardContent></Card>
                </div>
            </header>

            <div className="flex-1 flex min-h-0">
                <aside className="w-full lg:w-96 border-r border-border flex flex-col bg-card">
                    <div className="p-3 space-y-2 border-b border-border">
                        <Input placeholder="Search tickets…" value={search} onChange={(e) => setSearch(e.target.value)} />
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                            <SelectTrigger><SelectValue placeholder="Status" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All statuses</SelectItem>
                                <SelectItem value="open">Open</SelectItem>
                                <SelectItem value="in_progress">In progress</SelectItem>
                                <SelectItem value="resolved">Resolved</SelectItem>
                                <SelectItem value="closed">Closed</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <ScrollArea className="flex-1">
                        <ul className="divide-y divide-border">
                            {filteredTickets.map((t) => (
                                <li key={t.id}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedTicketId(t.id)}
                                        className={cn(
                                            'w-full text-left p-4 hover:bg-muted/50',
                                            selectedTicketId === t.id && 'bg-muted'
                                        )}
                                    >
                                        <div className="flex items-start gap-2">
                                            <Avatar className="h-8 w-8 shrink-0">
                                                <AvatarImage src={t.user?.avatar_url} />
                                                <AvatarFallback>{t.user?.full_name?.[0] ?? '?'}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex-1 min-w-0">
                                                <div className="flex justify-between gap-1">
                                                    <p className="font-medium text-sm truncate">{t.subject}</p>
                                                    {(t.unread_count ?? 0) > 0 && (
                                                        <Badge className="shrink-0 h-5">{t.unread_count}</Badge>
                                                    )}
                                                </div>
                                                <p className="text-xs text-muted-foreground truncate">{t.user?.full_name}, {t.user?.role}</p>
                                                <Badge variant="secondary" className={cn('mt-1 text-[10px]', STATUS_COLORS[t.status] ?? '')}>
                                                    {(t.status ?? 'open').replace('_', ' ')}
                                                </Badge>
                                            </div>
                                        </div>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </ScrollArea>
                </aside>

                <main className="flex-1 flex flex-col min-w-0 hidden lg:flex">
                    {!selectedTicketId ? (
                        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm">
                            Select a ticket to view the conversation
                        </div>
                    ) : (
                        <>
                            <div className="p-4 border-b border-border flex flex-wrap items-center gap-2">
                                <div className="flex-1 min-w-0">
                                    <p className="font-semibold truncate">{selectedTicket?.subject}</p>
                                    <p className="text-xs text-muted-foreground">
                                        {selectedTicket?.user?.full_name} ({selectedTicket?.user?.email}), {selectedTicket?.category}
                                    </p>
                                </div>
                                <Select
                                    value={selectedTicket?.status ?? 'open'}
                                    onValueChange={(status) => statusMutation.mutate({ ticketId: selectedTicketId, status })}
                                >
                                    <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="open">Open</SelectItem>
                                        <SelectItem value="in_progress">In progress</SelectItem>
                                        <SelectItem value="resolved">Resolved</SelectItem>
                                        <SelectItem value="closed">Closed</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <ScrollArea className="flex-1 p-4">
                                {messagesLoading ? (
                                    <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
                                ) : (
                                    <div className="space-y-3 max-w-2xl">
                                        {messages.map((msg) => {
                                            const isSupport = msg.is_from_support;
                                            return (
                                                <div key={msg.id} className={cn('flex', isSupport ? 'justify-end' : 'justify-start')}>
                                                    <div className={cn(
                                                        'max-w-[85%] rounded-2xl px-4 py-2 text-sm',
                                                        isSupport ? 'bg-primary text-primary-foreground' : 'bg-muted'
                                                    )}>
                                                        <p className="text-[10px] opacity-70 mb-0.5">{msg.sender_display_name}</p>
                                                        <p className="whitespace-pre-wrap">{msg.content}</p>
                                                        <p className="text-[10px] opacity-60 mt-1">{formatTime(msg.created_at)}</p>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        <div ref={scrollRef} />
                                    </div>
                                )}
                            </ScrollArea>
                            {selectedTicket?.status !== 'closed' && (
                                <form
                                    className="p-4 border-t flex gap-2"
                                    onSubmit={(e) => {
                                        e.preventDefault();
                                        if (!messageText.trim()) return;
                                        sendMutation.mutate({ ticketId: selectedTicketId, content: messageText.trim() });
                                    }}
                                >
                                    <Input value={messageText} onChange={(e) => setMessageText(e.target.value)} placeholder="Reply as support…" />
                                    <Button type="submit" disabled={sendMutation.isPending}><Send className="w-4 h-4" /></Button>
                                </form>
                            )}
                        </>
                    )}
                </main>
            </div>
        </div>
    );
}

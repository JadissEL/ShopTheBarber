import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { useMessageStream } from '@/hooks/useMessageStream';
import { createPageUrl } from '@/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
    ArrowLeft, Headphones, Loader2, MessageSquarePlus, Send, ShieldCheck, ChevronLeft,
} from 'lucide-react';
import { format, parseISO, isValid } from 'date-fns';
import { toast } from 'sonner';
import ClientDisputeAppealsPanel from '@/components/dispute/ClientDisputeAppealsPanel';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/layout/PageHeader';
import { stb } from '@/lib/stbUi';

const STATUS_COLORS = {
    open: 'bg-warning/15 text-foreground',
    in_progress: 'bg-primary/10 text-primary',
    resolved: 'stb-chip stb-chip-active',
    closed: 'bg-muted text-muted-foreground',
};

function formatTime(value) {
    if (!value) return '';
    const d = parseISO(value);
    return isValid(d) ? format(d, 'PPp') : '';
}

export default function SupportChat() {
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const scrollRef = useRef(null);
    const [searchParams] = useSearchParams();
    const [selectedTicketId, setSelectedTicketId] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [newOpen, setNewOpen] = useState(false);
    const [newSubject, setNewSubject] = useState('');
    const [newCategory, setNewCategory] = useState('general');
    const [newContent, setNewContent] = useState('');

    const orderId = searchParams.get('order_id') || searchParams.get('orderId');
    const bookingId = searchParams.get('booking_id') || searchParams.get('bookingId');

    useMessageStream(user?.id, isAuthenticated);

    const { data: desk } = useQuery({
        queryKey: ['support-desk'],
        queryFn: () => sovereign.support.getDesk(),
        enabled: !!user?.id,
    });

    const { data: tickets = [], isLoading: ticketsLoading } = useQuery({
        queryKey: ['support-tickets', user?.id],
        queryFn: () => sovereign.support.listTickets(),
        enabled: !!user?.id,
        refetchInterval: 15000,
    });

    const { data: messages = [], isLoading: messagesLoading } = useQuery({
        queryKey: ['support-messages', selectedTicketId],
        queryFn: () => sovereign.support.getTicketMessages(selectedTicketId),
        enabled: !!selectedTicketId,
        refetchInterval: 8000,
    });

    const selectedTicket = useMemo(
        () => tickets.find((t) => t.id === selectedTicketId) ?? null,
        [tickets, selectedTicketId]
    );

    useEffect(() => {
        if (searchParams.get('new') === '1') setNewOpen(true);
    }, [searchParams]);

    useEffect(() => {
        if (orderId && newOpen && !newSubject) {
            setNewSubject(`Order help, ${orderId.slice(0, 8)}…`);
            setNewCategory('marketplace');
        }
        if (bookingId && newOpen && !newSubject) {
            setNewSubject(`Booking help`);
            setNewCategory('booking');
        }
    }, [orderId, bookingId, newOpen, newSubject]);

    useEffect(() => {
        scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

    const createMutation = useMutation({
        mutationFn: (payload) => sovereign.support.createTicket(payload),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
            setNewOpen(false);
            setNewSubject('');
            setNewContent('');
            setNewCategory('general');
            setSelectedTicketId(data.ticket.id);
            toast.success('Support ticket created');
        },
        onError: (e) => toast.error(e.message),
    });

    const sendMutation = useMutation({
        mutationFn: ({ ticketId, content }) => sovereign.support.sendMessage(ticketId, content),
        onSuccess: () => {
            setMessageText('');
            queryClient.invalidateQueries({ queryKey: ['support-messages', selectedTicketId] });
            queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
        },
        onError: (e) => toast.error(e.message),
    });

    const closeMutation = useMutation({
        mutationFn: (ticketId) => sovereign.support.updateTicket(ticketId, { status: 'closed' }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['support-tickets'] });
            toast.success('Ticket closed');
        },
        onError: (e) => toast.error(e.message),
    });

    if (!isAuthenticated) {
        return (
            <div className={stb.page + ' flex items-center justify-center p-6'}>
                <MetaTags title="Support" />
                <p className="text-muted-foreground">Sign in to contact support.</p>
            </div>
        );
    }

    const categories = desk?.categories ?? [
        { id: 'general', label: 'General' },
        { id: 'booking', label: 'Bookings' },
        { id: 'marketplace', label: 'Marketplace' },
    ];

    return (
        <div className={stb.page + ' flex flex-col lg:pb-8'}>
            <MetaTags title="Support Chat" description="Chat with ShopTheBarber support" />
            <PageHeader
                label="Help"
                title="Support"
                subtitle="We typically reply within a few hours."
                compact
                variant="light"
                tier="app"
            >
                <Button className="gap-2" onClick={() => setNewOpen(true)}>
                    <MessageSquarePlus className="w-4 h-4" /> New conversation
                </Button>
            </PageHeader>
            <div className="max-w-7xl mx-auto w-full px-4 py-2">
                <ClientDisputeAppealsPanel />
            </div>
            <div className="flex flex-col lg:flex-row flex-1">
            <aside className={cn(
                'w-full lg:w-80 border-r border-border bg-card flex flex-col',
                selectedTicketId && 'hidden lg:flex'
            )}>
                <div className="p-4 border-b border-border">
                    <Link to={createPageUrl('HelpCenter')} className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                        <ArrowLeft className="w-4 h-4" /> Help Center
                    </Link>
                </div>
                <ScrollArea className="flex-1">
                    {ticketsLoading ? (
                        <div className="p-6 flex justify-center"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
                    ) : tickets.length === 0 ? (
                        <p className="p-6 text-sm text-muted-foreground text-center">No conversations yet.</p>
                    ) : (
                        <ul className="divide-y divide-border">
                            {tickets.map((t) => (
                                <li key={t.id}>
                                    <button
                                        type="button"
                                        onClick={() => setSelectedTicketId(t.id)}
                                        className={cn(
                                            'w-full text-left p-4 hover:bg-muted/50 transition-colors',
                                            selectedTicketId === t.id && 'bg-muted'
                                        )}
                                    >
                                        <div className="flex items-start justify-between gap-2">
                                            <p className="font-medium text-sm line-clamp-1">{t.subject}</p>
                                            {t.unread_count > 0 && (
                                                <Badge variant="default" className="shrink-0 h-5 min-w-5 px-1.5">{t.unread_count}</Badge>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.last_message_preview}</p>
                                        <Badge variant="secondary" className={cn('mt-2 text-[10px]', STATUS_COLORS[t.status] ?? '')}>
                                            {(t.status ?? 'open').replace('_', ' ')}
                                        </Badge>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    )}
                </ScrollArea>
            </aside>

            {/* Conversation */}
            <main className={cn('flex-1 flex flex-col min-h-0', !selectedTicketId && 'hidden lg:flex')}>
                {!selectedTicketId ? (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                        <ShieldCheck className="w-12 h-12 text-primary mb-4" />
                        <h2 className="font-semibold text-lg">ShopTheBarber Support</h2>
                        <p className="text-muted-foreground text-sm mt-2 max-w-sm">
                            Questions about bookings, orders, payouts, or your account? Start a conversation and our team will help.
                        </p>
                        <Button className="mt-6 gap-2" onClick={() => setNewOpen(true)}>
                            <MessageSquarePlus className="w-4 h-4" /> Contact support
                        </Button>
                    </div>
                ) : (
                    <>
                        <div className="p-4 border-b border-border flex items-center gap-3">
                            <button type="button" className="lg:hidden p-1" onClick={() => setSelectedTicketId(null)}>
                                <ChevronLeft className="w-5 h-5" />
                            </button>
                            <Avatar className="h-9 w-9">
                                <AvatarImage src={desk?.avatar_url} />
                                <AvatarFallback><Headphones className="w-4 h-4" /></AvatarFallback>
                            </Avatar>
                            <div className="flex-1 min-w-0">
                                <p className="font-semibold text-sm truncate">{selectedTicket?.subject}</p>
                                <p className="text-xs text-muted-foreground">{desk?.display_name ?? 'Support'}</p>
                            </div>
                            {selectedTicket?.status !== 'closed' && (
                                <Button variant="outline" size="sm" onClick={() => closeMutation.mutate(selectedTicketId)}>
                                    Close
                                </Button>
                            )}
                        </div>

                        <ScrollArea className="flex-1 p-4">
                            {messagesLoading ? (
                                <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin" /></div>
                            ) : (
                                <div className="space-y-4 max-w-2xl mx-auto">
                                    {messages.map((msg) => {
                                        const isMine = msg.sender_id === user?.id && !msg.is_from_support;
                                        return (
                                            <div key={msg.id} className={cn('flex', isMine ? 'justify-end' : 'justify-start')}>
                                                <div className={cn(
                                                    'max-w-[85%] rounded-lg px-4 py-2.5 text-sm',
                                                    isMine ? 'bg-primary text-primary-foreground' : 'bg-muted text-foreground'
                                                )}>
                                                    {!isMine && (
                                                        <p className="text-[10px] font-medium opacity-70 mb-1">{msg.sender_display_name}</p>
                                                    )}
                                                    <p className="whitespace-pre-wrap">{msg.content}</p>
                                                    <p className={cn('text-[10px] mt-1 opacity-60', isMine ? 'text-right' : '')}>
                                                        {formatTime(msg.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                    <div ref={scrollRef} />
                                </div>
                            )}
                        </ScrollArea>

                        {selectedTicket?.status !== 'closed' ? (
                            <form
                                className="p-4 border-t border-border flex gap-2 max-w-2xl mx-auto w-full"
                                onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!messageText.trim()) return;
                                    sendMutation.mutate({ ticketId: selectedTicketId, content: messageText.trim() });
                                }}
                            >
                                <Input
                                    value={messageText}
                                    onChange={(e) => setMessageText(e.target.value)}
                                    placeholder="Type your message…"
                                    disabled={sendMutation.isPending}
                                />
                                <Button type="submit" disabled={sendMutation.isPending || !messageText.trim()}>
                                    <Send className="w-4 h-4" />
                                </Button>
                            </form>
                        ) : (
                            <p className="p-4 text-center text-sm text-muted-foreground border-t">This ticket is closed.</p>
                        )}
                    </>
                )}
            </main>
            </div>

            <Dialog open={newOpen} onOpenChange={setNewOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>New support request</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 py-2">
                        <div>
                            <Label htmlFor="subject">Subject</Label>
                            <Input id="subject" value={newSubject} onChange={(e) => setNewSubject(e.target.value)} placeholder="Brief summary" />
                        </div>
                        <div>
                            <Label>Category</Label>
                            <Select value={newCategory} onValueChange={setNewCategory}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    {categories.map((c) => (
                                        <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <Label htmlFor="content">Message</Label>
                            <Textarea id="content" rows={4} value={newContent} onChange={(e) => setNewContent(e.target.value)} placeholder="Describe your issue…" />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setNewOpen(false)}>Cancel</Button>
                        <Button
                            disabled={createMutation.isPending || !newSubject.trim() || !newContent.trim()}
                            onClick={() => createMutation.mutate({
                                subject: newSubject.trim(),
                                category: newCategory,
                                content: newContent.trim(),
                                order_id: orderId || undefined,
                                booking_id: bookingId || undefined,
                            })}
                        >
                            {createMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Send'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

import { useEffect, useMemo, useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { useAuth } from '@/lib/AuthContext';
import { useMessageStream } from '@/hooks/useMessageStream';
import BookingChatBanner from '@/components/messages/BookingChatBanner';
import RescheduleProposalCard from '@/components/messages/RescheduleProposalCard';
import {
    Send, Search, MessageSquare, ChevronLeft, Scissors, Store, ShieldCheck, CheckCheck, Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MetaTags } from '@/components/seo/MetaTags';
import { signInUrlWithReturn } from '@/utils';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { motion, AnimatePresence } from 'framer-motion';
import { format, parseISO, isValid } from 'date-fns';
import { toast } from 'sonner';

function readChatParams() {
    const params = new URLSearchParams(window.location.search);
    return {
        contactUserId: params.get('contact') || params.get('contactId') || null,
        bookingId: params.get('booking') || params.get('bookingId') || null,
        barberId: params.get('barber_id') || params.get('barberId') || null,
        shopId: params.get('shop_id') || params.get('shopId') || null,
    };
}

function formatMsgTime(value) {
    if (!value) return '';
    const d = parseISO(value);
    return isValid(d) ? format(d, 'p') : '';
}

export default function Chat() {
    const { user, isAuthenticated } = useAuth();
    const queryClient = useQueryClient();
    const scrollRef = useRef(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [messageText, setMessageText] = useState('');
    const [selectedContactId, setSelectedContactId] = useState(null);
    const [activeBookingId, setActiveBookingId] = useState(null);
    const [rescheduleOpen, setRescheduleOpen] = useState(false);
    const [proposedDateTime, setProposedDateTime] = useState('');

    const initialParams = useMemo(() => readChatParams(), []);

    useMessageStream(user?.id, isAuthenticated);

    const { data: threads = [], isLoading: threadsLoading } = useQuery({
        queryKey: ['message-threads', user?.id],
        queryFn: () => sovereign.messages.getThreads(),
        enabled: !!user?.id,
        refetchInterval: 15000,
    });

    const { data: resolvedContact } = useQuery({
        queryKey: ['resolve-contact', initialParams.barberId, initialParams.shopId, initialParams.contactUserId],
        queryFn: async () => {
            if (initialParams.contactUserId) {
                return sovereign.messages.resolveContact({ user_id: initialParams.contactUserId });
            }
            if (initialParams.barberId) {
                return sovereign.messages.resolveContact({ barber_id: initialParams.barberId });
            }
            if (initialParams.shopId) {
                return sovereign.messages.resolveContact({ shop_id: initialParams.shopId });
            }
            return null;
        },
        enabled: !!user && !!(initialParams.contactUserId || initialParams.barberId || initialParams.shopId),
    });

    useEffect(() => {
        if (resolvedContact?.user_id && !selectedContactId) {
            setSelectedContactId(resolvedContact.user_id);
        } else if (initialParams.contactUserId && !selectedContactId) {
            setSelectedContactId(initialParams.contactUserId);
        }
        if (initialParams.bookingId && !activeBookingId) {
            setActiveBookingId(initialParams.bookingId);
        }
    }, [resolvedContact, initialParams, selectedContactId, activeBookingId]);

    const { data: bookingContext } = useQuery({
        queryKey: ['booking-chat-context', activeBookingId],
        queryFn: () => sovereign.messages.getBookingContext(activeBookingId),
        enabled: !!activeBookingId && !!user,
    });

    useEffect(() => {
        if (!bookingContext || !user?.id) return;
        const otherId =
            user.id === bookingContext.client_id
                ? bookingContext.barber_user_id
                : bookingContext.client_id;
        if (otherId && !selectedContactId) {
            setSelectedContactId(otherId);
        }
    }, [bookingContext, user?.id, selectedContactId]);

    const { data: messages = [], isLoading: messagesLoading } = useQuery({
        queryKey: ['message-thread', user?.id, selectedContactId, activeBookingId],
        queryFn: () => sovereign.messages.getThread(selectedContactId, activeBookingId),
        enabled: !!user?.id && !!selectedContactId,
        refetchInterval: 8000,
    });

    const sendMutation = useMutation({
        mutationFn: (content) =>
            sovereign.messages.send({
                receiver_id: selectedContactId,
                content,
                booking_id: activeBookingId,
            }),
        onSuccess: () => {
            setMessageText('');
            queryClient.invalidateQueries({ queryKey: ['message-thread', user?.id, selectedContactId] });
            queryClient.invalidateQueries({ queryKey: ['message-threads', user?.id] });
        },
        onError: (err) => toast.error(err.message),
    });

    const proposeMutation = useMutation({
        mutationFn: () => {
            const dt = new Date(proposedDateTime);
            if (Number.isNaN(dt.getTime())) throw new Error('Pick a valid date and time');
            return sovereign.messages.proposeReschedule(activeBookingId, dt.toISOString());
        },
        onSuccess: () => {
            setRescheduleOpen(false);
            setProposedDateTime('');
            queryClient.invalidateQueries({ queryKey: ['message-thread', user?.id, selectedContactId] });
            toast.success('Reschedule proposal sent');
        },
        onError: (err) => toast.error(err.message),
    });

    const respondMutation = useMutation({
        mutationFn: ({ messageId, accept }) => sovereign.messages.respondReschedule(messageId, accept),
        onSuccess: (data, vars) => {
            queryClient.invalidateQueries({ queryKey: ['message-thread', user?.id, selectedContactId] });
            queryClient.invalidateQueries({ queryKey: ['booking-chat-context', activeBookingId] });
            queryClient.invalidateQueries({ queryKey: ['my-bookings'] });
            queryClient.invalidateQueries({ queryKey: ['provider-bookings'] });
            toast.success(vars.accept ? 'Appointment rescheduled' : 'Proposal declined');
        },
        onError: (err) => toast.error(err.message),
    });

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const mergedThreads = useMemo(() => {
        const list = [...threads];
        if (resolvedContact && !list.some((t) => t.contact_user_id === resolvedContact.user_id)) {
            list.unshift({
                contact_user_id: resolvedContact.user_id,
                full_name: resolvedContact.display_name,
                role: resolvedContact.role,
                avatar_url: resolvedContact.avatar_url,
                unread_count: 0,
                last_message: null,
                booking_id: initialParams.bookingId,
            });
        }
        return list;
    }, [threads, resolvedContact, initialParams.bookingId]);

    const selectedContact =
        mergedThreads.find((c) => c.contact_user_id === selectedContactId) ||
        (resolvedContact && selectedContactId === resolvedContact.user_id
            ? {
                  contact_user_id: resolvedContact.user_id,
                  full_name: resolvedContact.display_name,
                  role: resolvedContact.role,
                  avatar_url: resolvedContact.avatar_url,
              }
            : null);

    const filteredConversations = mergedThreads.filter((c) =>
        c.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSend = (e) => {
        e.preventDefault();
        if (!messageText.trim() || sendMutation.isPending) return;
        sendMutation.mutate(messageText.trim());
    };

    if (!isAuthenticated) {
        return (
            <div className="stb-page flex items-center justify-center p-4">
                <MetaTags title="Messages" description="Chat with your barber or clients" />
                <div className="text-center space-y-4 max-w-sm">
                    <MessageSquare className="w-12 h-12 text-primary mx-auto" />
                    <h2 className="text-2xl font-bold">Sign in for Messages</h2>
                    <p className="text-muted-foreground">Coordinate appointments and reschedule in real time.</p>
                    <Button asChild>
                        <a href={signInUrlWithReturn('/Chat')}>Sign in</a>
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="stb-page flex flex-col lg:pb-8">
            <MetaTags title="Messages" description="Secure booking chat" />
            <div className="flex-1 flex overflow-hidden min-h-0">
                <div className={`w-full md:w-80 lg:w-96 bg-card border-r border-border flex flex-col ${selectedContactId ? 'hidden md:flex' : 'flex'}`}>
                    <div className="p-4 border-b flex flex-col gap-4">
                        <h1 className="text-xl font-bold">Messages</h1>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-9 rounded-xl h-10"
                            />
                        </div>
                    </div>
                    <ScrollArea className="flex-1">
                        <div className="p-2 space-y-1">
                            {threadsLoading && (
                                <div className="py-8 flex justify-center">
                                    <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                                </div>
                            )}
                            {filteredConversations.map((contact) => (
                                <button
                                    key={contact.contact_user_id}
                                    type="button"
                                    onClick={() => {
                                        setSelectedContactId(contact.contact_user_id);
                                        if (contact.booking_id) setActiveBookingId(contact.booking_id);
                                    }}
                                    className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all ${
                                        selectedContactId === contact.contact_user_id ? 'bg-muted' : 'hover:bg-muted/60'
                                    }`}
                                >
                                    <Avatar className="w-11 h-11">
                                        {contact.avatar_url?.trim() ? <AvatarImage src={contact.avatar_url} /> : null}
                                        <AvatarFallback>{contact.full_name?.charAt(0)}</AvatarFallback>
                                    </Avatar>
                                    <div className="flex-1 text-left min-w-0">
                                        <div className="flex justify-between items-center">
                                            <span className="font-semibold truncate text-sm">{contact.full_name}</span>
                                            {contact.unread_count > 0 && (
                                                <span className="bg-primary text-primary-foreground text-[10px] px-1.5 py-0.5 rounded-full">
                                                    {contact.unread_count}
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {contact.last_message?.content || 'Start conversation'}
                                        </p>
                                    </div>
                                </button>
                            ))}
                            {!threadsLoading && filteredConversations.length === 0 && (
                                <p className="text-center text-sm text-muted-foreground py-12 px-4">
                                    Message a barber from their profile, or open chat from a booking.
                                </p>
                            )}
                        </div>
                    </ScrollArea>
                </div>

                <div className={`flex-1 bg-muted/40 flex flex-col ${!selectedContactId ? 'hidden md:flex' : 'flex'}`}>
                    {selectedContactId ? (
                        <>
                            <div className="bg-card border-b p-3 flex items-center gap-3 sticky top-0 z-20">
                                <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setSelectedContactId(null)}>
                                    <ChevronLeft className="w-6 h-6" />
                                </Button>
                                <Avatar className="w-10 h-10">
                                    {selectedContact?.avatar_url?.trim() ? <AvatarImage src={selectedContact.avatar_url} /> : null}
                                    <AvatarFallback>{selectedContact?.full_name?.charAt(0)}</AvatarFallback>
                                </Avatar>
                                <div className="flex-1 min-w-0">
                                    <h2 className="font-bold text-sm flex items-center gap-1 truncate">
                                        {selectedContact?.full_name}
                                        {selectedContact?.role !== 'client' && <ShieldCheck className="w-3.5 h-3.5 text-blue-500 shrink-0" />}
                                    </h2>
                                    <p className="text-[10px] text-muted-foreground flex items-center gap-1">
                                        {selectedContact?.role === 'barber' && <Scissors className="w-3 h-3" />}
                                        {selectedContact?.role === 'shop_owner' && <Store className="w-3 h-3" />}
                                        {selectedContact?.role ?? 'client'}
                                    </p>
                                </div>
                                {activeBookingId && (
                                    <Button variant="outline" size="sm" className="rounded-xl text-xs" onClick={() => setActiveBookingId(null)}>
                                        All messages
                                    </Button>
                                )}
                            </div>

                            {activeBookingId && bookingContext && (
                                <BookingChatBanner
                                    context={bookingContext}
                                    onProposeReschedule={() => setRescheduleOpen(true)}
                                />
                            )}

                            <ScrollArea viewportRef={scrollRef} className="flex-1 p-4">
                                {messagesLoading ? (
                                    <div className="flex justify-center py-12">
                                        <Loader2 className="w-6 h-6 animate-spin" />
                                    </div>
                                ) : (
                                    <div className="space-y-3 max-w-3xl mx-auto">
                                        <AnimatePresence initial={false}>
                                            {messages.map((msg) => {
                                                const isMe = msg.sender_id === user.id;
                                                if (msg.message_type === 'reschedule_proposal') {
                                                    return (
                                                        <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                                            <RescheduleProposalCard
                                                                message={msg}
                                                                isMe={isMe}
                                                                isPending={respondMutation.isPending}
                                                                onAccept={(id) => respondMutation.mutate({ messageId: id, accept: true })}
                                                                onDecline={(id) => respondMutation.mutate({ messageId: id, accept: false })}
                                                            />
                                                        </div>
                                                    );
                                                }
                                                return (
                                                    <motion.div
                                                        key={msg.id}
                                                        initial={{ opacity: 0, y: 6 }}
                                                        animate={{ opacity: 1, y: 0 }}
                                                        className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                                    >
                                                        <div
                                                            className={`max-w-[85%] p-3 rounded-2xl text-sm shadow-sm ${
                                                                isMe
                                                                    ? 'bg-primary text-primary-foreground rounded-tr-sm'
                                                                    : 'bg-card border rounded-tl-sm'
                                                            }`}
                                                        >
                                                            <p className="leading-relaxed">{msg.content}</p>
                                                            <div className={`flex items-center gap-1 mt-1 justify-end text-[10px] ${isMe ? 'text-primary-foreground/60' : 'text-muted-foreground'}`}>
                                                                {formatMsgTime(msg.created_at)}
                                                                {isMe && <CheckCheck className="w-3 h-3" />}
                                                            </div>
                                                        </div>
                                                    </motion.div>
                                                );
                                            })}
                                        </AnimatePresence>
                                    </div>
                                )}
                            </ScrollArea>

                            <div className="bg-card border-t p-3">
                                <form onSubmit={handleSend} className="flex gap-2 max-w-3xl mx-auto">
                                    <Input
                                        placeholder="Type a message..."
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        className="rounded-xl h-11"
                                    />
                                    <Button type="submit" disabled={!messageText.trim() || sendMutation.isPending} className="rounded-xl h-11 w-11 p-0 shrink-0">
                                        <Send className="w-5 h-5" />
                                    </Button>
                                </form>
                            </div>
                        </>
                    ) : (
                        <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
                            <MessageSquare className="w-12 h-12 text-muted-foreground mb-4" />
                            <p className="text-muted-foreground text-sm">Select a conversation or message someone from a booking.</p>
                        </div>
                    )}
                </div>
            </div>

            <Dialog open={rescheduleOpen} onOpenChange={setRescheduleOpen}>
                <DialogContent className="rounded-2xl">
                    <DialogHeader>
                        <DialogTitle>Propose a new time</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-2 py-2">
                        <Label htmlFor="proposed-dt">Date & time</Label>
                        <Input
                            id="proposed-dt"
                            type="datetime-local"
                            value={proposedDateTime}
                            onChange={(e) => setProposedDateTime(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">The other party can accept or decline in chat. Slot availability is checked automatically.</p>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setRescheduleOpen(false)}>Cancel</Button>
                        <Button onClick={() => proposeMutation.mutate()} disabled={!proposedDateTime || proposeMutation.isPending}>
                            Send proposal
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}

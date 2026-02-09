import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import {
    Send, Search, MessageSquare, Phone, Video, Info,
    MoreVertical, CheckCheck, Paperclip, Smile,
    ChevronLeft, Scissors, Store, ShieldCheck
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { MetaTags } from '@/components/seo/MetaTags';
import { motion, AnimatePresence } from 'framer-motion';
import { format } from 'date-fns';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

export default function Chat() {
    const [selectedContactId, setSelectedContactId] = useState(null);
    const [messageText, setMessageText] = useState('');
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();
    const scrollRef = useRef(null);

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => sovereign.auth.me().catch(() => null),
    });

    const { data: conversations = [] } = useQuery({
        queryKey: ['conversations', user?.id],
        queryFn: () => user ? sovereign.request('GET', `/conversations/${user.id}`) : [],
        enabled: !!user,
        refetchInterval: 5000, // Poll for new conversations
    });

    const { data: messages = [] } = useQuery({
        queryKey: ['messages', selectedContactId],
        queryFn: async () => {
            if (!user || !selectedContactId) return [];
            // Fetch messages where (sender=user AND receiver=contact) OR (sender=contact AND receiver=user)
            const sent = await sovereign.entities.Message.filter({
                sender_id: user.id,
                receiver_id: selectedContactId
            });
            const received = await sovereign.entities.Message.filter({
                sender_id: selectedContactId,
                receiver_id: user.id
            });

            return [...sent, ...received].sort((a, b) =>
                new Date(a.created_date).getTime() - new Date(b.created_date).getTime()
            );
        },
        enabled: !!user && !!selectedContactId,
        refetchInterval: 3000, // Frequent polling for messages
    });

    const sendMessageMutation = useMutation({
        mutationFn: (content) => sovereign.entities.Message.create({
            sender_id: user.id,
            receiver_id: selectedContactId,
            content,
            is_read: false,
            created_date: new Date().toISOString()
        }),
        onSuccess: () => {
            setMessageText('');
            queryClient.invalidateQueries({ queryKey: ['messages', selectedContactId] });
            queryClient.invalidateQueries({ queryKey: ['conversations', user?.id] });
        }
    });

    const handleSendMessage = (e) => {
        e.preventDefault();
        if (!messageText.trim() || sendMessageMutation.isPending) return;
        sendMessageMutation.mutate(messageText.trim());
    };

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const selectedContact = conversations.find(c => c.id === selectedContactId);

    const filteredConversations = conversations.filter(c =>
        c.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="w-16 h-16 bg-card rounded-2xl shadow-sm flex items-center justify-center mx-auto text-muted-foreground">
                        <MessageSquare className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Sign in for Chat</h2>
                    <p className="text-muted-foreground">Connect with your barbers or clients directly through our secure platform.</p>
                    <Button variant="default" className="w-full bg-primary text-primary-foreground hover:opacity-95 rounded-xl py-6 h-auto text-lg font-medium shadow-lg shadow-md" onClick={() => window.location.href = '/SignIn'}>
                        Sign In to Continue
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background flex flex-col pb-24 lg:pb-8">
            <MetaTags title="Secure Messages" description="Connect with grooming professionals" />
            <div className="flex-1 flex overflow-hidden min-h-0">

            {/* Sidebar: Conversations List */}
            <div className={`w-full md:w-80 lg:w-96 bg-card border-r border-border flex flex-col ${selectedContactId ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-slate-100 flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <h1 className="text-xl font-bold text-foreground">Messages</h1>
                        <Button variant="ghost" size="icon" className="rounded-full">
                            <MoreVertical className="w-5 h-5" />
                        </Button>
                    </div>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                            placeholder="Search conversations..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-9 bg-muted border-transparent focus:bg-card rounded-xl h-10 text-sm"
                        />
                    </div>
                </div>

                <ScrollArea className="flex-1">
                    <div className="p-2 space-y-1">
                        {filteredConversations.map(contact => (
                            <button
                                key={contact.id}
                                onClick={() => setSelectedContactId(contact.id)}
                                className={`w-full p-3 rounded-2xl flex items-center gap-3 transition-all ${selectedContactId === contact.id ? 'bg-muted' : 'hover:bg-muted'}`}
                            >
                                <div className="relative">
                                    <Avatar className="w-12 h-12 border-2 border-white shadow-sm">
                                        {contact.avatar_url?.trim() ? <AvatarImage src={contact.avatar_url} /> : null}
                                        <AvatarFallback className="bg-muted text-foreground font-bold uppercase">
                                            {contact.full_name?.charAt(0)}
                                        </AvatarFallback>
                                    </Avatar>
                                    {/* Status Indicator */}
                                    <div className="absolute bottom-0 right-0 w-3 h-3 bg-primary border-2 border-white rounded-full shadow-sm"></div>
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <div className="flex justify-between items-center mb-0.5">
                                        <span className="font-bold text-foreground truncate">{contact.full_name}</span>
                                        <span className="text-[10px] text-muted-foreground">12:45 PM</span>
                                    </div>
                                    <div className="flex items-center gap-1">
                                        {contact.role === 'barber' && <Scissors className="w-3 h-3 text-muted-foreground" />}
                                        {contact.role === 'shop_owner' && <Store className="w-3 h-3 text-muted-foreground" />}
                                        <p className="text-xs text-muted-foreground truncate">Click to message...</p>
                                    </div>
                                </div>
                            </button>
                        ))}
                        {conversations.length === 0 && (
                            <div className="py-20 text-center px-6">
                                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                                    <MessageSquare className="w-6 h-6" />
                                </div>
                                <p className="text-sm font-medium text-foreground mb-1">No conversations yet</p>
                                <p className="text-xs text-muted-foreground">Go to Explore to find a barber and start a conversation.</p>
                            </div>
                        )}
                    </div>
                </ScrollArea>
            </div>

            {/* Main Chat Area */}
            <div className={`flex-1 bg-muted flex flex-col ${!selectedContactId ? 'hidden md:flex' : 'flex'}`}>
                {selectedContactId ? (
                    <>
                        {/* Header */}
                        <div className="bg-card border-b border-border p-3 px-4 flex items-center justify-between sticky top-0 z-20">
                            <div className="flex items-center gap-3">
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="md:hidden rounded-full"
                                    onClick={() => setSelectedContactId(null)}
                                >
                                    <ChevronLeft className="w-6 h-6" />
                                </Button>
                                <Avatar className="w-10 h-10">
                                    {selectedContact?.avatar_url?.trim() ? <AvatarImage src={selectedContact.avatar_url} /> : null}
                                    <AvatarFallback className="bg-muted text-foreground font-bold">
                                        {selectedContact?.full_name?.charAt(0)}
                                    </AvatarFallback>
                                </Avatar>
                                <div>
                                    <h2 className="font-bold text-foreground leading-none mb-1 flex items-center gap-1.5">
                                        {selectedContact?.full_name}
                                        {selectedContact?.role !== 'client' && <ShieldCheck className="w-3.5 h-3.5 text-blue-500" />}
                                    </h2>
                                    <p className="text-[10px] text-primary font-medium flex items-center gap-1">
                                        <span className="w-1.5 h-1.5 bg-primary rounded-full animate-pulse"></span> Online
                                    </p>
                                </div>
                            </div>
                            <div className="flex items-center gap-1">
                                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
                                    <Phone className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
                                    <Video className="w-5 h-5" />
                                </Button>
                                <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground">
                                    <Info className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <ScrollArea
                            viewportRef={scrollRef}
                            className="flex-1 p-4 md:p-6"
                        >
                            <div className="space-y-4 pb-4">
                                <div className="text-center py-4">
                                    <span className="px-3 py-1 bg-card border border-slate-100 text-[10px] text-muted-foreground rounded-full font-medium">
                                        Conversation Started on {format(new Date(), 'MMMM d, yyyy')}
                                    </span>
                                </div>

                                <AnimatePresence initial={false}>
                                    {messages.map((msg, _idx) => {
                                        const isMe = msg.sender_id === user.id;
                                        return (
                                            <motion.div
                                                key={msg.id}
                                                initial={{ opacity: 0, y: 10, scale: 0.95 }}
                                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                                className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}
                                            >
                                                <div className={`max-w-[80%] md:max-w-[70%] space-y-1`}>
                                                    <div className={`p-3 md:p-4 rounded-3xl shadow-sm relative ${isMe ? 'bg-primary text-primary-foreground rounded-tr-none' : 'bg-card text-foreground border border-border rounded-tl-none'}`}>
                                                        <p className="text-sm md:text-base leading-relaxed">{msg.content}</p>
                                                        <div className={`flex items-center gap-1 mt-1 justify-end ${isMe ? 'text-white/40' : 'text-muted-foreground'}`}>
                                                            <span className="text-[9px]">{format(new Date(msg.created_date), 'p')}</span>
                                                            {isMe && <CheckCheck className="w-3 h-3" />}
                                                        </div>
                                                    </div>
                                                </div>
                                            </motion.div>
                                        );
                                    })}
                                </AnimatePresence>
                                {sendMessageMutation.isPending && (
                                    <div className="flex justify-end">
                                        <div className="bg-muted text-muted-foreground p-3 rounded-2xl animate-pulse">
                                            Sending...
                                        </div>
                                    </div>
                                )}
                            </div>
                        </ScrollArea>

                        {/* Input Area */}
                        <div className="bg-card border-t border-border p-3 md:p-4">
                            <form onSubmit={handleSendMessage} className="flex items-center gap-2 md:gap-3 max-w-4xl mx-auto">
                                <Button type="button" variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground flex-shrink-0">
                                    <Paperclip className="w-5 h-5" />
                                </Button>
                                <div className="flex-1 relative">
                                    <Input
                                        placeholder="Type your message..."
                                        value={messageText}
                                        onChange={(e) => setMessageText(e.target.value)}
                                        className="h-12 border-slate-100 bg-muted focus:bg-card rounded-2xl px-4 pr-10 text-sm md:text-base"
                                    />
                                    <Button type="button" variant="ghost" size="icon" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-full text-muted-foreground hover:text-foreground">
                                        <Smile className="w-5 h-5" />
                                    </Button>
                                </div>
                                <Button
                                    type="submit"
                                    disabled={!messageText.trim() || sendMessageMutation.isPending}
                                    className="bg-primary text-primary-foreground hover:opacity-95 rounded-full h-12 w-12 p-0 flex-shrink-0"
                                >
                                    <Send className="w-5 h-5" />
                                </Button>
                            </form>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-muted">
                        <div className="w-20 h-20 bg-card rounded-3xl shadow-sm border border-slate-100 flex items-center justify-center mb-6 text-muted-foreground transform rotate-3">
                            <MessageSquare className="w-10 h-10" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-2">Your Conversations</h2>
                        <p className="text-muted-foreground max-w-xs mx-auto text-sm">Select a contact from the sidebar to start chatting with your barber or shop manager.</p>
                    </div>
                )}
            </div>
            </div>
            <ClientBottomNav />
        </div>
    );
}

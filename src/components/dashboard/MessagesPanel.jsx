import React, { useState } from 'react';
import { Send, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";

export default function MessagesPanel({ isOpen, onClose }) {
  const [messageInput, setMessageInput] = useState('');
  const [selectedEmail, setSelectedEmail] = useState(null);
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => sovereign.auth.me(),
  });

  const { data: messagesList = [] } = useQuery({
    queryKey: ['messages', user?.email],
    queryFn: () => user ? sovereign.entities.Message.list() : [],
    enabled: !!user
  });

  const createMessageMutation = useMutation({
    mutationFn: (data) => sovereign.entities.Message.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['messages'] });
      setMessageInput('');
    }
  });

  const conversations = React.useMemo(() => {
    if (!messagesList || !user) return [];
    const groups = {};
    messagesList.forEach(msg => {
      const otherEmail = msg.sender_email === user.email ? msg.receiver_email : msg.sender_email;
      if (!groups[otherEmail]) {
        groups[otherEmail] = {
          email: otherEmail,
          messages: [],
          lastMessage: null,
          unreadCount: 0
        };
      }
      groups[otherEmail].messages.push(msg);
      if (!msg.is_read && msg.receiver_email === user.email) {
        groups[otherEmail].unreadCount++;
      }
    });

    return Object.values(groups).map(group => {
      group.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
      group.lastMessage = group.messages[group.messages.length - 1];
      return group;
    }).sort((a, b) => new Date(b.lastMessage.created_at) - new Date(a.lastMessage.created_at));
  }, [messagesList, user]);

  const activeEmail = selectedEmail || (conversations.length > 0 ? conversations[0].email : null);

  const activeConversationMessages = React.useMemo(() => {
    if (!activeEmail) return [];
    const convo = conversations.find(c => c.email === activeEmail);
    return convo ? convo.messages.map(msg => ({
      id: msg.id,
      text: msg.content,
      isMe: msg.sender_email === user?.email,
      time: msg.created_at ? new Date(msg.created_at.replace(' ', 'T')).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Now'
    })) : [];
  }, [activeEmail, conversations, user]);

  const handleSendMessage = () => {
    if (!messageInput.trim() || !user || !activeEmail) return;
    createMessageMutation.mutate({
      content: messageInput,
      sender_email: user.email,
      receiver_email: activeEmail,
      is_read: false
    });
  };

  return (
    <Sheet open={isOpen} onOpenChange={onClose}>
      <SheetContent side="right" className="w-full sm:w-96 p-0 bg-card border-border">
        <div className="flex flex-col h-full">
          <SheetHeader className="p-4 border-b border-border bg-white">
            <SheetTitle className="text-foreground">Messages</SheetTitle>
          </SheetHeader>

          {!selectedEmail ? (
            <ScrollArea className="flex-1 bg-muted/30">
              <div className="p-2">
                {conversations.length === 0 ? (
                  <div className="p-8 text-center text-muted-foreground text-sm">
                    No messages yet
                  </div>
                ) : (
                  conversations.map(convo => (
                    <button
                      key={convo.email}
                      onClick={() => setSelectedEmail(convo.email)}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted rounded-lg transition-colors"
                    >
                      <Avatar className="w-10 h-10 border border-border">
                        <AvatarFallback className="bg-muted text-foreground">{convo.email[0].toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate text-foreground">{convo.email}</p>
                        <p className="text-xs text-muted-foreground truncate">{convo.lastMessage?.content}</p>
                      </div>
                      {convo.unreadCount > 0 && (
                        <span className="w-5 h-5 bg-primary text-primary-foreground text-xs rounded-full flex items-center justify-center">
                          {convo.unreadCount}
                        </span>
                      )}
                    </button>
                  ))
                )}
              </div>
            </ScrollArea>
          ) : (
            <>
              <div className="p-3 border-b border-border bg-white flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={() => setSelectedEmail(null)} className="text-muted-foreground hover:bg-muted">
                    <X className="w-4 h-4" />
                  </Button>
                  <p className="font-semibold text-sm text-foreground">{activeEmail}</p>
                </div>
              </div>

              <ScrollArea className="flex-1 p-4 bg-muted/30">
                <div className="space-y-4">
                  {activeConversationMessages.map((msg) => (
                    <div key={msg.id} className={`flex ${msg.isMe ? 'justify-end' : 'justify-start'}`}>
                      <div
                        className={`max-w-[75%] px-3 py-2 rounded-lg text-sm ${msg.isMe
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-card border border-border text-foreground'
                          }`}
                      >
                        {msg.text}
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>

              <div className="p-3 border-t border-border bg-white flex gap-2">
                <Input
                  value={messageInput}
                  onChange={(e) => setMessageInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 border-border bg-slate-50 text-foreground placeholder:text-muted-foreground"
                />
                <Button onClick={handleSendMessage} size="icon" className="shrink-0">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

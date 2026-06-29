import { format, parseISO } from 'date-fns';
import { Button } from '@/components/ui/button';
import { CalendarClock, Check, X } from 'lucide-react';

export default function RescheduleProposalCard({ message, isMe, onAccept, onDecline, isPending }) {
    const meta = message.metadata ?? {};
    const proposedStart = meta.proposed_start_time ? parseISO(String(meta.proposed_start_time)) : null;
    const isPendingProposal = meta.status === 'pending';

    return (
        <div
            className={`max-w-sm rounded-2xl border p-4 space-y-3 ${
                isMe ? 'bg-primary/10 border-primary/30' : 'bg-card border-border'
            }`}
        >
            <div className="flex items-center gap-2 text-sm font-semibold">
                <CalendarClock className="w-4 h-4 text-primary" />
                Reschedule proposal
            </div>
            {proposedStart && (
                <p className="text-sm">
                    {format(proposedStart, 'PPP')} at {format(proposedStart, 'h:mm a')}
                </p>
            )}
            <p className="text-xs text-muted-foreground">{message.content}</p>
            {!isMe && isPendingProposal && (
                <div className="flex gap-2">
                    <Button
                        size="sm"
                        className="rounded-xl flex-1"
                        disabled={isPending}
                        onClick={() => onAccept(message.id)}
                    >
                        <Check className="w-4 h-4 mr-1" />
                        Accept
                    </Button>
                    <Button
                        size="sm"
                        variant="outline"
                        className="rounded-xl flex-1"
                        disabled={isPending}
                        onClick={() => onDecline(message.id)}
                    >
                        <X className="w-4 h-4 mr-1" />
                        Decline
                    </Button>
                </div>
            )}
            {meta.status && meta.status !== 'pending' && (
                <p className="text-xs font-medium capitalize text-muted-foreground">Status: {meta.status}</p>
            )}
        </div>
    );
}

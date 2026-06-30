import { format, parseISO } from 'date-fns';
import { Calendar, Clock, Scissors } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

export default function BookingChatBanner({ context, onProposeReschedule }) {
    if (!context) return null;

    const start = context.start_time ? parseISO(context.start_time) : null;

    return (
        <div className="mx-4 mt-3 p-3 rounded-lg bg-card border border-border shadow-sm">
            <div className="flex flex-wrap items-start justify-between gap-2">
                <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <Scissors className="w-4 h-4 text-primary shrink-0" />
                        <span className="font-semibold text-sm truncate">
                            {context.service_name || 'Appointment'}
                        </span>
                        <Badge variant="outline" className="text-[10px] uppercase">
                            {context.status}
                        </Badge>
                    </div>
                    <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
                        {start && (
                            <>
                                <span className="flex items-center gap-1">
                                    <Calendar className="w-3.5 h-3.5" />
                                    {format(start, 'PPP')}
                                </span>
                                <span className="flex items-center gap-1">
                                    <Clock className="w-3.5 h-3.5" />
                                    {format(start, 'h:mm a')}
                                </span>
                            </>
                        )}
                        {context.barber_name && <span>with {context.barber_name}</span>}
                    </div>
                </div>
                {context.can_reschedule && onProposeReschedule && (
                    <button
                        type="button"
                        onClick={onProposeReschedule}
                        className="text-xs font-semibold text-primary hover:underline shrink-0"
                    >
                        Propose new time
                    </button>
                )}
            </div>
        </div>
    );
}

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { ChevronDown, ChevronUp, Users, Loader2 } from 'lucide-react';

export function GroupBookingGuestPanel({ bookingId, partySize, eventLabel }) {
  const [open, setOpen] = useState(false);
  const { data, isLoading, isError } = useQuery({
    queryKey: ['booking-details', bookingId],
    queryFn: () => sovereign.bookings.getDetails(bookingId),
    enabled: open && !!bookingId,
    staleTime: 60_000,
  });

  const guests = data?.group_guests ?? [];

  return (
    <div className="mt-2 pt-3 border-t border-border/60">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        className="h-8 px-2 text-xs text-muted-foreground hover:text-foreground"
        onClick={() => setOpen((v) => !v)}
      >
        <Users className="w-3.5 h-3.5 mr-1.5" />
        {partySize ? `${partySize} guests` : 'Group guests'}
        {eventLabel ? `, ${eventLabel}` : ''}
        {open ? <ChevronUp className="w-3.5 h-3.5 ml-1" /> : <ChevronDown className="w-3.5 h-3.5 ml-1" />}
      </Button>

      {open && (
        <div className="mt-2 rounded-lg bg-muted/40 border border-border/60 p-3 text-sm">
          {isLoading && (
            <div className="flex items-center gap-2 text-muted-foreground text-xs">
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              Loading guest list…
            </div>
          )}
          {isError && (
            <p className="text-xs text-destructive">Could not load guest details.</p>
          )}
          {!isLoading && !isError && guests.length === 0 && (
            <p className="text-xs text-muted-foreground">No guest names recorded.</p>
          )}
          {!isLoading && !isError && guests.length > 0 && (
            <ul className="space-y-1.5">
              {guests.map((guest, index) => (
                <li key={guest.id || index} className="flex items-start gap-2">
                  <span className="text-[10px] font-bold text-muted-foreground w-5 shrink-0 pt-0.5">
                    {index + 1}.
                  </span>
                  <div className="min-w-0">
                    <span className="font-medium text-foreground">{guest.guest_name || 'Guest'}</span>
                    {guest.notes && (
                      <p className="text-xs text-muted-foreground truncate">{guest.notes}</p>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

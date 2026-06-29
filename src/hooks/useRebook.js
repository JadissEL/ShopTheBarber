import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { createPageUrl } from '@/utils';
import { sovereign } from '@/api/apiClient';
import {
  buildRebookPath,
  canRebookBooking,
  mergeRebookPayload,
  saveRebookPrefill,
} from '@/lib/rebook';

/**
 * One-click rebook, independent barber, shop chair, at-home mobile, or group.
 */
export function useRebook() {
  const navigate = useNavigate();
  const [isRebooking, setIsRebooking] = useState(false);

  const rebook = useCallback(
    async (booking, { silent = false } = {}) => {
      if (!canRebookBooking(booking)) {
        if (!silent) toast.error('Cannot rebook, barber information is missing.');
        return;
      }

      setIsRebooking(true);
      try {
        let enriched = booking;
        if (booking.id) {
          try {
            const payload = await sovereign.bookings.getRebookPayload(booking.id);
            if (payload) enriched = mergeRebookPayload(booking, payload);
          } catch {
            // Fall back to list row fields
          }
        }

        saveRebookPrefill(enriched);
        navigate(buildRebookPath(enriched, createPageUrl));

        if (!silent) {
          const who = enriched.barber_name || 'your barber';
          toast.success(`Pick a new time with ${who}`);
        }
      } finally {
        setIsRebooking(false);
      }
    },
    [navigate]
  );

  return { rebook, isRebooking, canRebook: canRebookBooking };
}

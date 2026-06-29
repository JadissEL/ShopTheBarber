import { useEffect, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { ensureNotificationPermission, notifyWaitlistOffer } from '@/lib/browserNotifications';
import { markWaitlistOfferSeen } from '@/lib/waitlistOfferDedupe';

/** Poll + native alerts when a new waitlist offer becomes actionable (logged-in clients only). */
export default function WaitlistOfferNotifier() {
    const navigate = useNavigate();
    const initialized = useRef(false);

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => sovereign.auth.me(),
        retry: false,
    });

    useEffect(() => {
        if (!user?.id) return;
        ensureNotificationPermission();
    }, [user?.id]);

    const { data } = useQuery({
        queryKey: ['waitlist-my-offers', user?.id],
        queryFn: () => sovereign.bookingWaitlist.getMyOffers(),
        refetchInterval: 15_000,
        retry: false,
        enabled: !!user?.id,
    });

    useEffect(() => {
        if (!user?.id) return;
        const offers = (data?.offers ?? []).filter((o) => o.status === 'pending');
        if (!initialized.current) {
            offers.forEach((o) => markWaitlistOfferSeen(o.id));
            initialized.current = true;
            return;
        }
        for (const offer of offers) {
            notifyWaitlistOffer({
                offerId: offer.id,
                title: 'Waitlist slot available',
                body: `${offer.barber_name ?? 'Your barber'} · ${offer.service_name ?? 'Appointment'} — 15 min to accept`,
                navigate: (path) => navigate(path),
            });
        }
    }, [data, navigate, user?.id]);

    return null;
}

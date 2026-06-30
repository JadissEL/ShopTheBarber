import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Star } from 'lucide-react';
import { sovereign } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';

export default function PendingReviewBanner() {
    const { data } = useQuery({
        queryKey: ['pending-reviews'],
        queryFn: () => sovereign.reviews.listPending(),
        staleTime: 60_000,
    });

    const pending = data?.pending ?? [];
    if (pending.length === 0) return null;

    const next = pending[0];

    return (
        <div className="border border-primary/30 bg-primary/10 p-4 mb-6 flex flex-col sm:flex-row sm:items-center gap-3 justify-between">
            <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/100 text-white flex items-center justify-center shrink-0">
                    <Star className="w-5 h-5 fill-current" />
                </div>
                <div>
                    <p className="font-semibold text-primary-foreground">How was your visit?</p>
                    <p className="text-sm text-foreground/80">
                        Rate {next.barber_name || 'your barber'}
                        {next.date_text ? `, ${next.date_text}` : ''}
                        {pending.length > 1 ? ` (+${pending.length - 1} more)` : ''}
                    </p>
                </div>
            </div>
            <Link to={createPageUrl(`Review?bookingId=${next.booking_id}`)}>
                <Button className="bg-primary hover:bg-primary/90 text-white shrink-0">
                    Leave review
                </Button>
            </Link>
        </div>
    );
}

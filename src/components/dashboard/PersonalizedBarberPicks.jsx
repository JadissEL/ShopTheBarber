import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Star, TrendingUp } from 'lucide-react';
import BarberCard from '@/components/ui/barber-card';
import { motion } from 'framer-motion';

function scoreBarber(barber, { favoriteIds, bookingLocations, reviewedIds }) {
    let score = (barber.rating ?? 0) * 10 + Math.min(barber.review_count ?? 0, 50) * 0.2;

    if (favoriteIds.has(barber.id)) score += 25;

    const location = (barber.location || barber.city || '').toLowerCase();
    if (location && bookingLocations.some((loc) => loc && location.includes(loc.toLowerCase()))) {
        score += 15;
    }

    if (reviewedIds.has(barber.id)) score += 8;

    return score;
}

function pickReason(barber, { favoriteIds, bookingLocations }) {
    if (favoriteIds.has(barber.id)) return 'One of your favorites';
    const location = (barber.location || barber.city || '').toLowerCase();
    if (location && bookingLocations.some((loc) => loc && location.includes(loc.toLowerCase()))) {
        return 'Near places you have booked before';
    }
    if ((barber.rating ?? 0) >= 4.8) return 'Highly rated in your area';
    return 'Popular with clients like you';
}

export default function PersonalizedBarberPicks() {
    const { data: user } = useQuery({
        queryKey: ['current-user'],
        queryFn: () => sovereign.auth.me(),
        staleTime: 1000 * 60 * 5,
    });

    const { data: bookings = [] } = useQuery({
        queryKey: ['user-bookings'],
        queryFn: () => sovereign.entities.Booking.filter({ created_by: user?.email }),
        enabled: !!user,
        initialData: [],
    });

    const { data: favorites = [] } = useQuery({
        queryKey: ['user-favorites'],
        queryFn: () => sovereign.entities.Favorite.filter({ created_by: user?.email }),
        enabled: !!user,
        initialData: [],
    });

    const { data: allBarbers = [], isLoading } = useQuery({
        queryKey: ['all-barbers'],
        queryFn: () => sovereign.entities.Barber.list(),
        initialData: [],
    });

    const { data: reviews = [] } = useQuery({
        queryKey: ['user-reviews'],
        queryFn: () => sovereign.entities.Review.filter({ author_name: user?.full_name }),
        enabled: !!user,
        initialData: [],
    });

    const { recommendations, reasonings } = useMemo(() => {
        if (!user || allBarbers.length === 0) {
            return { recommendations: [], reasonings: {} };
        }

        const favoriteIds = new Set(
            favorites.map((f) => f.barber_id || f.item_id).filter(Boolean)
        );
        const bookingLocations = bookings
            .map((b) => b.location || b.shop_name)
            .filter(Boolean);
        const reviewedIds = new Set(
            reviews.map((r) => r.target_id || r.barber_id).filter(Boolean)
        );

        const context = { favoriteIds, bookingLocations, reviewedIds };

        const ranked = [...allBarbers]
            .map((barber) => ({
                barber,
                score: scoreBarber(barber, context),
                reason: pickReason(barber, context),
            }))
            .sort((a, b) => b.score - a.score)
            .slice(0, 3);

        const reasonMap = {};
        for (const row of ranked) {
            reasonMap[row.barber.id] = row.reason;
        }

        return {
            recommendations: ranked.map((r) => r.barber),
            reasonings: reasonMap,
        };
    }, [user, allBarbers, bookings, favorites, reviews]);

    if (!user) return null;

    return (
        <div className="space-y-6">
            <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-500 flex items-center justify-center shadow-md">
                    <Star className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="text-2xl font-bold text-foreground">Picked For You</h2>
                    <p className="text-sm text-muted-foreground">Based on your bookings, favorites, and ratings</p>
                </div>
            </div>

            {isLoading ? (
                <div className="grid md:grid-cols-3 gap-6">
                    {[1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className="h-80 bg-muted rounded-2xl animate-pulse border border-slate-200"
                        />
                    ))}
                </div>
            ) : (
                <div className="grid md:grid-cols-3 gap-6">
                    {recommendations.map((barber, index) => {
                        const reason = reasonings[barber.id];
                        return (
                            <motion.div
                                key={barber.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="relative"
                            >
                                {reason && (
                                    <div className="absolute -top-3 left-4 z-20 bg-gradient-to-r from-violet-600 to-fuchsia-600 text-white px-4 py-1.5 rounded-full text-xs font-bold shadow-lg flex items-center gap-1">
                                        <TrendingUp className="w-3 h-3" />
                                        {reason}
                                    </div>
                                )}
                                <BarberCard barber={barber} variant="vertical" appearance="light" />
                            </motion.div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

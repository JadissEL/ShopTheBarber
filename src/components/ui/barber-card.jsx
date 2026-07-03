import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl, signInUrlWithReturn } from '@/utils';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Star, MapPin, Heart, Calendar, ChevronRight, Scissors } from 'lucide-react';
import ShowcaseDiscoveryStrip from '@/components/providerShowcase/ShowcaseDiscoveryStrip';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { catalogCardClasses, stb } from '@/lib/stbUi';

export default function BarberCard({ barber, variant = 'vertical', badge, appearance }) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => sovereign.auth.me().catch(() => null)
    });

    const { data: favorites = [] } = useQuery({
        queryKey: ['favorites', user?.id],
        queryFn: () => user ? sovereign.entities['Favorite'].filter({ user_id: user.id }) : [],
        enabled: !!user && !!barber?.id
    });

    if (!barber || !barber.id) return null;

    const barberData = {
        id: barber.id,
        name: barber.name || 'Unknown Barber',
        location: barber.location || 'Location Not Set',
        image_url: barber.image_url || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop",
        rating: barber.rating || 0,
        review_count: barber.review_count || 0,
        title: barber.title || 'Professional Barber',
        min_price: barber.min_price,
        completed_services: barber.completed_services ?? 0,
        discovery_preview: barber.discovery_preview ?? null,
    };

    const isFavorited = favorites.some(f => f.target_id === barberData.id && f.target_type === 'barber');
    const ratingLabel = barberData.rating > 0 ? barberData.rating.toFixed(1) : 'New';

    const toggleFavorite = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            toast.error("Please login to save favorites");
            navigate(signInUrlWithReturn());
            return;
        }

        try {
            if (isFavorited) {
                const fav = favorites.find(f => f.target_id === barberData.id && f.target_type === 'barber');
                if (fav) await sovereign.entities['Favorite'].delete(fav.id);
            } else {
                await sovereign.entities['Favorite'].create({
                    user_id: user.id,
                    target_id: barberData.id,
                    target_type: 'barber'
                });
            }
            queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
            toast.success(isFavorited ? "Removed from favorites" : "Added to favorites");
        } catch {
            toast.error("Failed to update favorites");
        }
    };

    const isLight = appearance === 'light';

    if (variant === 'horizontal') {
        return (
            <Link to={createPageUrl(`BarberProfile?id=${barberData.id}`)}>
                <div className={cn(stb.surfaceHover, 'p-4 flex items-center gap-5 group')}>
                    <div className="relative w-20 h-20 flex-shrink-0 overflow-hidden rounded-lg">
                        <OptimizedImage
                            src={barberData.image_url}
                            alt={barberData.name}
                            fill
                            width={100}
                            height={100}
                            aspectRatio="1/1"
                            fallbackSrc="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80"
                            imgClassName="rounded-lg"
                        />
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                        <h3 className={cn(stb.title, 'text-lg truncate group-hover:text-primary transition-colors')}>{barberData.name}</h3>
                        <p className="text-muted-foreground text-sm mb-1">{barberData.location}</p>
                        <div className="flex items-center gap-2 text-xs">
                            <span className="inline-flex items-center gap-1 font-semibold text-primary">
                                <Star className="w-3 h-3 fill-primary" /> {ratingLabel}
                            </span>
                            <span className="text-muted-foreground">·</span>
                            <Calendar className="w-3.5 h-3.5 text-muted-foreground" />
                            <span className="text-muted-foreground">Available</span>
                        </div>
                        <ShowcaseDiscoveryStrip preview={barberData.discovery_preview} compact className="mt-2" />
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="icon"
                            variant="outline"
                            onClick={toggleFavorite}
                            aria-label={isFavorited ? 'Remove from favorites' : 'Save barber'}
                            className={cn('h-9 w-9', isFavorited && 'text-primary border-primary')}
                        >
                            <Heart className={cn('w-4 h-4', isFavorited && 'fill-current')} />
                        </Button>
                        <ChevronRight className={cn('w-5 h-5', isLight ? 'text-muted-foreground' : 'text-muted-foreground')} />
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link to={createPageUrl(`BarberProfile?id=${barberData.id}`)} className="h-full block group">
            <div className={catalogCardClasses('h-full flex flex-col p-0')}>
                <div className={cn(stb.catalogMedia, 'aspect-[3/4]')}>
                    <OptimizedImage
                        src={barberData.image_url}
                        alt={barberData.name}
                        fill
                        imgClassName="transition-transform duration-500 group-hover:scale-[1.03] object-cover"
                        width={600}
                        height={800}
                        aspectRatio="3/4"
                        fallbackSrc="https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&q=80"
                        className="w-full h-full"
                    />

                    {badge && (
                        <div className="absolute top-3 left-3 z-20">
                            <span className="px-2 py-0.5 rounded-md bg-foreground text-background text-xs font-semibold uppercase tracking-wide">
                                {badge.text}
                            </span>
                        </div>
                    )}

                    <button
                        type="button"
                        onClick={toggleFavorite}
                        aria-label={isFavorited ? 'Remove from favorites' : 'Save barber'}
                        className={cn(
                            'absolute top-3 right-3 z-20 w-9 h-9 flex items-center justify-center rounded-lg border border-foreground/10 bg-card/95 shadow-sm transition-colors duration-normal ease-out',
                            isFavorited ? 'text-primary border-primary/30' : 'text-muted-foreground hover:text-primary'
                        )}
                    >
                        <Heart className={cn('w-4 h-4', isFavorited && 'fill-current')} />
                    </button>
                </div>

                <div className={cn(stb.catalogBody, 'flex flex-col flex-1')}>
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                            <h3 className={cn(stb.title, 'text-xl leading-tight group-hover:text-primary transition-colors truncate')}>{barberData.name}</h3>
                            <div className="flex items-center gap-1.5 text-sm text-muted-foreground mt-1">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <span className="line-clamp-1">{barberData.location}</span>
                            </div>
                        </div>
                        {barberData.min_price != null ? (
                            <span className="text-sm font-semibold text-primary shrink-0 tabular-nums">
                                from €{Math.round(barberData.min_price)}
                            </span>
                        ) : (
                            <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary shrink-0">
                                <Star className="w-3.5 h-3.5 fill-primary" />
                                {ratingLabel}
                            </span>
                        )}
                    </div>

                    {barberData.min_price != null && (
                        <div className="flex items-center gap-1.5 text-sm">
                            <Star className="w-3.5 h-3.5 text-primary fill-primary" />
                            <span className="font-semibold text-primary">{ratingLabel}</span>
                            {barberData.review_count > 0 && (
                                <span className="text-muted-foreground text-xs">({barberData.review_count})</span>
                            )}
                        </div>
                    )}

                    {barberData.completed_services > 0 && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Scissors className="w-3 h-3" />
                            {barberData.completed_services.toLocaleString()} cuts completed
                        </p>
                    )}

                    <ShowcaseDiscoveryStrip preview={barberData.discovery_preview} compact />

                    <div className={cn(stb.cardCta, 'mt-auto -mx-4 -mb-4')}>
                        View profile
                    </div>
                </div>
            </div>
        </Link>
    );
}

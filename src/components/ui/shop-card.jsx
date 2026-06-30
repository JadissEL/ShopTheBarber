import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Star, MapPin, Heart } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { catalogCardClasses, stb } from '@/lib/stbUi';

export default function ShopCard({ shop }) {
    const queryClient = useQueryClient();
    const navigate = useNavigate();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => sovereign.auth.me().catch(() => null)
    });

    const { data: favorites = [] } = useQuery({
        queryKey: ['favorites', user?.id],
        queryFn: () => user ? sovereign.entities['Favorite'].filter({ user_id: user.id }) : [],
        enabled: !!user && !!shop?.id
    });

    if (!shop || !shop.id) return null;

    const shopData = {
        id: shop.id,
        name: shop.name || 'Barbershop',
        location: shop.location || 'Location Not Set',
        image_url: shop.image_url || "https://images.unsplash.com/photo-1521590832167-7bcbfaa6381f?w=800&auto=format&fit=crop",
        rating: shop.rating || 0,
        review_count: shop.review_count || 0,
    };

    const isFavorited = favorites.some(f => f.target_id === shopData.id && f.target_type === 'shop');
    const ratingLabel = shopData.rating > 0 ? shopData.rating.toFixed(1) : 'New';

    const toggleFavorite = async (e) => {
        e.preventDefault();
        e.stopPropagation();

        if (!user) {
            toast.error("Please login to save favorites");
            navigate(createPageUrl('SignIn'));
            return;
        }

        try {
            if (isFavorited) {
                const fav = favorites.find(f => f.target_id === shopData.id && f.target_type === 'shop');
                if (fav) await sovereign.entities['Favorite'].delete(fav.id);
            } else {
                await sovereign.entities['Favorite'].create({
                    user_id: user.id,
                    target_id: shopData.id,
                    target_type: 'shop'
                });
            }
            queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
            toast.success(isFavorited ? "Removed from favorites" : "Added to favorites");
        } catch {
            toast.error("Failed to update favorites");
        }
    };

    return (
        <Link to={createPageUrl(`ShopProfile?id=${shopData.id}`)} className="h-full block group">
            <div className={catalogCardClasses('h-full flex flex-col p-0')}>
                <div className={cn(stb.catalogMedia, 'aspect-[16/9]')}>
                    <OptimizedImage
                        src={shopData.image_url}
                        alt={shopData.name}
                        fill
                        imgClassName="transition-transform duration-500 group-hover:scale-[1.03] object-cover"
                        width={600}
                        height={337}
                        aspectRatio="16/9"
                        fallbackSrc={shopData.image_url}
                        className="w-full h-full"
                    />

                    <button
                        type="button"
                        onClick={toggleFavorite}
                        aria-label={isFavorited ? 'Remove from favorites' : 'Save shop'}
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
                            <h3 className={cn(stb.title, 'text-lg leading-tight group-hover:text-primary transition-colors truncate')}>{shopData.name}</h3>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-1">
                                <MapPin className="w-3.5 h-3.5 shrink-0" />
                                <span className="line-clamp-1">{shopData.location}</span>
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary shrink-0">
                            <Star className="w-3.5 h-3.5 fill-primary" />
                            {ratingLabel}
                        </span>
                    </div>

                    {shopData.review_count > 0 && (
                        <p className="text-xs text-muted-foreground">{shopData.review_count} reviews</p>
                    )}

                    <div className={cn(stb.cardCta, 'mt-auto -mx-4 -mb-4')}>
                        Visit shop
                    </div>
                </div>
            </div>
        </Link>
    );
}

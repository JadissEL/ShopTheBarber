import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Star, MapPin, Users, ArrowRight, Heart } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { toast } from 'sonner';

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
        review_count: shop.review_count || 0
    };

    const isFavorited = favorites.some(f => f.target_id === shopData.id && f.target_type === 'shop');

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
        <Link to={createPageUrl(`ShopProfile?id=${shopData.id}`)} className="h-full block">
            <motion.div whileHover={{ y: -5 }} transition={{ duration: 0.2 }} className="h-full">
                <Card className="overflow-hidden border border-border shadow-sm bg-card hover:shadow-md transition-all duration-300 h-full rounded-[1.5rem] group relative flex flex-col">

                    {/* Image Section */}
                    <div className="relative aspect-[16/9] overflow-hidden">
                        <OptimizedImage
                            src={shopData.image_url}
                            alt={shopData.name}
                            fill
                            imgClassName="transition-transform duration-700 group-hover:scale-105 object-cover"
                            width={600}
                            height={337}
                            aspectRatio="16/9"
                            fallbackSrc={shopData.image_url}
                            className="w-full h-full"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-60"></div>

                        {/* Floating Action */}
                        <div className="absolute top-3 right-3 z-20">
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={toggleFavorite}
                                className={`w-10 h-10 rounded-full backdrop-blur-md transition-all border border-white/10 ${isFavorited ? 'bg-red-500 text-white border-red-500' : 'bg-white/20 text-white hover:bg-white hover:text-red-500 dark:hover:bg-slate-800'}`}
                            >
                                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                            </Button>
                        </div>

                        {/* Rating Badge Overlay */}
                        <div className="absolute bottom-3 right-3 z-10">
                            <div className="flex items-center gap-1.5 bg-background/95 backdrop-blur-md px-2.5 py-1 rounded-full shadow-sm border border-border">
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                                <span className="font-bold text-xs text-foreground">{shopData.rating > 0 ? shopData.rating.toFixed(1) : "New"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-4 flex flex-col flex-1">
                        <h3 className="font-bold text-lg text-foreground leading-tight group-hover:text-primary transition-colors mb-1">{shopData.name}</h3>

                        <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-3">
                            <MapPin className="w-3.5 h-3.5 text-gray-400" />
                            <span className="line-clamp-1">{shopData.location}</span>
                        </div>

                        <div className="mt-auto flex items-center justify-between pt-3 border-t border-border">
                            <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                                <Users className="w-3.5 h-3.5" />
                                <span>Team of experts</span>
                            </div>
                            <span className="text-xs text-primary font-semibold flex items-center">
                                Visit Shop <ArrowRight className="w-3 h-3 ml-1" />
                            </span>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </Link>
    );
}
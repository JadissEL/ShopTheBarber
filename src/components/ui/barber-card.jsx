import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Star, MapPin, Heart, Calendar, ChevronRight } from 'lucide-react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { toast } from 'sonner';

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
        image_url: barber.image_url || "https://images.unsplash.com/photo-1503951914290-93d32b06769c?w=800&auto=format&fit=crop",
        rating: barber.rating || 0,
        review_count: barber.review_count || 0,
        title: barber.title || 'Professional Barber',
        tags: barber.tags || ['Top Rated']
    };

    const isFavorited = favorites.some(f => f.target_id === barberData.id && f.target_type === 'barber');

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
                <motion.div
                    whileHover={{ y: -5 }}
                    className={isLight
                        ? "bg-white border border-slate-200 rounded-3xl p-4 flex items-center gap-5 hover:border-primary/30 hover:shadow-md transition-all group shadow-sm"
                        : "bg-card/95 backdrop-blur-md border border-border rounded-3xl p-4 flex items-center gap-5 hover:border-primary/20 hover:shadow-primary/5 transition-all group"
                    }
                >
                    <div className="relative w-20 h-20 flex-shrink-0">
                        <OptimizedImage
                            src={barberData.image_url}
                            alt={barberData.name}
                            className="rounded-2xl"
                            fill
                            width={100}
                            height={100}
                            aspectRatio="1/1"
                            fallbackSrc={barberData.image_url}
                            imgClassName="rounded-2xl"
                        />
                        <div className={isLight ? "absolute -bottom-2 -right-2 bg-white rounded-lg p-1 shadow border border-slate-200" : "absolute -bottom-2 -right-2 bg-primary rounded-lg p-1 shadow-sm border border-primary/30"}>
                            <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 text-[10px] font-bold px-1.5 py-0.5 rounded-md flex items-center gap-1">
                                <Star className="w-3 h-3 fill-current" /> {barberData.rating > 0 ? barberData.rating.toFixed(1) : "New"}
                            </div>
                        </div>
                    </div>
                    <div className="flex-1 min-w-0 py-1">
                        <h3 className={isLight ? "text-foreground font-bold text-lg truncate group-hover:text-primary transition-colors" : "text-white font-bold text-lg truncate group-hover:text-primary transition-colors"}>{barberData.name}</h3>
                        <p className={isLight ? "text-slate-500 text-sm mb-2" : "text-slate-400 text-sm mb-2"}>{barberData.location}</p>
                        <div className={isLight ? "flex items-center gap-2 text-xs text-slate-500" : "flex items-center gap-2 text-xs text-slate-500"}>
                            <Calendar className="w-3.5 h-3.5" />
                            <span>Available for booking</span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={toggleFavorite}
                            className={`rounded-full ${isFavorited ? 'text-red-500' : isLight ? 'text-slate-500 hover:text-red-500' : 'text-muted-foreground hover:text-red-500'}`}
                        >
                            <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                        </Button>
                        <Button size="icon" variant="ghost" className={isLight ? "rounded-full text-muted-foreground hover:text-foreground hover:bg-muted" : "rounded-full text-muted-foreground hover:text-foreground hover:bg-muted"}>
                            <ChevronRight className="w-5 h-5" />
                        </Button>
                    </div>
                </motion.div>
            </Link>
        );
    }

    // Vertical Variant
    const cardClass = isLight
        ? "overflow-hidden border border-slate-200 shadow-sm bg-white hover:shadow-md hover:border-primary/20 transition-all duration-300 h-full rounded-2xl group relative flex flex-col"
        : "overflow-hidden border border-border shadow-xl bg-card/95 backdrop-blur-md hover:shadow-primary/5 transition-all duration-300 h-full rounded-[2rem] group relative flex flex-col";

    return (
        <Link to={createPageUrl(`BarberProfile?id=${barberData.id}`)} className="h-full block">
            <motion.div whileHover={{ y: -8 }} transition={{ duration: 0.3 }} className="h-full">
                <Card className={cardClass}>

                    {/* Image Section */}
                    <div className="relative aspect-[3/4] overflow-hidden m-2 rounded-xl">
                        <OptimizedImage
                            src={barberData.image_url}
                            alt={barberData.name}
                            fill
                            imgClassName="transition-transform duration-700 group-hover:scale-105"
                            width={600}
                            height={800}
                            aspectRatio="3/4"
                            fallbackSrc={barberData.image_url}
                            className="w-full h-full"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-80 group-hover:opacity-90 transition-opacity" />

                        {badge && (
                            <div className="absolute top-3 left-3 z-20">
                                <div className={`px-3 py-1.5 rounded-full text-xs font-bold text-white shadow-sm ${badge.color || 'bg-red-500'}`}>
                                    {badge.text}
                                </div>
                            </div>
                        )}

                        <div className="absolute top-3 right-3 z-20">
                            <Button
                                size="icon"
                                variant="ghost"
                                onClick={toggleFavorite}
                                className={isLight
                                    ? `w-10 h-10 rounded-full bg-white/90 border border-slate-200 shadow-sm ${isFavorited ? 'bg-red-500 text-white border-red-500' : 'text-slate-600 hover:text-red-500 hover:bg-white'}`
                                    : `w-10 h-10 rounded-full backdrop-blur-md transition-all border border-white/10 ${isFavorited ? 'bg-red-500 text-white border-red-500' : 'bg-white/20 text-white hover:bg-white hover:text-red-500'}`
                                }
                            >
                                <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                            </Button>
                        </div>

                        <div className="absolute bottom-3 right-3 z-10">
                            <div className={isLight ? "flex items-center gap-1.5 bg-white/95 backdrop-blur border border-slate-200 px-3 py-1.5 rounded-full shadow-sm" : "flex items-center gap-1.5 bg-background/90 backdrop-blur-md border border-border px-3 py-1.5 rounded-full shadow-sm"}>
                                <Star className="w-3.5 h-3.5 text-yellow-500 fill-yellow-500" />
                                <span className={isLight ? "font-semibold text-sm text-foreground" : "font-semibold text-sm text-foreground"}>{barberData.rating > 0 ? barberData.rating.toFixed(1) : "New"}</span>
                            </div>
                        </div>
                    </div>

                    <div className="p-5 pt-3 flex flex-col flex-1">
                        <div className="flex justify-between items-start mb-1">
                            <div>
                                <h3 className={isLight ? "font-semibold text-xl text-foreground leading-tight group-hover:text-primary transition-colors" : "font-semibold text-xl text-white leading-tight group-hover:text-primary transition-colors"}>{barberData.name}</h3>
                                <p className={isLight ? "text-sm text-slate-500 font-light mt-0.5" : "text-sm text-slate-400 font-light mt-0.5"}>{barberData.title}</p>
                            </div>
                        </div>

                        <div className={isLight ? "flex items-center gap-2 text-sm text-slate-500 mb-6 font-light" : "flex items-center gap-2 text-sm text-slate-400 mb-6 font-light"}>
                            <MapPin className="w-3.5 h-3.5" />
                            <span className="line-clamp-1">{barberData.location}</span>
                            <span>·</span>
                            <span>{barberData.review_count} reviews</span>
                        </div>

                        <div className={isLight ? "mt-auto pt-4 border-t border-slate-200" : "mt-auto pt-4 border-t border-border"}>
                            <div className="flex gap-2 flex-wrap">
                                {barberData.tags.slice(0, 2).map((tag, i) => (
                                    <span key={i} className={isLight ? "text-[10px] uppercase tracking-wider text-slate-500 bg-slate-100 px-2 py-1 rounded-md border border-slate-200" : "text-[10px] uppercase tracking-wider text-muted-foreground bg-muted/50 px-2 py-1 rounded-md border border-border"}>{tag}</span>
                                ))}
                            </div>
                        </div>
                    </div>
                </Card>
            </motion.div>
        </Link>
    );
}
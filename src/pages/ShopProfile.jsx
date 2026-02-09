import { MapPin, Star, Heart, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { UserAvatar } from '@/components/ui/user-avatar';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { RefreshIndicator } from '@/components/ui/refresh-indicator';
import { MetaTags } from '@/components/seo/MetaTags';
import { LocalBusinessSchema } from '@/components/seo/SchemaMarkup';
import LocationMap from '@/components/ui/location-map';
import { toast } from 'sonner';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

export default function ShopProfile() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const urlParams = new URLSearchParams(window.location.search);
    const shopId = urlParams.get('id');

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => sovereign.auth.me().catch(() => null)
    });

    const { data: shop, isFetching: isShopFetching } = useQuery({
        queryKey: ['shop', shopId],
        queryFn: () => shopId ? sovereign.entities.Shop.get(shopId) : Promise.resolve(null),
        enabled: !!shopId
    });

    const { data: favorites = [] } = useQuery({
        queryKey: ['favorites', user?.id],
        queryFn: () => user ? sovereign.entities.Favorite.filter({ user_id: user.id }) : [],
        enabled: !!user
    });

    const isFavorited = favorites.some(f => f.target_id === shopId && f.target_type === 'shop');

    const toggleFavoriteMutation = useMutation({
        mutationFn: async () => {
            if (!user) {
                toast.error("Please login first");
                navigate(createPageUrl('SignIn'));
                return;
            }
            if (isFavorited) {
                const fav = favorites.find(f => f.target_id === shopId && f.target_type === 'shop');
                if (fav) await sovereign.entities.Favorite.delete(fav.id);
            } else {
                await sovereign.entities.Favorite.create({
                    user_id: user.id,
                    target_id: shopId,
                    target_type: 'shop'
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
            toast.success(isFavorited ? "Removed from favorites" : "Added to favorites");
        },
        onError: (err) => toast.error(err.message)
    });

    const initiateChat = async () => {
        if (!user) {
            toast.error("Please login to send messages");
            navigate(createPageUrl('SignIn'));
            return;
        }

        try {
            const members = await sovereign.entities.ShopMember.filter({ shop_id: shopId, role: 'owner' });
            const owner = members[0];
            if (owner && owner.barber_id) {
                navigate(createPageUrl(`Chat?contactId=${owner.barber_id}`));
            } else {
                toast.error("Contact not available for this shop");
            }
        } catch {
            toast.error("Could not reach the shop");
        }
    };

    // Fetch barbers linked to this shop via ShopMember (New Architecture)
    const { data: shopBarbers = [], isFetching: isBarbersFetching } = useQuery({
        queryKey: ['shop-barbers', shopId],
        queryFn: async () => {
            if (!shopId) return [];
            const members = await sovereign.entities.ShopMember.filter({ shop_id: shopId });
            const activeMembers = members.filter(m => m.status === 'active' && m.booking_enabled);

            const barbers = await Promise.all(activeMembers.map(async (member) => {
                try {
                    const barberData = await sovereign.entities.Barber.get(member.barber_id);
                    return { ...barberData, shopRole: member.role };
                } catch {
                    return null;
                }
            }));
            return barbers.filter(Boolean);
        },
        enabled: !!shopId
    });

    const { data: services = [], isFetching: isServicesFetching } = useQuery({
        queryKey: ['shop-services', shopId],
        queryFn: () => shopId ? sovereign.entities.Service.filter({ shop_id: shopId }) : [],
        enabled: !!shopId
    });

    const isRefreshing = isShopFetching || isBarbersFetching || isServicesFetching;

    if (!shop && !isShopFetching) return <div className="p-8 text-center">Shop not found</div>;

    const displayShop = shop || {
        name: "Shop Loading...",
        rating: 0,
        review_count: 0,
        location: "Loading...",
        image_url: "",
    };

    return (
        <div className="min-h-screen bg-background pb-24 lg:pb-8">
        <div className="container mx-auto px-4 md:px-6 py-8">
            <MetaTags
                title={displayShop.name}
                description={`Visit ${displayShop.name}. Top-rated barbershop with ${displayShop.rating} stars.`}
                image={displayShop.image_url}
            />
            <LocalBusinessSchema
                name={displayShop.name}
                image={displayShop.image_url}
                address={displayShop.location || displayShop.address}
                rating={displayShop.rating}
                reviewCount={displayShop.review_count}
                priceRange="$$"
            />

            {/* Shop Header */}
            <div className="h-64 md:h-96 w-full rounded-[40px] overflow-hidden mb-10 relative group shadow-2xl">
                <div className="absolute top-6 right-6 z-20 flex gap-3">
                    <Button
                        variant="secondary"
                        size="icon"
                        onClick={() => toggleFavoriteMutation.mutate()}
                        className={`rounded-full backdrop-blur-md border-white/20 transition-all ${isFavorited ? 'bg-red-500 text-white border-red-500' : 'bg-white/20 text-white hover:bg-white/40'}`}
                    >
                        <Heart className={`w-5 h-5 ${isFavorited ? 'fill-current' : ''}`} />
                    </Button>
                    <RefreshIndicator isRefreshing={isRefreshing} className="bg-black/50 border-white/20 text-white backdrop-blur-md" />
                </div>

                <OptimizedImage
                    src={displayShop.image_url || "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=1200&fit=crop"}
                    className="w-full h-full object-cover"
                    fill
                    alt={displayShop.name}
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 via-foreground/20 to-transparent"></div>

                <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white w-full flex flex-col md:flex-row md:items-end justify-between gap-6">
                    <div>
                        <h1 className="text-4xl md:text-6xl font-black mb-4 tracking-tight">{displayShop.name}</h1>
                        <div className="flex flex-wrap items-center gap-4 text-sm md:text-base font-medium">
                            <div className="flex items-center gap-2">
                                <MapPin className="w-5 h-5 text-primary" />
                                <span className="text-white/90">{displayShop.location || displayShop.address}</span>
                            </div>
                            <div className="flex items-center gap-1.5 bg-white/10 backdrop-blur-md px-4 py-1.5 rounded-full border border-white/20">
                                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                                <span className="font-bold">{displayShop.rating || 'New'}</span>
                                <span className="text-white/60 font-normal">({displayShop.review_count || 0} reviews)</span>
                            </div>
                        </div>
                    </div>
                    <Button
                        size="lg"
                        onClick={initiateChat}
                        className="bg-primary text-primary-foreground hover:opacity-90 font-black rounded-2xl h-14 px-8 shadow-xl shadow-black/20"
                    >
                        <MessageSquare className="w-5 h-5 mr-3" />
                        Message Shop
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                <div className="lg:col-span-8 space-y-12">
                    {/* Description */}
                    {displayShop.description && (
                        <div>
                            <h2 className="text-2xl font-black text-foreground mb-4">About</h2>
                            <p className="text-muted-foreground text-lg leading-relaxed">{displayShop.description}</p>
                        </div>
                    )}

                    {/* Team */}
                    <div>
                        <div className="flex items-center justify-between mb-8">
                            <h2 className="text-2xl font-black text-foreground">Select Expert</h2>
                            <span className="text-sm font-bold text-muted-foreground uppercase tracking-widest">{shopBarbers.length} Available</span>
                        </div>

                        {shopBarbers.length === 0 ? (
                            <div className="p-12 text-center bg-muted/50 rounded-[32px] border-2 border-dashed border-border">
                                <p className="text-slate-500 font-bold">No barbers listed for this shop yet.</p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
                                {shopBarbers.map((barberRecord, i) => (
                                    <Link key={i} to={createPageUrl(`BarberProfile?id=${barberRecord.id}`)} className="group">
                                        <div className="bg-card p-6 rounded-[32px] border border-border group-hover:border-primary group-hover:shadow-2xl group-hover:shadow-primary/10 transition-all duration-300 text-center flex flex-col items-center">
                                            <div className="relative mb-4 group-hover:scale-105 transition-transform">
                                                <UserAvatar
                                                    src={barberRecord.image_url}
                                                    name={barberRecord.name}
                                                    className="w-24 h-24 border-4 border-white shadow-xl"
                                                />
                                                <div className="absolute -bottom-1 -right-1 bg-white rounded-full px-2 py-1 shadow-lg text-xs font-black flex items-center gap-1 border border-border">
                                                    <Star className="w-3 h-3 text-amber-500 fill-amber-500" /> {barberRecord.rating || 'New'}
                                                </div>
                                            </div>
                                            <h3 className="font-black text-lg text-foreground group-hover:text-primary transition-colors mb-1">{barberRecord.name}</h3>
                                            <span className="text-xs font-bold text-muted-foreground uppercase tracking-tight mb-4 text-center">
                                                {barberRecord.shopRole ? `${barberRecord.shopRole} • ` : ''}{barberRecord.title || 'Barber'}
                                            </span>
                                            <Button variant="outline" className="w-full rounded-2xl border-border group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all font-bold">
                                                View Profile
                                            </Button>
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Services */}
                    <div>
                        <h2 className="text-2xl font-black text-foreground mb-8">Popular Services</h2>
                        {services.length === 0 ? (
                            <p className="text-slate-500 font-bold">No services available at this shop.</p>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {services.map((service) => {
                                    const sData = service.data || service;
                                    return (
                                        <Link key={service.id} to={createPageUrl(`BookingFlow?shopId=${shopId}&serviceId=${service.id}`)}>
                                            <div className="bg-card border border-border rounded-2xl p-6 hover:border-primary hover:bg-muted/50 transition-all flex items-center justify-between group">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center text-xl">✂️</div>
                                                    <div>
                                                        <h3 className="font-black text-foreground mb-1">{sData.name}</h3>
                                                        <p className="text-sm font-bold text-muted-foreground">{sData.duration_min || 30} mins</p>
                                                    </div>
                                                </div>
                                                <div className="text-right">
                                                    <p className="text-xl font-black text-foreground">${(sData.price || 0).toFixed(2)}</p>
                                                    <p className="text-[10px] font-black text-primary uppercase tracking-widest">Book Now</p>
                                                </div>
                                            </div>
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                </div>

                <div className="lg:col-span-4 space-y-8">
                    {/* Location Card */}
                    <div className="bg-card rounded-[32px] border border-border overflow-hidden shadow-sm">
                        <div className="p-6 border-b border-border">
                            <h2 className="text-xl font-black text-foreground">Find Us</h2>
                        </div>
                        <div className="h-64">
                            <LocationMap
                                center={[33.15, -96.96]}
                                popupText={displayShop.name}
                            />
                        </div>
                        <div className="p-6">
                            <p className="text-muted-foreground font-medium mb-4">{displayShop.location || displayShop.address}</p>
                            <Button variant="outline" className="w-full rounded-2xl border-border font-bold" onClick={() => window.open(`https://maps.google.com/?q=${displayShop.location || displayShop.address}`, '_blank')}>
                                Get Directions
                            </Button>
                        </div>
                    </div>

                    {/* Hours / Info */}
                    <div className="bg-primary rounded-[32px] p-8 text-primary-foreground">
                        <h2 className="text-xl font-black mb-6">Store Integrity</h2>
                        <div className="space-y-4">
                            {[
                                { label: 'Sanitation Protocol', value: 'Level 5' },
                                { label: 'Service Guarantee', value: '100%' },
                                { label: 'Payment Type', value: 'Cashless' },
                                { label: 'Cancellation Policy', value: '24 Hours' }
                            ].map((item, i) => (
                                <div key={i} className="flex justify-between items-center py-2 border-b border-white/5 last:border-0">
                                    <span className="text-white/60 font-bold text-xs uppercase tracking-widest">{item.label}</span>
                                    <span className="font-black text-primary">{item.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </div>
            <ClientBottomNav />
        </div>
    );
}

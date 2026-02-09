import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Heart, Search, Loader2, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { MetaTags } from '@/components/seo/MetaTags';
import BarberCard from '@/components/ui/barber-card';
import ShopCard from '@/components/ui/shop-card';
import { motion, AnimatePresence } from 'framer-motion';
import { toast } from 'sonner';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

export default function Favorites() {
    const [searchTerm, setSearchTerm] = useState('');
    const queryClient = useQueryClient();

    const { data: user } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => sovereign.auth.me().catch(() => null),
    });

    const { data: favorites = [], isLoading: isFavoritesLoading } = useQuery({
        queryKey: ['favorites', user?.id],
        queryFn: () => user ? sovereign.entities.Favorite.filter({ user_id: user.id }) : [],
        enabled: !!user,
    });

    const { data: barbers = [] } = useQuery({
        queryKey: ['favorite-barbers'],
        queryFn: async () => {
            const barberIds = favorites.filter(f => f.target_type === 'barber').map(f => f.target_id);
            if (barberIds.length === 0) return [];
            return sovereign.entities.Barber.filter({ id: { $in: barberIds } });
        },
        enabled: favorites.length > 0,
    });

    const { data: shops = [] } = useQuery({
        queryKey: ['favorite-shops'],
        queryFn: async () => {
            const shopIds = favorites.filter(f => f.target_type === 'shop').map(f => f.target_id);
            if (shopIds.length === 0) return [];
            return sovereign.entities.Shop.filter({ id: { $in: shopIds } });
        },
        enabled: favorites.length > 0,
    });

    const removeFavoriteMutation = useMutation({
        mutationFn: (id) => sovereign.entities.Favorite.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites'] });
            toast.success('Removed from favorites');
        }
    });

    const filteredBarbers = barbers.filter(b =>
        b.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        b.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const filteredShops = shops.filter(s =>
        s.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        s.location?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!user) {
        return (
            <div className="min-h-screen bg-background flex items-center justify-center p-4">
                <div className="text-center space-y-4 max-w-sm">
                    <div className="w-16 h-16 bg-card rounded-2xl shadow-sm flex items-center justify-center mx-auto text-muted-foreground">
                        <Heart className="w-8 h-8" />
                    </div>
                    <h2 className="text-2xl font-bold text-foreground">Sign in for Favorites</h2>
                    <p className="text-muted-foreground">Save your favorite barbers and shops to find them easily next time.</p>
                    <Button variant="default" className="w-full bg-primary text-primary-foreground hover:opacity-95 rounded-xl py-6 h-auto text-lg font-medium" onClick={() => window.location.href = '/SignIn'}>
                        Sign In to Continue
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24 lg:pb-8">
            <MetaTags title="My Favorites" description="Your saved barbers and shops" />

            {/* Premium Header */}
            <div className="bg-card border-b border-border pt-8 pb-6 px-4 md:px-8 sticky top-0 z-30">
                <div className="w-full max-w-6xl lg:max-w-7xl mx-auto space-y-6">
                    <div className="flex items-center justify-between">
                        <div className="space-y-1">
                            <h1 className="text-3xl font-extrabold tracking-tight text-foreground flex items-center gap-2">
                                Favorites <Sparkles className="w-5 h-5 text-amber-500 fill-amber-500" />
                            </h1>
                            <p className="text-muted-foreground text-sm">You have {favorites.length} saved profiles</p>
                        </div>
                    </div>

                    <div className="relative group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-foreground transition-colors" />
                        <Input
                            placeholder="Search your favorites..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="pl-12 pr-4 h-14 bg-muted border-transparent focus:bg-card focus:ring-2 focus:ring-primary/10 transition-all text-lg rounded-2xl"
                        />
                    </div>
                </div>
            </div>

            <div className="w-full max-w-6xl lg:max-w-7xl mx-auto px-4 md:px-8 py-8">
                <Tabs defaultValue="all" className="space-y-8">
                    <TabsList className="bg-card p-1 rounded-xl border border-border shadow-sm w-full md:w-auto inline-flex overflow-x-auto">
                        <TabsTrigger value="all" className="px-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">All</TabsTrigger>
                        <TabsTrigger value="barbers" className="px-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Barbers</TabsTrigger>
                        <TabsTrigger value="shops" className="px-8 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Shops</TabsTrigger>
                    </TabsList>

                    {isFavoritesLoading ? (
                        <div className="py-20 flex flex-col items-center justify-center text-muted-foreground space-y-4">
                            <Loader2 className="w-10 h-10 animate-spin" />
                            <p className="text-sm font-medium">Crunching your favorites...</p>
                        </div>
                    ) : favorites.length === 0 ? (
                        <div className="py-32 text-center">
                            <div className="w-24 h-24 bg-card rounded-3xl shadow-sm border border-border flex items-center justify-center mx-auto mb-6 text-muted-foreground">
                                <Heart className="w-12 h-12" />
                            </div>
                            <h3 className="text-2xl font-bold text-foreground mb-2">Your favorites list is empty</h3>
                            <p className="text-muted-foreground max-w-sm mx-auto mb-8 text-lg">Heart your favorite professionals to see them here for quick access.</p>
                            <Button variant="outline" className="rounded-xl px-8 h-12 border-border hover:bg-muted hover:border-primary/30" onClick={() => window.location.href = '/Explore'}>
                                Explore Professionals
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-12">
                            <TabsContent value="all" className="mt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    <AnimatePresence>
                                        {filteredBarbers.map(barber => (
                                            <motion.div layout key={barber.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                                <BarberCard barber={barber} />
                                                <button
                                                    onClick={() => removeFavoriteMutation.mutate(favorites.find(f => f.target_id === barber.id)?.id)}
                                                    className="mt-2 text-xs text-red-500 hover:text-red-600 font-medium px-2"
                                                >
                                                    Remove from favorites
                                                </button>
                                            </motion.div>
                                        ))}
                                        {filteredShops.map(shop => (
                                            <motion.div layout key={shop.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}>
                                                <ShopCard shop={shop} />
                                                <button
                                                    onClick={() => removeFavoriteMutation.mutate(favorites.find(f => f.target_id === shop.id)?.id)}
                                                    className="mt-2 text-xs text-red-500 hover:text-red-600 font-medium px-2"
                                                >
                                                    Remove from favorites
                                                </button>
                                            </motion.div>
                                        ))}
                                    </AnimatePresence>
                                </div>
                            </TabsContent>

                            <TabsContent value="barbers" className="mt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredBarbers.map(barber => (
                                        <BarberCard key={barber.id} barber={barber} />
                                    ))}
                                    {filteredBarbers.length === 0 && (
                                        <div className="col-span-full py-20 text-center text-muted-foreground italic">No favorite barbers found.</div>
                                    )}
                                </div>
                            </TabsContent>

                            <TabsContent value="shops" className="mt-0">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {filteredShops.map(shop => (
                                        <ShopCard key={shop.id} shop={shop} />
                                    ))}
                                    {filteredShops.length === 0 && (
                                        <div className="col-span-full py-20 text-center text-muted-foreground italic">No favorite shops found.</div>
                                    )}
                                </div>
                            </TabsContent>
                        </div>
                    )}
                </Tabs>
            </div>
            <ClientBottomNav />
        </div>
    );
}

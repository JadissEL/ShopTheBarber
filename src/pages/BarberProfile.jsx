import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Star, Heart, MapPin, Share2, CheckCircle2, ShieldCheck, CalendarDays, Instagram, Scissors } from 'lucide-react';
import { useBooking } from '@/components/context/BookingContext';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Link, useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { MetaTags } from '@/components/seo/MetaTags';
import { LocalBusinessSchema } from '@/components/seo/SchemaMarkup';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import ReviewCard from '@/components/ui/review-card';
import PromotionList from '@/components/promotions/PromotionList';
import ServiceSelection from '@/components/barber/ServiceSelection';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog";
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

export default function BarberProfile() {
    const queryClient = useQueryClient();
    const navigate = useNavigate();
    const urlParams = new URLSearchParams(window.location.search);
    const barberId = urlParams.get('id');
    const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => sovereign.auth.me() });
    const { bookingState, updateBooking } = useBooking();

    // Analytics: Track Profile View
    React.useEffect(() => {
        if (barberId) {
            sovereign.analytics.track({
                eventName: 'view_barber_profile',
                properties: { barber_id: barberId, viewer_id: user?.id }
            });
        }
    }, [barberId, user]);

    // Fetch services relevant to this barber (Independent + Shop Services)
    const { data: services = [] } = useQuery({
        queryKey: ['barber-services', barberId],
        queryFn: async () => {
            if (!barberId) return [];

            let allServices = [];

            try {
                // 0. Fetch Barber details 
                const barber = await sovereign.entities.Barber.get(barberId).catch(() => null);

                // 1. Fetch Independent Services
                const servicesById = await sovereign.entities.Service.filter({ barber_id: barberId });
                allServices = [...servicesById];

                if (barber?.user_id) {
                    const servicesByUserId = await sovereign.entities.Service.filter({ barber_id: barber.user_id });
                    allServices = [...allServices, ...servicesByUserId];
                }

                // 2. Fetch Shop Services (via memberships)
                const members = await sovereign.entities.ShopMember.filter({ barber_id: barberId });
                const shopIds = members.map(m => m.shop_id).filter(Boolean);

                let shopServices = [];
                if (shopIds.length > 0) {
                    const servicePromises = shopIds.map(sid => sovereign.entities.Service.filter({ shop_id: sid }));
                    const results = await Promise.all(servicePromises);
                    shopServices = results.flat();
                }

                // 3. Filter Shop Services by Config
                if (members.length > 0) {
                    const memberIds = members.map(m => m.id);
                    const configPromises = memberIds.map(mid => sovereign.entities.StaffServiceConfig.filter({ shop_member_id: mid }));
                    const configResults = await Promise.all(configPromises);
                    const allConfigs = configResults.flat();

                    shopServices = shopServices.filter(s => {
                        const config = allConfigs.find(c => c.service_id === s.id);
                        return config ? config.is_enabled : true;
                    });
                }

                allServices = [...allServices, ...shopServices];

                // Deduplicate by ID
                allServices = allServices.filter((v, i, a) => a.findIndex(t => (t.id === v.id)) === i);

            } catch (e) {
                console.error("Error fetching services", e);
            }

            return allServices;
        },
        enabled: !!barberId
    });

    const [selectedServiceIds, setSelectedServiceIds] = useState([]);
    const [contextDialogOpen, setContextDialogOpen] = useState(false);

    React.useEffect(() => {
        if (bookingState?.selectedServices?.length > 0) {
            setSelectedServiceIds(bookingState.selectedServices.map(s => s.id));
        }
    }, [bookingState]);

    const handleServiceToggle = (service) => {
        const newSelected = selectedServiceIds.includes(service.id)
            ? selectedServiceIds.filter(id => id !== service.id)
            : [...selectedServiceIds, service.id];

        setSelectedServiceIds(newSelected);

        updateBooking({
            ...bookingState,
            selectedServices: newSelected.map(id => services.find(s => s.id === id)).filter(Boolean)
        });
    };

    const { data: barber, isFetching: isBarberFetching, isError: barberError, refetch: refetchBarber } = useQuery({
        queryKey: ['barber', barberId],
        queryFn: async () => {
            if (!barberId) return null;
            const b = await sovereign.entities.Barber.get(barberId);
            return b ?? null;
        },
        enabled: !!barberId,
        retry: 2,
        retryDelay: (i) => (i + 1) * 1000,
    });

    // Fetch all shop memberships for this barber (New Architecture)
    const { data: memberships = [] } = useQuery({
        queryKey: ['barber-memberships', barberId],
        queryFn: async () => {
            if (!barberId) return [];
            const members = await sovereign.entities.ShopMember.filter({ barber_id: barberId });
            // Fetch shop details for each membership
            const enriched = await Promise.all(members.map(async (m) => {
                if (!m.shop_id) return null;
                const shop = await sovereign.entities.Shop.get(m.shop_id).catch(() => null);
                return { ...m, shop };
            }));
            return enriched.filter(m => m && m.shop);
        },
        enabled: !!barberId
    });

    const primaryMembership = memberships[0]; // For now, default to first shop found if multiple
    const _barberShop = primaryMembership?.shop;

    const displayBarber = barber || {
        name: "Ethan Carter",
        title: "Master Barber",
        rating: 4.9,
        review_count: 124,
        location: "San Francisco, CA",
        experience: "8 Years Exp",
        image_url: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&auto=format&fit=crop"
    };

    const { data: reviews = [], isFetching: isReviewsFetching } = useQuery({
        queryKey: ['reviews', displayBarber.name],
        queryFn: () => sovereign.entities.Review.filter({ target_name: displayBarber.name }),
        initialData: [],
        staleTime: 1000 * 60 * 1,
    });

    const _isRefreshing = isBarberFetching || isReviewsFetching;

    const { data: favorites = [] } = useQuery({
        queryKey: ['favorites', user?.id],
        queryFn: () => user ? sovereign.entities.Favorite.filter({ user_id: user.id }) : [],
        enabled: !!user
    });

    const isFavorited = favorites.some(f => f.target_id === barberId && f.target_type === 'barber');

    const toggleFavoriteMutation = useMutation({
        mutationFn: async () => {
            if (!user) {
                toast.error("Please login first");
                navigate(createPageUrl('SignIn'));
                return;
            }
            if (isFavorited) {
                const fav = favorites.find(f => f.target_id === barberId && f.target_type === 'barber');
                if (fav) await sovereign.entities.Favorite.delete(fav.id);
            } else {
                await sovereign.entities.Favorite.create({
                    user_id: user.id,
                    target_id: barberId,
                    target_type: 'barber'
                });
            }
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['favorites', user?.id] });
            toast.success(isFavorited ? "Removed from favorites" : "Added to favorites");
        },
        onError: (err) => toast.error(err.message)
    });

    const initiateChat = () => {
        if (!user) {
            toast.error("Please login to send messages");
            navigate(createPageUrl('SignIn'));
            return;
        }
        // Redirect to chat with the barber
        navigate(createPageUrl(`Chat?contactId=${barberId}`));
    };

    const displayReviews = reviews.length > 0 ? reviews : [
        { author_name: "Liam Harper", date_text: "2 months ago", rating: 5, text: "Ethan is hands down the best barber in the city. The attention to detail is unmatched." },
        { author_name: "Noah Jackson", date_text: "3 weeks ago", rating: 5, text: "Great vibes and an even better cut. Highly recommend the hot towel shave." },
        { author_name: "Oliver Smith", date_text: "1 week ago", rating: 4.5, text: "Very professional and punctual. Will be back." }
    ];

    const proceedToBooking = (shopId, type) => {
        // Analytics: Track Context Selection
        sovereign.analytics.track({
            eventName: 'select_booking_context',
            properties: {
                barber_id: barberId,
                context_type: type, // 'shop' or 'independent'
                shop_id: shopId
            }
        });

        const step = selectedServiceIds.length > 0 ? 'datetime' : 'services';
        let url = `BookingFlow?step=${step}&barberId=${barberId}`;
        if (shopId) url += `&shopId=${shopId}`;
        if (type === 'independent') url += `&context=independent`;

        navigate(createPageUrl(url));
    };

    const handleBookContext = () => {
        // Logic to determine if we need to ask for context
        const hasIndependent = barber?.is_independent;
        const shopCount = memberships.length;

        // Case 1: Only one shop, not independent
        if (shopCount === 1 && !hasIndependent) {
            proceedToBooking(memberships[0].shop.id, 'shop');
            return;
        }

        // Case 2: Only independent, no shops
        if (shopCount === 0 && hasIndependent) {
            proceedToBooking(null, 'independent');
            return;
        }

        // Case 3: Multiple options -> Show Dialog
        if (shopCount > 1 || (shopCount > 0 && hasIndependent)) {
            setContextDialogOpen(true);
            return;
        }

        // Fallback (e.g. data not loaded or no memberships/independent set)
        // Just proceed without context and let BookingFlow handle/fail
        proceedToBooking(null, 'unknown');
    };

    if (!barberId) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-8">
                <div className="text-center">
                    <p className="text-muted-foreground mb-4">No professional selected.</p>
                    <Link to={createPageUrl('Explore')}><Button variant="default">Find a Barber</Button></Link>
                </div>
            </div>
        );
    }

    if (barberError && !barber) {
        return (
            <div className="bg-background min-h-screen flex items-center justify-center p-8">
                <div className="text-center max-w-md">
                    <h2 className="text-xl font-bold mb-2">Couldn&apos;t load this professional</h2>
                    <p className="text-muted-foreground mb-4">The server may be offline or the link may be invalid. Try again or browse from Find a Barber.</p>
                    <div className="flex gap-3 justify-center">
                        <Button onClick={() => refetchBarber()} variant="default">Try again</Button>
                        <Link to={createPageUrl('Explore')}><Button variant="outline">Find a Barber</Button></Link>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-background min-h-screen text-foreground pb-24 lg:pb-8 font-sans transition-colors duration-300">
            <MetaTags
                title={displayBarber.name}
                description={`${displayBarber.title}. Rated ${displayBarber.rating} stars. Book an appointment now.`}
                image={displayBarber.image_url}
            />
            <LocalBusinessSchema
                name={displayBarber.name}
                image={displayBarber.image_url}
                address={displayBarber.location}
                rating={displayBarber.rating}
                reviewCount={displayBarber.review_count}
                priceRange="$$"
            />

            {/* Immersive Hero Section */}
            <div className="relative h-[40vh] md:h-[50vh] w-full overflow-hidden">
                <OptimizedImage
                    src="https://images.unsplash.com/photo-1503951914290-93d32b06769c?w=1600&auto=format&fit=crop"
                    className="w-full h-full"
                    fill
                    alt="Cover"
                    priority
                    imgClassName="object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-transparent"></div>

                {/* Navigation / Actions Overlay */}
                <div className="absolute top-0 left-0 right-0 p-6 flex justify-between items-center z-20">
                    <div></div>
                    <div className="flex gap-2">
                        <Button variant="outline" size="icon" className="rounded-full bg-white/20 backdrop-blur-md border-white/20 text-white hover:bg-white/40">
                            <Share2 className="w-4 h-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            onClick={() => toggleFavoriteMutation.mutate()}
                            className={`rounded-full border-white/20 backdrop-blur-md ${isFavorited ? 'bg-red-500/80 text-white border-red-500' : 'bg-white/20 text-white hover:bg-white/40'}`}
                        >
                            <Heart className={`w-4 h-4 ${isFavorited ? 'fill-current' : ''}`} />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 md:px-6 relative z-10 -mt-24">
                <div className="flex flex-col md:flex-row gap-8 items-start">

                    {/* Left Column: Profile Card */}
                    <div className="w-full md:w-1/3 lg:w-1/4">
                        <div className="bg-card rounded-3xl p-6 border border-border shadow-sm relative overflow-hidden group">
                            <div className="relative w-32 h-32 md:w-40 md:h-40 rounded-full border-4 border-white overflow-hidden shadow-xl mx-auto md:mx-0 mb-4">
                                <OptimizedImage
                                    src={displayBarber.image_url}
                                    alt={displayBarber.name}
                                    fill
                                    width={300}
                                    imgClassName="group-hover:scale-110 transition-transform duration-500"
                                />
                            </div>

                            <div className="text-center md:text-left">
                                <h1 className="text-2xl font-bold text-foreground mb-1 flex items-center justify-center md:justify-start gap-2">
                                    {displayBarber.name}
                                    <CheckCircle2 className="w-5 h-5 text-blue-500 fill-blue-500/10" />
                                </h1>
                                <p className="text-muted-foreground font-medium mb-1">{displayBarber.title}</p>

                                {/* Works at Shop Badge(s) - North Star Context */}
                                <div className="flex flex-wrap gap-2 mb-3 justify-center md:justify-start">
                                    {memberships.length > 0 ? (
                                        memberships.map(m => (
                                            <Link key={m.id} to={createPageUrl(`ShopProfile?id=${m.shop.id}`)} className="hover:opacity-80 transition-opacity">
                                                <div className="flex items-center gap-1.5 text-xs font-medium bg-gray-100 text-gray-700 px-2 py-1 rounded-full border border-gray-200">
                                                    <span>{m.role === 'owner' ? 'Owner at' : 'Works at'} <strong>{m.shop.name}</strong></span>
                                                    <Share2 className="w-3 h-3" />
                                                </div>
                                            </Link>
                                        ))
                                    ) : (
                                        // Independent / Mobile context
                                        <div className="flex items-center gap-1.5 text-xs font-medium bg-primary/10 text-primary px-2 py-1 rounded-full border border-primary/20">
                                            <span>Independent / Mobile</span>
                                            <CheckCircle2 className="w-3 h-3" />
                                        </div>
                                    )}
                                </div>

                                <div className="flex items-center justify-center md:justify-start gap-4 text-sm text-muted-foreground mb-6">
                                    <div className="flex items-center gap-1">
                                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                                        <span className="font-bold text-foreground">{displayBarber.rating}</span>
                                        <span className="text-muted-foreground">({displayBarber.review_count})</span>
                                    </div>
                                    <div className="w-1 h-1 bg-gray-300 rounded-full"></div>
                                    <div className="flex items-center gap-1">
                                        <MapPin className="w-4 h-4 text-muted-foreground" />
                                        <span>{displayBarber.location || "San Francisco"}</span>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3 mb-6">
                                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-border">
                                        <ShieldCheck className="w-5 h-5 text-primary mx-auto mb-1" />
                                        <span className="text-xs text-muted-foreground block">Verified</span>
                                    </div>
                                    <div className="bg-gray-50 rounded-xl p-3 text-center border border-border">
                                        <span className="block font-bold text-foreground">{displayBarber.experience}</span>
                                        <span className="text-xs text-muted-foreground block">Experience</span>
                                    </div>
                                </div>

                                <div className="flex gap-2 justify-center md:justify-start items-center">
                                    <Badge variant="outline" className="border-border text-muted-foreground hover:text-foreground cursor-pointer h-8 px-3 rounded-full"><Instagram className="w-3 h-3 mr-1" /> Instagram</Badge>
                                    <Button variant="default" size="sm" onClick={initiateChat} className="bg-primary text-primary-foreground hover:opacity-95 rounded-full h-8 px-4 font-bold text-xs">
                                        Message
                                    </Button>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column: Content */}
                    <div className="flex-1 w-full">
                        <PromotionList barberId={barberId} />
                        <Tabs defaultValue="services" className="w-full">
                            <TabsList className="bg-muted border border-border p-1 rounded-full w-full md:w-auto overflow-x-auto justify-start mb-8 [&::-webkit-scrollbar]:hidden select-none">
                                {['services', 'portfolio', 'reviews', 'about'].map(tab => (
                                    <TabsTrigger
                                        key={tab}
                                        value={tab}
                                        onClick={() => sovereign.analytics.track({ eventName: 'view_profile_tab', properties: { tab, barber_id: barberId } })}
                                        className="rounded-full data-[state=active]:bg-primary data-[state=active]:text-white px-6 capitalize"
                                    >
                                        {tab}
                                    </TabsTrigger>
                                ))}
                            </TabsList>

                            <TabsContent value="services" className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <ServiceSelection
                                    services={services}
                                    selectedServiceIds={selectedServiceIds}
                                    onToggleService={handleServiceToggle}
                                    barberId={barberId}
                                    onBookNow={handleBookContext}
                                />
                            </TabsContent>

                            <TabsContent value="portfolio" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {[
                                        "https://images.unsplash.com/photo-1621605815971-fbc98d665033",
                                        "https://images.unsplash.com/photo-1503951914290-93d32b06769c",
                                        "https://images.unsplash.com/photo-1599351431202-6e0c06e7838d",
                                        "https://images.unsplash.com/photo-1534643960519-11ad79bc19df",
                                        "https://images.unsplash.com/photo-1635273051932-a56976a4a49c",
                                        "https://images.unsplash.com/photo-1605497788044-5a32c7078486"
                                    ].map((url, i) => (
                                        <div key={i} className="aspect-square rounded-2xl overflow-hidden bg-gray-100 relative group cursor-pointer border border-border">
                                            <OptimizedImage
                                                src={`${url}?w=400&auto=format&fit=crop`}
                                                fallbackSrc="https://images.unsplash.com/photo-1621605815971-fbc98d6d4e84?w=400&fit=crop"
                                                alt={`Portfolio Item ${i + 1}`}
                                                fill
                                                imgClassName="group-hover:scale-110 transition-transform duration-500"
                                            />
                                            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                                <Heart className="w-6 h-6 text-white" />
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </TabsContent>

                            <TabsContent value="reviews" className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                                <div className="grid gap-6">
                                    {displayReviews.map((review, i) => (
                                        <ReviewCard key={i} review={review} />
                                    ))}
                                </div>
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Floating Book Button Mobile */}
            <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 w-[90%] md:hidden">
                <Button
                    onClick={() => handleBookContext()}
                    className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-2xl shadow-xl shadow-primary/20 text-lg flex items-center justify-center gap-2"
                >
                    <CalendarDays className="w-5 h-5" /> {selectedServiceIds.length > 0 ? 'Continue to Date' : 'Book Appointment'}
                </Button>
            </div>

            <Dialog open={contextDialogOpen} onOpenChange={setContextDialogOpen}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <DialogTitle>Choose Location</DialogTitle>
                        <DialogDescription>
                            {displayBarber.name} works at multiple locations. Where would you like to book?
                        </DialogDescription>
                    </DialogHeader>
                    <div className="grid gap-4 py-4">
                        {memberships.map(m => (
                            <Button
                                key={m.id}
                                variant="outline"
                                className="h-auto py-4 justify-start text-left flex gap-3 hover:border-primary hover:bg-primary/5"
                                onClick={() => proceedToBooking(m.shop.id, 'shop')}
                            >
                                <div className="bg-gray-100 p-2 rounded-full">
                                    <MapPin className="w-5 h-5 text-gray-600" />
                                </div>
                                <div>
                                    <div className="font-bold text-foreground">{m.shop.name}</div>
                                    <div className="text-xs text-muted-foreground">{m.shop.location || "Location details"}</div>
                                </div>
                            </Button>
                        ))}
                        {barber?.is_independent && (
                            <Button
                                variant="outline"
                                className="h-auto py-4 justify-start text-left flex gap-3 hover:border-primary hover:bg-primary/5"
                                onClick={() => proceedToBooking(null, 'independent')}
                            >
                                <div className="bg-primary/10 p-2 rounded-full">
                                    <Scissors className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <div className="font-bold text-foreground">Independent / Mobile</div>
                                    <div className="text-xs text-muted-foreground">{barber.independent_location || "Direct booking"}</div>
                                </div>
                            </Button>
                        )}
                    </div>
                </DialogContent>
            </Dialog>
            <ClientBottomNav />
        </div>
    );
}

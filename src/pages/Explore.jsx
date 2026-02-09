import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { RefreshIndicator } from '@/components/ui/refresh-indicator';
import { useQueryClient } from '@tanstack/react-query';
import { MetaTags } from '@/components/seo/MetaTags';
import { SchemaMarkup } from '@/components/seo/SchemaMarkup';
import { AnimatePresence } from 'framer-motion';
import BarberCard from '@/components/ui/barber-card';
import ShopCard from '@/components/ui/shop-card';
import { Button } from '@/components/ui/button';
import { Store, User } from 'lucide-react';
import AIAdvisor from '@/components/ai/AIAdvisor';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

export default function Explore() {
  const urlParams = new URLSearchParams(window.location.search);
  const [searchTerm, setSearchTerm] = useState(urlParams.get('q') || '');
  const [activeFilter, setActiveFilter] = useState(urlParams.get('filter') || 'All');
  const queryClient = useQueryClient();

  const {
    data: rawBarbers,
    isFetching: barbersFetching,
    isError: barbersError,
    error: barbersErr,
    refetch: refetchBarbers
  } = useQuery({
    queryKey: ['explore-barbers'],
    queryFn: async () => {
      const list = await sovereign.entities.Barber.list();
      return Array.isArray(list) ? list : [];
    },
    staleTime: 1000 * 60 * 2, // 2 minutes
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  });

  // Normalize barbers data - flatten data object if exists; safe when API fails
  const barbers = React.useMemo(() => {
    const list = Array.isArray(rawBarbers) ? rawBarbers : [];
    return list.map(b => {
      const data = b.data || {};
      return {
        id: b.id,
        name: data.name || b.name || 'Unknown',
        location: data.location || b.location,
        image_url: data.image_url || b.image_url,
        rating: data.rating ?? b.rating ?? 0,
        review_count: data.review_count ?? b.review_count ?? 0,
        title: data.title || b.title,
        shop_id: b.shop_id ?? data.shop_id,
        services: data.services || b.services,
        auto_accept: data.auto_accept || b.auto_accept,
        type: data.type || b.type,
        offers_mobile_service: data.offers_mobile_service || b.offers_mobile_service
      };
    });
  }, [rawBarbers]);

  const { data: rawShops, isError: shopsError, refetch: refetchShops } = useQuery({
    queryKey: ['explore-shops'],
    queryFn: async () => {
      const list = await sovereign.entities.Shop.list();
      return Array.isArray(list) ? list : [];
    },
    staleTime: 1000 * 60 * 2,
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    refetchOnMount: 'always',
    refetchOnWindowFocus: true
  });

  const { data: servicesList = [] } = useQuery({
    queryKey: ['explore-services'],
    queryFn: async () => {
      try {
        const list = await sovereign.entities.Service.list();
        return Array.isArray(list) ? list : [];
      } catch {
        return [];
      }
    },
    staleTime: 1000 * 60 * 5,
    retry: 2
  });

  const shops = React.useMemo(() => {
    const list = Array.isArray(rawShops) ? rawShops : [];
    return list.map(s => ({
      ...s,
      ...(s.data || {}),
      id: s.id
    }));
  }, [rawShops]);

  // Shop IDs that offer a given service (for service-first filter)
  const shopIdsByService = React.useMemo(() => {
    const map = {};
    const list = Array.isArray(servicesList) ? servicesList : [];
    const tags = ['hair', 'haircut', 'beard', 'beard trim', 'shave', 'styling', 'facial'];
    for (const svc of list) {
      const cat = (svc.category || '').toLowerCase();
      const name = (svc.name || '').toLowerCase();
      const shopId = svc.shop_id;
      if (!shopId) continue;
      for (const tag of tags) {
        if (cat.includes(tag) || name.includes(tag)) {
          const key = tag.replace(/\s+/g, '');
          if (!map[key]) map[key] = new Set();
          map[key].add(shopId);
        }
      }
      if (cat.includes('hair') || name.includes('hair')) {
        if (!map['haircut']) map['haircut'] = new Set();
        map['haircut'].add(shopId);
      }
      if (cat.includes('beard') || name.includes('beard')) {
        if (!map['beardtrim']) map['beardtrim'] = new Set();
        map['beardtrim'].add(shopId);
      }
    }
    return map;
  }, [servicesList]);

  const { data: promotions } = useQuery({
    queryKey: ['active-promotions'],
    queryFn: async () => {
      try {
        return await sovereign.entities.Promotion?.list?.() ?? [];
      } catch {
        return [];
      }
    },
    initialData: [],
    retry: false
  });

  const { data: inspirationPosts = [] } = useQuery({
    queryKey: ['inspiration-posts'],
    queryFn: async () => {
      try {
        return await sovereign.entities.InspirationPost?.list?.('-likes', 8) ?? [];
      } catch {
        return [];
      }
    },
    initialData: [],
    retry: false
  });

  const [viewType, setViewType] = useState('professionals'); // 'professionals' or 'shops'

  const prefetchBarber = (id) => {
    queryClient.prefetchQuery({
      queryKey: ['barber', id],
      queryFn: () => sovereign.entities.Barber.get(id),
      staleTime: 1000 * 60 * 5,
    });
  };

  const tags = ["All", "Deals", "Haircut", "Beard Trim", "Shave", "Styling", "Facial"];

  const filteredBarbers = React.useMemo(() => {
    return barbers.filter(barber => {
      const searchTermLower = searchTerm.toLowerCase();

      const matchesSearch = !searchTerm || (
        (barber.name || '').toLowerCase().includes(searchTermLower) ||
        (barber.location || '').toLowerCase().includes(searchTermLower) ||
        (barber.title || '').toLowerCase().includes(searchTermLower) ||
        (Array.isArray(barber.services) && barber.services.some(s =>
          (typeof s === 'string' ? s : '').toLowerCase().includes(searchTermLower)
        ))
      );

      const promoList = Array.isArray(promotions) ? promotions : [];
      const hasPromotion = promoList.some(p =>
        (p.barber_id === barber.id && p.type === 'barber') ||
        p.type === 'general' ||
        p.type === 'platform_targeted'
      );

      let matchesTag = true;
      if (activeFilter === 'Deals') {
        matchesTag = hasPromotion;
      } else if (activeFilter !== 'All') {
        const tagKey = activeFilter.toLowerCase().replace(/\s+/g, '');
        const tagNorm = tagKey === 'beardtrim' ? 'beard' : tagKey === 'haircut' ? 'hair' : tagKey;
        const shopIds = shopIdsByService[tagNorm] || shopIdsByService[tagKey];
        const barberShopId = barber.shop_id;
        const matchesByService = barberShopId && shopIds && shopIds.has(barberShopId);
        const matchesByBarberServices = Array.isArray(barber.services) &&
          barber.services.some(s =>
            (typeof s === 'string' ? s : '').toLowerCase().includes(activeFilter.toLowerCase())
          );
        matchesTag = !!(matchesByService || matchesByBarberServices);
      }

      return matchesSearch && matchesTag;
    });
  }, [barbers, searchTerm, activeFilter, promotions, shopIdsByService]);

  const filteredShops = React.useMemo(() => {
    return shops.filter(shop => {
      const searchTermLower = searchTerm.toLowerCase();
      return !searchTerm || (
        (shop.name || '').toLowerCase().includes(searchTermLower) ||
        (shop.location || '').toLowerCase().includes(searchTermLower) ||
        (shop.description || '').toLowerCase().includes(searchTermLower)
      );
    });
  }, [shops, searchTerm]);

  return (
    <div className="min-h-screen bg-background text-foreground font-sans pb-24 lg:pb-8">
      <MetaTags
        title={searchTerm ? `Search: ${searchTerm}` : "Explore Top Barbers"}
        description="Discover the best grooming professionals in your city."
      />
      <SchemaMarkup
        type="CollectionPage"
        data={{
          name: "Explore Top Barbers",
          description: "Discover the best grooming professionals in your city.",
          url: window.location.href
        }}
      />

      {/* Header & Search */}
      <div className="relative bg-background border-b border-border pt-4 pb-4 px-4 md:px-8">
        <div className="max-w-6xl mx-auto space-y-4">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search Input */}
            <div className="relative flex-1 group">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder={viewType === 'professionals' ? "Search for professionals, locations..." : "Search for shops, locations..."}
                className="pl-12 pr-10 h-14 bg-card border-border text-foreground placeholder:text-muted-foreground focus:ring-primary focus:border-primary rounded-full text-sm font-light tracking-wide transition-all shadow-sm"
              />
              {searchTerm && (
                <button onClick={() => setSearchTerm('')} className="absolute right-4 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-muted transition-colors">
                  <X className="w-4 h-4 text-muted-foreground" />
                </button>
              )}
            </div>
          </div>

          {/* View Toggle & Filters */}
          <div className="flex flex-col md:flex-row justify-between gap-4 items-center">
            {/* View Type Toggle */}
            <div className="bg-card p-1 rounded-full border border-border flex w-full md:w-auto">
              <button
                onClick={() => setViewType('professionals')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2 ${viewType === 'professionals'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
              >
                <User className="w-4 h-4" /> Professionals
              </button>
              <button
                onClick={() => setViewType('shops')}
                className={`flex-1 md:flex-none px-6 py-2.5 rounded-full text-sm font-medium transition-all flex items-center justify-center gap-2 ${viewType === 'shops'
                  ? 'bg-primary text-white shadow-md'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                  }`}
              >
                <Store className="w-4 h-4" /> Barbershops
              </button>
            </div>

            {/* Tags (Only for professionals for now, or could adapt) */}
            {viewType === 'professionals' && (
              <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide w-full md:w-auto">
                {tags.map(tag => (
                  <button
                    key={tag}
                    onClick={() => setActiveFilter(tag)}
                    className={`px-4 py-2 rounded-full font-medium text-xs transition-all whitespace-nowrap border ${activeFilter === tag
                      ? 'bg-primary text-primary-foreground border-primary shadow-sm'
                      : 'bg-card border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                      }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="w-full max-w-6xl lg:max-w-7xl mx-auto px-4 md:px-8 py-8">
        {/* Inspiration Section */}
        {viewType === 'professionals' && !searchTerm && inspirationPosts.length > 0 && (
          <div className="mb-8">
            <h2 className="text-2xl font-bold mb-4">Style Inspiration</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {inspirationPosts.slice(0, 4).map((post) => (
                <div key={post.id} className="group cursor-pointer">
                  <div className="relative aspect-square rounded-xl overflow-hidden mb-2">
                    <OptimizedImage
                      src={post.image_url}
                      fill
                      alt={post.title}
                      imgClassName="object-cover group-hover:scale-110 transition-transform duration-300"
                    />
                  </div>
                  <p className="text-sm font-medium line-clamp-1">{post.title}</p>
                  <p className="text-xs text-muted-foreground">{post.category}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-foreground mb-1">
              {searchTerm
                ? `Results for "${searchTerm}"`
                : (viewType === 'professionals' ? 'Top Professionals' : 'Top Barbershops')}
            </h1>
            <p className="text-muted-foreground text-sm">
              {viewType === 'professionals'
                ? `${filteredBarbers.length} professionals available`
                : `${filteredShops.length} shops available`}
            </p>
          </div>
          <RefreshIndicator isRefreshing={barbersFetching} />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <AnimatePresence>
            {viewType === 'professionals' ? (
              // Professionals List
              <>
                {barbersError && (
                  <div className="col-span-full py-16 text-center">
                    <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6 text-destructive border border-destructive/30">
                      <Search className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">Couldn&apos;t load professionals</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-4">
                      {barbersErr?.message || 'The server may be offline or the request failed.'} Make sure the backend is running (in the server folder: npm run dev).
                    </p>
                    <Button onClick={() => refetchBarbers()} variant="default" className="rounded-full">
                      Try again
                    </Button>
                  </div>
                )}

                {!barbersError && barbersFetching && barbers.length === 0 && (
                  <div className="col-span-full py-16 text-center">
                    <p className="text-muted-foreground">Loading professionals...</p>
                  </div>
                )}

                {!barbersError && !barbersFetching && filteredBarbers.map((barber) => {
                  const barberPromo = Array.isArray(promotions) ? promotions.find(p => p.barber_id === barber.id) : null;
                  return (
                    <div key={barber.id} onMouseEnter={() => prefetchBarber(barber.id)}>
                      <BarberCard barber={barber} variant="vertical" badge={barberPromo ? { text: barberPromo.discount_text, color: 'bg-red-500' } : null} />
                    </div>
                  );
                })}

                {!barbersError && !barbersFetching && filteredBarbers.length === 0 && barbers.length > 0 && (
                  <div className="col-span-full py-32 text-center">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground border border-border">
                      <Search className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">No professionals found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">Try changing your search or filter (e.g. &quot;All&quot; or a different service).</p>
                  </div>
                )}

                {!barbersError && !barbersFetching && barbers.length === 0 && (
                  <div className="col-span-full py-32 text-center">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground border border-border">
                      <Search className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">No professionals in the database</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-4">Run <code className="bg-muted px-1 rounded">npm run seed</code> in the server folder to add sample barbers and shops. If you just seeded, click Refresh.</p>
                    <Button onClick={() => refetchBarbers()} variant="default" className="rounded-full" disabled={barbersFetching}>Refresh</Button>
                  </div>
                )}
              </>
            ) : (
              // Shops List
              <>
                {shopsError && (
                  <div className="col-span-full py-16 text-center">
                    <div className="w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6 text-destructive border border-destructive/30">
                      <Store className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">Couldn&apos;t load shops</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-4">Make sure the backend is running (server folder: npm run dev).</p>
                    <Button onClick={() => refetchShops()} variant="default" className="rounded-full">Try again</Button>
                  </div>
                )}

                {!shopsError && filteredShops.map((shop) => (
                  <div key={shop.id}>
                    <ShopCard shop={shop} />
                  </div>
                ))}

                {!shopsError && filteredShops.length === 0 && shops.length > 0 && (
                  <div className="col-span-full py-32 text-center">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground border border-border">
                      <Store className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">No shops found</h3>
                    <p className="text-muted-foreground max-w-md mx-auto">Try changing your search.</p>
                  </div>
                )}

                {!shopsError && shops.length === 0 && (
                  <div className="col-span-full py-32 text-center">
                    <div className="w-20 h-20 bg-muted rounded-full flex items-center justify-center mx-auto mb-6 text-muted-foreground border border-border">
                      <Store className="w-10 h-10" />
                    </div>
                    <h3 className="text-2xl font-bold text-foreground mb-3">No shops in the database</h3>
                    <p className="text-muted-foreground max-w-md mx-auto mb-4">Run <code className="bg-muted px-1 rounded">npm run seed</code> in the server folder. If you just seeded, click Refresh.</p>
                    <Button onClick={() => refetchShops()} variant="default" className="rounded-full">Refresh</Button>
                  </div>
                )}
              </>
            )}
          </AnimatePresence>
        </div>
      </div>
      <AIAdvisor />
      <ClientBottomNav />
    </div>
  );
}

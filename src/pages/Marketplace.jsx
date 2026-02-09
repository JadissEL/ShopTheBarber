import { useState, useMemo, useRef } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import {
  Search,
  Bell,
  MessageCircle,
  Scissors,
  SlidersHorizontal,
  ShoppingCart,
  Star,
  Check,
  LayoutGrid,
  Smile,
  Droplets,
  Leaf,
  Briefcase,
  Paintbrush,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { createPageUrl } from '@/utils';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';
import NotificationsPanel from '@/components/dashboard/NotificationsPanel';
import { useCart } from '@/components/context/CartContext';

// Fallback when API has no products or is unavailable (with brand/rating for Elite Grooming layout)
const FALLBACK_PRODUCTS = [
  {
    id: '1',
    name: 'Night Skin Recharge',
    brand: 'Baxter of California',
    price: 48,
    image_url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&fit=crop',
    category: 'Beard',
    rating: 4.8,
    reviewCount: 320,
    bestSeller: false,
  },
  {
    id: '2',
    name: 'Claymation Styling Kit',
    brand: 'Hanz de Fuko',
    price: 24,
    image_url: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&fit=crop',
    category: 'Hair',
    rating: 4.7,
    reviewCount: 890,
    bestSeller: false,
  },
  {
    id: '3',
    name: 'Wahl Professional 5-Star Cordless',
    brand: 'Wahl',
    price: 145,
    image_url: 'https://images.unsplash.com/photo-1596981899093-11f15e5f60f0?w=400&fit=crop',
    category: 'Tools',
    rating: 4.9,
    reviewCount: 1200,
    bestSeller: true,
  },
  {
    id: '4',
    name: 'Byredo Black Saffron EDP',
    brand: 'Byredo',
    price: 190,
    image_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&fit=crop',
    category: 'Fragrance',
    rating: 4.8,
    reviewCount: 840,
    bestSeller: false,
  },
  {
    id: '5',
    name: 'Elite Face Serum',
    brand: 'Curated',
    price: 68,
    image_url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&fit=crop',
    category: 'Skincare',
    rating: 4.6,
    reviewCount: 156,
    bestSeller: false,
  },
  {
    id: '6',
    name: 'Wooden Comb Set',
    brand: 'Partner',
    price: 55,
    image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&fit=crop',
    category: 'Tools',
    rating: 4.5,
    reviewCount: 92,
    bestSeller: false,
  },
];

const CATEGORIES = [
  { id: 'all', label: 'All', icon: LayoutGrid },
  { id: 'hair', label: 'Hair Care', icon: Smile },
  { id: 'skincare', label: 'Skin Care', icon: Droplets },
  { id: 'beard', label: 'Beard', icon: Leaf },
  { id: 'tools', label: 'Pro Kits', icon: Briefcase },
  { id: 'accessories', label: 'Accessories', icon: Paintbrush },
];

const LUXURY_BRANDS = [
  { id: 'brand-aurelius', name: 'Aurelius Grooming', profileId: 'brand-aurelius' },
  { id: 'aesop', name: 'AESOP' },
  { id: 'malin', name: 'MALIN+GOETZ' },
  { id: 'kiehls', name: "KIEHL'S" },
  { id: 'lelabo', name: 'LE LABO', italic: true },
];

const PROMO_BANNER_IMAGE = 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=800&fit=crop';

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [sortBy, setSortBy] = useState(null); // 'price_asc' | 'price_desc' | 'rating' | null
  const allProductsRef = useRef(null);
  const { itemCount } = useCart();

  const scrollToAllProducts = () => {
    allProductsRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  const clearFilters = () => {
    setSearchTerm('');
    setActiveCategory('all');
    setSortBy(null);
  };

  const { data: apiProducts = [] } = useQuery({
    queryKey: ['marketplace-products'],
    queryFn: () => sovereign.entities.Product.list(),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const products = useMemo(() => {
    if (Array.isArray(apiProducts) && apiProducts.length > 0) {
      return apiProducts.map((p) => ({
        id: p.id,
        name: p.name,
        brand: p.vendor_name || 'Curated',
        price: p.price,
        category: (p.category || '').toLowerCase(),
        image_url: p.image_url || '',
        rating: 4.7,
        reviewCount: 100,
        bestSeller: false,
      }));
    }
    return FALLBACK_PRODUCTS.map((p) => ({ ...p, category: (p.category || '').toLowerCase() }));
  }, [apiProducts]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchTerm ||
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.category || '').includes(searchTerm.toLowerCase());
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchTerm, activeCategory]);

  const sortedProducts = useMemo(() => {
    if (!sortBy) return filtered;
    const copy = [...filtered];
    if (sortBy === 'price_asc') copy.sort((a, b) => Number(a.price) - Number(b.price));
    else if (sortBy === 'price_desc') copy.sort((a, b) => Number(b.price) - Number(a.price));
    else if (sortBy === 'rating') copy.sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
    return copy;
  }, [filtered, sortBy]);

  const editorsPicks = products.slice(0, 4);
  const topRated = products.slice(0, 4).map((p, i) => ({ ...p, rating: 4.9 - i * 0.1, reviewCount: [1200, 840, 600, 420][i] || 100 }));

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <MetaTags
        title="Marketplace – Elite Grooming"
        description="Premium grooming products. Editor's Picks, luxury brands, and top-rated styling gear."
      />

      {/* App bar: Elite Grooming + bell + message */}
      <header className="sticky top-0 z-40 bg-card border-b border-border">
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center shrink-0">
              <Scissors className="w-5 h-5 text-white" strokeWidth={2.5} />
            </div>
            <span className="font-bold text-foreground text-lg">Elite Grooming</span>
          </div>
          <div className="flex items-center gap-1">
            <button type="button" className="p-2 rounded-full text-muted-foreground hover:bg-muted" aria-label="Notifications" onClick={() => setNotificationsOpen(true)}>
              <Bell className="w-5 h-5" />
            </button>
            <Link to={createPageUrl('ShoppingBag')} className="relative p-2 rounded-full text-muted-foreground hover:bg-muted" aria-label="Shopping Bag">
              <ShoppingCart className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute top-1 right-1 min-w-[18px] h-[18px] rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center px-1">
                  {itemCount > 99 ? '99+' : itemCount}
                </span>
              )}
            </Link>
            <Link to={createPageUrl('Chat')} className="relative p-2 rounded-full text-muted-foreground hover:bg-muted" aria-label="Messages">
              <MessageCircle className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-primary text-[10px] font-bold text-white flex items-center justify-center">2</span>
            </Link>
          </div>
        </div>

        {/* Search bar */}
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Search premium brands or gear"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-11 pr-11 h-11 rounded-xl bg-muted border-0 text-foreground placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-primary/20"
            />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button type="button" className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground p-1 rounded" aria-label="Sort or filter">
                  <SlidersHorizontal className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Sort by</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => { setSortBy('price_asc'); scrollToAllProducts(); }}>
                  {sortBy === 'price_asc' ? <Check className="w-4 h-4 mr-2" /> : <span className="w-4 mr-2" />}
                  Price (low to high)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('price_desc'); scrollToAllProducts(); }}>
                  {sortBy === 'price_desc' ? <Check className="w-4 h-4 mr-2" /> : <span className="w-4 mr-2" />}
                  Price (high to low)
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => { setSortBy('rating'); scrollToAllProducts(); }}>
                  {sortBy === 'rating' ? <Check className="w-4 h-4 mr-2" /> : <span className="w-4 mr-2" />}
                  Rating
                </DropdownMenuItem>
                {sortBy && (
                  <DropdownMenuItem onClick={() => setSortBy(null)}>
                    Clear sort
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 lg:px-8">
        {/* Category filters – horizontal scroll */}
        <div className="flex gap-3 overflow-x-auto pb-4 -mx-4 px-4 scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={`flex flex-col items-center justify-center gap-1.5 min-w-[72px] py-3 px-2 rounded-xl border transition-all shrink-0 ${
                  activeCategory === cat.id ? 'bg-primary text-primary-foreground border-primary' : 'bg-card text-foreground border-border hover:border-primary/30'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-xs font-medium text-center leading-tight">{cat.label}</span>
              </button>
            );
          })}
        </div>

        {/* Promo banner */}
        <section className="rounded-2xl overflow-hidden mb-8">
          <div className="relative aspect-[4/3] min-h-[180px] bg-primary/90">
            <OptimizedImage
              src={PROMO_BANNER_IMAGE}
              alt=""
              className="absolute inset-0 w-full h-full object-cover opacity-80"
              width={800}
            />
            <div className="absolute inset-0 bg-black/50" />
            <div className="absolute inset-0 flex flex-col justify-center items-center text-center p-6">
              <span className="text-primary/90 text-xs font-bold uppercase tracking-widest mb-2">New Arrival</span>
              <h2 className="text-xl md:text-2xl font-bold text-white leading-tight mb-4">The Gentleman&apos;s Summer Vault</h2>
              <Button className="rounded-xl bg-primary text-primary-foreground hover:opacity-95 font-semibold px-6" size="sm" onClick={scrollToAllProducts}>
                Shop Collection
              </Button>
            </div>
          </div>
        </section>

        {/* Editor's Picks */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground text-lg">Editor&apos;s Picks</h3>
            <button type="button" className="text-primary font-medium text-sm" onClick={scrollToAllProducts}>See All</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {editorsPicks.map((product) => (
              <Link
                key={product.id}
                to={`${createPageUrl('ProductDetail')}?id=${encodeURIComponent(product.id)}`}
                className="flex flex-col shrink-0 w-[160px] text-left group"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted mb-2">
                  <OptimizedImage src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" width={320} />
                  <span className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-primary text-white flex items-center justify-center shadow-md" aria-hidden>
                    <ShoppingCart className="w-4 h-4" />
                  </span>
                </div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-medium">{product.brand}</p>
                <p className="font-semibold text-foreground text-sm line-clamp-2">{product.name}</p>
                <p className="font-bold text-foreground mt-0.5">${Number(product.price).toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* Luxury Brands */}
        <section className="mb-8">
          <h3 className="font-bold text-foreground text-lg mb-4">Luxury Brands</h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {LUXURY_BRANDS.map((brand) =>
              brand.profileId ? (
                <Link
                  key={brand.id}
                  to={`${createPageUrl('BrandProfile')}?id=${encodeURIComponent(brand.profileId)}`}
                  className="rounded-xl border border-border bg-card py-6 px-4 flex items-center justify-center hover:border-primary/30 transition-colors text-left"
                >
                  <span className={`font-bold text-foreground ${brand.italic ? 'italic' : ''}`}>{brand.name}</span>
                </Link>
              ) : (
                <button
                  key={brand.id}
                  type="button"
                  onClick={() => {
                    setSearchTerm(brand.name);
                    setActiveCategory('all');
                    scrollToAllProducts();
                  }}
                  className="rounded-xl border border-border bg-card py-6 px-4 flex items-center justify-center hover:border-primary/30 transition-colors text-left"
                >
                  <span className={`font-bold text-foreground ${brand.italic ? 'italic' : ''}`}>{brand.name}</span>
                </button>
              )
            )}
          </div>
        </section>

        {/* Top Rated Styling Gear */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-foreground text-lg">Top Rated Styling Gear</h3>
            <button type="button" className="text-primary font-medium text-sm" onClick={scrollToAllProducts}>View All</button>
          </div>
          <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
            {topRated.map((product) => (
              <Link
                key={product.id}
                to={`${createPageUrl('ProductDetail')}?id=${encodeURIComponent(product.id)}`}
                className="flex flex-col shrink-0 w-[160px] text-left group"
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-muted mb-2">
                  <OptimizedImage src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" width={320} />
                  {product.bestSeller && (
                    <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase px-2 py-0.5 rounded">Best Seller</span>
                  )}
                  <span className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-card border border-border text-foreground flex items-center justify-center" aria-hidden>
                    <ShoppingCart className="w-4 h-4" />
                  </span>
                </div>
                <div className="flex items-center gap-1 text-amber-500 mb-1">
                  <Star className="w-3.5 h-3.5 fill-current" />
                  <span className="text-xs font-medium text-foreground">{product.rating} ({product.reviewCount >= 1000 ? `${(product.reviewCount / 1000).toFixed(1)}k` : product.reviewCount})</span>
                </div>
                <p className="font-semibold text-foreground text-sm line-clamp-2">{product.name}</p>
                <p className="font-bold text-foreground mt-0.5">${Number(product.price).toFixed(2)}</p>
              </Link>
            ))}
          </div>
        </section>

        {/* All products – handpicked list or empty state */}
        <section ref={allProductsRef} className="mb-8">
          <div className="flex flex-wrap items-center justify-between gap-2 mb-4">
            <h3 className="font-bold text-foreground text-lg">Handpicked For You</h3>
            {(searchTerm || activeCategory !== 'all' || sortBy) && sortedProducts.length > 0 && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="text-xs text-muted-foreground">{sortedProducts.length} product{sortedProducts.length !== 1 ? 's' : ''}</span>
                {searchTerm && (
                  <span className="text-xs text-muted-foreground">
                    Search: <strong className="text-foreground">&quot;{searchTerm}&quot;</strong>
                  </span>
                )}
                {activeCategory !== 'all' && (
                  <span className="text-xs text-muted-foreground">
                    Category: <strong className="text-foreground">{CATEGORIES.find((c) => c.id === activeCategory)?.label ?? activeCategory}</strong>
                  </span>
                )}
                {sortBy && (
                  <span className="text-xs text-muted-foreground">
                    Sort: <strong className="text-foreground">
                      {sortBy === 'price_asc' ? 'Price (low–high)' : sortBy === 'price_desc' ? 'Price (high–low)' : 'Rating'}
                    </strong>
                  </span>
                )}
                <button type="button" className="text-xs text-primary font-medium hover:underline" onClick={clearFilters}>
                  Clear all
                </button>
              </div>
            )}
          </div>
          {sortedProducts.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
              {sortedProducts.map((product) => (
                <Link
                  key={product.id}
                  to={`${createPageUrl('ProductDetail')}?id=${encodeURIComponent(product.id)}`}
                  className="w-full flex gap-4 rounded-xl border border-border bg-card p-3 text-left hover:border-primary/30 transition-colors group"
                >
                  <div className="relative w-24 h-24 rounded-lg overflow-hidden bg-muted shrink-0">
                    <OptimizedImage src={product.image_url} alt={product.name} className="w-full h-full object-cover" width={96} />
                    <span className="absolute bottom-1 right-1 w-8 h-8 rounded-full bg-card border border-border flex items-center justify-center text-foreground text-lg leading-none font-light">+</span>
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <p className="text-xs uppercase tracking-wider text-primary font-medium">{product.brand}</p>
                    <p className="font-semibold text-foreground line-clamp-2">{product.name}</p>
                    <p className="font-bold text-foreground mt-1">${Number(product.price).toFixed(2)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-xl border border-border bg-muted/50 py-12 px-6 text-center">
              <p className="text-muted-foreground font-medium">No products available.</p>
              <p className="text-muted-foreground text-sm mt-1">Check back later for new arrivals.</p>
            </div>
          ) : (
            <div className="rounded-xl border border-border bg-muted/50 py-12 px-6 text-center">
              <p className="text-muted-foreground font-medium">No products match your search or filters.</p>
              <p className="text-muted-foreground text-sm mt-1">Try a different search or category.</p>
              <Button variant="outline" className="mt-4 rounded-xl" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          )}
        </section>
      </main>

      <NotificationsPanel isOpen={notificationsOpen} onClose={() => setNotificationsOpen(false)} />
      <ClientBottomNav />
    </div>
  );
}

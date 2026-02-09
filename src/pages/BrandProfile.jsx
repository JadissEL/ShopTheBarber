import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import {
  ArrowLeft,
  Share2,
  Heart,
  Mail,
  Trophy,
  Star,
  Leaf,
  Palette,
  Plus,
  Calendar,
  Filter,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { MetaTags } from '@/components/seo/MetaTags';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';
import { toast } from 'sonner';

const ACCOLADE_ICONS = {
  trophy: Trophy,
  star: Star,
  leaf: Leaf,
  art: Palette,
};

const FOLLOW_KEY = 'brand_follow_ids';

function getFollowedBrands() {
  try {
    const raw = localStorage.getItem(FOLLOW_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function toggleFollowBrand(brandId) {
  const set = new Set(getFollowedBrands());
  if (set.has(brandId)) set.delete(brandId);
  else set.add(brandId);
  localStorage.setItem(FOLLOW_KEY, JSON.stringify([...set]));
}

export default function BrandProfile() {
  const urlParams = new URLSearchParams(window.location.search);
  const brandId = urlParams.get('id');

  const [catalogCategory, _setCatalogCategory] = useState('all');
  const [catalogSort, _setCatalogSort] = useState('');
  const [followedBrands, setFollowedBrands] = useState(() => getFollowedBrands());

  const isFollowed = brandId ? followedBrands.includes(brandId) : false;

  const handleShare = () => {
    const url = window.location.href;
    if (navigator.share) {
      navigator.share({ title: document.title, url }).catch(() => copyAndToast(url));
    } else {
      copyAndToast(url);
    }
  };

  function copyAndToast(url) {
    navigator.clipboard.writeText(url).then(
      () => toast.success('Link copied to clipboard'),
      () => toast.error('Could not copy link')
    );
  }

  const handleToggleFollow = () => {
    if (!brandId) return;
    toggleFollowBrand(brandId);
    setFollowedBrands(getFollowedBrands());
    toast.success(isFollowed ? 'Unfollowed brand' : 'Following brand');
  };

  const { data: brand, isFetching: isBrandLoading } = useQuery({
    queryKey: ['brand', brandId],
    queryFn: () => (brandId ? sovereign.entities.Brand.get(brandId) : Promise.resolve(null)),
    enabled: !!brandId,
  });

  const { data: accolades = [] } = useQuery({
    queryKey: ['brand-accolades', brandId],
    queryFn: () => (brandId ? sovereign.entities.BrandAccolade.filter({ brand_id: brandId }) : []),
    enabled: !!brandId,
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['brand-collections', brandId],
    queryFn: () => (brandId ? sovereign.entities.BrandCollection.filter({ brand_id: brandId }) : []),
    enabled: !!brandId,
  });

  const { data: products = [] } = useQuery({
    queryKey: ['brand-products', brandId],
    queryFn: async () => {
      if (!brandId) return [];
      const all = await sovereign.entities.Product.list();
      return all.filter((p) => p.brand_id === brandId);
    },
    enabled: !!brandId,
  });

  const sortedAccolades = [...accolades].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));
  const sortedCollections = [...collections].sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0));

  const _catalogProducts = useMemo(() => {
    let list = [...products];
    if (catalogCategory !== 'all') {
      list = list.filter((p) => (p.category || '').toLowerCase() === catalogCategory.toLowerCase());
    }
    if (catalogSort === 'price_asc') list.sort((a, b) => (a.price ?? 0) - (b.price ?? 0));
    else if (catalogSort === 'price_desc') list.sort((a, b) => (b.price ?? 0) - (a.price ?? 0));
    return list;
  }, [products, catalogCategory, catalogSort]);

  const _catalogCategories = useMemo(() => {
    const set = new Set(products.map((p) => (p.category || 'Product').toLowerCase()));
    return ['all', ...[...set].sort()];
  }, [products]);

  if (!brandId) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-8">
        <p className="text-muted-foreground">Select a brand to view its profile.</p>
        <Link to={createPageUrl('Marketplace')} className="ml-2 text-primary font-medium hover:underline">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  if (!brand && !isBrandLoading) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8">
        <p className="text-muted-foreground">Brand not found.</p>
        <Link to={createPageUrl('Marketplace')} className="mt-2 text-primary font-medium hover:underline">
          Back to Marketplace
        </Link>
      </div>
    );
  }

  const displayBrand = brand || {};
  const priceRange = displayBrand.price_range || '$$$';

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <MetaTags
        title={displayBrand.name}
        description={displayBrand.description || `Elite brand profile for ${displayBrand.name}.`}
        image={displayBrand.hero_image_url || displayBrand.logo_url}
      />

      {/* Top nav: back, share, heart */}
      <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 bg-background/95 backdrop-blur border-b border-slate-200 lg:border-0 lg:bg-transparent lg:absolute lg:left-0 lg:right-0 lg:py-6 lg:px-6">
        <Link
          to={createPageUrl('Marketplace')}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-white/90 border border-slate-200 text-slate-700 hover:bg-slate-50 lg:bg-white/80 lg:backdrop-blur"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div className="flex items-center gap-2">
          <Button variant="secondary" size="icon" className="rounded-full w-10 h-10 lg:bg-white/80 lg:backdrop-blur lg:border lg:border-slate-200" onClick={handleShare} aria-label="Share">
            <Share2 className="w-5 h-5" />
          </Button>
          <Button
            variant="secondary"
            size="icon"
            className={`rounded-full w-10 h-10 lg:bg-white/80 lg:backdrop-blur lg:border lg:border-slate-200 ${isFollowed ? 'bg-red-50 text-red-600 border-red-200' : ''}`}
            onClick={handleToggleFollow}
            aria-label={isFollowed ? 'Unfollow brand' : 'Follow brand'}
          >
            <Heart className={`w-5 h-5 ${isFollowed ? 'fill-current' : ''}`} />
          </Button>
        </div>
      </div>

      {/* Hero */}
      <div className="relative w-full aspect-[4/3] max-h-[50vh] lg:max-h-[60vh] overflow-hidden">
        <OptimizedImage
          src={displayBrand.hero_image_url || displayBrand.logo_url || 'https://images.unsplash.com/photo-1621605815971-fbc98d665033?w=1200&fit=crop'}
          alt=""
          className="w-full h-full object-cover"
          fill
          priority
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
      </div>

      <div className="container mx-auto px-4 md:px-6 -mt-4 relative z-10">
        {/* Brand block: logo, name, badge, locations, Follow, contact, description */}
        <div className="bg-card rounded-2xl shadow-sm border border-slate-200 p-6 mb-8">
          <div className="flex flex-col sm:flex-row sm:items-start gap-4">
            <div className="shrink-0">
              <div className="w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                <OptimizedImage
                  src={displayBrand.logo_url}
                  alt=""
                  className="w-full h-full object-cover"
                  width={64}
                  height={64}
                />
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-1">
                <h1 className="text-2xl font-bold text-foreground">{displayBrand.name}</h1>
                {displayBrand.verified_elite && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-sky-100 text-sky-800 px-2.5 py-0.5 text-xs font-semibold uppercase tracking-wide">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    Verified Elite
                  </span>
                )}
              </div>
              {displayBrand.locations && (
                <p className="text-sm text-slate-600 mb-3">{displayBrand.locations}</p>
              )}
              <div className="flex flex-wrap items-center gap-2">
                <Button size="sm" className="rounded-full" onClick={handleToggleFollow}>
                  {isFollowed ? 'Following' : 'Follow Brand'}
                </Button>
                <Button variant="outline" size="icon" className="rounded-full shrink-0" aria-label="Contact brand">
                  <Mail className="w-4 h-4" />
                </Button>
                <Button size="sm" className="rounded-full gap-2 lg:inline-flex hidden" asChild>
                  <Link to={createPageUrl('Explore')}>
                    <Calendar className="w-4 h-4" />
                    Book Experience
                  </Link>
                </Button>
              </div>
            </div>
          </div>
          {displayBrand.description && (
            <p className="mt-4 text-slate-600 text-sm leading-relaxed">{displayBrand.description}</p>
          )}
        </div>

        {/* Industry accolades */}
        {sortedAccolades.length > 0 && (
          <section className="mb-8">
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {sortedAccolades.map((acc) => {
                const IconComponent = ACCOLADE_ICONS[acc.icon_key] || Star;
                const colors = {
                  trophy: 'bg-amber-100 text-amber-800',
                  star: 'bg-sky-100 text-sky-800',
                  leaf: 'bg-emerald-100 text-emerald-800',
                  art: 'bg-violet-100 text-violet-800',
                };
                const colorClass = colors[acc.icon_key] || 'bg-muted text-foreground';
                return (
                  <div
                    key={acc.id}
                    className="shrink-0 flex flex-col items-center text-center w-24"
                  >
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${colorClass}`}>
                      <IconComponent className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-600 leading-tight">
                      {acc.label}
                    </span>
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Signature Collections */}
        {sortedCollections.length > 0 && (
          <section className="mb-8">
            <h2 className="text-lg font-bold text-foreground mb-4">Signature Collections</h2>
            <div className="flex gap-4 overflow-x-auto pb-2 -mx-4 px-4 scrollbar-hide">
              {sortedCollections.map((coll) => (
                <Link
                  key={coll.id}
                  to={`${createPageUrl('Marketplace')}?brand=${brandId}&collection=${coll.id}`}
                  className="shrink-0 w-[200px] group"
                >
                  <div className="relative aspect-[3/4] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <OptimizedImage
                      src={coll.image_url}
                      alt={coll.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      width={200}
                      height={267}
                    />
                    {coll.tag && (
                      <span className="absolute top-2 left-2 bg-primary text-primary-foreground text-[10px] font-bold uppercase px-2 py-0.5 rounded">
                        {coll.tag}
                      </span>
                    )}
                  </div>
                  <p className="font-semibold text-foreground mt-2 truncate">{coll.name}</p>
                  {coll.subtitle && (
                    <p className="text-xs text-slate-500 truncate">{coll.subtitle}</p>
                  )}
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Full Catalog */}
        <section className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-bold text-foreground">Full Catalog</h2>
            <Button variant="outline" size="sm" className="rounded-full gap-1">
              <Filter className="w-4 h-4" />
              Filter
            </Button>
          </div>
          {products.length > 0 ? (
            <div className="grid grid-cols-2 gap-4">
              {products.map((product) => (
                <Link
                  key={product.id}
                  to={`${createPageUrl('ProductDetail')}?id=${encodeURIComponent(product.id)}`}
                  className="group text-left"
                >
                  <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200 mb-2">
                    <OptimizedImage
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      width={400}
                      height={400}
                    />
                    <span
                      className="absolute bottom-2 right-2 w-9 h-9 rounded-full bg-white border border-slate-200 flex items-center justify-center text-slate-700 shadow-sm"
                      aria-hidden
                    >
                      <Plus className="w-4 h-4" />
                    </span>
                  </div>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 font-medium">
                    {product.category || 'Product'}
                  </p>
                  <p className="font-semibold text-foreground text-sm line-clamp-2">{product.name}</p>
                  <p className="font-bold text-foreground">${Number(product.price).toFixed(2)}</p>
                </Link>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-slate-200 bg-slate-50 py-12 px-6 text-center">
              <p className="text-slate-600 font-medium">No products in catalog yet.</p>
            </div>
          )}
        </section>
      </div>

      {/* Bottom bar – mobile only */}
      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-between px-4 py-3 bg-card border-t border-slate-200 lg:hidden z-20">
        <span className="text-sm font-semibold text-slate-700">PRICE RANGE {priceRange}</span>
        <Button className="rounded-full gap-2" asChild>
          <Link to={createPageUrl('Explore')}>
            <Calendar className="w-4 h-4" />
            Book Experience
          </Link>
        </Button>
      </div>

      <ClientBottomNav />
    </div>
  );
}

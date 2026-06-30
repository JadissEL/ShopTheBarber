import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { ShoppingCart, Grid3x3, TrendingUp, Sparkles, Search } from 'lucide-react';
import SearchField from '@/components/ui/search-field';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { createPageUrl } from '@/utils';
import { useCart } from '@/components/context/CartContext';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

const CATEGORIES = [
  { id: 'all', label: 'All Products', icon: Grid3x3 },
  { id: 'hair', label: 'Hair Care', icon: Sparkles },
  { id: 'skincare', label: 'Skin Care', icon: Sparkles },
  { id: 'beard', label: 'Beard Care', icon: Sparkles },
  { id: 'tools', label: 'Tools & Kits', icon: TrendingUp },
];

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { itemCount } = useCart();

  const { data: apiProducts = [], isLoading } = useQuery({
    queryKey: ['marketplace-products'],
    queryFn: () => sovereign.products.listPublic(),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const products = useMemo(() => {
    const source = Array.isArray(apiProducts) ? apiProducts : [];
    return source.map((p) => ({
      id: p.id,
      name: p.name,
      brand: p.vendor_name || 'Premium',
      price: p.price,
      category: (p.category || '').toLowerCase(),
      image_url: p.image_url || '',
    }));
  }, [apiProducts]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const matchSearch =
        !searchTerm ||
        (p.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.brand || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchCat = activeCategory === 'all' || p.category === activeCategory;
      return matchSearch && matchCat;
    });
  }, [products, searchTerm, activeCategory]);

  return (
    <div className="stb-page pb-24 lg:pb-8">
      <MetaTags
        title="Marketplace - Premium Grooming Products"
        description="Shop premium grooming products from luxury brands."
      />

      <PageHeader
        label="Shop"
        title="Marketplace"
        subtitle="Premium grooming essentials from barbers and brands you trust."
      >
        <Link to={createPageUrl('ShoppingBag')} className="relative">
          <Button variant="outline" className="border-white/25 bg-white/10 text-white hover:bg-white/15 hover:text-white h-11">
            <ShoppingCart className="w-5 h-5 mr-2" />
            Bag
            {itemCount > 0 && (
              <span className="ml-2 min-w-[20px] h-5 rounded-md bg-primary text-xs font-semibold text-primary-foreground flex items-center justify-center px-2">
                {itemCount}
              </span>
            )}
          </Button>
        </Link>
      </PageHeader>

      <PageContent>
        <SearchField
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          onClear={() => setSearchTerm('')}
          placeholder="Search products, brands..."
          size="lg"
          className="max-w-2xl mb-8"
          aria-label="Search marketplace products"
        />

        <div className="flex gap-2 overflow-x-auto scrollbar-hide mb-8 pb-2">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  'flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 whitespace-nowrap',
                  activeCategory === cat.id
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'bg-muted text-foreground hover:bg-muted/80',
                )}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
              </button>
            );
          })}
        </div>

        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className={cn(stb.uiHeading, 'text-2xl')}>
              {activeCategory === 'all' ? 'All products' : CATEGORIES.find((c) => c.id === activeCategory)?.label}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
            </p>
          </div>
        </div>

        {isLoading ? (
          <div className={cn(stb.surface, 'py-16 px-6 text-center')}>
            <p className="text-muted-foreground">Loading products…</p>
          </div>
        ) : filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filtered.map((product) => (
              <Link
                key={product.id}
                to={`${createPageUrl('ProductDetail')}?id=${encodeURIComponent(product.id)}`}
                className={cn('group block no-underline text-inherit h-full', stb.cardInteractive)}
              >
                <div className="relative aspect-square bg-muted overflow-hidden">
                  <OptimizedImage
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                    width={400}
                  />
                </div>
                <div className="p-4 flex flex-col flex-1 gap-1">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">{product.brand}</p>
                  <h3 className={cn(stb.title, 'text-base line-clamp-2 group-hover:text-primary transition-colors')}>
                    {product.name}
                  </h3>
                  <p className="text-primary font-semibold text-lg tabular-nums">${Number(product.price).toFixed(0)}</p>
                  <div className={cn(stb.cardCta, '-mx-4 -mb-4 mt-3 rounded-none rounded-b-lg')}>View product</div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className={cn(stb.surface, 'border-dashed py-16 px-6 text-center')}>
            <div className="max-w-md mx-auto">
              <div className={cn(stb.iconBox, 'w-16 h-16 mx-auto mb-4')}>
                <Search className="w-8 h-8" />
              </div>
              <h3 className={cn(stb.uiHeading, 'text-xl mb-2')}>No products found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm
                  ? `No products match "${searchTerm}". Try a different search term.`
                  : apiProducts.length === 0
                    ? 'No products are listed yet. Check back soon.'
                    : 'No products available in this category.'}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('all');
                }}
              >
                Show all products
              </Button>
            </div>
          </div>
        )}
      </PageContent>
    </div>
  );
}

import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import {
  Search,
  ShoppingCart,
  Star,
  Grid3x3,
  TrendingUp,
  Sparkles,
} from 'lucide-react';
import { Input } from '@/components/ui/input';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { createPageUrl } from '@/utils';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';
import { useCart } from '@/components/context/CartContext';

const CATEGORIES = [
  { id: 'all', label: 'All Products', icon: Grid3x3 },
  { id: 'hair', label: 'Hair Care', icon: Sparkles },
  { id: 'skincare', label: 'Skin Care', icon: Sparkles },
  { id: 'beard', label: 'Beard Care', icon: Sparkles },
  { id: 'tools', label: 'Tools & Kits', icon: TrendingUp },
];

const FALLBACK_PRODUCTS = [
  { id: '1', name: 'Night Skin Recharge', vendor_name: 'Baxter of California', price: 48, image_url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=400&fit=crop', category: 'skincare' },
  { id: '2', name: 'Claymation Styling Kit', vendor_name: 'Hanz de Fuko', price: 24, image_url: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=400&fit=crop', category: 'hair' },
  { id: '3', name: 'Professional 5-Star Cordless', vendor_name: 'Wahl', price: 145, image_url: 'https://images.unsplash.com/photo-1596981899093-11f15e5f60f0?w=400&fit=crop', category: 'tools' },
  { id: '4', name: 'Black Saffron EDP', vendor_name: 'Byredo', price: 190, image_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=400&fit=crop', category: 'fragrance' },
  { id: '5', name: 'Elite Face Serum', vendor_name: 'Premium', price: 68, image_url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=400&fit=crop', category: 'skincare' },
  { id: '6', name: 'Wooden Comb Set', vendor_name: 'Artisan', price: 55, image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&fit=crop', category: 'tools' },
];

export default function Marketplace() {
  const [searchTerm, setSearchTerm] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const { itemCount } = useCart();

  const { data: apiProducts = [] } = useQuery({
    queryKey: ['marketplace-products'],
    queryFn: () => sovereign.entities.Product.list(),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const products = useMemo(() => {
    const source = Array.isArray(apiProducts) && apiProducts.length > 0 ? apiProducts : FALLBACK_PRODUCTS;
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
    <div className="min-h-screen bg-background">
      <MetaTags
        title="Marketplace – Premium Grooming Products"
        description="Shop premium grooming products from luxury brands."
      />

      {/* Header */}
      <header className="sticky top-0 z-50 bg-background/95 backdrop-blur-sm border-b border-border">
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-foreground">Marketplace</h1>
              <p className="text-muted-foreground mt-1">Premium grooming essentials</p>
            </div>
            <Link to={createPageUrl('ShoppingBag')} className="relative">
              <Button variant="outline" className="rounded-full">
                <ShoppingCart className="w-5 h-5 mr-2" />
                Bag
                {itemCount > 0 && (
                  <span className="ml-2 min-w-[20px] h-5 rounded-full bg-primary text-xs font-bold text-primary-foreground flex items-center justify-center px-2">
                    {itemCount}
                  </span>
                )}
              </Button>
            </Link>
          </div>

          {/* Search */}
          <div className="relative max-w-2xl">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="Search products, brands..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 rounded-full bg-muted border-border text-foreground"
            />
          </div>
        </div>
      </header>

      {/* Categories */}
      <div className="w-full border-b border-border bg-background">
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-4">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-2 px-6 py-3 rounded-full font-medium transition-all whitespace-nowrap ${
                    activeCategory === cat.id
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted text-foreground hover:bg-muted/80'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {cat.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-8">
        
        {/* Results Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-foreground">
              {activeCategory === 'all' ? 'All Products' : CATEGORIES.find(c => c.id === activeCategory)?.label}
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              {filtered.length} {filtered.length === 1 ? 'product' : 'products'}
            </p>
          </div>
          {searchTerm && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSearchTerm('')}
              className="text-muted-foreground hover:text-foreground"
            >
              Clear search
            </Button>
          )}
        </div>

        {/* Product Grid */}
        {filtered.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((product) => (
              <Link
                key={product.id}
                to={`${createPageUrl('ProductDetail')}?id=${encodeURIComponent(product.id)}`}
                className="group"
              >
                <div className="bg-card border border-border rounded-2xl overflow-hidden hover:border-primary/50 hover:shadow-lg transition-all">
                  {/* Product Image */}
                  <div className="relative aspect-square bg-muted overflow-hidden">
                    <OptimizedImage
                      src={product.image_url}
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      width={400}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>

                  {/* Product Info */}
                  <div className="p-4">
                    <p className="text-xs font-semibold text-primary uppercase tracking-wide mb-1">
                      {product.brand}
                    </p>
                    <h3 className="font-semibold text-foreground text-base line-clamp-2 mb-3 min-h-[3rem]">
                      {product.name}
                    </h3>
                    <div className="flex items-center justify-between">
                      <p className="text-2xl font-bold text-foreground">
                        ${Number(product.price).toFixed(0)}
                      </p>
                      <Button
                        size="sm"
                        className="rounded-full bg-primary hover:bg-primary/90"
                        onClick={(e) => {
                          e.preventDefault();
                          // Add to cart logic handled by ProductDetail page
                        }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border-2 border-dashed border-border bg-muted/30 py-16 px-6 text-center">
            <div className="max-w-md mx-auto">
              <div className="w-16 h-16 rounded-full bg-muted border-2 border-border flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-muted-foreground" />
              </div>
              <h3 className="text-xl font-bold text-foreground mb-2">No products found</h3>
              <p className="text-muted-foreground mb-6">
                {searchTerm
                  ? `No products match "${searchTerm}". Try a different search term.`
                  : 'No products available in this category.'}
              </p>
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm('');
                  setActiveCategory('all');
                }}
                className="rounded-full"
              >
                Show all products
              </Button>
            </div>
          </div>
        )}
      </main>

      <ClientBottomNav />
    </div>
  );
}

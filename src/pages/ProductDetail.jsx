import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useState, useEffect } from 'react';
import { sovereign } from '@/api/apiClient';
import {
  ArrowLeft,
  ShoppingBag,
  Heart,
  Share2,
  Sparkles,
  Leaf,
  Droplets,
  Shield,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import { useCart } from '@/components/context/CartContext';
import { useIsDesktop } from '@/hooks/useMediaQuery';

// Default specs for API products missing detail fields
const DEFAULT_SPECS = [
  { icon: Leaf, label: 'Origin', value: 'Premium blend' },
  { icon: Droplets, label: 'Formula', value: 'Curated' },
  { icon: Shield, label: 'Tested', value: 'Quality assured' },
  { icon: Sparkles, label: 'Finish', value: 'Elite' },
];

function getProductById(id, apiProduct) {
  if (apiProduct && (apiProduct.id === id || String(apiProduct.id) === id)) {
    return {
      id: apiProduct.id,
      name: apiProduct.name,
      brand: apiProduct.vendor_name || 'Curated',
      price: apiProduct.price,
      image_url: apiProduct.image_url || '',
      category: apiProduct.category || '',
      description: apiProduct.description || 'Premium grooming product. Crafted for quality and performance.',
      specs: DEFAULT_SPECS,
      applicationTips: 'Apply as directed. For best results, use on clean, dry skin or hair.',
      ingredients: 'See packaging for full ingredient list.',
      shippingReturns: 'Free shipping on orders over $50. 30-day returns. Contact support for assistance.',
    };
  }
  return null;
}

export default function ProductDetail() {
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('id');
  const isDesktop = useIsDesktop();
  const [quantity, setQuantity] = useState(1);
  const { addItem } = useCart();
  const [ingredientsOpen, setIngredientsOpen] = useState(false);
  const [shippingOpen, setShippingOpen] = useState(false);
  useEffect(() => {
    if (isDesktop) {
      setIngredientsOpen(true);
      setShippingOpen(true);
    }
  }, [isDesktop]);

  const { data: apiProduct, isLoading } = useQuery({
    queryKey: ['marketplace-product', productId],
    queryFn: () => sovereign.products.getPublic(productId),
    enabled: !!productId,
    staleTime: 60 * 1000,
    retry: 1,
  });

  const product = getProductById(productId, apiProduct);

  if (!productId) {
    return (
      <div className="stb-page pb-24 lg:pb-8 flex flex-col items-center justify-center px-4">
        <MetaTags title="Product not found" description="This product could not be found." />
        <p className="text-muted-foreground font-medium mb-4">Product not found.</p>
        <Link to={createPageUrl('Marketplace')}>
          <Button variant="outline" className="rounded-xl">Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="stb-page pb-24 lg:pb-8 flex items-center justify-center">
        <p className="text-muted-foreground">Loading product…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="stb-page pb-24 lg:pb-8 flex flex-col items-center justify-center px-4">
        <MetaTags title="Product not found" description="This product could not be found." />
        <p className="text-muted-foreground font-medium mb-4">Product not found.</p>
        <Link to={createPageUrl('Marketplace')}>
          <Button variant="outline" className="rounded-xl">Back to Marketplace</Button>
        </Link>
      </div>
    );
  }

  const SpecIcon = ({ icon: Icon, label, value }) => {
    const IconComp = Icon || Sparkles;
    return (
      <div className="rounded-xl border border-slate-200 bg-card p-4 flex flex-col items-start gap-2">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <IconComp className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    );
  };

  return (
    <div className="stb-page pb-24 lg:pb-8">
      <MetaTags
        title={`${product.name} - ${product.brand}`}
        description={product.description || `Premium ${product.category} product from ${product.brand}.`}
      />

      {/* Top bar: back + share/favorite, desktop: full nav via sidebar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <Link
            to={createPageUrl('Marketplace')}
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Marketplace
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground/90" aria-label="Share">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-muted-foreground hover:text-foreground/90" aria-label="Add to wishlist">
              <Heart className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-8">
        {/* Desktop: two-column | Mobile: single column */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 lg:gap-14">
          {/* Product image */}
          <div className="relative">
            <div className="aspect-square rounded-2xl overflow-hidden bg-card border border-slate-200 shadow-sm">
              <OptimizedImage
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
                width={800}
              />
            </div>
            <div className="flex justify-center gap-2 mt-4">
              {[1, 2, 3].map((i) => (
                <span key={i} className={`w-2 h-2 rounded-full ${i === 1 ? 'bg-primary' : 'bg-slate-200'}`} aria-hidden />
              ))}
            </div>
          </div>

          {/* Product details */}
          <div className="flex flex-col">
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-1">{product.brand}</p>
            <h1 className="text-2xl lg:text-3xl font-bold text-foreground tracking-tight mb-2">{product.name}</h1>
            <p className="text-2xl font-bold text-foreground mb-6">${Number(product.price).toFixed(2)}</p>
            <p className="text-muted-foreground text-base leading-relaxed mb-8">{product.description}</p>

            {/* High-End Specs */}
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">High-End Specs</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {(product.specs || DEFAULT_SPECS).map((spec, i) => (
                  <SpecIcon key={i} icon={spec.icon} label={spec.label} value={spec.value} />
                ))}
              </div>
            </section>

            {/* Expert Application Tips */}
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Expert Application Tips</h2>
              <p className="text-muted-foreground text-sm leading-relaxed">{product.applicationTips}</p>
            </section>

            {/* Ingredients, collapsible on mobile, open on desktop */}
            <Collapsible open={ingredientsOpen} onOpenChange={setIngredientsOpen} className="mb-4">
              <CollapsibleTrigger asChild>
                <button type="button" className="flex items-center justify-between w-full py-3 border-b border-slate-200 text-left font-semibold text-foreground hover:text-foreground/90">
                  Ingredients
                  {ingredientsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <p className="text-muted-foreground text-sm pt-3 pb-2">{product.ingredients}</p>
              </CollapsibleContent>
            </Collapsible>

            {/* Shipping & Returns */}
            <Collapsible open={shippingOpen} onOpenChange={setShippingOpen} className="mb-8">
              <CollapsibleTrigger asChild>
                <button type="button" className="flex items-center justify-between w-full py-3 border-b border-slate-200 text-left font-semibold text-foreground hover:text-foreground/90">
                  Shipping & Returns
                  {shippingOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <p className="text-muted-foreground text-sm pt-3 pb-2">{product.shippingReturns}</p>
              </CollapsibleContent>
            </Collapsible>

            {/* Add to Bag, in-flow on desktop */}
            <div className="mt-auto pt-6 border-t border-slate-200 hidden lg:flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-muted-foreground">Qty</span>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:bg-muted" aria-label="Decrease quantity">−</button>
                  <span className="w-12 text-center font-semibold text-foreground">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((q) => q + 1)} className="w-10 h-10 flex items-center justify-center text-muted-foreground hover:bg-muted" aria-label="Increase quantity">+</button>
                </div>
              </div>
              <Button
                className="flex-1 rounded-xl bg-primary text-primary-foreground hover:opacity-95 font-semibold h-12 gap-2"
                size="lg"
                onClick={async () => {
                  try {
                    await addItem(productId, quantity, { name: product.name, price: product.price, image_url: product.image_url, vendor_name: product.brand });
                    toast.success(`${product.name} added to bag (${quantity})`);
                  } catch (e) {
                    toast.error(e.message || 'Could not add to bag');
                  }
                }}
              >
                <ShoppingBag className="w-5 h-5" /> Add to Bag
              </Button>
            </div>
          </div>
        </div>

        {/* Continue shopping CTA */}
        <div className="mt-12 pt-8 border-t border-slate-200 text-center">
          <Link to={createPageUrl('Marketplace')} className="text-primary font-semibold hover:underline">
            ← Continue shopping
          </Link>
        </div>
      </main>

      {/* Sticky bottom bar, mobile only (desktop has in-flow CTA) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-slate-200 p-4 lg:hidden safe-area-pb">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-card">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-12 h-12 flex items-center justify-center text-muted-foreground" aria-label="Decrease quantity">−</button>
            <span className="w-10 text-center font-semibold text-foreground">{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => q + 1)} className="w-12 h-12 flex items-center justify-center text-muted-foreground" aria-label="Increase quantity">+</button>
          </div>
          <Button
            className="flex-1 rounded-xl bg-primary text-primary-foreground hover:opacity-95 font-semibold h-12 gap-2"
            size="lg"
            onClick={async () => {
              try {
                await addItem(productId, quantity, { name: product.name, price: product.price, image_url: product.image_url, vendor_name: product.brand });
                toast.success(`${product.name} added to bag (${quantity})`);
              } catch (e) {
                toast.error(e.message || 'Could not add to bag');
              }
            }}
          >
            <ShoppingBag className="w-5 h-5" /> Add to Bag
          </Button>
        </div>
      </div>
    </div>
  );
}

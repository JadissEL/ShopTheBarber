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
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';
import { useCart } from '@/components/context/CartContext';
import { useIsDesktop } from '@/hooks/useMediaQuery';

// Fallback product data with premium fields for detail page
const FALLBACK_PRODUCTS = [
  {
    id: '1',
    name: 'Night Skin Recharge',
    brand: 'Baxter of California',
    price: 48,
    image_url: 'https://images.unsplash.com/photo-1600880292203-757bb62b4baf?w=800&fit=crop',
    category: 'Beard',
    description: 'A lightweight, fast-absorbing blend designed to restore balance overnight. Crafted with premium natural oils and vitamins to support skin recovery and a healthy-looking beard.',
    specs: [
      { icon: Leaf, label: 'Origin', value: '100% Organic' },
      { icon: Droplets, label: 'Formula', value: 'Oil-based' },
      { icon: Shield, label: 'Tested', value: 'Dermatologist' },
      { icon: Sparkles, label: 'Finish', value: 'Non-greasy' },
    ],
    applicationTips: 'Apply 3–5 drops to cleansed skin or beard. Warm between palms and press into skin. Best used in the evening for overnight recovery.',
    ingredients: 'Argan Oil, Jojoba, Vitamin E, Rosemary Extract, Cedarwood.',
    shippingReturns: 'Free shipping on orders over $50. 30-day returns. Contact support@shopthebarber.com for exchanges.',
  },
  {
    id: '2',
    name: 'Claymation Styling Kit',
    brand: 'Hanz de Fuko',
    price: 24,
    image_url: 'https://images.unsplash.com/photo-1522338242992-e1a54906a8da?w=800&fit=crop',
    category: 'Hair',
    description: 'A versatile, medium-hold clay that adds texture and definition without stiffness. Ideal for modern, natural looks with a matte finish.',
    specs: [
      { icon: Leaf, label: 'Origin', value: 'Natural wax' },
      { icon: Droplets, label: 'Formula', value: 'Water-based' },
      { icon: Shield, label: 'Tested', value: 'Salon-grade' },
      { icon: Sparkles, label: 'Finish', value: 'Matte' },
    ],
    applicationTips: 'Work a small amount through towel-dried or dry hair. Style with fingers or comb. Build up for stronger hold.',
    ingredients: 'Beeswax, Kaolin, Carnauba, Vitamin B5.',
    shippingReturns: 'Free shipping on orders over $50. 30-day returns.',
  },
  { id: '3', name: 'Wahl Professional 5-Star Cordless', brand: 'Wahl', price: 145, image_url: 'https://images.unsplash.com/photo-1596981899093-11f15e5f60f0?w=800&fit=crop', category: 'Tools', description: 'Professional-grade cordless clipper for precision cuts. Long-lasting battery and durable blades for barber-quality results.', specs: [{ icon: Leaf, label: 'Origin', value: 'Pro-grade' }, { icon: Droplets, label: 'Type', value: 'Cordless' }, { icon: Shield, label: 'Tested', value: 'Professional' }, { icon: Sparkles, label: 'Finish', value: 'Precision' }], applicationTips: 'Charge fully before first use. Use with guard combs for consistent length. Oil blades regularly.', ingredients: 'Metal, plastic, lithium-ion battery. See manual for full specs.', shippingReturns: 'Free shipping on orders over $50. 30-day returns.' },
  { id: '4', name: 'Byredo Black Saffron EDP', brand: 'Byredo', price: 190, image_url: 'https://images.unsplash.com/photo-1594035910387-fea47794261f?w=800&fit=crop', category: 'Fragrance', description: 'A bold, sophisticated fragrance blending saffron, leather, and violet. Long-lasting and distinctive.', specs: [{ icon: Leaf, label: 'Origin', value: 'Luxury' }, { icon: Droplets, label: 'Formula', value: 'EDP' }, { icon: Shield, label: 'Tested', value: 'Allergen-checked' }, { icon: Sparkles, label: 'Finish', value: 'Long-lasting' }], applicationTips: 'Apply to pulse points. One or two sprays sufficient. Store away from heat and light.', ingredients: 'Alcohol, fragrance oils. See packaging for full list.', shippingReturns: 'Free shipping on orders over $50. 30-day returns.' },
  { id: '5', name: 'Elite Face Serum', brand: 'Curated', price: 68, image_url: 'https://images.unsplash.com/photo-1571781926291-c477ebfd024b?w=800&fit=crop', category: 'Skincare', description: 'A lightweight serum to support skin recovery and radiance. Curated for premium grooming routines.', specs: [{ icon: Leaf, label: 'Origin', value: 'Curated' }, { icon: Droplets, label: 'Formula', value: 'Serum' }, { icon: Shield, label: 'Tested', value: 'Dermatologist' }, { icon: Sparkles, label: 'Finish', value: 'Non-greasy' }], applicationTips: 'Apply to clean, dry skin morning or evening. Follow with moisturizer if desired.', ingredients: 'See packaging for full ingredient list.', shippingReturns: 'Free shipping on orders over $50. 30-day returns.' },
  { id: '6', name: 'Wooden Comb Set', brand: 'Partner', price: 55, image_url: 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=800&fit=crop', category: 'Tools', description: 'Handcrafted wooden combs for gentle detangling and styling. A timeless addition to any grooming kit.', specs: [{ icon: Leaf, label: 'Origin', value: 'Natural wood' }, { icon: Droplets, label: 'Type', value: 'Set' }, { icon: Shield, label: 'Tested', value: 'Quality assured' }, { icon: Sparkles, label: 'Finish', value: 'Smooth' }], applicationTips: 'Use on damp or dry hair. Store in a dry place. Avoid excessive heat.', ingredients: 'Wood (sandalwood/ebony). No synthetic materials.', shippingReturns: 'Free shipping on orders over $50. 30-day returns.' },
];

const DEFAULT_SPECS = [
  { icon: Leaf, label: 'Origin', value: 'Premium blend' },
  { icon: Droplets, label: 'Formula', value: 'Curated' },
  { icon: Shield, label: 'Tested', value: 'Quality assured' },
  { icon: Sparkles, label: 'Finish', value: 'Elite' },
];

function getProductById(id, apiProduct, fallbackList) {
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
  const found = fallbackList.find((p) => String(p.id) === String(id));
  if (found) return { ...found, specs: found.specs || DEFAULT_SPECS };
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

  const { data: apiProducts = [] } = useQuery({
    queryKey: ['marketplace-products'],
    queryFn: () => sovereign.entities.Product.list(),
    staleTime: 60 * 1000,
    retry: 1,
  });

  const apiProduct = Array.isArray(apiProducts)
    ? apiProducts.find((p) => String(p.id) === String(productId))
    : null;
  const product = getProductById(productId, apiProduct, FALLBACK_PRODUCTS);

  if (!productId || !product) {
    return (
      <div className="min-h-screen bg-background pb-24 lg:pb-8 flex flex-col items-center justify-center px-4">
        <MetaTags title="Product not found" description="This product could not be found." />
        <p className="text-slate-600 font-medium mb-4">Product not found.</p>
        <Link to={createPageUrl('Marketplace')}>
          <Button variant="outline" className="rounded-xl">Back to Marketplace</Button>
        </Link>
        <ClientBottomNav />
      </div>
    );
  }

  const SpecIcon = ({ icon: Icon, label, value }) => {
    const IconComp = Icon || Sparkles;
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col items-start gap-2">
        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
          <IconComp className="w-5 h-5" />
        </div>
        <p className="text-xs font-semibold uppercase tracking-wider text-slate-500">{label}</p>
        <p className="text-sm font-semibold text-foreground">{value}</p>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <MetaTags
        title={`${product.name} – ${product.brand}`}
        description={product.description || `Premium ${product.category} product from ${product.brand}.`}
      />

      {/* Top bar: back + share/favorite — desktop: full nav via sidebar */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-100">
        <div className="w-full max-w-7xl mx-auto px-4 lg:px-8 py-3 flex items-center justify-between">
          <Link
            to={createPageUrl('Marketplace')}
            className="inline-flex items-center gap-2 text-slate-600 hover:text-foreground font-medium text-sm"
          >
            <ArrowLeft className="w-4 h-4" /> Back to Marketplace
          </Link>
          <div className="flex items-center gap-2">
            <Button variant="ghost" size="icon" className="rounded-full text-slate-500 hover:text-slate-700" aria-label="Share">
              <Share2 className="w-4 h-4" />
            </Button>
            <Button variant="ghost" size="icon" className="rounded-full text-slate-500 hover:text-slate-700" aria-label="Add to wishlist">
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
            <div className="aspect-square rounded-2xl overflow-hidden bg-white border border-slate-200 shadow-sm">
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
            <p className="text-slate-600 text-base leading-relaxed mb-8">{product.description}</p>

            {/* High-End Specs */}
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-4">High-End Specs</h2>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {(product.specs || DEFAULT_SPECS).map((spec, i) => (
                  <SpecIcon key={i} icon={spec.icon} label={spec.label} value={spec.value} />
                ))}
              </div>
            </section>

            {/* Expert Application Tips */}
            <section className="mb-8">
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-500 mb-3">Expert Application Tips</h2>
              <p className="text-slate-600 text-sm leading-relaxed">{product.applicationTips}</p>
            </section>

            {/* Ingredients — collapsible on mobile, open on desktop */}
            <Collapsible open={ingredientsOpen} onOpenChange={setIngredientsOpen} className="mb-4">
              <CollapsibleTrigger asChild>
                <button type="button" className="flex items-center justify-between w-full py-3 border-b border-slate-200 text-left font-semibold text-foreground hover:text-slate-700">
                  Ingredients
                  {ingredientsOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <p className="text-slate-600 text-sm pt-3 pb-2">{product.ingredients}</p>
              </CollapsibleContent>
            </Collapsible>

            {/* Shipping & Returns */}
            <Collapsible open={shippingOpen} onOpenChange={setShippingOpen} className="mb-8">
              <CollapsibleTrigger asChild>
                <button type="button" className="flex items-center justify-between w-full py-3 border-b border-slate-200 text-left font-semibold text-foreground hover:text-slate-700">
                  Shipping & Returns
                  {shippingOpen ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent>
                <p className="text-slate-600 text-sm pt-3 pb-2">{product.shippingReturns}</p>
              </CollapsibleContent>
            </Collapsible>

            {/* Add to Bag — in-flow on desktop */}
            <div className="mt-auto pt-6 border-t border-slate-200 hidden lg:flex flex-col sm:flex-row gap-4">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-slate-600">Qty</span>
                <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden">
                  <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100">−</button>
                  <span className="w-12 text-center font-semibold text-foreground">{quantity}</span>
                  <button type="button" onClick={() => setQuantity((q) => q + 1)} className="w-10 h-10 flex items-center justify-center text-slate-600 hover:bg-slate-100">+</button>
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

      {/* Sticky bottom bar — mobile only (desktop has in-flow CTA) */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-4 lg:hidden safe-area-pb">
        <div className="max-w-lg mx-auto flex items-center gap-3">
          <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white">
            <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} className="w-12 h-12 flex items-center justify-center text-slate-600">−</button>
            <span className="w-10 text-center font-semibold text-foreground">{quantity}</span>
            <button type="button" onClick={() => setQuantity((q) => q + 1)} className="w-12 h-12 flex items-center justify-center text-slate-600">+</button>
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

      <ClientBottomNav />
    </div>
  );
}

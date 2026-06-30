import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useHomepage } from '@/hooks/useHomepage';
import { formatMoney } from '@/lib/gtmPricing';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

export default function HomeMarketplacePreview() {
  const { data, isLoading } = useHomepage();
  const products = data?.featured_products ?? [];

  if (isLoading) {
    return (
      <section className="py-24 bg-background">
        <div className="container mx-auto px-4 md:px-6 animate-pulse">
          <div className="h-8 bg-muted rounded-lg w-72 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-background border-y border-foreground/10">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className={cn(stb.label, 'mb-2')}>Also on ShopTheBarber</p>
            <h2 className={cn(stb.heading, 'text-2xl md:text-3xl')}>Grooming products</h2>
            <p className={cn(stb.body, 'text-muted-foreground mt-2 max-w-md text-sm')}>
              Curated picks from barbers and brands, add to cart after you book.
            </p>
          </div>
          <Link to={createPageUrl('Marketplace')}>
            <Button variant="outline" size="sm" className="gap-2 shrink-0">
              Shop all <ShoppingBag className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.slice(0, 4).map((product) => (
            <Link
              key={product.id}
              to={createPageUrl(`ProductDetail?id=${product.id}`)}
              className={cn('group block no-underline text-inherit h-full', stb.cardInteractive)}
            >
              <div className="aspect-square overflow-hidden bg-muted relative">
                <OptimizedImage
                  src={
                    product.image_url ||
                    'https://images.unsplash.com/photo-1621607508240-3940e6a1a2a4?w=400&q=80'
                  }
                  alt={product.name}
                  fill
                  className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                />
              </div>
              <div className="p-3 flex flex-col flex-1 gap-1">
                <h3 className={cn(stb.title, 'text-sm line-clamp-2 group-hover:text-primary transition-colors')}>
                  {product.name}
                </h3>
                <p className="text-primary font-semibold text-sm">
                  {product.price != null ? formatMoney(product.price) : 'View price'}
                </p>
                {product.vendor_name && (
                  <p className="text-xs text-muted-foreground truncate">{product.vendor_name}</p>
                )}
                <div className={cn(stb.cardCta, '-mx-3 -mb-3 mt-2 rounded-none rounded-b-lg')}>
                  View product
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

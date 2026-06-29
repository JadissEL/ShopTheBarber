import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';
import { ShoppingBag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useHomepage } from '@/hooks/useHomepage';
import { formatMoney } from '@/lib/gtmPricing';

export default function HomeMarketplacePreview() {
  const { data, isLoading } = useHomepage();
  const products = data?.featured_products ?? [];

  if (isLoading) {
    return (
      <section className="py-24 bg-muted/50">
        <div className="container mx-auto px-4 md:px-6 animate-pulse">
          <div className="h-8 bg-muted rounded w-72 mb-8" />
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="aspect-square bg-muted rounded-2xl" />
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (products.length === 0) return null;

  return (
    <section className="py-16 md:py-20 bg-muted/30 border-y border-border/60">
      <div className="container mx-auto px-4 md:px-6 max-w-6xl">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
          <div>
            <p className="text-xs font-semibold uppercase tracking-widest text-primary mb-2">Also on ShopTheBarber</p>
            <h2 className="text-2xl md:text-3xl font-bold text-foreground tracking-tight">Grooming products</h2>
            <p className="text-muted-foreground mt-2 max-w-md text-sm">
              Curated picks from barbers and brands, add to cart after you book.
            </p>
          </div>
          <Link to={createPageUrl('Marketplace')}>
            <Button variant="outline" size="sm" className="rounded-xl gap-2 shrink-0">
              Shop all <ShoppingBag className="w-4 h-4" />
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {products.slice(0, 4).map((product, i) => (
            <motion.div
              key={product.id}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
            >
              <Link
                to={createPageUrl(`ProductDetail?id=${product.id}`)}
                className="group block no-underline text-inherit"
              >
                <div className="aspect-square rounded-2xl overflow-hidden bg-card border border-border mb-3 relative shadow-sm group-hover:shadow-md group-hover:border-primary/30 transition-all">
                  <OptimizedImage
                    src={
                      product.image_url ||
                      'https://images.unsplash.com/photo-1621607508240-3940e6a1a2a4?w=400&q=80'
                    }
                    alt={product.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <h3 className="font-semibold text-sm text-foreground line-clamp-2 group-hover:text-primary transition-colors">
                  {product.name}
                </h3>
                <p className="text-primary font-bold text-sm mt-1">
                  {product.price != null ? formatMoney(product.price) : 'View price'}
                </p>
                {product.vendor_name && (
                  <p className="text-xs text-muted-foreground mt-0.5 truncate">{product.vendor_name}</p>
                )}
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}

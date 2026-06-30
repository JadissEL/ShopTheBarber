import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Star,
  Check,
  Eye,
  TrendingUp,
  Award,
  Package
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function ProductComparison({ products, onClose }) {
  if (!products || products.length < 2) {
    return null;
  }

  const features = [
    { key: 'price', label: 'Prix', icon: '💰', format: (v) => `${v}€` },
    { key: 'rating', label: 'Note', icon: '⭐', format: (v) => `${v?.toFixed(1) || 'N/A'}/5` },
    { key: 'total_reviews', label: 'Avis', icon: '💬', format: (v) => v || 0 },
    { key: 'stock', label: 'Stock', icon: '📦', format: (v) => v > 0 ? `${v} disponible(s)` : 'Rupture' },
    { key: 'brand', label: 'Marque', icon: '🏷️', format: (v) => v || 'N/A' },
    { key: 'category', label: 'Catégorie', icon: '📁', format: (v) => v || 'N/A' },
  ];

  const getBestValue = (key) => {
    if (key === 'price') {
      return Math.min(...products.map(p => p[key] || Infinity));
    }
    if (key === 'rating' || key === 'total_reviews' || key === 'stock') {
      return Math.max(...products.map(p => p[key] || 0));
    }
    return null;
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <TrendingUp className="w-6 h-6 text-primary" />
            Comparaison de Produits
          </DialogTitle>
        </DialogHeader>

        <div className="mt-6">
          {/* Products Header */}
          <div className="grid gap-6 mb-8" style={{ gridTemplateColumns: `repeat(${products.length}, minmax(0, 1fr))` }}>
            {products.map((product, index) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <Card className="rounded-lg border-2 border-border overflow-hidden">
                  <div className="relative aspect-square bg-muted">
                    {product.image_url ? (
                      <img
                        src={product.image_url}
                        alt={product.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <Package className="w-16 h-16 text-white/70" />
                      </div>
                    )}
                    {product.is_featured && (
                      <Badge className="absolute top-3 right-3 bg-primary border-0 text-white">
                        <Award className="w-3 h-3 mr-1" />
                        Top
                      </Badge>
                    )}
                  </div>

                  <CardContent className="p-5">
                    <h3 className="font-bold text-lg mb-2 line-clamp-2">{product.name}</h3>
                    <div className="flex items-center gap-1 mb-3">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`w-4 h-4 ${
                            i < Math.floor(product.rating || 5)
                              ? 'text-yellow-400 fill-current'
                              : 'text-muted-foreground'
                          }`}
                        />
                      ))}
                    </div>

                    <div className="space-y-2">
                      <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Eye className="w-4 h-4 mr-2" />
                          Voir le Produit
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </div>

          {/* Comparison Table */}
          <Card className="rounded-lg border-2 border-border">
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-border bg-muted/50">
                      <th className="text-left p-4 font-bold sticky left-0 bg-muted/50 z-10">
                        Caractéristiques
                      </th>
                      {products.map((product) => (
                        <th key={product.id} className="p-4">
                          <div className="w-16 h-16 mx-auto rounded-lg overflow-hidden">
                            {product.image_url ? (
                              <img src={product.image_url} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full bg-muted" />
                            )}
                          </div>
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {features.map((feature, idx) => {
                      const bestValue = getBestValue(feature.key);
                      return (
                        <tr key={feature.key} className={idx % 2 === 0 ? 'bg-card' : 'bg-muted/50'}>
                          <td className="p-4 font-semibold sticky left-0 bg-inherit z-10 border-r-2 border-border">
                            <div className="flex items-center gap-2">
                              <span className="text-xl">{feature.icon}</span>
                              <span>{feature.label}</span>
                            </div>
                          </td>
                          {products.map((product) => {
                            const value = product[feature.key];
                            const isBest = bestValue !== null && value === bestValue;
                            return (
                              <td key={product.id} className="p-4 text-center">
                                <div className={cn(
                                  'inline-flex items-center gap-2 px-3 py-2 rounded-lg',
                                  isBest && 'bg-success/10 text-success font-bold',
                                )}>
                                  {isBest && <Check className="w-4 h-4" />}
                                  <span>{feature.format(value)}</span>
                                </div>
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}

                    {/* Description Row */}
                    <tr className="bg-card">
                      <td className="p-4 font-semibold sticky left-0 bg-card z-10 border-r-2 border-border">
                        <div className="flex items-center gap-2">
                          <span className="text-xl">📝</span>
                          <span>Description</span>
                        </div>
                      </td>
                      {products.map((product) => (
                        <td key={product.id} className="p-4">
                          <p className="text-sm text-muted-foreground line-clamp-3">
                            {product.description || 'Aucune description'}
                          </p>
                        </td>
                      ))}
                    </tr>
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>

          {/* Summary */}
          <div className="mt-6 p-6 bg-[hsl(var(--navy))]/5 rounded-lg border-2 border-foreground/20">
            <h4 className="font-bold text-lg mb-4 flex items-center gap-2 text-foreground">
              <Award className="w-5 h-5 text-primary" />
              Recommandation
            </h4>
            {(() => {
              const lowestPrice = products.reduce((min, p) => p.price < min.price ? p : min);
              const highestRated = products.reduce((max, p) => (p.rating || 0) > (max.rating || 0) ? p : max);
              const mostReviewed = products.reduce((max, p) => (p.total_reviews || 0) > (max.total_reviews || 0) ? p : max);

              return (
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Badge className="bg-success text-success-foreground">Meilleur Prix</Badge>
                    <span className="font-semibold text-foreground">{lowestPrice.name}</span>
                    <span className="text-success font-bold">{lowestPrice.price}€</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-primary">Mieux Noté</Badge>
                    <span className="font-semibold text-foreground">{highestRated.name}</span>
                    <span className="text-primary font-bold">{highestRated.rating?.toFixed(1)}/5</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge className="bg-[hsl(var(--navy))]">Plus Populaire</Badge>
                    <span className="font-semibold text-foreground">{mostReviewed.name}</span>
                    <span className="text-foreground font-bold">{mostReviewed.total_reviews} avis</span>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
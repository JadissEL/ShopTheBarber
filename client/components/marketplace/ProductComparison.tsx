import React from "react";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import {
  Star,
  X,
  Plus,
  Minus,
  Check,
  ShoppingCart,
  Heart,
  Scale,
  Award,
  Shield,
  Truck,
  Eye,
  Share2,
} from "lucide-react";

interface Product {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  reviewCount: number;
  features: { [key: string]: string | boolean | number };
  pros?: string[];
  cons?: string[];
  verified?: boolean;
  quickShip?: boolean;
  inStock: boolean;
  description: string;
  tags?: string[];
}

interface ProductComparisonProps {
  products: Product[];
  onRemoveProduct: (productId: number) => void;
  onAddToCart: (product: Product) => void;
  onAddToWishlist: (productId: number) => void;
  onClearComparison: () => void;
}

export function ProductComparison({
  products,
  onRemoveProduct,
  onAddToCart,
  onAddToWishlist,
  onClearComparison,
}: ProductComparisonProps) {
  const [selectedFeatures, setSelectedFeatures] = React.useState<string[]>([]);

  // Get all unique features from all products
  const allFeatures = React.useMemo(() => {
    const featureSet = new Set<string>();
    products.forEach((product) => {
      Object.keys(product.features).forEach((feature) =>
        featureSet.add(feature),
      );
    });
    return Array.from(featureSet);
  }, [products]);

  const toggleFeatureFilter = (feature: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(feature)
        ? prev.filter((f) => f !== feature)
        : [...prev, feature],
    );
  };

  const filteredFeatures =
    selectedFeatures.length > 0
      ? allFeatures.filter((feature) => selectedFeatures.includes(feature))
      : allFeatures;

  const formatFeatureValue = (value: any) => {
    if (typeof value === "boolean") {
      return value ? (
        <Check className="w-4 h-4 text-green-400" />
      ) : (
        <X className="w-4 h-4 text-red-400" />
      );
    }
    if (typeof value === "number") {
      return value.toString();
    }
    return value || "—";
  };

  const getBestPrice = () => {
    return Math.min(...products.map((p) => p.price));
  };

  const getBestRating = () => {
    return Math.max(...products.map((p) => p.rating));
  };

  if (products.length === 0) {
    return (
      <div className="text-center py-12 space-y-4">
        <div className="w-16 h-16 bg-moroccan-gold/20 rounded-full flex items-center justify-center mx-auto">
          <Scale className="w-8 h-8 text-moroccan-gold" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-moroccan-sand mb-2">
            Aucun produit à comparer
          </h3>
          <p className="text-moroccan-cream text-sm">
            Ajoutez des produits à votre comparaison pour voir les différences
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-moroccan-gold flex items-center gap-2">
            <Scale className="w-6 h-6" />
            Comparaison de produits
          </h2>
          <p className="text-moroccan-cream">
            Comparez jusqu'à {products.length} produits côte à côte
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={onClearComparison}
            className="border-red-500/30 text-red-400 hover:bg-red-500/20"
          >
            <X className="w-4 h-4 mr-2" />
            Tout effacer
          </Button>
        </div>
      </div>

      {/* Feature Filter */}
      {allFeatures.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-moroccan-sand">
            Filtrer par caractéristiques :
          </h3>
          <div className="flex flex-wrap gap-2">
            {allFeatures.map((feature) => (
              <Button
                key={feature}
                variant="outline"
                size="sm"
                onClick={() => toggleFeatureFilter(feature)}
                className={`${
                  selectedFeatures.includes(feature)
                    ? "bg-moroccan-gold text-moroccan-charcoal border-moroccan-gold"
                    : "border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold/10"
                }`}
              >
                {feature}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Comparison Table */}
      <div className="overflow-x-auto">
        <div className="min-w-full">
          {/* Product Headers */}
          <div
            className="grid gap-4 mb-6"
            style={{
              gridTemplateColumns: `200px repeat(${products.length}, 1fr)`,
            }}
          >
            <div></div>
            {products.map((product) => (
              <div
                key={product.id}
                className="bg-moroccan-darkgrey/60 rounded-xl p-4 border border-moroccan-gold/20 relative"
              >
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveProduct(product.id)}
                  className="absolute top-2 right-2 text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1"
                >
                  <X className="w-4 h-4" />
                </Button>

                <div className="space-y-3">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-semibold text-moroccan-sand text-sm line-clamp-2">
                      {product.name}
                    </h3>
                    <p className="text-xs text-moroccan-cream/60 mt-1">
                      {product.brand}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-3 h-3 ${star <= product.rating ? "text-moroccan-gold fill-current" : "text-moroccan-gold/30"}`}
                      />
                    ))}
                    <span className="text-xs text-moroccan-cream ml-1">
                      ({product.reviewCount})
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span
                        className={`text-lg font-bold ${product.price === getBestPrice() ? "text-green-400" : "text-moroccan-gold"}`}
                      >
                        {product.price}€
                      </span>
                      {product.price === getBestPrice() && (
                        <Badge className="bg-green-500/20 text-green-400 text-xs">
                          Meilleur prix
                        </Badge>
                      )}
                    </div>
                    {product.originalPrice && (
                      <span className="text-sm text-moroccan-cream/60 line-through">
                        {product.originalPrice}€
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1">
                    {product.verified && (
                      <Badge className="bg-blue-500/20 text-blue-400 text-xs">
                        <Shield className="w-3 h-3 mr-1" />
                        Vérifié
                      </Badge>
                    )}
                    {product.quickShip && (
                      <Badge className="bg-green-500/20 text-green-400 text-xs">
                        <Truck className="w-3 h-3 mr-1" />
                        24h
                      </Badge>
                    )}
                    {product.rating === getBestRating() && (
                      <Badge className="bg-yellow-500/20 text-yellow-400 text-xs">
                        <Award className="w-3 h-3 mr-1" />
                        Top noté
                      </Badge>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Button
                      size="sm"
                      onClick={() => onAddToCart(product)}
                      disabled={!product.inStock}
                      className="w-full bg-moroccan-gold text-moroccan-charcoal hover:bg-moroccan-copper disabled:opacity-50"
                    >
                      <ShoppingCart className="w-4 h-4 mr-2" />
                      {product.inStock ? "Ajouter" : "Rupture"}
                    </Button>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onAddToWishlist(product.id)}
                        className="flex-1 border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold/10"
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold/10"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1 border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold/10"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Description Row */}
          <div
            className="grid gap-4 mb-4"
            style={{
              gridTemplateColumns: `200px repeat(${products.length}, 1fr)`,
            }}
          >
            <div className="flex items-center text-sm font-semibold text-moroccan-sand p-4">
              Description
            </div>
            {products.map((product) => (
              <div
                key={product.id}
                className="p-4 bg-moroccan-darkgrey/40 rounded-lg border border-moroccan-gold/10"
              >
                <p className="text-sm text-moroccan-cream line-clamp-3">
                  {product.description}
                </p>
              </div>
            ))}
          </div>

          {/* Features Comparison */}
          {filteredFeatures.map((feature) => (
            <div
              key={feature}
              className="grid gap-4 mb-4"
              style={{
                gridTemplateColumns: `200px repeat(${products.length}, 1fr)`,
              }}
            >
              <div className="flex items-center text-sm font-semibold text-moroccan-sand p-4 bg-moroccan-darkgrey/40 rounded-lg">
                {feature}
              </div>
              {products.map((product) => (
                <div
                  key={product.id}
                  className="p-4 bg-moroccan-darkgrey/40 rounded-lg border border-moroccan-gold/10 flex items-center justify-center"
                >
                  <div className="text-sm text-moroccan-cream text-center">
                    {formatFeatureValue(product.features[feature])}
                  </div>
                </div>
              ))}
            </div>
          ))}

          {/* Pros and Cons */}
          <div
            className="grid gap-4 mb-4"
            style={{
              gridTemplateColumns: `200px repeat(${products.length}, 1fr)`,
            }}
          >
            <div className="flex items-start text-sm font-semibold text-moroccan-sand p-4">
              Avantages / Inconvénients
            </div>
            {products.map((product) => (
              <div
                key={product.id}
                className="p-4 bg-moroccan-darkgrey/40 rounded-lg border border-moroccan-gold/10 space-y-3"
              >
                {product.pros && product.pros.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-green-400 mb-2 flex items-center gap-1">
                      <Plus className="w-3 h-3" />
                      Avantages
                    </h4>
                    <ul className="space-y-1">
                      {product.pros.map((pro, index) => (
                        <li
                          key={index}
                          className="text-xs text-moroccan-cream flex items-start gap-1"
                        >
                          <span className="text-green-400 mt-0.5">+</span>
                          {pro}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {product.cons && product.cons.length > 0 && (
                  <div>
                    <h4 className="text-xs font-semibold text-red-400 mb-2 flex items-center gap-1">
                      <Minus className="w-3 h-3" />
                      Inconvénients
                    </h4>
                    <ul className="space-y-1">
                      {product.cons.map((con, index) => (
                        <li
                          key={index}
                          className="text-xs text-moroccan-cream flex items-start gap-1"
                        >
                          <span className="text-red-400 mt-0.5">-</span>
                          {con}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {(!product.pros || product.pros.length === 0) &&
                  (!product.cons || product.cons.length === 0) && (
                    <div className="text-xs text-moroccan-cream/60 text-center py-4">
                      Aucune donnée disponible
                    </div>
                  )}
              </div>
            ))}
          </div>

          {/* Tags */}
          <div
            className="grid gap-4"
            style={{
              gridTemplateColumns: `200px repeat(${products.length}, 1fr)`,
            }}
          >
            <div className="flex items-start text-sm font-semibold text-moroccan-sand p-4">
              Tags
            </div>
            {products.map((product) => (
              <div
                key={product.id}
                className="p-4 bg-moroccan-darkgrey/40 rounded-lg border border-moroccan-gold/10"
              >
                <div className="flex flex-wrap gap-1">
                  {product.tags && product.tags.length > 0 ? (
                    product.tags.map((tag) => (
                      <Badge
                        key={tag}
                        className="bg-moroccan-gold/20 text-moroccan-gold text-xs"
                      >
                        {tag}
                      </Badge>
                    ))
                  ) : (
                    <span className="text-xs text-moroccan-cream/60">
                      Aucun tag
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Summary */}
      <div className="bg-moroccan-darkgrey/60 rounded-xl p-6 border border-moroccan-gold/20">
        <h3 className="text-lg font-semibold text-moroccan-gold mb-4">
          Résumé de la comparaison
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="text-sm text-moroccan-cream mb-1">
              Meilleur rapport qualité/prix
            </div>
            <div className="font-semibold text-moroccan-gold">
              {products.find((p) => p.price === getBestPrice() && p.inStock)
                ?.name || "N/A"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-moroccan-cream mb-1">Mieux noté</div>
            <div className="font-semibold text-moroccan-gold">
              {products.find((p) => p.rating === getBestRating())?.name ||
                "N/A"}
            </div>
          </div>
          <div className="text-center">
            <div className="text-sm text-moroccan-cream mb-1">
              Livraison la plus rapide
            </div>
            <div className="font-semibold text-moroccan-gold">
              {products.find((p) => p.quickShip)?.name || "Standard"}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// Comparison Button for Product Cards
export function ComparisonButton({
  product,
  isInComparison,
  onToggleComparison,
  comparisonCount,
  maxComparison = 4,
}: {
  product: Product;
  isInComparison: boolean;
  onToggleComparison: (product: Product) => void;
  comparisonCount: number;
  maxComparison?: number;
}) {
  const canAdd = comparisonCount < maxComparison;

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            if (isInComparison || canAdd) {
              onToggleComparison(product);
            }
          }}
          disabled={!isInComparison && !canAdd}
          className={`${
            isInComparison
              ? "bg-moroccan-gold text-moroccan-charcoal border-moroccan-gold"
              : "border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold/10"
          }`}
        >
          <Scale className="w-4 h-4 mr-2" />
          {isInComparison ? "Retirer" : "Comparer"}
        </Button>
      </DialogTrigger>
      {!canAdd && !isInComparison && (
        <DialogContent className="bg-moroccan-charcoal border-moroccan-gold/20 text-moroccan-sand">
          <DialogHeader>
            <DialogTitle className="text-moroccan-gold">
              Limite de comparaison atteinte
            </DialogTitle>
            <DialogDescription className="text-moroccan-cream">
              Vous pouvez comparer jusqu'à {maxComparison} produits
              simultanément. Retirez un produit de votre comparaison pour en
              ajouter un nouveau.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      )}
    </Dialog>
  );
}

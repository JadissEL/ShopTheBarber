import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Search,
  Filter,
  Star,
  Heart,
  ArrowLeft,
  Sparkles,
  ShoppingCart,
  Grid3X3,
  List,
  SlidersHorizontal,
  Eye,
  Share2,
  Zap,
  Crown,
  Shield,
  Truck,
  TrendingUp,
  Award,
  Users,
  Clock,
  X,
  ChevronDown,
  ChevronRight,
  Plus,
  Minus,
} from "lucide-react";
import { Link } from "react-router-dom";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  original_price?: number;
  image: string;
  category: string;
  brand: string;
  rating: number;
  review_count: number;
  in_stock: boolean;
  is_featured: boolean;
  isNew?: boolean;
  isPromo?: boolean;
  promoPrice?: number;
  tags?: string[];
  discount?: number;
  quickShip?: boolean;
  verified?: boolean;
  exclusive?: boolean;
}

interface Category {
  id: number;
  name: string;
  description?: string;
  icon?: string;
  count?: number;
}

export default function Marketplace() {
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [products, setProducts] = React.useState<Product[]>([]);
  const [categories, setCategories] = React.useState<Category[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [selectedCategory, setSelectedCategory] = React.useState("");
  const [sortBy, setSortBy] = React.useState("featured");
  const [viewMode, setViewMode] = React.useState<"grid" | "list">("grid");
  const [showFilters, setShowFilters] = React.useState(false);
  const [selectedCategories, setSelectedCategories] = React.useState<string[]>(
    [],
  );
  const [inStockOnly, setInStockOnly] = React.useState(false);
  const [cartCount, setCartCount] = React.useState(0);
  const [wishlistItems, setWishlistItems] = React.useState<Set<number>>(
    new Set(),
  );
  const [hoveredProduct, setHoveredProduct] = React.useState<number | null>(
    null,
  );

  const mockProducts: Product[] = [
    {
      id: 1,
      name: "Shampoing Premium Moroccan Gold",
      description:
        "Shampoing enrichi aux huiles essentielles marocaines pour cheveux secs et abîmés",
      price: 89.99,
      original_price: 119.99,
      image:
        "https://images.unsplash.com/photo-1556228720-195a672e8a03?w=600&h=600&fit=crop",
      category: "Shampoings & Soins",
      brand: "MoroccanCare",
      rating: 4.8,
      review_count: 127,
      in_stock: true,
      is_featured: true,
      isNew: true,
      isPromo: true,
      promoPrice: 79.99,
      tags: ["Bio", "Huiles essentielles", "Anti-âge"],
      discount: 25,
      quickShip: true,
      verified: true,
      exclusive: true,
    },
    {
      id: 2,
      name: "Cire à Cheveux Gold Edition Premium",
      description:
        "Cire de coiffage longue tenue avec finition naturelle et protection UV",
      price: 45.99,
      image:
        "https://images.unsplash.com/photo-1559056199-641a0ac8b55e?w=600&h=600&fit=crop",
      category: "Cires & Pommades",
      brand: "StylePro",
      rating: 4.6,
      review_count: 89,
      in_stock: true,
      is_featured: true,
      tags: ["Longue tenue", "Protection UV", "Finition mate"],
      quickShip: true,
      verified: true,
    },
    {
      id: 3,
      name: "Kit Barbier Professionnel Deluxe",
      description:
        "Kit complet avec ciseaux japonais, peignes en carbone et accessoires premium",
      price: 199.99,
      original_price: 249.99,
      image:
        "https://images.unsplash.com/photo-1503951458645-643d53bfd90f?w=600&h=600&fit=crop",
      category: "Kits Complets",
      brand: "BarberElite",
      rating: 4.9,
      review_count: 203,
      in_stock: true,
      is_featured: true,
      isNew: true,
      tags: ["Professionnel", "Acier japonais", "Garantie 5 ans"],
      discount: 20,
      verified: true,
      exclusive: true,
    },
    {
      id: 4,
      name: "Parfum Masculin Royal Oud",
      description:
        "Fragrance exclusive aux notes de bois de oud, épices orientales et ambre",
      price: 129.99,
      image:
        "https://images.unsplash.com/photo-1541643600914-78b084683601?w=600&h=600&fit=crop",
      category: "Parfums & Fragrances",
      brand: "RoyalScents",
      rating: 4.7,
      review_count: 156,
      in_stock: true,
      is_featured: false,
      tags: ["Oud", "Longue tenue", "Oriental"],
      verified: true,
    },
    {
      id: 5,
      name: "Pommade Texturante Bio",
      description: "Pommade pour volume et texture naturelle, formule 100% bio",
      price: 32.99,
      image:
        "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=600&h=600&fit=crop",
      category: "Cires & Pommades",
      brand: "TextureLab",
      rating: 4.5,
      review_count: 78,
      in_stock: true,
      is_featured: false,
      tags: ["Bio", "Volume", "Naturel"],
      quickShip: true,
    },
    {
      id: 6,
      name: "Ciseaux de Précision Titanium",
      description:
        "Ciseaux professionnels en titane avec lame convexe ultra-tranchante",
      price: 89.99,
      image:
        "https://images.unsplash.com/photo-1503951458645-643d53bfd90f?w=600&h=600&fit=crop",
      category: "Outils & Accessoires",
      brand: "PrecisionTools",
      rating: 4.8,
      review_count: 94,
      in_stock: true,
      is_featured: false,
      tags: ["Titanium", "Professionnel", "Ultra-tranchant"],
      verified: true,
    },
  ];

  const uniqueBrands = Array.from(new Set(mockProducts.map((p) => p.brand)));
  const [selectedBrands, setSelectedBrands] = React.useState<string[]>([]);
  const [minRating, setMinRating] = React.useState(1);

  const prices = mockProducts.map((p) => p.price);
  const minPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxPrice = prices.length > 0 ? Math.max(...prices) : 1000;
  const [priceRange, setPriceRange] = React.useState<[number, number]>([
    minPrice,
    maxPrice,
  ]);

  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setGlobalError(event.message || "Erreur inconnue");
    };
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);

  React.useEffect(() => {
    loadCategories();
    loadProducts();
  }, [searchTerm, selectedCategory, sortBy]);

  const loadCategories = async () => {
    try {
      setCategories([
        {
          id: 1,
          name: "Shampoings & Soins",
          description: "Produits de soin capillaire",
          icon: "🧴",
          count: 24,
        },
        {
          id: 2,
          name: "Cires & Pommades",
          description: "Produits de coiffage",
          icon: "💈",
          count: 18,
        },
        {
          id: 3,
          name: "Outils & Accessoires",
          description: "Outils de barbier",
          icon: "✂️",
          count: 15,
        },
        {
          id: 4,
          name: "Parfums & Fragrances",
          description: "Parfums masculins",
          icon: "🍃",
          count: 12,
        },
        {
          id: 5,
          name: "Kits Complets",
          description: "Kits de soin complets",
          icon: "📦",
          count: 8,
        },
      ]);
    } catch (error) {
      console.error("Error loading categories:", error);
    }
  };

  const loadProducts = async () => {
    setLoading(true);
    try {
      let filteredProducts = mockProducts.filter((product) => {
        const matchesSearch =
          product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          product.description
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          product.brand.toLowerCase().includes(searchTerm.toLowerCase());
        const inSelectedCategories =
          selectedCategories.length === 0 ||
          selectedCategories.includes(product.category);
        const inPriceRange =
          product.price >= priceRange[0] && product.price <= priceRange[1];
        const inSelectedBrands =
          selectedBrands.length === 0 || selectedBrands.includes(product.brand);
        const matchesRating = product.rating >= minRating;
        const matchesStock = !inStockOnly || product.in_stock;
        return (
          matchesSearch &&
          inSelectedCategories &&
          inPriceRange &&
          inSelectedBrands &&
          matchesRating &&
          matchesStock
        );
      });

      switch (sortBy) {
        case "price-low":
          filteredProducts.sort((a, b) => a.price - b.price);
          break;
        case "price-high":
          filteredProducts.sort((a, b) => b.price - a.price);
          break;
        case "rating":
          filteredProducts.sort((a, b) => b.rating - a.rating);
          break;
        case "newest":
          filteredProducts.sort(
            (a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0),
          );
          break;
        case "featured":
        default:
          filteredProducts.sort(
            (a, b) => (b.is_featured ? 1 : 0) - (a.is_featured ? 1 : 0),
          );
          break;
      }

      setProducts(filteredProducts);
    } catch (error) {
      console.error("Error loading products:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddToCart = (product: Product) => {
    setCartCount((prev) => prev + 1);
    console.log("Adding to cart:", product);
  };

  const handleWishlist = (productId: number) => {
    setWishlistItems((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(productId)) {
        newSet.delete(productId);
      } else {
        newSet.add(productId);
      }
      return newSet;
    });
  };

  if (globalError) {
    return (
      <div className="min-h-screen bg-moroccan-charcoal flex items-center justify-center p-6">
        <div className="bg-red-900/20 border border-red-500/50 rounded-xl p-8 max-w-lg">
          <h2 className="text-xl font-bold text-red-400 mb-4">
            Erreur du Marketplace
          </h2>
          <pre className="text-red-300 whitespace-pre-wrap text-sm">
            {globalError}
          </pre>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background relative overflow-hidden modern-bg">
      {/* Modern background pattern */}
      <div className="absolute inset-0 bg-modern-gradient-light opacity-50"></div>
      <div className="absolute inset-0 modern-pattern"></div>

      {/* Advanced header with glass morphism */}
      <header className="sticky top-0 z-50 w-full border-b border-border/20 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto px-6 py-4">
          {/* Top bar */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-4">
              <Link to="/" className="flex items-center space-x-3 group">
                <div className="w-12 h-12 bg-modern-gradient-primary rounded-xl flex items-center justify-center shadow-xl shadow-accent/20 group-hover:scale-105 transition-transform">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-modern-blue">
                    ShopTheBarber
                  </h1>
                  <p className="text-xs text-muted-foreground">
                    Premium Marketplace
                  </p>
                </div>
              </Link>
            </div>

            {/* Premium search bar */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-accent group-focus-within:text-primary transition-colors" />
                <Input
                  placeholder="Rechercher parmi 1,000+ produits premium..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-12 pr-4 py-3 bg-card/60 border-2 border-border/30 text-foreground placeholder:text-muted-foreground/50 focus:border-accent focus:bg-card/80 transition-all rounded-xl text-lg backdrop-blur-sm"
                />
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex items-center space-x-2">
                  <kbd className="px-2 py-1 text-xs bg-accent/20 text-accent rounded">
                    ⌘K
                  </kbd>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex items-center space-x-3">
              <Button
                variant="ghost"
                size="sm"
                className="relative text-accent hover:bg-accent/10 hover:text-primary transition-all"
              >
                <Heart className="w-5 h-5" />
                {wishlistItems.size > 0 && (
                  <span className="absolute -top-2 -right-2 bg-modern-purple text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                    {wishlistItems.size}
                  </span>
                )}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="relative text-accent hover:bg-accent/10 hover:text-primary transition-all"
              >
                <ShoppingCart className="w-5 h-5" />
                {cartCount > 0 && (
                  <span className="absolute -top-2 -right-2 bg-accent text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
                    {cartCount}
                  </span>
                )}
              </Button>
              <div className="w-px h-6 bg-border/20"></div>
              <div className="w-8 h-8 bg-modern-gradient-primary rounded-full flex items-center justify-center text-white font-bold text-sm">
                U
              </div>
            </div>
          </div>

          {/* Navigation and controls */}
          <div className="flex items-center justify-between">
            {/* Category quick nav */}
            <div className="flex items-center space-x-6">
              {categories.slice(0, 5).map((category) => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.name)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-lg transition-all ${
                    selectedCategory === category.name
                      ? "bg-accent text-white"
                      : "text-foreground hover:text-accent hover:bg-accent/10"
                  }`}
                >
                  <span className="text-sm">{category.icon}</span>
                  <span className="text-sm font-medium">{category.name}</span>
                  <span className="text-xs opacity-60">({category.count})</span>
                </button>
              ))}
            </div>

            {/* View controls */}
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 bg-muted/60 rounded-lg p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("grid")}
                  className={`${viewMode === "grid" ? "bg-accent text-white" : "text-foreground hover:text-accent"}`}
                >
                  <Grid3X3 className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={`${viewMode === "list" ? "bg-accent text-white" : "text-foreground hover:text-accent"}`}
                >
                  <List className="w-4 h-4" />
                </Button>
              </div>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-48 bg-card/60 border-border/30 text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card border-border/30">
                  <SelectItem value="featured">🌟 Mis en avant</SelectItem>
                  <SelectItem value="newest">🆕 Plus récents</SelectItem>
                  <SelectItem value="price-low">💰 Prix croissant</SelectItem>
                  <SelectItem value="price-high">
                    💎 Prix décroissant
                  </SelectItem>
                  <SelectItem value="rating">⭐ Mieux notés</SelectItem>
                </SelectContent>
              </Select>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowFilters(!showFilters)}
                className="border-border/30 text-foreground hover:bg-accent/10"
              >
                <SlidersHorizontal className="w-4 h-4 mr-2" />
                Filtres
                {showFilters && <X className="w-4 h-4 ml-2" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main content */}
      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Hero stats bar */}
        <div className="bg-moroccan-darkgrey/40 backdrop-blur-sm rounded-2xl p-6 mb-8 border border-moroccan-gold/20">
          <div className="grid grid-cols-4 gap-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-moroccan-gold mb-1">
                1,000+
              </div>
              <div className="text-sm text-moroccan-sand">Produits Premium</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-moroccan-gold mb-1">
                50+
              </div>
              <div className="text-sm text-moroccan-sand">
                Marques Partenaires
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-moroccan-gold mb-1">
                24h
              </div>
              <div className="text-sm text-moroccan-sand">
                Livraison Express
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-moroccan-gold mb-1">
                4.9/5
              </div>
              <div className="text-sm text-moroccan-sand">
                Satisfaction Client
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
          {/* Advanced filters sidebar */}
          {showFilters && (
            <aside className="w-80 space-y-6 animate-slide-in">
              <Card className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-moroccan-gold flex items-center gap-2">
                    <SlidersHorizontal className="w-5 h-5" />
                    Filtres Avancés
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Categories */}
                  <div>
                    <h3 className="text-foreground font-semibold mb-3">
                      Catégories
                    </h3>
                    <div className="space-y-2">
                      {categories.map((category) => (
                        <label
                          key={category.id}
                          className="flex items-center gap-3 cursor-pointer text-muted-foreground hover:text-accent transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedCategories.includes(category.name)}
                            onChange={() => {
                              setSelectedCategories((prev) =>
                                prev.includes(category.name)
                                  ? prev.filter((c) => c !== category.name)
                                  : [...prev, category.name],
                              );
                            }}
                            className="w-4 h-4 rounded border-border/60 bg-background text-accent focus:ring-accent"
                          />
                          <span className="flex items-center gap-2">
                            <span>{category.icon}</span>
                            {category.name}
                            <span className="text-xs text-accent">
                              ({category.count})
                            </span>
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Price range */}
                  <div>
                    <h3 className="text-moroccan-sand font-semibold mb-3">
                      Gamme de Prix
                    </h3>
                    <div className="space-y-3">
                      <input
                        type="range"
                        min={minPrice}
                        max={maxPrice}
                        value={priceRange[1]}
                        onChange={(e) =>
                          setPriceRange([minPrice, Number(e.target.value)])
                        }
                        className="w-full h-2 bg-moroccan-darkgrey rounded-lg appearance-none cursor-pointer accent-moroccan-gold"
                      />
                      <div className="flex justify-between text-sm">
                        <span className="text-moroccan-gold font-semibold">
                          {minPrice}€
                        </span>
                        <span className="text-moroccan-gold font-semibold">
                          {priceRange[1]}€
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Brands */}
                  <div>
                    <h3 className="text-moroccan-sand font-semibold mb-3">
                      Marques
                    </h3>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {uniqueBrands.map((brand) => (
                        <label
                          key={brand}
                          className="flex items-center gap-3 cursor-pointer text-moroccan-cream hover:text-moroccan-gold transition-colors"
                        >
                          <input
                            type="checkbox"
                            checked={selectedBrands.includes(brand)}
                            onChange={() => {
                              setSelectedBrands((prev) =>
                                prev.includes(brand)
                                  ? prev.filter((b) => b !== brand)
                                  : [...prev, brand],
                              );
                            }}
                            className="w-4 h-4 rounded border-moroccan-gold/60 bg-moroccan-darkgrey text-moroccan-gold focus:ring-moroccan-gold"
                          />
                          <span>{brand}</span>
                        </label>
                      ))}
                    </div>
                  </div>

                  {/* Rating */}
                  <div>
                    <h3 className="text-moroccan-sand font-semibold mb-3">
                      Note Minimum
                    </h3>
                    <div className="flex items-center gap-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          onClick={() => setMinRating(star)}
                          className={`text-xl transition-all ${minRating >= star ? "text-moroccan-gold scale-110" : "text-moroccan-gold/30 hover:text-moroccan-gold/70"}`}
                        >
                          ⭐
                        </button>
                      ))}
                      <span className="ml-2 text-moroccan-gold font-semibold">
                        {minRating}+
                      </span>
                    </div>
                  </div>

                  {/* Stock */}
                  <div>
                    <label className="flex items-center gap-3 cursor-pointer text-moroccan-cream hover:text-moroccan-gold transition-colors">
                      <input
                        type="checkbox"
                        checked={inStockOnly}
                        onChange={(e) => setInStockOnly(e.target.checked)}
                        className="w-4 h-4 rounded border-moroccan-gold/60 bg-moroccan-darkgrey text-moroccan-gold focus:ring-moroccan-gold"
                      />
                      <span>En stock uniquement</span>
                    </label>
                  </div>

                  {/* Reset button */}
                  <Button
                    onClick={() => {
                      setSelectedCategories([]);
                      setPriceRange([minPrice, maxPrice]);
                      setSelectedBrands([]);
                      setMinRating(1);
                      setInStockOnly(false);
                    }}
                    className="w-full bg-moroccan-gold/20 text-moroccan-gold hover:bg-moroccan-gold hover:text-moroccan-charcoal transition-all"
                  >
                    Réinitialiser
                  </Button>
                </CardContent>
              </Card>
            </aside>
          )}

          {/* Products section */}
          <section className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <div className="text-center space-y-4">
                  <div className="w-16 h-16 border-4 border-moroccan-gold border-t-transparent rounded-full animate-spin mx-auto"></div>
                  <p className="text-moroccan-sand text-lg">
                    Chargement des produits premium...
                  </p>
                </div>
              </div>
            ) : products.length > 0 ? (
              <div
                className={`${
                  viewMode === "grid"
                    ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
                    : "space-y-4"
                } animate-fade-in`}
              >
                {products.map((product) => (
                  <div
                    key={product.id}
                    className={`group relative ${
                      viewMode === "grid"
                        ? "bg-moroccan-darkgrey/60 rounded-2xl overflow-hidden border border-moroccan-gold/20 hover:border-moroccan-gold/50 transition-all duration-300 hover:scale-105 hover:shadow-2xl hover:shadow-moroccan-gold/20 backdrop-blur-sm"
                        : "bg-moroccan-darkgrey/60 rounded-xl p-4 border border-moroccan-gold/20 hover:border-moroccan-gold/50 transition-all flex items-center gap-4 backdrop-blur-sm"
                    }`}
                    onMouseEnter={() => setHoveredProduct(product.id)}
                    onMouseLeave={() => setHoveredProduct(null)}
                  >
                    {/* Badges */}
                    <div className="absolute top-3 left-3 z-20 flex flex-col gap-1">
                      {product.exclusive && (
                        <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white text-xs px-2 py-1">
                          <Crown className="w-3 h-3 mr-1" />
                          Exclusif
                        </Badge>
                      )}
                      {product.isNew && (
                        <Badge className="bg-gradient-to-r from-green-500 to-green-600 text-white text-xs px-2 py-1">
                          <Sparkles className="w-3 h-3 mr-1" />
                          Nouveau
                        </Badge>
                      )}
                      {product.isPromo && (
                        <Badge className="bg-gradient-to-r from-red-500 to-red-600 text-white text-xs px-2 py-1">
                          <Zap className="w-3 h-3 mr-1" />-{product.discount}%
                        </Badge>
                      )}
                    </div>

                    {/* Quick actions */}
                    <div className="absolute top-3 right-3 z-20 flex flex-col gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleWishlist(product.id)}
                        className={`w-8 h-8 p-0 rounded-full backdrop-blur-sm border transition-all ${
                          wishlistItems.has(product.id)
                            ? "bg-red-500 text-white border-red-500"
                            : "bg-moroccan-darkgrey/80 text-moroccan-gold border-moroccan-gold/30 hover:bg-red-500 hover:text-white"
                        }`}
                      >
                        <Heart className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0 rounded-full bg-moroccan-darkgrey/80 text-moroccan-gold border border-moroccan-gold/30 hover:bg-moroccan-gold hover:text-moroccan-charcoal transition-all backdrop-blur-sm"
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="w-8 h-8 p-0 rounded-full bg-moroccan-darkgrey/80 text-moroccan-gold border border-moroccan-gold/30 hover:bg-moroccan-gold hover:text-moroccan-charcoal transition-all backdrop-blur-sm"
                      >
                        <Share2 className="w-4 h-4" />
                      </Button>
                    </div>

                    {viewMode === "grid" ? (
                      <>
                        {/* Product image */}
                        <div className="relative aspect-square overflow-hidden">
                          <img
                            src={product.image}
                            alt={product.name}
                            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                          />
                          {hoveredProduct === product.id && (
                            <div className="absolute inset-0 bg-black/20 flex items-center justify-center">
                              <Button
                                onClick={() => handleAddToCart(product)}
                                className="bg-moroccan-gold text-moroccan-charcoal hover:bg-moroccan-copper transition-all transform translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100"
                              >
                                <ShoppingCart className="w-4 h-4 mr-2" />
                                Ajouter au panier
                              </Button>
                            </div>
                          )}
                        </div>

                        {/* Product info */}
                        <div className="p-4 space-y-3">
                          <div className="flex items-start justify-between">
                            <div className="space-y-1">
                              <h3 className="font-bold text-moroccan-sand group-hover:text-moroccan-gold transition-colors line-clamp-2">
                                {product.name}
                              </h3>
                              <p className="text-xs text-moroccan-cream/60 uppercase tracking-wide font-medium">
                                {product.brand}
                              </p>
                            </div>
                            {product.verified && (
                              <Shield className="w-4 h-4 text-blue-400 flex-shrink-0" />
                            )}
                          </div>

                          {/* Rating */}
                          <div className="flex items-center gap-2">
                            <div className="flex">
                              {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                  key={star}
                                  className={`w-3 h-3 ${star <= product.rating ? "text-moroccan-gold fill-current" : "text-moroccan-gold/30"}`}
                                />
                              ))}
                            </div>
                            <span className="text-xs text-moroccan-cream">
                              {product.rating} ({product.review_count})
                            </span>
                          </div>

                          {/* Tags */}
                          {product.tags && product.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {product.tags.slice(0, 2).map((tag) => (
                                <span
                                  key={tag}
                                  className="text-xs bg-moroccan-gold/20 text-moroccan-gold px-2 py-1 rounded-full"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Price */}
                          <div className="flex items-center justify-between">
                            <div className="space-y-1">
                              {product.isPromo ? (
                                <div className="flex items-center gap-2">
                                  <span className="text-lg font-bold text-moroccan-gold">
                                    {product.promoPrice}€
                                  </span>
                                  <span className="text-sm text-moroccan-cream/60 line-through">
                                    {product.price}€
                                  </span>
                                </div>
                              ) : (
                                <span className="text-lg font-bold text-moroccan-gold">
                                  {product.price}€
                                </span>
                              )}
                              {product.quickShip && (
                                <div className="flex items-center gap-1 text-xs text-green-400">
                                  <Truck className="w-3 h-3" />
                                  Livraison 24h
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </>
                    ) : (
                      // List view
                      <>
                        <img
                          src={product.image}
                          alt={product.name}
                          className="w-20 h-20 object-cover rounded-lg"
                        />
                        <div className="flex-1 space-y-2">
                          <div className="flex items-start justify-between">
                            <div>
                              <h3 className="font-bold text-moroccan-sand group-hover:text-moroccan-gold transition-colors">
                                {product.name}
                              </h3>
                              <p className="text-sm text-moroccan-cream/60">
                                {product.brand}
                              </p>
                            </div>
                            <div className="text-right">
                              {product.isPromo ? (
                                <div className="space-y-1">
                                  <span className="text-lg font-bold text-moroccan-gold">
                                    {product.promoPrice}€
                                  </span>
                                  <span className="text-sm text-moroccan-cream/60 line-through block">
                                    {product.price}€
                                  </span>
                                </div>
                              ) : (
                                <span className="text-lg font-bold text-moroccan-gold">
                                  {product.price}€
                                </span>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-1">
                                {[1, 2, 3, 4, 5].map((star) => (
                                  <Star
                                    key={star}
                                    className={`w-3 h-3 ${star <= product.rating ? "text-moroccan-gold fill-current" : "text-moroccan-gold/30"}`}
                                  />
                                ))}
                                <span className="text-xs text-moroccan-cream ml-1">
                                  ({product.review_count})
                                </span>
                              </div>
                              {product.tags && (
                                <div className="flex gap-1">
                                  {product.tags.slice(0, 3).map((tag) => (
                                    <span
                                      key={tag}
                                      className="text-xs bg-moroccan-gold/20 text-moroccan-gold px-2 py-1 rounded-full"
                                    >
                                      {tag}
                                    </span>
                                  ))}
                                </div>
                              )}
                            </div>
                            <Button
                              onClick={() => handleAddToCart(product)}
                              className="bg-moroccan-gold text-moroccan-charcoal hover:bg-moroccan-copper transition-all"
                            >
                              <ShoppingCart className="w-4 h-4 mr-2" />
                              Ajouter
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-24 space-y-4">
                <div className="w-16 h-16 bg-moroccan-gold/20 rounded-full flex items-center justify-center mx-auto">
                  <Search className="w-8 h-8 text-moroccan-gold" />
                </div>
                <h3 className="text-xl font-bold text-moroccan-sand">
                  Aucun produit trouvé
                </h3>
                <p className="text-moroccan-cream">
                  Essayez d'ajuster vos filtres ou votre recherche
                </p>
                <Button
                  onClick={() => {
                    setSearchTerm("");
                    setSelectedCategories([]);
                    setSelectedBrands([]);
                    setMinRating(1);
                    setInStockOnly(false);
                    setPriceRange([minPrice, maxPrice]);
                  }}
                  className="bg-moroccan-gold text-moroccan-charcoal hover:bg-moroccan-copper"
                >
                  Réinitialiser les filtres
                </Button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Footer with trust indicators */}
      <footer className="bg-moroccan-darkgrey/80 border-t border-moroccan-gold/20 py-12 mt-16 backdrop-blur-sm">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-4 gap-8 text-center">
            <div className="space-y-2">
              <Shield className="w-8 h-8 text-moroccan-gold mx-auto" />
              <h4 className="font-semibold text-moroccan-sand">
                Paiement Sécurisé
              </h4>
              <p className="text-sm text-moroccan-cream/60">
                SSL & PCI Compliant
              </p>
            </div>
            <div className="space-y-2">
              <Truck className="w-8 h-8 text-moroccan-gold mx-auto" />
              <h4 className="font-semibold text-moroccan-sand">
                Livraison 24h
              </h4>
              <p className="text-sm text-moroccan-cream/60">Gratuite dès 50€</p>
            </div>
            <div className="space-y-2">
              <Award className="w-8 h-8 text-moroccan-gold mx-auto" />
              <h4 className="font-semibold text-moroccan-sand">
                Qualité Premium
              </h4>
              <p className="text-sm text-moroccan-cream/60">
                Produits certifiés
              </p>
            </div>
            <div className="space-y-2">
              <Users className="w-8 h-8 text-moroccan-gold mx-auto" />
              <h4 className="font-semibold text-moroccan-sand">Support 24/7</h4>
              <p className="text-sm text-moroccan-cream/60">Équipe dédiée</p>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

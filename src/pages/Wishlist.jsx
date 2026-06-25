import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { useWishlist } from '../components/wishlist/WishlistContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Search, Share2, Trash2, Grid3x3, List, FolderPlus, Bell, TrendingDown, Check, ArrowUpDown, Star, Eye, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import WishlistCollectionManager from '../components/wishlist/WishlistCollectionManager';
import ProductComparison from '../components/wishlist/ProductComparison';
import ShareWishlistDialog from '../components/wishlist/ShareWishlistDialog';
import PriceAlertConfig from '../components/wishlist/PriceAlertConfig';

export default function Wishlist() {
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState('grid');
  const [sortBy, setSortBy] = useState('recent');
  const [selectedCollection, setSelectedCollection] = useState('all');
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [showComparison, setShowComparison] = useState(false);
  const [showCollectionManager, setShowCollectionManager] = useState(false);
  const [showShareDialog, setShowShareDialog] = useState(false);

  const { data: user } = useQuery({ queryKey: ['current-user'], queryFn: () => sovereign.auth.me() });

  const { data: products = [], isLoading: productsLoading } = useQuery({
    queryKey: ['wishlist-products', wishlistItems],
    queryFn: async () => {
      if (wishlistItems.length === 0) return [];
      const allProducts = await sovereign.entities.Product.list();
      return allProducts.filter(p => wishlistItems.some(w => w.product_id === p.id));
    },
    enabled: wishlistItems.length > 0
  });

  const { data: collections = [] } = useQuery({
    queryKey: ['wishlist-items', user?.id],
    queryFn: async () => user ? await sovereign.entities.WishlistItem.filter({ user_id: user.id }) : [],
    enabled: !!user
  });

  const priceAlerts = [];

  const enrichedProducts = products.map(product => {
    const wishlistItem = wishlistItems.find(w => w.product_id === product.id);
    const priceAlert = priceAlerts.find(a => a.product_id === product.id);
    const priceDrop = priceAlert && product.price < priceAlert.original_price;
    const dropPercentage = priceDrop ? Math.round(((priceAlert.original_price - product.price) / priceAlert.original_price) * 100) : 0;
    return { ...product, addedDate: wishlistItem?.added_date, originalPrice: wishlistItem?.original_price, hasPriceAlert: !!priceAlert, priceDrop, dropPercentage };
  });

  const filteredProducts = enrichedProducts.filter(product => {
    const matchesSearch = product.name?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCollection = selectedCollection === 'all' || collections.find(c => c.id === selectedCollection)?.product_ids?.includes(product.id);
    return matchesSearch && matchesCollection;
  }).sort((a, b) => { 
    if (sortBy === 'recent') return new Date(b.addedDate) - new Date(a.addedDate); 
    if (sortBy === 'price_asc') return a.price - b.price; 
    if (sortBy === 'price_desc') return b.price - a.price; 
    if (sortBy === 'name') return a.name.localeCompare(b.name); 
    if (sortBy === 'discount') return b.dropPercentage - a.dropPercentage; 
    return 0; 
  });

  const toggleProductSelection = (productId) => setSelectedProducts(prev => prev.includes(productId) ? prev.filter(id => id !== productId) : [...prev, productId]);
  const handleCompare = () => { if (selectedProducts.length >= 2) setShowComparison(true); };
  const totalValue = filteredProducts.reduce((sum, p) => sum + p.price, 0);
  const priceDropCount = filteredProducts.filter(p => p.priceDrop).length;

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#F7F8FA] py-12">
        <Card className="max-w-md w-full mx-4 rounded-[12px]">
          <CardContent className="p-12 text-center">
            <Heart className="w-20 h-20 text-slate-300 mx-auto mb-6" />
            <h2 className="text-2xl font-bold text-[#0B2545] mb-4">Connectez-vous pour voir votre wishlist</h2>
            <p className="text-[#4B5563] mb-8">Sauvegardez vos produits favoris et recevez des alertes de prix</p>
            <Button onClick={() => sovereign.auth.redirectToLogin(window.location.href)} className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">Se connecter</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen py-12 bg-[#F7F8FA]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
            <div>
              <h1 className="text-4xl font-bold text-[#0B2545] mb-2">Ma Liste de Souhaits</h1>
              <p className="text-[#4B5563]">{filteredProducts.length} produit(s) • Valeur totale: {totalValue.toFixed(2)}€</p>
            </div>
            <div className="flex gap-3 flex-wrap">
              <Button onClick={() => setShowCollectionManager(true)} variant="outline" className="border-slate-200 rounded-[10px] min-h-[44px]"><FolderPlus className="w-4 h-4 mr-2" />Collections</Button>
              <Button onClick={() => setShowShareDialog(true)} variant="outline" className="border-slate-200 rounded-[10px] min-h-[44px]" disabled={filteredProducts.length === 0}><Share2 className="w-4 h-4 mr-2" />Partager</Button>
              <Button onClick={handleCompare} variant="outline" className="border-slate-200 rounded-[10px] min-h-[44px]" disabled={selectedProducts.length < 2}><ArrowUpDown className="w-4 h-4 mr-2" />Comparer ({selectedProducts.length})</Button>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[{ icon: Heart, label: "Produits", value: filteredProducts.length, color: "bg-[#D08B3D]" }, { icon: TrendingDown, label: "Baisses de prix", value: priceDropCount, color: "bg-[#1E7A4B]" }, { icon: Package, label: "Valeur totale", value: `${totalValue.toFixed(0)}€`, color: "bg-[#0B2545]" }, { icon: Bell, label: "Alertes actives", value: priceAlerts.length, color: "bg-[#4B5563]" }].map((stat, i) => (
              <Card key={i} className="rounded-[12px] border-2 border-slate-200">
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 ${stat.color} rounded-[10px] flex items-center justify-center`}><stat.icon className="w-6 h-6 text-white" /></div>
                    <div><p className="text-2xl font-bold text-[#0B2545]">{stat.value}</p><p className="text-sm text-[#4B5563]">{stat.label}</p></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </motion.div>

        <div className="bg-white rounded-[12px] p-6 mb-8 shadow-lg border border-slate-200">
          <div className="flex flex-col lg:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-[#4B5563] w-5 h-5" />
              <Input placeholder="Rechercher dans la wishlist..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-12 h-12 border-slate-200 rounded-[10px] focus:ring-[#D08B3D] focus:border-[#D08B3D]" />
            </div>
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger className="w-full lg:w-48 h-12 border-slate-200 rounded-[10px]"><SelectValue placeholder="Collection" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Toutes les collections</SelectItem>
                {collections.map((collection) => <SelectItem key={collection.id} value={collection.id}>{collection.icon} {collection.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48 h-12 border-slate-200 rounded-[10px]"><SelectValue placeholder="Trier par" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Plus Récents</SelectItem>
                <SelectItem value="name">Nom A-Z</SelectItem>
                <SelectItem value="price_asc">Prix Croissant</SelectItem>
                <SelectItem value="price_desc">Prix Décroissant</SelectItem>
                <SelectItem value="discount">Meilleures Promos</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setViewMode('grid')} className={`h-12 w-12 rounded-[10px] min-h-[44px] min-w-[44px] ${viewMode === 'grid' ? 'bg-[#0B2545]/10 border-[#0B2545]' : 'border-slate-200'}`}><Grid3x3 className="w-5 h-5" /></Button>
              <Button variant="outline" size="icon" onClick={() => setViewMode('list')} className={`h-12 w-12 rounded-[10px] min-h-[44px] min-w-[44px] ${viewMode === 'list' ? 'bg-[#0B2545]/10 border-[#0B2545]' : 'border-slate-200'}`}><List className="w-5 h-5" /></Button>
            </div>
          </div>
        </div>

        {productsLoading ? (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-6`}>
            {[...Array(8)].map((_, i) => <Card key={i} className="rounded-[12px] border-slate-200"><Skeleton className="aspect-square w-full" /><div className="p-5 space-y-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-6 w-1/2" /></div></Card>)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <Card className="rounded-[12px] border-2 border-slate-200 p-12 text-center">
            <Heart className="w-20 h-20 text-slate-300 mx-auto mb-6" />
            <h3 className="text-2xl font-bold text-[#0B2545] mb-3">Votre wishlist est vide</h3>
            <p className="text-[#4B5563] mb-8">Explorez nos produits et ajoutez vos favoris</p>
            <Link to={createPageUrl('Marketplace')}><Button className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]">Découvrir les Produits</Button></Link>
          </Card>
        ) : (
          <motion.div layout className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
            <AnimatePresence>
              {filteredProducts.map((product, index) => (
                <motion.div key={product.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: index * 0.03 }}>
                  <Card className={`group rounded-[12px] border-2 overflow-hidden hover:shadow-2xl transition-all ${selectedProducts.includes(product.id) ? 'border-[#D08B3D] bg-[#D08B3D]/5' : 'border-slate-200 hover:border-[#D08B3D]'}`}>
                    <div className="relative aspect-square overflow-hidden bg-slate-100">
                      {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full bg-gradient-to-br from-[#D08B3D]/20 to-[#D08B3D]/5 flex items-center justify-center"><Package className="w-16 h-16 text-slate-300" /></div>}
                      {product.priceDrop && <Badge className="absolute top-3 left-3 bg-[#1E7A4B] border-0 text-white text-xs px-2 py-1 shadow-lg"><TrendingDown className="w-3 h-3 mr-1" />-{product.dropPercentage}%</Badge>}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant={selectedProducts.includes(product.id) ? 'default' : 'secondary'} className="w-9 h-9 rounded-full shadow-lg min-h-[44px] min-w-[44px]" onClick={() => toggleProductSelection(product.id)}><Check className="w-4 h-4" /></Button>
                        <Button size="icon" className="w-9 h-9 rounded-full bg-[#D6454A] hover:bg-[#D6454A]/90 text-white shadow-lg min-h-[44px] min-w-[44px]" onClick={() => removeFromWishlist(product.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <div className="p-5 bg-white">
                      <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}><h3 className="font-bold text-[#0B2545] mb-2 line-clamp-2 group-hover:text-[#D08B3D] transition-colors">{product.name}</h3></Link>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating || 5) ? 'text-[#D08B3D] fill-current' : 'text-slate-200'}`} />)}</div>
                        <span className="text-xs text-[#4B5563]">({product.total_reviews || 0})</span>
                      </div>
                      <div className="space-y-2 mb-4">
                        {product.priceDrop ? (<div><div className="flex items-center gap-2"><span className="text-2xl font-bold text-[#1E7A4B]">{product.price}€</span><span className="text-lg text-[#4B5563] line-through">{product.originalPrice}€</span></div><p className="text-xs text-[#1E7A4B] font-semibold">Économisez {(product.originalPrice - product.price).toFixed(2)}€</p></div>) : (<span className="text-2xl font-bold text-[#0B2545]">{product.price}€</span>)}
                      </div>
                      <div className="flex gap-2">
                        <Link to={createPageUrl(`ProductDetail?id=${product.id}`)} className="flex-1"><Button variant="outline" size="sm" className="w-full border-slate-200 rounded-[8px] min-h-[44px]"><Eye className="w-4 h-4 mr-2" />Voir</Button></Link>
                        <PriceAlertConfig product={product} trigger={<Button size="icon" variant="outline" className={`border-slate-200 rounded-[8px] min-h-[44px] min-w-[44px] ${product.hasPriceAlert ? 'bg-[#0B2545]/10 border-[#0B2545] text-[#0B2545]' : ''}`}><Bell className="w-4 h-4" /></Button>} />
                      </div>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>

      <WishlistCollectionManager open={showCollectionManager} onOpenChange={setShowCollectionManager} collections={collections} products={products} />
      <ShareWishlistDialog open={showShareDialog} onOpenChange={setShowShareDialog} products={filteredProducts} />
      {showComparison && <ProductComparison products={products.filter(p => selectedProducts.includes(p.id))} onClose={() => { setShowComparison(false); setSelectedProducts([]); }} />}
    </div>
  );
}
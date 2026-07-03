import { useState } from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { useWishlist } from '../components/wishlist/WishlistContext';
import SearchField from '@/components/ui/search-field';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Heart, Share2, Trash2, Grid3x3, List, FolderPlus, Bell, TrendingDown, Check, ArrowUpDown, Star, Eye, Package } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Skeleton } from '@/components/ui/skeleton';
import WishlistCollectionManager from '../components/wishlist/WishlistCollectionManager';
import ProductComparison from '../components/wishlist/ProductComparison';
import ShareWishlistDialog from '../components/wishlist/ShareWishlistDialog';
import PriceAlertConfig from '../components/wishlist/PriceAlertConfig';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { MetaTags } from '@/components/seo/MetaTags';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

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
      const allProducts = await sovereign.products.listPublic();
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
      <div className="stb-page flex items-center justify-center py-12 px-4">
        <MetaTags title="Wishlist" description="Save products and track price drops" />
        <div className={cn(stb.panel, 'max-w-md w-full p-12 text-center')}>
          <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
          <h2 className={cn(stb.uiHeading, 'text-2xl mb-4')}>Sign in to view your wishlist</h2>
          <p className={cn(stb.body, 'text-muted-foreground mb-8')}>Save your favorite products and get price alerts</p>
          <Button onClick={() => sovereign.auth.redirectToLogin(window.location.href)} className="min-h-[44px]">Sign in</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="stb-page lg:pb-8">
      <MetaTags title="My Wishlist" description="Saved marketplace products and price alerts" />
      <PageHeader
        label="Marketplace"
        title="My wishlist"
        subtitle={`${filteredProducts.length} item(s) • Total value: $${totalValue.toFixed(2)}`}
        compact
        variant="light"
        tier="app"
      >
        <Button onClick={() => setShowCollectionManager(true)} variant="outline" className="min-h-[44px]"><FolderPlus className="w-4 h-4 mr-2" />Collections</Button>
        <Button onClick={() => setShowShareDialog(true)} variant="outline" className="min-h-[44px]" disabled={filteredProducts.length === 0}><Share2 className="w-4 h-4 mr-2" />Share</Button>
        <Button onClick={handleCompare} variant="outline" className="min-h-[44px]" disabled={selectedProducts.length < 2}><ArrowUpDown className="w-4 h-4 mr-2" />Compare ({selectedProducts.length})</Button>
      </PageHeader>

      <PageContent>
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Heart, label: 'Products', value: filteredProducts.length, color: 'bg-primary' },
              { icon: TrendingDown, label: 'Price drops', value: priceDropCount, color: 'bg-success' },
              { icon: Package, label: 'Total value', value: `$${totalValue.toFixed(0)}`, color: 'bg-foreground' },
              { icon: Bell, label: 'Active alerts', value: priceAlerts.length, color: 'bg-muted-foreground' },
            ].map((stat, i) => (
              <div key={i} className={cn(stb.panel, 'p-4')}>
                <div className="flex items-center gap-3">
                  <div className={cn('w-12 h-12 rounded-lg flex items-center justify-center text-primary-foreground', stat.color)}>
                    <stat.icon className="w-6 h-6" />
                  </div>
                  <div>
                    <p className={cn(stb.metricValue, 'text-2xl')}>{stat.value}</p>
                    <p className={cn(stb.caption, 'text-muted-foreground')}>{stat.label}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <div className={cn(stb.panel, 'p-6 mb-8')}>
          <div className="flex flex-col lg:flex-row gap-4">
            <SearchField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search wishlist..."
              size="lg"
              className="flex-1"
              aria-label="Search wishlist"
            />
            <Select value={selectedCollection} onValueChange={setSelectedCollection}>
              <SelectTrigger className="w-full lg:w-48 h-12 border-border rounded-lg"><SelectValue placeholder="Collection" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All collections</SelectItem>
                {collections.map((collection) => <SelectItem key={collection.id} value={collection.id}>{collection.icon} {collection.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full lg:w-48 h-12 border-border rounded-lg"><SelectValue placeholder="Sort by" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="name">Name A-Z</SelectItem>
                <SelectItem value="price_asc">Price: low to high</SelectItem>
                <SelectItem value="price_desc">Price: high to low</SelectItem>
                <SelectItem value="discount">Best deals</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button variant="outline" size="icon" onClick={() => setViewMode('grid')} className={cn('h-12 w-12 min-h-[44px] min-w-[44px]', viewMode === 'grid' && 'bg-foreground/5 border-foreground')}><Grid3x3 className="w-5 h-5" /></Button>
              <Button variant="outline" size="icon" onClick={() => setViewMode('list')} className={cn('h-12 w-12 min-h-[44px] min-w-[44px]', viewMode === 'list' && 'bg-foreground/5 border-foreground')}><List className="w-5 h-5" /></Button>
            </div>
          </div>
        </div>

        {productsLoading ? (
          <div className={`grid ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'} gap-6`}>
            {[...Array(8)].map((_, i) => <div key={i} className={cn(stb.surface, 'overflow-hidden')}><Skeleton className="aspect-square w-full" /><div className="p-5 space-y-3"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-6 w-1/2" /></div></div>)}
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className={cn(stb.panel, 'p-12 text-center')}>
            <Heart className="w-16 h-16 text-muted-foreground mx-auto mb-6" />
            <h3 className={cn(stb.uiHeading, 'text-2xl mb-3')}>Your wishlist is empty</h3>
            <p className={cn(stb.body, 'text-muted-foreground mb-8')}>Browse products and save your favorites</p>
            <Link to={createPageUrl('Marketplace')}><Button className="min-h-[44px]">Browse products</Button></Link>
          </div>
        ) : (
          <motion.div layout className={`grid gap-6 ${viewMode === 'grid' ? 'grid-cols-2 md:grid-cols-3 lg:grid-cols-4' : 'grid-cols-1'}`}>
            <AnimatePresence>
              {filteredProducts.map((product, index) => (
                <motion.div key={product.id} layout initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }} transition={{ delay: index * 0.03 }}>
                  <div className={cn(stb.surface, stb.surfaceHover, 'group overflow-hidden transition-all', selectedProducts.includes(product.id) ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'hover:border-primary/40')}>
                    <div className="relative aspect-square overflow-hidden bg-muted">
                      {product.image_url ? <img src={product.image_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" /> : <div className="w-full h-full bg-primary/10 flex items-center justify-center"><Package className="w-16 h-16 text-muted-foreground" /></div>}
                      {product.priceDrop && <Badge className="absolute top-3 left-3 bg-success border-0 text-success-foreground text-xs px-2 py-1 shadow-lg"><TrendingDown className="w-3 h-3 mr-1" />-{product.dropPercentage}%</Badge>}
                      <div className="absolute top-3 right-3 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button size="icon" variant={selectedProducts.includes(product.id) ? 'default' : 'secondary'} className="w-9 h-9 rounded-full shadow-lg min-h-[44px] min-w-[44px]" onClick={() => toggleProductSelection(product.id)}><Check className="w-4 h-4" /></Button>
                        <Button size="icon" variant="destructive" className="w-9 h-9 rounded-full shadow-lg min-h-[44px] min-w-[44px]" onClick={() => removeFromWishlist(product.id)}><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </div>
                    <div className="p-5 bg-card">
                      <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}><h3 className="font-bold text-foreground mb-2 line-clamp-2 group-hover:text-primary transition-colors">{product.name}</h3></Link>
                      <div className="flex items-center gap-2 mb-3">
                        <div className="flex items-center">{[...Array(5)].map((_, i) => <Star key={i} className={`w-3 h-3 ${i < Math.floor(product.rating || 5) ? 'text-primary fill-current' : 'text-muted-foreground'}`} />)}</div>
                        <span className="text-xs text-muted-foreground">({product.total_reviews || 0})</span>
                      </div>
                      <div className="space-y-2 mb-4">
                        {product.priceDrop ? (<div><div className="flex items-center gap-2"><span className={cn(stb.metricValue, 'text-2xl text-success')}>${product.price}</span><span className="text-lg text-muted-foreground line-through">${product.originalPrice}</span></div><p className="text-xs text-success font-semibold">Save ${(product.originalPrice - product.price).toFixed(2)}</p></div>) : (<span className={cn(stb.metricValue, 'text-2xl')}>${product.price}</span>)}
                      </div>
                      <div className="flex gap-2">
                        <Link to={createPageUrl(`ProductDetail?id=${product.id}`)} className="flex-1"><Button variant="outline" size="sm" className="w-full border-border rounded-lg min-h-[44px]"><Eye className="w-4 h-4 mr-2" />View</Button></Link>
                        <PriceAlertConfig product={product} trigger={<Button size="icon" variant="outline" className={cn('min-h-[44px] min-w-[44px]', product.hasPriceAlert && 'bg-foreground/5 border-foreground text-foreground')}><Bell className="w-4 h-4" /></Button>} />
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </PageContent>

      <WishlistCollectionManager open={showCollectionManager} onOpenChange={setShowCollectionManager} collections={collections} products={products} />
      <ShareWishlistDialog open={showShareDialog} onOpenChange={setShowShareDialog} products={filteredProducts} />
      {showComparison && <ProductComparison products={products.filter(p => selectedProducts.includes(p.id))} onClose={() => { setShowComparison(false); setSelectedProducts([]); }} />}
    </div>
  );
}
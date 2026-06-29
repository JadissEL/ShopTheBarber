import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { MetaTags } from '@/components/seo/MetaTags';
import { ArrowLeft, Save, Send } from 'lucide-react';
import { toast } from 'sonner';
import {
  MARKETPLACE_SELLER_TERMS_VERSION,
  SELLER_TERMS_PATH,
  hasAcceptedSellerTerms,
  recordSellerTermsAcceptance,
} from '@/lib/marketplaceLegal';

const CATEGORIES = [
  { id: 'hair', label: 'Hair' },
  { id: 'skincare', label: 'Skincare' },
  { id: 'beard', label: 'Beard' },
  { id: 'tools', label: 'Tools' },
  { id: 'fragrance', label: 'Fragrance' },
  { id: 'styling', label: 'Styling' },
];

export default function MarketplaceProductEditor() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const productId = searchParams.get('id');
  const queryClient = useQueryClient();
  const { isAuthenticated, role, user } = useAuth();
  const canSell = ['barber', 'shop_owner', 'admin'].includes(role);
  const [sellerTermsAccepted, setSellerTermsAccepted] = useState(() =>
    hasAcceptedSellerTerms(user?.id),
  );

  const [form, setForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'hair',
    image_url: '',
    stock: '10',
    barber_id: '',
    shop_id: '',
    seller_type: 'barber',
    vendor_name: '',
    brand_id: '',
  });

  const { data: sellerProfiles } = useQuery({
    queryKey: ['seller-profiles'],
    queryFn: () => sovereign.products.sellerProfiles(),
    enabled: isAuthenticated && canSell,
  });

  const { data: existing, isLoading } = useQuery({
    queryKey: ['product-edit', productId],
    queryFn: () => sovereign.products.get(productId),
    enabled: !!productId && isAuthenticated && canSell,
  });

  useEffect(() => {
    if (user?.id) setSellerTermsAccepted(hasAcceptedSellerTerms(user.id));
  }, [user?.id]);

  useEffect(() => {
    if (sellerProfiles && !productId) {
      setForm((f) => ({
        ...f,
        barber_id: sellerProfiles.barbers?.[0]?.id || '',
        shop_id: sellerProfiles.shops?.[0]?.id || '',
        seller_type: role === 'shop_owner' ? 'shop' : role === 'admin' ? 'platform' : 'barber',
      }));
    }
  }, [sellerProfiles, productId, role]);

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name || '',
        description: existing.description || '',
        price: String(existing.price ?? ''),
        category: existing.category || 'hair',
        image_url: existing.image_url || '',
        stock: String(existing.stock ?? 0),
        barber_id: existing.barber_id || '',
        shop_id: existing.shop_id || '',
        seller_type: existing.seller_type || 'barber',
        vendor_name: existing.vendor_name || '',
        brand_id: existing.brand_id || '',
      });
    }
  }, [existing]);

  const buildPayload = () => ({
    name: form.name,
    description: form.description,
    price: parseFloat(form.price),
    category: form.category,
    image_url: form.image_url || undefined,
    stock: parseInt(form.stock, 10) || 0,
    ...(role === 'admin'
      ? {
          seller_type: form.seller_type,
          barber_id: form.seller_type === 'barber' ? form.barber_id : undefined,
          shop_id: form.seller_type === 'shop' ? form.shop_id : undefined,
          vendor_name: form.seller_type === 'vendor' ? form.vendor_name : undefined,
          brand_id: form.brand_id || undefined,
        }
      : role === 'shop_owner'
        ? { shop_id: form.shop_id || sellerProfiles?.shops?.[0]?.id }
        : { barber_id: form.barber_id || sellerProfiles?.barbers?.[0]?.id }),
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = buildPayload();
      if (productId) return sovereign.products.update(productId, payload);
      return sovereign.products.create(payload);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['products-mine'] });
      toast.success('Product saved');
      if (!productId && data?.id) {
        navigate(createPageUrl(`MarketplaceProductEditor?id=${data.id}`), { replace: true });
      }
    },
    onError: (e) => toast.error(e.message),
  });

  const submitMutation = useMutation({
    mutationFn: async () => {
      if (!sellerTermsAccepted) {
        throw new Error('Accept the Marketplace Seller Terms before submitting');
      }
      let id = productId;
      const payload = buildPayload();
      if (!id) {
        const created = await sovereign.products.create(payload);
        id = created.id;
      } else {
        await sovereign.products.update(id, payload);
      }
      if (user?.id) recordSellerTermsAcceptance(user.id);
      return sovereign.products.submit(id, {
        seller_terms_accepted: true,
        seller_terms_version: MARKETPLACE_SELLER_TERMS_VERSION,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-mine'] });
      toast.success('Submitted for admin approval');
      navigate(createPageUrl('ProviderMarketplaceProducts'));
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated || !canSell) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <p className="text-muted-foreground">Sign in as a barber or shop owner to sell on the marketplace.</p>
      </div>
    );
  }

  if (productId && isLoading) {
    return <div className="p-8 text-muted-foreground">Loading…</div>;
  }

  if (existing && existing.status !== 'draft' && existing.status !== 'rejected') {
    return (
      <div className="max-w-2xl mx-auto p-8 text-center">
        <p className="text-muted-foreground mb-4">This listing cannot be edited in its current state.</p>
        <Button onClick={() => navigate(createPageUrl('ProviderMarketplaceProducts'))}>Back to listings</Button>
      </div>
    );
  }

  return (
    <div className="stb-page lg:pb-8">
      <MetaTags title={productId ? 'Edit product' : 'New marketplace product'} />
      <div className="max-w-3xl mx-auto px-4 py-6">
        <Button variant="ghost" className="mb-4 gap-2" onClick={() => navigate(createPageUrl('ProviderMarketplaceProducts'))}>
          <ArrowLeft className="w-4 h-4" /> Back
        </Button>

        <Card className="rounded-2xl">
          <CardContent className="p-6 space-y-5">
            <div>
              <Label htmlFor="name">Product name</Label>
              <Input id="name" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} className="mt-1" />
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="price">Price (USD)</Label>
                <Input id="price" type="number" min="0.01" step="0.01" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label htmlFor="stock">Stock</Label>
                <Input id="stock" type="number" min="0" value={form.stock} onChange={(e) => setForm((f) => ({ ...f, stock: e.target.value }))} className="mt-1" />
              </div>
            </div>

            <div>
              <Label htmlFor="category">Category</Label>
              <Select value={form.category} onValueChange={(v) => setForm((f) => ({ ...f, category: v }))}>
                <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.id} value={c.id}>{c.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {role === 'barber' && sellerProfiles?.barbers?.length > 1 && (
              <div>
                <Label>Barber profile</Label>
                <Select value={form.barber_id} onValueChange={(v) => setForm((f) => ({ ...f, barber_id: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sellerProfiles.barbers.map((b) => (
                      <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {role === 'shop_owner' && sellerProfiles?.shops?.length > 1 && (
              <div>
                <Label>Shop</Label>
                <Select value={form.shop_id} onValueChange={(v) => setForm((f) => ({ ...f, shop_id: v }))}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {sellerProfiles.shops.map((s) => (
                      <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {role === 'admin' && (
              <>
                <div>
                  <Label>Seller type</Label>
                  <Select value={form.seller_type} onValueChange={(v) => setForm((f) => ({ ...f, seller_type: v }))}>
                    <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="platform">Platform</SelectItem>
                      <SelectItem value="barber">Barber</SelectItem>
                      <SelectItem value="shop">Shop</SelectItem>
                      <SelectItem value="vendor">Vendor / Brand</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {form.seller_type === 'vendor' && (
                  <div>
                    <Label htmlFor="vendor_name">Vendor name</Label>
                    <Input id="vendor_name" value={form.vendor_name} onChange={(e) => setForm((f) => ({ ...f, vendor_name: e.target.value }))} className="mt-1" />
                  </div>
                )}
              </>
            )}

            <div>
              <Label htmlFor="description">Description (min. 20 chars to submit)</Label>
              <Textarea id="description" value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="mt-1 min-h-[120px]" />
            </div>

            <div>
              <Label htmlFor="image_url">Image URL</Label>
              <Input id="image_url" value={form.image_url} onChange={(e) => setForm((f) => ({ ...f, image_url: e.target.value }))} className="mt-1" placeholder="https://…" />
            </div>

            <div className="rounded-xl border border-amber-200 bg-amber-50/80 dark:bg-amber-950/20 p-4 text-sm space-y-3">
              <p className="font-medium text-foreground">Seller obligations</p>
              <p className="text-muted-foreground text-xs leading-relaxed">
                List VAT-inclusive prices where required. You are responsible for shipping, returns, and
                product compliance. See{' '}
                <Link to={SELLER_TERMS_PATH} className="text-primary hover:underline">
                  Marketplace Seller Terms
                </Link>
                .
              </p>
              <label className="flex items-start gap-2 cursor-pointer text-xs text-muted-foreground">
                <input
                  type="checkbox"
                  checked={sellerTermsAccepted}
                  onChange={(e) => setSellerTermsAccepted(e.target.checked)}
                  className="rounded border-border mt-0.5"
                />
                <span>
                  I accept the Marketplace Seller Terms (v{MARKETPLACE_SELLER_TERMS_VERSION}) for this
                  listing
                </span>
              </label>
            </div>

            <div className="flex flex-wrap gap-3 pt-2">
              <Button variant="outline" className="gap-2" disabled={saveMutation.isPending || !form.name.trim()} onClick={() => saveMutation.mutate()}>
                <Save className="w-4 h-4" /> Save draft
              </Button>
              <Button className="gap-2 bg-primary text-white" disabled={submitMutation.isPending || !form.name.trim() || !sellerTermsAccepted} onClick={() => submitMutation.mutate()}>
                <Send className="w-4 h-4" /> Submit for approval
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

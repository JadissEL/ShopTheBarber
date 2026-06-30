import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Trash2, Tag, Layers } from 'lucide-react';
import { toast } from 'sonner';

export default function ProviderPricingPanel({ shopId, services = [] }) {
  const queryClient = useQueryClient();
  const [promoForm, setPromoForm] = useState({ code: '', discount_type: 'percentage', discount_value: 10 });
  const [bundleForm, setBundleForm] = useState({
    name: '',
    service_ids: [],
    pricing_mode: 'percentage',
    discount_value: 15,
    bundle_price: '',
  });

  const { data: policy } = useQuery({
    queryKey: ['pricing-policy'],
    queryFn: () => sovereign.pricing.getPolicy(),
  });

  const { data: promotions = [] } = useQuery({
    queryKey: ['my-shop-promotions', shopId],
    queryFn: () => (shopId ? sovereign.entities.PromoCode.filter({ shop_id: shopId }) : []),
    enabled: !!shopId,
  });

  const { data: bundles = [] } = useQuery({
    queryKey: ['pricing-bundles-mine', shopId],
    queryFn: () => sovereign.pricing.myBundles(),
    enabled: !!shopId,
  });

  const createPromoMutation = useMutation({
    mutationFn: (payload) => sovereign.entities.PromoCode.create(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shop-promotions'] });
      toast.success('Promotion created');
      setPromoForm({ code: '', discount_type: 'percentage', discount_value: 10 });
    },
    onError: (e) => toast.error(e.message),
  });

  const deletePromoMutation = useMutation({
    mutationFn: (id) => sovereign.entities.PromoCode.update(id, { is_active: false }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['my-shop-promotions'] });
      toast.success('Promotion deactivated');
    },
    onError: (e) => toast.error(e.message),
  });

  const createBundleMutation = useMutation({
    mutationFn: (payload) => sovereign.pricing.createBundle(payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-bundles-mine'] });
      toast.success('Service combo created');
      setBundleForm({ name: '', service_ids: [], pricing_mode: 'percentage', discount_value: 15, bundle_price: '' });
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteBundleMutation = useMutation({
    mutationFn: (id) => sovereign.pricing.deleteBundle(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-bundles-mine'] });
      toast.success('Combo removed');
    },
    onError: (e) => toast.error(e.message),
  });

  if (!shopId) {
    return (
      <Card className="">
        <CardContent className="p-8 text-muted-foreground text-sm">
          Link your shop to manage promotions and service combos.
        </CardContent>
      </Card>
    );
  }

  const toggleServiceInBundle = (id) => {
    setBundleForm((f) => ({
      ...f,
      service_ids: f.service_ids.includes(id) ? f.service_ids.filter((x) => x !== id) : [...f.service_ids, id],
    }));
  };

  const submitBundle = () => {
    const payload = {
      shop_id: shopId,
      name: bundleForm.name,
      service_ids: bundleForm.service_ids,
    };
    if (bundleForm.pricing_mode === 'fixed_price') {
      payload.bundle_price = Number(bundleForm.bundle_price);
    } else {
      payload.discount_type = bundleForm.pricing_mode;
      payload.discount_value = Number(bundleForm.discount_value);
    }
    createBundleMutation.mutate(payload);
  };

  return (
    <div className="space-y-8">
      {policy && (
        <Card className=" border-primary/20 bg-primary/5">
          <CardContent className="p-5 text-sm text-muted-foreground">
            <p className="font-semibold text-foreground mb-1">Fair pricing bounds (platform)</p>
            <p>
              Services ${policy.min_service_price}-${policy.max_service_price}, Promos up to {policy.max_promo_percentage}% or
              ${policy.max_promo_fixed} off, Combos up to {policy.max_combo_discount_percent}% off (min {policy.min_combo_services}{' '}
              services)
            </p>
          </CardContent>
        </Card>
      )}

      <Card className="">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Tag className="w-5 h-5" /> Promotions
          </CardTitle>
          <p className="text-sm text-muted-foreground">Create shop promo codes within platform limits, live immediately.</p>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-8">
          <div className="grid md:grid-cols-4 gap-3">
            <div>
              <Label>Code</Label>
              <Input
                value={promoForm.code}
                onChange={(e) => setPromoForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
                placeholder="SUMMER20"
                className=" mt-1"
              />
            </div>
            <div>
              <Label>Type</Label>
              <select
                className="w-full mt-1 rounded-lg border border-border p-2 text-sm"
                value={promoForm.discount_type}
                onChange={(e) => setPromoForm((f) => ({ ...f, discount_type: e.target.value }))}
              >
                <option value="percentage">Percentage</option>
                <option value="fixed">Fixed amount</option>
              </select>
            </div>
            <div>
              <Label>Value</Label>
              <Input
                type="number"
                value={promoForm.discount_value}
                onChange={(e) => setPromoForm((f) => ({ ...f, discount_value: e.target.value }))}
                className=" mt-1"
              />
            </div>
            <div className="flex items-end">
              <Button
                className="w-full rounded-lg"
                disabled={!promoForm.code || createPromoMutation.isPending}
                onClick={() =>
                  createPromoMutation.mutate({
                    code: promoForm.code.trim(),
                    discount_type: promoForm.discount_type,
                    discount_value: Number(promoForm.discount_value),
                    shop_id: shopId,
                    is_active: true,
                  })
                }
              >
                <Plus className="w-4 h-4 mr-1" /> Add promo
              </Button>
            </div>
          </div>
          <ul className="space-y-2">
            {promotions.filter((p) => p.is_active).map((p) => (
              <li key={p.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <span className="font-mono font-semibold">{p.code}</span>
                <span className="text-sm text-muted-foreground">
                  {p.discount_type === 'percentage' ? `${p.discount_value}%` : `$${p.discount_value}`} off
                </span>
                <Button variant="ghost" size="sm" onClick={() => deletePromoMutation.mutate(p.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </li>
            ))}
            {promotions.filter((p) => p.is_active).length === 0 && (
              <p className="text-sm text-muted-foreground">No active promotions yet.</p>
            )}
          </ul>
        </CardContent>
      </Card>

      <Card className="">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <Layers className="w-5 h-5" /> Service combos
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            When clients book the exact services together, they pay less than the sum of individual prices.
          </p>
        </CardHeader>
        <CardContent className="space-y-6 px-8 pb-8">
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <Label>Combo name</Label>
              <Input
                value={bundleForm.name}
                onChange={(e) => setBundleForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Cut + Beard"
                className=" mt-1"
              />
            </div>
            <div>
              <Label>Discount mode</Label>
              <select
                className="w-full mt-1 rounded-lg border border-border p-2 text-sm"
                value={bundleForm.pricing_mode}
                onChange={(e) => setBundleForm((f) => ({ ...f, pricing_mode: e.target.value }))}
              >
                <option value="percentage">% off combined price</option>
                <option value="fixed">$ off combined price</option>
                <option value="fixed_price">Fixed combo price</option>
              </select>
            </div>
          </div>
          {bundleForm.pricing_mode === 'fixed_price' ? (
            <div>
              <Label>Combo price ($)</Label>
              <Input
                type="number"
                value={bundleForm.bundle_price}
                onChange={(e) => setBundleForm((f) => ({ ...f, bundle_price: e.target.value }))}
                className=" mt-1 max-w-xs"
              />
            </div>
          ) : (
            <div>
              <Label>Discount value</Label>
              <Input
                type="number"
                value={bundleForm.discount_value}
                onChange={(e) => setBundleForm((f) => ({ ...f, discount_value: e.target.value }))}
                className=" mt-1 max-w-xs"
              />
            </div>
          )}
          <div>
            <Label className="mb-2 block">Services in combo</Label>
            <div className="flex flex-wrap gap-2">
              {services.map((s) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => toggleServiceInBundle(s.id)}
                  className={`px-3 py-1.5 rounded-full text-sm border ${
                    bundleForm.service_ids.includes(s.id)
                      ? 'bg-primary text-primary-foreground border-primary'
                      : 'border-border text-muted-foreground'
                  }`}
                >
                  {s.name} (${s.price})
                </button>
              ))}
            </div>
          </div>
          <Button
            className=""
            disabled={!bundleForm.name || bundleForm.service_ids.length < 2 || createBundleMutation.isPending}
            onClick={submitBundle}
          >
            <Plus className="w-4 h-4 mr-1" /> Create combo
          </Button>
          <ul className="space-y-2">
            {bundles.map((b) => (
              <li key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-border">
                <div>
                  <p className="font-semibold">{b.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {(b.services || []).map((s) => s.name).join(' + ') || `${b.service_ids?.length || 0} services`}
                    {b.bundle_price != null
                      ? ` $${b.bundle_price}`
                      : b.discount_value != null
                        ? ` ${b.discount_value}${b.discount_type === 'percentage' ? '%' : '$'} off`
                        : ''}
                  </p>
                </div>
                <Button variant="ghost" size="sm" onClick={() => deleteBundleMutation.mutate(b.id)}>
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </li>
            ))}
            {bundles.length === 0 && <p className="text-sm text-muted-foreground">No combos yet.</p>}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

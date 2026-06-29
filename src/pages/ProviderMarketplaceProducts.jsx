import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MetaTags } from '@/components/seo/MetaTags';
import { Plus, Package, Send, Pencil, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_LABELS = {
  draft: { label: 'Draft', className: 'bg-amber-100 text-amber-800' },
  pending_review: { label: 'Pending review', className: 'bg-blue-100 text-blue-800' },
  published: { label: 'Live', className: 'bg-emerald-100 text-emerald-800' },
  rejected: { label: 'Rejected', className: 'bg-red-100 text-red-800' },
};

export default function ProviderMarketplaceProducts() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, role } = useAuth();
  const canSell = ['barber', 'shop_owner', 'admin'].includes(role);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products-mine'],
    queryFn: () => sovereign.products.mine(),
    enabled: isAuthenticated && canSell,
  });

  const submitMutation = useMutation({
    mutationFn: (id) => sovereign.products.submit(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-mine'] });
      toast.success('Product submitted for admin approval');
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => sovereign.products.delete(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products-mine'] });
      toast.success('Product deleted');
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated || !canSell) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
        <MetaTags title="My marketplace products | Shop The Barber" />
        <p className="text-muted-foreground mb-4">Barbers and shop owners can sell products on the marketplace.</p>
        <Button onClick={() => navigate(createPageUrl('SignIn'))}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="stb-page lg:pb-8">
      <MetaTags title="My marketplace products | Shop The Barber" />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Marketplace listings</h1>
                <p className="text-sm text-muted-foreground mt-1">
              List grooming products for sale. Admin approval is required before they appear on the marketplace.{' '}
              <Link to="/marketplace/seller-terms" className="text-primary hover:underline">
                Seller terms (VAT & shipping)
              </Link>
            </p>
          </div>
          <Button
            onClick={() => navigate(createPageUrl('MarketplaceProductEditor'))}
            className="bg-primary text-white rounded-xl gap-2"
          >
            <Plus className="w-5 h-5" /> New product
          </Button>
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : products.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="py-12 text-center">
              <Package className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground mb-4">No listings yet.</p>
              <Button onClick={() => navigate(createPageUrl('MarketplaceProductEditor'))}>Create your first listing</Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {products.map((product) => {
              const status = STATUS_LABELS[product.status] || STATUS_LABELS.draft;
              const canEdit = product.status === 'draft' || product.status === 'rejected';
              return (
                <Card key={product.id} className="rounded-2xl">
                  <CardContent className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex gap-4 flex-1 min-w-0">
                      {product.image_url && (
                        <img src={product.image_url} alt="" className="w-16 h-16 rounded-xl object-cover shrink-0" />
                      )}
                      <div className="min-w-0">
                        <h2 className="font-semibold text-lg truncate">{product.name}</h2>
                        <p className="text-sm text-muted-foreground">${Number(product.price).toFixed(2)}, Stock {product.stock ?? 0}</p>
                        <div className="flex flex-wrap items-center gap-2 mt-2">
                          <Badge className={`${status.className} border-0`}>{status.label}</Badge>
                          <Badge variant="outline">{product.seller_type}</Badge>
                          {product.vendor_name && <span className="text-xs text-muted-foreground">{product.vendor_name}</span>}
                          <span className="text-xs text-muted-foreground">
                            {product.updated_at ? format(new Date(product.updated_at), 'dd MMM yyyy') : ''}
                          </span>
                        </div>
                        {product.status === 'rejected' && product.rejection_reason && (
                          <p className="text-sm text-red-600 mt-2">{product.rejection_reason}</p>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2 shrink-0">
                      {product.status === 'published' && (
                        <Button variant="outline" size="sm" asChild>
                          <Link to={createPageUrl(`ProductDetail?id=${product.id}`)}>View live</Link>
                        </Button>
                      )}
                      {canEdit && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(createPageUrl(`MarketplaceProductEditor?id=${product.id}`))}
                          >
                            <Pencil className="w-4 h-4 mr-1" /> Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            className="text-red-600"
                            onClick={() => deleteMutation.mutate(product.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button
                            size="sm"
                            className="bg-primary text-white"
                            disabled={submitMutation.isPending}
                            onClick={() => submitMutation.mutate(product.id)}
                          >
                            <Send className="w-4 h-4 mr-1" /> Submit
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

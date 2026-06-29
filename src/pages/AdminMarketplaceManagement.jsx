import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Package, Eye, CheckCircle2, XCircle, Star, Ban } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_TABS = [
  { id: 'pending_review', label: 'Pending' },
  { id: 'published', label: 'Live' },
  { id: 'draft', label: 'Drafts' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
];

const STATUS_STYLES = {
  draft: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Draft' },
  pending_review: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pending' },
  published: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Live' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
};

export default function AdminMarketplaceManagement() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [search, setSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['admin-products', statusFilter],
    queryFn: () => sovereign.products.listAdmin(statusFilter),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-products'] });
    queryClient.invalidateQueries({ queryKey: ['products-mine'] });
    queryClient.invalidateQueries({ queryKey: ['marketplace-products'] });
  };

  const approveMutation = useMutation({
    mutationFn: (id) => sovereign.products.approve(id),
    onSuccess: () => { toast.success('Product approved, now live on marketplace'); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => sovereign.products.reject(id, reason),
    onSuccess: () => {
      toast.success('Product rejected');
      setRejectTarget(null);
      setRejectReason('');
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const unpublishMutation = useMutation({
    mutationFn: (id) => sovereign.products.unpublish(id, 'Unpublished by admin'),
    onSuccess: () => { toast.success('Product removed from marketplace'); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const featureMutation = useMutation({
    mutationFn: ({ id, featured }) => sovereign.products.update(id, { featured }),
    onSuccess: () => { toast.success('Featured updated'); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = products.filter((p) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      p.name?.toLowerCase().includes(q) ||
      p.vendor_name?.toLowerCase().includes(q) ||
      p.category?.toLowerCase().includes(q) ||
      p.seller_type?.toLowerCase().includes(q)
    );
  });

  const pendingCount = statusFilter === 'pending_review' ? products.length : products.filter((p) => p.status === 'pending_review').length;

  return (
    <div className="min-h-screen py-8 bg-background">
      <MetaTags title="Marketplace moderation | Admin" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Marketplace moderation</h1>
          <p className="text-muted-foreground">
            Approve product listings from barbers and shop owners before they appear for sale.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Pending approval', value: pendingCount },
            { label: 'In view', value: filtered.length },
            { label: 'Live stock units', value: filtered.reduce((s, p) => s + (p.stock || 0), 0) },
          ].map((stat) => (
            <Card key={stat.label} className="rounded-2xl">
              <CardContent className="p-5">
                <p className="text-sm text-muted-foreground">{stat.label}</p>
                <p className="text-3xl font-bold">{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <Button key={tab.id} variant={statusFilter === tab.id ? 'default' : 'outline'} size="sm" onClick={() => setStatusFilter(tab.id)}>
                {tab.label}
              </Button>
            ))}
          </div>
          <Input placeholder="Search name, seller, category…" value={search} onChange={(e) => setSearch(e.target.value)} className="sm:max-w-xs sm:ml-auto" />
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading products…</p>
        ) : filtered.length === 0 ? (
          <Card><CardContent className="py-12 text-center text-muted-foreground">No products in this view.</CardContent></Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((item) => {
              const st = STATUS_STYLES[item.status] || STATUS_STYLES.draft;
              return (
                <Card key={item.id} className="rounded-2xl">
                  <CardContent className="p-5">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex gap-4 flex-1 min-w-0">
                        <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 overflow-hidden">
                          {item.image_url ? (
                            <img src={item.image_url} alt="" className="w-full h-full object-cover" />
                          ) : (
                            <Package className="w-6 h-6 text-primary" />
                          )}
                        </div>
                        <div className="min-w-0">
                          <h3 className="font-semibold text-lg truncate">{item.name}</h3>
                          <p className="text-sm text-muted-foreground">
                            ${Number(item.price).toFixed(2)}, Stock {item.stock ?? 0}, {item.vendor_name || item.seller_type}
                          </p>
                          <div className="flex flex-wrap items-center gap-2 mt-1">
                            <Badge className={`${st.bg} ${st.text} border-0`}>{st.label}</Badge>
                            {item.featured && <Badge variant="secondary"><Star className="w-3 h-3 mr-1" />Featured</Badge>}
                            {item.category && <Badge variant="outline">{item.category}</Badge>}
                            {item.submitted_at && (
                              <span className="text-xs text-muted-foreground">
                                Submitted {format(new Date(item.submitted_at), 'dd MMM yyyy')}
                              </span>
                            )}
                          </div>
                          {item.rejection_reason && item.status === 'rejected' && (
                            <p className="text-sm text-red-600 mt-1">{item.rejection_reason}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 shrink-0">
                        {item.status === 'published' && (
                          <>
                            <Button variant="outline" size="sm" asChild>
                              <Link to={createPageUrl(`ProductDetail?id=${item.id}`)}><Eye className="w-4 h-4" /></Link>
                            </Button>
                            <Button variant="outline" size="sm" onClick={() => featureMutation.mutate({ id: item.id, featured: !item.featured })}>
                              <Star className={`w-4 h-4 ${item.featured ? 'fill-current' : ''}`} />
                            </Button>
                            <Button variant="outline" size="sm" className="text-red-600" onClick={() => unpublishMutation.mutate(item.id)}>
                              <Ban className="w-4 h-4" />
                            </Button>
                          </>
                        )}
                        {item.status === 'pending_review' && (
                          <>
                            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white gap-1" onClick={() => approveMutation.mutate(item.id)}>
                              <CheckCircle2 className="w-4 h-4" /> Approve
                            </Button>
                            <Button size="sm" variant="outline" className="text-red-600 gap-1" onClick={() => setRejectTarget(item)}>
                              <XCircle className="w-4 h-4" /> Reject
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Reject product listing</DialogTitle></DialogHeader>
          <p className="text-sm text-muted-foreground">{rejectTarget?.name}</p>
          <Textarea placeholder="Reason (shown to seller)" value={rejectReason} onChange={(e) => setRejectReason(e.target.value)} className="min-h-[100px]" />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button className="bg-red-600 hover:bg-red-700 text-white" disabled={rejectMutation.isPending} onClick={() => rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason })}>
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import SearchField from '@/components/ui/search-field';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { FileText, Eye, CheckCircle2, XCircle, Star, Ban } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';
import { motion } from 'framer-motion';
import { MetaTags } from '@/components/seo/MetaTags';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_TABS = [
  { id: 'pending_review', label: 'Pending' },
  { id: 'published', label: 'Published' },
  { id: 'draft', label: 'Drafts' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'all', label: 'All' },
];

const STATUS_STYLES = {
  draft: { bg: 'bg-warning/15', text: 'text-foreground', label: 'Draft' },
  pending_review: { bg: 'bg-primary/10', text: 'text-primary', label: 'Pending review' },
  published: { bg: 'bg-success/10', text: 'text-success', label: 'Published' },
  rejected: { bg: 'bg-destructive/10', text: 'text-destructive', label: 'Rejected' },
};

export default function AdminContentManagement() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [search, setSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: articles = [], isLoading } = useQuery({
    queryKey: ['admin-articles', statusFilter],
    queryFn: () => sovereign.articles.listAdmin(statusFilter),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-articles'] });
    queryClient.invalidateQueries({ queryKey: ['articles-mine'] });
  };

  const approveMutation = useMutation({
    mutationFn: (id) => sovereign.articles.approve(id),
    onSuccess: () => { toast.success('Article approved and published'); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => sovereign.articles.reject(id, reason),
    onSuccess: () => {
      toast.success('Article rejected');
      setRejectTarget(null);
      setRejectReason('');
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const unpublishMutation = useMutation({
    mutationFn: (id) => sovereign.articles.unpublish(id, 'Unpublished by admin'),
    onSuccess: () => { toast.success('Article unpublished'); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const featureMutation = useMutation({
    mutationFn: ({ id, featured }) => sovereign.articles.update(id, { featured }),
    onSuccess: () => { toast.success('Featured status updated'); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = articles.filter((a) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      a.title?.toLowerCase().includes(q) ||
      a.author_name?.toLowerCase().includes(q) ||
      a.category?.toLowerCase().includes(q)
    );
  });

  const pendingCount = statusFilter === 'all'
    ? articles.filter((a) => a.status === 'pending_review').length
    : statusFilter === 'pending_review'
      ? articles.length
      : 0;

  return (
    <div className={stb.page}>
      <MetaTags title="Content management | Admin" />
      <PageHeader
        tier="app"
        variant="light"
        title="Blog content"
        subtitle="Review articles submitted by barbers and shop owners. Only approved articles appear on the public blog."
      />

      <PageContent>
        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'In queue', value: pendingCount },
            { label: 'Showing', value: filtered.length },
            {
              label: 'Total views',
              value: filtered.reduce((sum, a) => sum + (a.views || 0), 0).toLocaleString(),
            },
          ].map((stat) => (
            <Card key={stat.label} className={stb.panel}>
              <CardContent className="p-5">
                <p className={stb.caption}>{stat.label}</p>
                <p className={stb.metricValue}>{stat.value}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <Button
                key={tab.id}
                variant={statusFilter === tab.id ? 'default' : 'outline'}
                size="sm"
                onClick={() => setStatusFilter(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
          <SearchField
            placeholder="Search title, author, category…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onClear={() => setSearch('')}
            className="sm:max-w-xs sm:ml-auto"
            aria-label="Search blog articles"
          />
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading articles…</p>
        ) : filtered.length === 0 ? (
          <Card className="">
            <CardContent className="py-12 text-center text-muted-foreground">
              No articles in this view.
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {filtered.map((item, idx) => {
              const st = STATUS_STYLES[item.status] || STATUS_STYLES.draft;
              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03 }}
                >
                  <Card className="">
                    <CardContent className="p-5">
                      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                        <div className="flex gap-4 flex-1 min-w-0">
                          <div className="w-11 h-11 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
                            <FileText className="w-5 h-5 text-primary" />
                          </div>
                          <div className="min-w-0">
                            <h3 className="font-semibold text-lg truncate">{item.title}</h3>
                            <div className="flex flex-wrap items-center gap-2 mt-1">
                              <Badge className={`${st.bg} ${st.text} border-0`}>{st.label}</Badge>
                              {item.featured && (
                                <Badge variant="secondary" className="gap-1">
                                  <Star className="w-3 h-3" /> Featured
                                </Badge>
                              )}
                              {item.category && <Badge variant="outline">{item.category}</Badge>}
                              <span className="text-xs text-muted-foreground">
                                {item.author_name || 'Unknown author'}
                                {item.submitted_at && `, submitted ${format(new Date(item.submitted_at), 'dd MMM yyyy')}`}
                              </span>
                            </div>
                            {item.excerpt && (
                              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{item.excerpt}</p>
                            )}
                            {item.rejection_reason && item.status === 'rejected' && (
                              <p className="text-sm text-destructive mt-1">{item.rejection_reason}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex flex-wrap items-center gap-2 shrink-0">
                          <span className="text-sm text-muted-foreground mr-2">{item.views || 0} views</span>

                          {item.status === 'published' && (
                            <>
                              <Button variant="outline" size="sm" asChild>
                                <Link to={createPageUrl(`ArticleDetail?id=${item.id}`)}>
                                  <Eye className="w-4 h-4" />
                                </Link>
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => featureMutation.mutate({ id: item.id, featured: !item.featured })}
                              >
                                <Star className={`w-4 h-4 ${item.featured ? 'fill-current' : ''}`} />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-destructive"
                                onClick={() => unpublishMutation.mutate(item.id)}
                              >
                                <Ban className="w-4 h-4" />
                              </Button>
                            </>
                          )}

                          {item.status === 'pending_review' && (
                            <>
                              <Button
                                size="sm"
                                className="bg-primary hover:bg-primary/90 text-white gap-1"
                                disabled={approveMutation.isPending}
                                onClick={() => approveMutation.mutate(item.id)}
                              >
                                <CheckCircle2 className="w-4 h-4" /> Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-destructive gap-1"
                                onClick={() => setRejectTarget(item)}
                              >
                                <XCircle className="w-4 h-4" /> Reject
                              </Button>
                            </>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}
      </PageContent>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject article</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {rejectTarget?.title}
          </p>
          <Textarea
            placeholder="Reason for rejection (shown to author)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              disabled={rejectMutation.isPending}
              onClick={() => rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason })}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

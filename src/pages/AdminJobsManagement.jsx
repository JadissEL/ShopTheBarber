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
import { Briefcase, Eye, CheckCircle2, XCircle, Star, Ban } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import { toast } from 'sonner';
import { format } from 'date-fns';

const STATUS_TABS = [
  { id: 'pending_review', label: 'Pending' },
  { id: 'published', label: 'Live' },
  { id: 'draft', label: 'Drafts' },
  { id: 'rejected', label: 'Rejected' },
  { id: 'closed', label: 'Closed' },
  { id: 'all', label: 'All' },
];

const STATUS_STYLES = {
  draft: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'Draft' },
  pending_review: { bg: 'bg-blue-100', text: 'text-blue-800', label: 'Pending' },
  published: { bg: 'bg-emerald-100', text: 'text-emerald-800', label: 'Live' },
  rejected: { bg: 'bg-red-100', text: 'text-red-800', label: 'Rejected' },
  closed: { bg: 'bg-muted', text: 'text-muted-foreground', label: 'Closed' },
};

export default function AdminJobsManagement() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState('pending_review');
  const [search, setSearch] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['admin-jobs', statusFilter],
    queryFn: () => sovereign.jobs.listAdmin(statusFilter),
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['admin-jobs'] });
    queryClient.invalidateQueries({ queryKey: ['jobs-my'] });
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
    queryClient.invalidateQueries({ queryKey: ['jobs-featured'] });
  };

  const approveMutation = useMutation({
    mutationFn: (id) => sovereign.jobs.approve(id),
    onSuccess: () => { toast.success('Job approved, now live on Career Hub'); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const rejectMutation = useMutation({
    mutationFn: ({ id, reason }) => sovereign.jobs.reject(id, reason),
    onSuccess: () => {
      toast.success('Job rejected');
      setRejectTarget(null);
      setRejectReason('');
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const unpublishMutation = useMutation({
    mutationFn: (id) => sovereign.jobs.unpublish(id, 'Unpublished by admin'),
    onSuccess: () => { toast.success('Job removed from Career Hub'); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const featureMutation = useMutation({
    mutationFn: ({ id, featured }) => sovereign.jobs.update(id, { featured }),
    onSuccess: () => { toast.success('Featured updated'); invalidate(); },
    onError: (e) => toast.error(e.message),
  });

  const filtered = jobs.filter((job) => {
    const q = search.toLowerCase();
    if (!q) return true;
    return (
      job.title?.toLowerCase().includes(q) ||
      job.employer_name?.toLowerCase().includes(q) ||
      job.category?.toLowerCase().includes(q) ||
      job.location_text?.toLowerCase().includes(q)
    );
  });

  const pendingCount = statusFilter === 'pending_review' ? jobs.length : jobs.filter((j) => j.status === 'pending_review').length;

  return (
    <div className="min-h-screen py-8 bg-background">
      <MetaTags title="Jobs moderation | Admin" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">Jobs moderation</h1>
          <p className="text-muted-foreground">
            Approve job postings from barbers and shop owners before they appear on Career Hub.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-4 mb-8">
          {[
            { label: 'Pending approval', value: pendingCount },
            { label: 'In view', value: filtered.length },
            { label: 'Live listings', value: filtered.filter((j) => j.status === 'published').length },
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
              <Button
                key={tab.id}
                variant={statusFilter === tab.id ? 'default' : 'outline'}
                size="sm"
                className="rounded-xl"
                onClick={() => setStatusFilter(tab.id)}
              >
                {tab.label}
              </Button>
            ))}
          </div>
          <Input
            placeholder="Search title, employer, location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="sm:max-w-xs rounded-xl"
          />
        </div>

        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : filtered.length === 0 ? (
          <Card className="rounded-2xl">
            <CardContent className="p-12 text-center">
              <Briefcase className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground">No job postings in this queue.</p>
            </CardContent>
          </Card>
        ) : (
          <ul className="space-y-4">
            {filtered.map((job) => {
              const style = STATUS_STYLES[job.status] || STATUS_STYLES.draft;
              return (
                <li key={job.id}>
                  <Card className="rounded-2xl overflow-hidden">
                    <CardContent className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-1">
                          <h2 className="font-semibold text-foreground truncate">{job.title}</h2>
                          <Badge className={`${style.bg} ${style.text} border-0`}>{style.label}</Badge>
                          {job.featured && (
                            <Badge variant="outline" className="gap-1">
                              <Star className="w-3 h-3" /> Featured
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {job.employer_name || job.employer_type}, {job.category}, {job.location_text || job.location_type}
                        </p>
                        {job.submitted_at && (
                          <p className="text-xs text-muted-foreground mt-1">
                            Submitted {format(new Date(job.submitted_at), 'MMM d, yyyy')}
                          </p>
                        )}
                        {job.rejection_reason && job.status === 'rejected' && (
                          <p className="text-xs text-red-600 mt-1">Reason: {job.rejection_reason}</p>
                        )}
                      </div>
                      <div className="flex flex-wrap gap-2 shrink-0">
                        <Link to={createPageUrl(`JobDetail?id=${job.id}`)}>
                          <Button variant="outline" size="sm" className="rounded-lg gap-1">
                            <Eye className="w-4 h-4" /> Preview
                          </Button>
                        </Link>
                        {job.status === 'pending_review' && (
                          <>
                            <Button
                              size="sm"
                              className="rounded-lg gap-1"
                              onClick={() => approveMutation.mutate(job.id)}
                              disabled={approveMutation.isPending}
                            >
                              <CheckCircle2 className="w-4 h-4" /> Approve
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg gap-1 text-red-600 border-red-200"
                              onClick={() => setRejectTarget(job)}
                            >
                              <XCircle className="w-4 h-4" /> Reject
                            </Button>
                          </>
                        )}
                        {job.status === 'published' && (
                          <>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg gap-1"
                              onClick={() => featureMutation.mutate({ id: job.id, featured: !job.featured })}
                            >
                              <Star className="w-4 h-4" /> {job.featured ? 'Unfeature' : 'Feature'}
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              className="rounded-lg gap-1 text-red-600"
                              onClick={() => unpublishMutation.mutate(job.id)}
                            >
                              <Ban className="w-4 h-4" /> Unpublish
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Dialog open={!!rejectTarget} onOpenChange={(open) => !open && setRejectTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reject job posting</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground mb-2">
            {rejectTarget?.title}, the employer will see your feedback and can edit and resubmit.
          </p>
          <Textarea
            placeholder="Reason for rejection (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            className="min-h-[100px]"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => setRejectTarget(null)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => rejectMutation.mutate({ id: rejectTarget.id, reason: rejectReason })}
              disabled={rejectMutation.isPending}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

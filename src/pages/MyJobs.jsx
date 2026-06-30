import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { Plus, Briefcase, Send, Trash2, Ban } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';
import { cn } from '@/lib/utils';

const STATUS_STYLES = {
  draft: 'bg-warning/15 text-foreground',
  pending_review: 'bg-primary/10 text-primary',
  published: 'bg-success/10 text-success',
  rejected: 'bg-destructive/10 text-destructive',
  closed: 'bg-muted text-muted-foreground',
};

const STATUS_LABELS = {
  draft: 'Draft',
  pending_review: 'Pending review',
  published: 'Live',
  rejected: 'Rejected',
  closed: 'Closed',
};

export default function MyJobs() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs-my'],
    queryFn: () => sovereign.jobs.my(),
    enabled: isAuthenticated,
  });

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ['jobs-my'] });
    queryClient.invalidateQueries({ queryKey: ['jobs'] });
  };

  const submitMutation = useMutation({
    mutationFn: (id) => sovereign.jobs.submit(id),
    onSuccess: () => {
      toast.success('Submitted for admin review');
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const closeMutation = useMutation({
    mutationFn: (id) => sovereign.jobs.close(id),
    onSuccess: () => {
      toast.success('Job closed, no longer accepting applications');
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => sovereign.jobs.delete(id),
    onSuccess: () => {
      toast.success('Job deleted');
      invalidate();
    },
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="stb-page flex flex-col items-center justify-center p-4">
        <MetaTags title="My job postings | Shop The Barber" />
        <p className="text-muted-foreground mb-4">Sign in to manage your job postings.</p>
        <Button onClick={() => navigate(`${createPageUrl('SignIn')  }?return=${  encodeURIComponent('/MyJobs')}`)}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className={stb.page}>
      <MetaTags title="My job postings | Shop The Barber" />
      <PageHeader
        label="Careers"
        title="My job postings"
        subtitle="Create a draft, submit for review, and an admin will approve before it goes live on Career Hub."
        compact
        variant="light"
        tier="app"
      >
        <Button onClick={() => navigate(createPageUrl('CreateJob'))} className={cn(stb.btn, 'gap-2')}>
          <Plus className="w-5 h-5" /> New opening
        </Button>
      </PageHeader>
      <PageContent narrow>
        {isLoading ? (
          <p className="text-muted-foreground">Loading…</p>
        ) : jobs.length === 0 ? (
          <div className={cn(stb.panel, 'p-8 text-center')}>
            <Briefcase className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No job postings yet.</p>
            <Button onClick={() => navigate(createPageUrl('CreateJob'))} className={stb.btn}>Create your first job</Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li key={job.id} className={cn(stb.panel, 'p-4 hover:shadow-elevation-sm transition-shadow')}>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <Link to={`${createPageUrl('ApplicantReview')  }?jobId=${  encodeURIComponent(job.id)}`} className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">{job.title}</p>
                    <p className="text-sm text-muted-foreground">{job.employer_name}</p>
                    {job.status === 'rejected' && job.rejection_reason && (
                      <p className="text-xs text-destructive mt-1">Feedback: {job.rejection_reason}</p>
                    )}
                  </Link>
                  <div className="flex flex-wrap items-center gap-2 shrink-0">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${STATUS_STYLES[job.status] || STATUS_STYLES.draft}`}>
                      {STATUS_LABELS[job.status] || job.status}
                    </span>
                    {(job.status === 'draft' || job.status === 'rejected') && (
                      <>
                        <Button
                          size="sm"
                          className="rounded-lg gap-1"
                          onClick={(e) => { e.preventDefault(); submitMutation.mutate(job.id); }}
                          disabled={submitMutation.isPending}
                        >
                          <Send className="w-3.5 h-3.5" /> Submit
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          className="rounded-lg text-destructive"
                          onClick={(e) => { e.preventDefault(); deleteMutation.mutate(job.id); }}
                          disabled={deleteMutation.isPending}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      </>
                    )}
                    {job.status === 'published' && (
                      <Button
                        size="sm"
                        variant="outline"
                        className="rounded-lg text-muted-foreground gap-1"
                        onClick={(e) => { e.preventDefault(); closeMutation.mutate(job.id); }}
                        disabled={closeMutation.isPending}
                      >
                        <Ban className="w-3.5 h-3.5" /> Close
                      </Button>
                    )}
                    <Link to={`${createPageUrl('ApplicantReview')  }?jobId=${  encodeURIComponent(job.id)}`} className="text-muted-foreground hover:text-muted-foreground px-1" aria-label="Review applicants"></Link>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </PageContent>
    </div>
  );
}

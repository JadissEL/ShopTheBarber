import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { Plus, Briefcase } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

export default function MyJobs() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const { data: jobs = [], isLoading } = useQuery({
    queryKey: ['jobs-my'],
    queryFn: () => sovereign.jobs.my(),
    enabled: isAuthenticated,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => sovereign.jobs.update(id, { status }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['jobs-my'] }),
    onError: (e) => toast.error(e.message),
  });

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <MetaTags title="My job postings | Shop The Barber" />
        <p className="text-slate-600 mb-4">Sign in to manage your job postings.</p>
        <Button onClick={() => navigate(createPageUrl('SignIn') + '?return=' + encodeURIComponent('/MyJobs'))}>Sign in</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <MetaTags title="My job postings | Shop The Barber" />
      <div className="max-w-4xl mx-auto px-4 py-6">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold text-foreground">My job postings</h1>
          <Button onClick={() => navigate(createPageUrl('CreateJob'))} className="bg-primary text-white rounded-xl gap-2">
            <Plus className="w-5 h-5" /> New opening
          </Button>
        </div>
        {isLoading ? <p className="text-slate-500">Loading…</p> : jobs.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-200 p-8 text-center">
            <Briefcase className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-slate-600 mb-4">No job postings yet.</p>
            <Button onClick={() => navigate(createPageUrl('CreateJob'))} className="bg-primary text-white">Create your first job</Button>
          </div>
        ) : (
          <ul className="space-y-3">
            {jobs.map((job) => (
              <li key={job.id} className="p-4 bg-white rounded-xl border border-slate-200 hover:shadow-sm flex flex-wrap items-center justify-between gap-3">
                <Link to={createPageUrl('ApplicantReview') + '?jobId=' + encodeURIComponent(job.id)} className="min-w-0 flex-1">
                  <p className="font-semibold text-foreground">{job.title}</p>
                  <p className="text-sm text-slate-500">{job.employer_name}</p>
                </Link>
                <div className="flex items-center gap-2 shrink-0">
                  <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                    job.status === 'published' ? 'bg-green-100 text-green-800' :
                    job.status === 'closed' ? 'bg-slate-100 text-slate-600' : 'bg-amber-100 text-amber-800'
                  }`}>
                    {job.status}
                  </span>
                  {job.status === 'draft' && (
                    <Button size="sm" variant="outline" className="rounded-lg" onClick={(e) => { e.preventDefault(); updateStatusMutation.mutate({ id: job.id, status: 'published' }); }} disabled={updateStatusMutation.isPending}>
                      Publish
                    </Button>
                  )}
                  {job.status === 'published' && (
                    <Button size="sm" variant="outline" className="rounded-lg text-slate-600" onClick={(e) => { e.preventDefault(); updateStatusMutation.mutate({ id: job.id, status: 'closed' }); }} disabled={updateStatusMutation.isPending}>
                      Close
                    </Button>
                  )}
                  <Link to={createPageUrl('ApplicantReview') + '?jobId=' + encodeURIComponent(job.id)} className="text-slate-400 hover:text-slate-600" aria-label="Review applicants">→</Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
      <ClientBottomNav />
    </div>
  );
}

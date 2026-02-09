import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { MapPin, Clock, Briefcase, Bookmark, ArrowLeft, Sparkles, BarChart3, Handshake } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

function formatSalary(job) {
  if (job.salary_min != null || job.salary_max != null) {
    const sym = job.salary_currency === 'GBP' ? '£' : '$';
    const fmt = (n) => (n >= 1000 ? `${Number(n / 1000).toFixed(0)}k` : String(n));
    if (job.salary_min != null && job.salary_max != null) return `${sym}${fmt(job.salary_min)} – ${sym}${fmt(job.salary_max)}`;
    if (job.salary_min != null) return `${sym}${fmt(job.salary_min)}+`;
    if (job.salary_max != null) return `Up to ${sym}${fmt(job.salary_max)}`;
  }
  return null;
}

export default function JobDetail() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [saving, setSaving] = useState(false);

  const { data: job, isLoading } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => sovereign.jobs.get(jobId),
    enabled: !!jobId,
  });

  const saveJobMutation = useMutation({
    mutationFn: () => sovereign.applicant.saveJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-saved'] });
      toast.success('Job saved');
    },
    onError: (e) => toast.error(e.message),
  });

  const unsaveJobMutation = useMutation({
    mutationFn: () => sovereign.applicant.unsaveJob(jobId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-saved'] });
      toast.success('Removed from saved');
    },
    onError: (e) => toast.error(e.message),
  });

  const { data: savedList = [] } = useQuery({
    queryKey: ['applicant-saved'],
    queryFn: () => sovereign.applicant.getSaved(),
    enabled: isAuthenticated && !!jobId,
  });
  const { data: myApplications = [] } = useQuery({
    queryKey: ['applicant-applications'],
    queryFn: () => sovereign.applicant.getApplications(),
    enabled: isAuthenticated && !!jobId,
  });
  const isSaved = savedList.some((s) => s.id === jobId);
  const myApplication = myApplications.find((a) => a.job_id === jobId);

  const handleApply = () => {
    if (!isAuthenticated) {
      navigate(createPageUrl('SignIn') + '?return=' + encodeURIComponent('/JobDetail?id=' + jobId));
      return;
    }
    navigate(createPageUrl('ApplyToJob') + '?id=' + encodeURIComponent(jobId));
  };

  const handleSave = () => {
    if (!isAuthenticated) {
      navigate(createPageUrl('SignIn') + '?return=' + encodeURIComponent('/JobDetail?id=' + jobId));
      return;
    }
    setSaving(true);
    if (isSaved) unsaveJobMutation.mutate(undefined, { onSettled: () => setSaving(false) });
    else saveJobMutation.mutate(undefined, { onSettled: () => setSaving(false) });
  };

  if (!jobId || isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <MetaTags title="Job | Shop The Barber" />
        <p className="text-slate-500">Loading…</p>
      </div>
    );
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 px-4">
        <MetaTags title="Job not found | Shop The Barber" />
        <p className="text-muted-foreground">Job not found.</p>
        <Link to={createPageUrl('CareerHub')}><Button variant="outline">Back to Career Hub</Button></Link>
      </div>
    );
  }

  const salaryStr = formatSalary(job);
  const employmentLabel = job.employment_type?.replace('_', '-') || '';
  const locationLabel = job.location_type?.replace('_', '-') || '';

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-12">
      <MetaTags title={`${job.title} – ${job.employer_name || 'Job'} | Shop The Barber`} description={job.description} />

      <header className="sticky top-0 z-40 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <button type="button" onClick={() => navigate(-1)} className="p-2 rounded-full text-muted-foreground hover:bg-slate-100" aria-label="Back">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <p className="font-semibold text-foreground truncate max-w-[180px]">{job.employer_name || 'Employer'}</p>
        </div>
        <div className="flex items-center gap-1">
          <button type="button" className="p-2 rounded-full text-slate-500 hover:bg-slate-100" aria-label="Share">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" /></svg>
          </button>
          <button type="button" className="p-2 rounded-full text-slate-500 hover:bg-slate-100" aria-label="More">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" /></svg>
          </button>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 py-6 space-y-6">
        <span className="inline-block px-3 py-1 rounded-full bg-primary text-white text-xs font-semibold uppercase">
          {job.category}
        </span>
        <h1 className="text-2xl md:text-3xl font-bold text-foreground">{job.title}</h1>
        <div className="flex flex-wrap gap-4 text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <MapPin className="w-4 h-4" />
            {job.location_text || locationLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <Clock className="w-4 h-4" />
            {employmentLabel}
          </span>
          <span className="flex items-center gap-1.5">
            <Briefcase className="w-4 h-4" />
            {locationLabel}
          </span>
        </div>

        {job.description && (
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="flex items-center gap-2 font-bold text-foreground mb-3">
              <Sparkles className="w-5 h-5 text-primary" />
              The Mission
            </h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{job.description}</p>
          </section>
        )}

        {job.responsibilities && (
          <section className="bg-white rounded-2xl border border-slate-200 p-5">
            <h2 className="flex items-center gap-2 font-bold text-foreground mb-3">
              <BarChart3 className="w-5 h-5 text-primary" />
              Operational Excellence
            </h2>
            <div className="text-muted-foreground whitespace-pre-wrap">{job.responsibilities}</div>
          </section>
        )}

        {(job.required_experience_skills || salaryStr) && (
          <section className="bg-primary rounded-2xl border border-primary/30 p-5 text-primary-foreground">
            <h2 className="flex items-center gap-2 font-bold mb-3">
              <Handshake className="w-5 h-5 text-primary" />
              The Partnership
            </h2>
            {salaryStr && <p className="font-semibold mb-2">Base: {salaryStr}</p>}
            {job.required_experience_skills && <p className="text-slate-300 text-sm">{job.required_experience_skills}</p>}
          </section>
        )}

        <div className="flex flex-col gap-3 pt-4">
          {myApplication ? (
            <div className="rounded-xl border border-slate-200 bg-slate-50 px-4 py-4 text-center">
              <p className="font-semibold text-foreground">You applied</p>
              <p className="text-sm text-muted-foreground capitalize mt-0.5">{myApplication.status.replace('_', ' ')}</p>
              <Link to={createPageUrl('CareerHub') + '?tab=applied'} className="text-sm font-medium text-primary hover:underline mt-2 inline-block">View all applications</Link>
            </div>
          ) : (
            <Button onClick={handleApply} className="w-full bg-primary text-white hover:bg-primary/90 py-6 text-base font-semibold rounded-xl">
              Apply with Elite Profile →
            </Button>
          )}
          <button type="button" onClick={handleSave} disabled={saving} className="flex items-center justify-center gap-2 text-muted-foreground hover:text-foreground text-sm">
            <Bookmark className={`w-4 h-4 ${isSaved ? 'fill-current' : ''}`} />
            {isSaved ? 'Saved for later' : 'Save for later'}
          </button>
        </div>
      </main>
      <ClientBottomNav />
    </div>
  );
}

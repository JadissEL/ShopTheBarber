import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { AlertTriangle, CheckCircle2, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';

export default function ApplyToJob() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedCredentialIds, setSelectedCredentialIds] = useState([]);
  const [attachAll, setAttachAll] = useState(true);

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => sovereign.jobs.get(jobId),
    enabled: !!jobId,
  });

  const { data: profile } = useQuery({
    queryKey: ['applicant-profile'],
    queryFn: () => sovereign.applicant.getProfile(),
    enabled: !!jobId,
  });

  const { data: credentials = [] } = useQuery({
    queryKey: ['applicant-credentials'],
    queryFn: () => sovereign.applicant.getCredentials(),
    enabled: !!jobId,
  });

  useEffect(() => {
    if (credentials.length && selectedCredentialIds.length === 0) {
      const cv = credentials.find((c) => c.type === 'cv');
      if (cv) setSelectedCredentialIds([cv.id]);
    }
  }, [credentials]);

  const applyMutation = useMutation({
    mutationFn: () =>
      sovereign.applicant.apply(jobId, {
        cover_letter: coverLetter || undefined,
        credential_ids: attachAll ? credentials.map((c) => c.id) : selectedCredentialIds,
        attach_all_credentials: attachAll,
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['applicant-applications'] });
      const score = data?.match_score;
      toast.success(score != null ? `Application submitted (${score}% match)` : 'Application submitted');
      navigate(`${createPageUrl('CareerHub')  }?tab=applied`);
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleCredential = (id) => {
    setAttachAll(false);
    setSelectedCredentialIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  const percent = profile?.completeness?.percent ?? 0;
  const ready = profile?.completeness?.ready_to_apply ?? false;

  if (!jobId) {
    navigate(createPageUrl('CareerHub'));
    return null;
  }

  return (
    <div className={`${stb.page  } lg:pb-8`}>
      <MetaTags title={`Apply - ${job?.title || 'Job'} | Shop The Barber`} />
      <PageHeader
        label="Careers"
        title={`Apply to ${job?.title || 'role'}`}
        subtitle={job?.employer_name}
        compact
        variant="light"
        tier="app"
      />
      <PageContent narrow>
        <div className={cn(stb.panel, 'p-4 mb-6', ready ? 'border-primary/30 bg-primary/5' : 'border-primary/30 bg-primary/10')}>
          <div className="flex gap-3">
            {ready ? (
              <CheckCircle2 className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            ) : (
              <AlertTriangle className="w-5 h-5 text-primary shrink-0 mt-0.5" />
            )}
            <div className="text-sm">
              <p className="font-medium text-foreground">Profile {percent}% complete</p>
              <p className="text-muted-foreground mt-1">
                {ready
                  ? 'Your profile looks good. Employers will receive your summary, skills, and selected documents.'
                  : 'Complete your portfolio for stronger applications, add a summary, skills, and CV.'}
              </p>
              <Link to={createPageUrl('ProfessionalPortfolio')} className="inline-flex items-center gap-1 text-primary font-medium mt-2 hover:underline">
                Edit portfolio <ExternalLink className="w-3 h-3" />
              </Link>
            </div>
          </div>
        </div>

        {profile?.professional_summary && (
          <section className={cn(stb.panel, 'mb-6 p-4')}>
            <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">Profile preview</p>
            <p className="text-sm text-foreground/90 line-clamp-4">{profile.professional_summary}</p>
            {profile.skills?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-2">
                {profile.skills.slice(0, 8).map((s) => (
                  <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-muted">{s}</span>
                ))}
              </div>
            )}
          </section>
        )}

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-2">Cover letter (optional)</label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Introduce yourself and why you're a fit for this role…"
              className="w-full min-h-[120px] px-4 py-3 rounded-lg border border-border bg-card text-foreground placeholder:text-muted-foreground"
              rows={5}
            />
          </div>

          {credentials.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium text-foreground/90">Documents to attach</label>
                <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                  <input
                    type="checkbox"
                    checked={attachAll}
                    onChange={(e) => {
                      setAttachAll(e.target.checked);
                      if (e.target.checked) setSelectedCredentialIds(credentials.map((c) => c.id));
                    }}
                    className="rounded"
                  />
                  Attach all
                </label>
              </div>
              <ul className="space-y-2">
                {credentials.map((c) => (
                  <li key={c.id}>
                    <label className="flex items-center gap-3 p-3 rounded-lg border border-border bg-card cursor-pointer hover:bg-muted/50">
                      <input
                        type="checkbox"
                        checked={attachAll || selectedCredentialIds.includes(c.id)}
                        disabled={attachAll}
                        onChange={() => toggleCredential(c.id)}
                        className="rounded"
                      />
                      <span className="font-medium text-foreground flex-1">{c.file_name}</span>
                      <span className="text-xs text-muted-foreground capitalize">{c.type}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {credentials.length === 0 && (
            <p className="text-sm text-muted-foreground bg-primary/10 border border-amber-100 rounded-lg p-3">
              No documents uploaded yet. You can still apply, but adding a CV improves your match score.{' '}
              <Link to={createPageUrl('PortfolioCredentials')} className="font-medium underline">Upload now</Link>
            </p>
          )}

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1 rounded-lg">Cancel</Button>
            <Button onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending} className="flex-1 bg-primary text-white hover:bg-primary/90 rounded-lg">
              {applyMutation.isPending ? 'Submitting…' : 'Submit application'}
            </Button>
          </div>
        </div>
      </PageContent>
    </div>
  );
}

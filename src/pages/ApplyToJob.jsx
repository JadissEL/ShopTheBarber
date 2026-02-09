import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

export default function ApplyToJob() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('id');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [coverLetter, setCoverLetter] = useState('');
  const [selectedCredentialIds, setSelectedCredentialIds] = useState([]);

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => sovereign.jobs.get(jobId),
    enabled: !!jobId,
  });

  const { data: credentials = [] } = useQuery({
    queryKey: ['applicant-credentials'],
    queryFn: () => sovereign.applicant.getCredentials(),
    enabled: !!jobId,
  });

  const applyMutation = useMutation({
    mutationFn: () => sovereign.applicant.apply(jobId, { cover_letter: coverLetter || undefined, credential_ids: selectedCredentialIds.length ? selectedCredentialIds : undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-applications'] });
      toast.success('Application submitted');
      navigate(createPageUrl('CareerHub') + '?tab=applied');
    },
    onError: (e) => toast.error(e.message),
  });

  const toggleCredential = (id) => {
    setSelectedCredentialIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  };

  if (!jobId) {
    navigate(createPageUrl('CareerHub'));
    return null;
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <MetaTags title={`Apply – ${job?.title || 'Job'} | Shop The Barber`} />
      <div className="max-w-2xl mx-auto px-4 py-8">
        <h1 className="text-2xl font-bold text-foreground mb-2">Apply to {job?.title}</h1>
        <p className="text-slate-600 mb-6">{job?.employer_name}</p>

        <div className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">Cover letter (optional)</label>
            <textarea
              value={coverLetter}
              onChange={(e) => setCoverLetter(e.target.value)}
              placeholder="Introduce yourself and why you're a fit..."
              className="w-full min-h-[120px] px-4 py-3 rounded-xl border border-border bg-card text-foreground placeholder:text-muted-foreground"
              rows={5}
            />
          </div>

          {credentials.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">Attach credentials (optional)</label>
              <ul className="space-y-2">
                {credentials.map((c) => (
                  <li key={c.id}>
                    <label className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 bg-white cursor-pointer hover:bg-slate-50">
                      <input type="checkbox" checked={selectedCredentialIds.includes(c.id)} onChange={() => toggleCredential(c.id)} className="rounded" />
                      <span className="font-medium text-foreground">{c.file_name}</span>
                      <span className="text-xs text-slate-500">{c.type}</span>
                    </label>
                  </li>
                ))}
              </ul>
            </div>
          )}

          <p className="text-sm text-slate-500">Your profile information will be shared with the employer. You can save this draft and return later from your dashboard.</p>

          <div className="flex gap-3 pt-4">
            <Button variant="outline" onClick={() => navigate(-1)} className="flex-1 rounded-xl">Cancel</Button>
            <Button onClick={() => applyMutation.mutate()} disabled={applyMutation.isPending} className="flex-1 bg-primary text-white hover:bg-primary/90 rounded-xl">
              {applyMutation.isPending ? 'Submitting…' : 'Submit application'}
            </Button>
          </div>
        </div>
      </div>
      <ClientBottomNav />
    </div>
  );
}

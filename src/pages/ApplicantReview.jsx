import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { Calendar, MessageCircle } from 'lucide-react';
import SearchField from '@/components/ui/search-field';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';

export default function ApplicantReview() {
  const [searchParams] = useSearchParams();
  const jobId = searchParams.get('jobId');
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [scheduleAppId, setScheduleAppId] = useState(null);

  const { data: job } = useQuery({
    queryKey: ['job', jobId],
    queryFn: () => sovereign.jobs.get(jobId),
    enabled: !!jobId,
  });

  const { data: applicants = [] } = useQuery({
    queryKey: ['job-applicants', jobId],
    queryFn: () => sovereign.applications.listForJob(jobId),
    enabled: !!jobId,
  });

  const updateStatusMutation = useMutation({
    mutationFn: ({ id, status }) => sovereign.applications.updateStatus(id, status),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['job-applicants', jobId] }),
    onError: (e) => toast.error(e.message),
  });

  const filtered = applicants.filter((a) => {
    const matchSearch = !search || (a.applicant_name || '').toLowerCase().includes(search.toLowerCase()) || (a.applicant_email || '').toLowerCase().includes(search.toLowerCase());
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchStatus;
  });

  const shortlisted = applicants.filter((a) => a.status === 'shortlisted').length;
  const interviewing = applicants.filter((a) => a.status === 'under_review').length;
  const pending = applicants.filter((a) => a.status === 'received' || a.status === 'under_review').length;

  if (!jobId) {
    navigate(createPageUrl('MyJobs'));
    return null;
  }

  return (
    <div className={`${stb.page  } lg:pb-8`}>
      <MetaTags title={`Applicant review - ${job?.title} | Shop The Barber`} />
      <PageHeader
        label="Careers"
        title="Applicant review"
        subtitle={job?.title ? `${job.title} · ${applicants.length} total applicants` : 'Review candidates for your opening'}
        compact
        variant="light"
        tier="app"
      />
      <PageContent>
        <div className={`${stb.panel  } p-5 mb-6`}>
          <p className={`${stb.overline  } mb-1`}>Active role</p>
          <h2 className={stb.uiSubheading}>{job?.title}</h2>
          <p className="text-muted-foreground text-sm">{applicants.length} total applicants</p>
          <div className="flex gap-3 mt-3">
            <button type="button" onClick={() => setStatusFilter('shortlisted')} className="px-3 py-1.5 rounded-lg bg-muted text-foreground/90 text-sm font-medium">{shortlisted} Shortlisted</button>
            <button type="button" onClick={() => setStatusFilter('under_review')} className="px-3 py-1.5 rounded-lg bg-muted text-foreground/90 text-sm font-medium">{interviewing} Interviewing</button>
            <button type="button" onClick={() => setStatusFilter('all')} className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-sm font-medium border border-primary">{pending} Pending</button>
          </div>
        </div>
        <SearchField
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onClear={() => setSearch('')}
          placeholder="Search by name or email..."
          className="mb-4"
          aria-label="Search applicants"
        />
        <p className="text-sm font-medium text-foreground/90 mb-2">Top matches</p>
        <ul className="space-y-4">
          {filtered.map((app) => (
            <li key={app.id} className="stb-panel p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex gap-3 min-w-0">
                  <div className="w-12 h-12 rounded-full bg-muted shrink-0 flex items-center justify-center text-muted-foreground font-semibold">{(app.applicant_name || '?')[0]}</div>
                  <div className="min-w-0">
                    <p className="font-semibold text-foreground">{app.applicant_name || 'Applicant'}</p>
                    <p className="text-sm text-muted-foreground">{app.applicant_email}</p>
                    {app.profile?.years_experience != null && (
                      <p className="text-xs text-muted-foreground">{app.profile.years_experience} years exp.</p>
                    )}
                    {app.cover_letter && (
                      <p className="text-sm text-muted-foreground mt-2 line-clamp-2 italic">&ldquo;{app.cover_letter}&rdquo;</p>
                    )}
                    {app.profile?.skills?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {app.profile.skills.slice(0, 5).map((s) => (
                          <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-muted">{s}</span>
                        ))}
                      </div>
                    )}
                    {(app.documents?.length > 0 || app.credentials?.length > 0) && (
                      <p className="text-xs text-muted-foreground mt-2">{app.documents?.length || app.credentials?.length} document(s) attached</p>
                    )}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  {app.match_score != null && <p className="text-primary font-semibold">{app.match_score}% match</p>}
                  <select value={app.status} onChange={(e) => updateStatusMutation.mutate({ id: app.id, status: e.target.value })} className="mt-1 text-sm rounded border border-border px-2 py-1">
                    <option value="received">Received</option>
                    <option value="under_review">Under review</option>
                    <option value="shortlisted">Shortlisted</option>
                    <option value="rejected">Rejected</option>
                    <option value="hired">Hired</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Button size="sm" onClick={() => setScheduleAppId(app.id)} className="gap-1 rounded-lg"><Calendar className="w-4 h-4" /> Schedule</Button>
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => navigate(`${createPageUrl('Chat')  }?contactId=${  encodeURIComponent(app.user_id)}`)} aria-label="Open chat"><MessageCircle className="w-4 h-4" /></Button>
              </div>
            </li>
          ))}
        </ul>
        {filtered.length === 0 && <p className="text-muted-foreground py-8 text-center">No applicants match.</p>}
      </PageContent>
      {scheduleAppId && (
        <ScheduleInterviewModal applicationId={scheduleAppId} onClose={() => setScheduleAppId(null)} onDone={() => { queryClient.invalidateQueries({ queryKey: ['job-applicants', jobId] }); setScheduleAppId(null); }} />
      )}
    </div>
  );
}

function ScheduleInterviewModal({ applicationId, onClose, onDone }) {
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [format, setFormat] = useState('video');
  const scheduleMutation = useMutation({
    mutationFn: () => sovereign.applications.scheduleInterview(applicationId, { scheduled_at: date && time ? `${date}T${time}:00.000Z` : new Date().toISOString(), format }),
    onSuccess: () => { onDone(); toast.success('Interview scheduled'); },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50" onClick={onClose}>
      <div className="bg-card rounded-lg max-w-md w-full p-6 shadow-elevation-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-bold text-foreground mb-4">Schedule Interview</h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">Date</label>
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">Time</label>
            <input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="w-full px-4 py-2 rounded-lg border border-border" />
          </div>
          <div>
            <label className="block text-sm font-medium text-foreground/90 mb-1">Format</label>
            <div className="flex gap-2">
              {['in_person', 'video', 'phone'].map((f) => (
                <button key={f} type="button" onClick={() => setFormat(f)} className={`px-3 py-2 rounded-lg border text-sm ${format === f ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>{f.replace('_', ' ')}</button>
              ))}
            </div>
          </div>
        </div>
        <div className="flex gap-3 mt-6">
          <Button variant="outline" onClick={onClose} className="flex-1 rounded-lg">Cancel</Button>
          <Button onClick={() => scheduleMutation.mutate()} disabled={scheduleMutation.isPending} className="flex-1 bg-primary text-white rounded-lg">Confirm</Button>
        </div>
      </div>
    </div>
  );
}

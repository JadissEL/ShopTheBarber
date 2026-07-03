import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import {
  FileText,
  Award,
  FileEdit,
  Upload,
  Send,
  Pencil,
  Plus,
  Trash2,
  ExternalLink,
  Download,
} from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';

const AVAILABILITY_OPTIONS = [
  { id: 'immediate', label: 'Available immediately' },
  { id: 'two_weeks', label: 'Within 2 weeks' },
  { id: 'one_month', label: 'Within 1 month' },
  { id: 'flexible', label: 'Flexible / open to discuss' },
];

const JOB_TYPE_OPTIONS = [
  { id: 'full_time', label: 'Full-time' },
  { id: 'part_time', label: 'Part-time' },
  { id: 'contract', label: 'Contract' },
  { id: 'freelance', label: 'Freelance' },
];

const SKILL_SUGGESTIONS = [
  'Hair cutting',
  'Fades',
  'Beard grooming',
  'Color / highlights',
  'Styling',
  'Hot towel shave',
  'Scissor work',
  'Client consultation',
  'Shop management',
  'Hygiene & safety',
];

const emptyForm = () => ({
  professional_summary: '',
  years_experience: '',
  skills: [],
  skillInput: '',
  availability: '',
  preferred_job_types: [],
  work_experience: [],
  certifications: [],
  portfolio_links: [],
});

export default function ProfessionalPortfolio() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated, user } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState(emptyForm());

  const { data: profile } = useQuery({
    queryKey: ['applicant-profile'],
    queryFn: () => sovereign.applicant.getProfile(),
    enabled: isAuthenticated,
  });

  useEffect(() => {
    if (profile) {
      setForm({
        professional_summary: profile.professional_summary || '',
        years_experience: profile.years_experience != null ? String(profile.years_experience) : '',
        skills: Array.isArray(profile.skills) ? profile.skills : [],
        skillInput: '',
        availability: profile.availability || '',
        preferred_job_types: Array.isArray(profile.preferred_job_types) ? profile.preferred_job_types : [],
        work_experience: Array.isArray(profile.work_experience) ? profile.work_experience : [],
        certifications: Array.isArray(profile.certifications) ? profile.certifications : [],
        portfolio_links: Array.isArray(profile.portfolio_links) ? profile.portfolio_links : [],
      });
    }
  }, [profile]);

  const saveProfileMutation = useMutation({
    mutationFn: () =>
      sovereign.applicant.saveProfile({
        professional_summary: form.professional_summary || undefined,
        years_experience: form.years_experience ? parseInt(form.years_experience, 10) : undefined,
        skills: form.skills,
        availability: form.availability || undefined,
        preferred_job_types: form.preferred_job_types,
        work_experience: form.work_experience,
        certifications: form.certifications,
        portfolio_links: form.portfolio_links,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
      toast.success('Profile updated');
      setEditing(false);
    },
    onError: (e) => toast.error(e.message),
  });

  const { data: credentials = [] } = useQuery({
    queryKey: ['applicant-credentials'],
    queryFn: () => sovereign.applicant.getCredentials(),
    enabled: isAuthenticated,
  });

  const deleteCredentialMutation = useMutation({
    mutationFn: (id) => sovereign.applicant.deleteCredential(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['applicant-credentials'] });
      queryClient.invalidateQueries({ queryKey: ['applicant-profile'] });
      toast.success('Credential removed');
    },
    onError: (e) => toast.error(e.message),
  });

  const percent = profile?.completeness?.percent ?? 0;
  const readyToApply = profile?.completeness?.ready_to_apply ?? false;
  const checks = profile?.completeness?.checks ?? {};
  const showcaseImage =
    credentials.find((c) => c.type === 'portfolio' && c.mime_type?.startsWith('image/')) ||
    credentials.find((c) => c.mime_type?.startsWith('image/'));

  const addSkill = (skill) => {
    const s = (skill || form.skillInput).trim();
    if (!s || form.skills.includes(s)) return;
    setForm((f) => ({ ...f, skills: [...f.skills, s], skillInput: '' }));
  };

  const toggleJobType = (id) => {
    setForm((f) => ({
      ...f,
      preferred_job_types: f.preferred_job_types.includes(id)
        ? f.preferred_job_types.filter((x) => x !== id)
        : [...f.preferred_job_types, id],
    }));
  };

  const addWorkEntry = () => {
    setForm((f) => ({
      ...f,
      work_experience: [...f.work_experience, { role: '', company: '', period: '', description: '' }],
    }));
  };

  const updateWorkEntry = (index, field, value) => {
    setForm((f) => {
      const next = [...f.work_experience];
      next[index] = { ...next[index], [field]: value };
      return { ...f, work_experience: next };
    });
  };

  const removeWorkEntry = (index) => {
    setForm((f) => ({ ...f, work_experience: f.work_experience.filter((_, i) => i !== index) }));
  };

  const addCertEntry = () => {
    setForm((f) => ({
      ...f,
      certifications: [...f.certifications, { name: '', issuer: '', year: '' }],
    }));
  };

  const updateCertEntry = (index, field, value) => {
    setForm((f) => {
      const next = [...f.certifications];
      next[index] = { ...next[index], [field]: value };
      return { ...f, certifications: next };
    });
  };

  const removeCertEntry = (index) => {
    setForm((f) => ({ ...f, certifications: f.certifications.filter((_, i) => i !== index) }));
  };

  const addPortfolioLink = () => {
    setForm((f) => ({
      ...f,
      portfolio_links: [...f.portfolio_links, { label: '', url: '' }],
    }));
  };

  const updatePortfolioLink = (index, field, value) => {
    setForm((f) => {
      const next = [...f.portfolio_links];
      next[index] = { ...next[index], [field]: value };
      return { ...f, portfolio_links: next };
    });
  };

  const removePortfolioLink = (index) => {
    setForm((f) => ({ ...f, portfolio_links: f.portfolio_links.filter((_, i) => i !== index) }));
  };

  if (!isAuthenticated) {
    return (
      <div className="stb-page flex flex-col items-center justify-center p-4">
        <MetaTags title="Professional Portfolio | Shop The Barber" />
        <p className="text-muted-foreground mb-4">Sign in to manage your professional portfolio.</p>
        <Link to={`${createPageUrl('SignIn')  }?return=${  encodeURIComponent('/ProfessionalPortfolio')}`}>
          <Button className="bg-[hsl(var(--navy))] text-white">Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className={`${stb.page  } pb-24 lg:pb-12`}>
      <MetaTags title="Professional Portfolio | Shop The Barber" description="Your credentials and career readiness." />
      <PageHeader
        label="Careers"
        title="Professional portfolio"
        subtitle="Career profile — credentials, skills, and readiness"
        compact
        variant="light"
        tier="app"
      >
        <Link to={createPageUrl('PortfolioCredentials')} className="inline-flex items-center gap-2 text-sm font-medium text-primary">
          <Upload className="w-4 h-4" /> Upload
        </Link>
      </PageHeader>

      <PageContent narrow className="space-y-6">
        <div className="aspect-[4/3] rounded-lg bg-muted overflow-hidden border border-border">
          {showcaseImage ? (
            <PortfolioImagePreview credentialId={showcaseImage.id} alt="Portfolio showcase" />
          ) : profile?.portfolio_links?.[0]?.url ? (
            <img src={profile.portfolio_links[0].url} alt="Portfolio" className="w-full h-full object-cover" />
          ) : user?.avatar_url ? (
            <img src={user.avatar_url} alt="" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-2 p-6 text-center">
              <FileEdit className="w-10 h-10 opacity-50" />
              <p className="text-sm">Upload a portfolio image or add a link to showcase your work.</p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap gap-4 text-muted-foreground text-sm">
          <span><span className="font-semibold text-foreground">{percent}%</span> profile complete</span>
          <span><span className="font-semibold text-foreground">{profile?.years_experience ?? 0}</span> yrs experience</span>
          <span><span className="font-semibold text-foreground">{credentials.length}</span> documents</span>
          <span><span className="font-semibold text-foreground">{form.skills.length || profile?.skills?.length || 0}</span> skills</span>
        </div>

        <section className="stb-panel p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className={stb.uiSubheading}>Professional profile</h2>
            {!editing ? (
              <Button size="sm" variant="outline" className="rounded-lg gap-1" onClick={() => setEditing(true)}>
                <Pencil className="w-4 h-4" /> Edit
              </Button>
            ) : (
              <div className="flex gap-2">
                <Button size="sm" variant="outline" className="rounded-lg" onClick={() => setEditing(false)}>Cancel</Button>
                <Button size="sm" className="rounded-lg bg-primary text-white" onClick={() => saveProfileMutation.mutate()} disabled={saveProfileMutation.isPending}>Save</Button>
              </div>
            )}
          </div>

          {editing ? (
            <div className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">Professional summary</label>
                <textarea value={form.professional_summary} onChange={(e) => setForm((f) => ({ ...f, professional_summary: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-border min-h-[100px]" placeholder="Overview of your experience, style, and career goals..." />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-foreground/90 mb-1">Years of experience</label>
                  <input type="number" min="0" value={form.years_experience} onChange={(e) => setForm((f) => ({ ...f, years_experience: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-border" placeholder="e.g. 5" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground/90 mb-1">Availability</label>
                  <select value={form.availability} onChange={(e) => setForm((f) => ({ ...f, availability: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-border bg-card">
                    <option value="">Select…</option>
                    {AVAILABILITY_OPTIONS.map((o) => (
                      <option key={o.id} value={o.id}>{o.label}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-2">Preferred job types</label>
                <div className="flex flex-wrap gap-2">
                  {JOB_TYPE_OPTIONS.map((o) => (
                    <button key={o.id} type="button" onClick={() => toggleJobType(o.id)} className={`px-3 py-1.5 rounded-full text-sm border ${form.preferred_job_types.includes(o.id) ? 'bg-primary text-white border-primary' : 'bg-card text-foreground/90 border-border'}`}>
                      {o.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-2">Skills</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {form.skills.map((s) => (
                    <span key={s} className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary/10 text-primary text-sm">
                      {s}
                      <button type="button" onClick={() => setForm((f) => ({ ...f, skills: f.skills.filter((x) => x !== s) }))} className="hover:text-destructive">×</button>
                    </span>
                  ))}
                </div>
                <div className="flex gap-2">
                  <input type="text" value={form.skillInput} onChange={(e) => setForm((f) => ({ ...f, skillInput: e.target.value }))} onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addSkill())} className="flex-1 px-4 py-2 rounded-lg border border-border" placeholder="Add a skill" />
                  <Button type="button" size="sm" variant="outline" onClick={() => addSkill()}>Add</Button>
                </div>
                <div className="flex flex-wrap gap-1 mt-2">
                  {SKILL_SUGGESTIONS.filter((s) => !form.skills.includes(s)).slice(0, 6).map((s) => (
                    <button key={s} type="button" onClick={() => addSkill(s)} className="text-xs px-2 py-1 rounded bg-muted text-muted-foreground hover:bg-muted">{s}</button>
                  ))}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground/90">Work experience</label>
                  <Button type="button" size="sm" variant="ghost" className="gap-1 h-8" onClick={addWorkEntry}><Plus className="w-4 h-4" /> Add</Button>
                </div>
                {form.work_experience.map((entry, i) => (
                  <div key={i} className="mb-3 p-3 rounded-lg border border-border space-y-2">
                    <div className="flex gap-2">
                      <input value={entry.role} onChange={(e) => updateWorkEntry(i, 'role', e.target.value)} placeholder="Role" className="flex-1 px-3 py-2 rounded-lg border border-border text-sm" />
                      <input value={entry.company} onChange={(e) => updateWorkEntry(i, 'company', e.target.value)} placeholder="Company / shop" className="flex-1 px-3 py-2 rounded-lg border border-border text-sm" />
                      <button type="button" onClick={() => removeWorkEntry(i)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                    </div>
                    <input value={entry.period || ''} onChange={(e) => updateWorkEntry(i, 'period', e.target.value)} placeholder="Period e.g. 2020 - 2024" className="w-full px-3 py-2 rounded-lg border border-border text-sm" />
                    <textarea value={entry.description || ''} onChange={(e) => updateWorkEntry(i, 'description', e.target.value)} placeholder="What you did…" className="w-full px-3 py-2 rounded-lg border border-border text-sm min-h-[60px]" />
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground/90">Certifications</label>
                  <Button type="button" size="sm" variant="ghost" className="gap-1 h-8" onClick={addCertEntry}><Plus className="w-4 h-4" /> Add</Button>
                </div>
                {form.certifications.map((entry, i) => (
                  <div key={i} className="mb-2 flex gap-2 items-center">
                    <input value={entry.name} onChange={(e) => updateCertEntry(i, 'name', e.target.value)} placeholder="Certificate name" className="flex-1 px-3 py-2 rounded-lg border border-border text-sm" />
                    <input value={entry.issuer || ''} onChange={(e) => updateCertEntry(i, 'issuer', e.target.value)} placeholder="Issuer" className="w-28 px-3 py-2 rounded-lg border border-border text-sm" />
                    <input value={entry.year || ''} onChange={(e) => updateCertEntry(i, 'year', e.target.value)} placeholder="Year" className="w-16 px-3 py-2 rounded-lg border border-border text-sm" />
                    <button type="button" onClick={() => removeCertEntry(i)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-foreground/90">Portfolio links</label>
                  <Button type="button" size="sm" variant="ghost" className="gap-1 h-8" onClick={addPortfolioLink}><Plus className="w-4 h-4" /> Add</Button>
                </div>
                {form.portfolio_links.map((entry, i) => (
                  <div key={i} className="mb-2 flex gap-2">
                    <input value={entry.label} onChange={(e) => updatePortfolioLink(i, 'label', e.target.value)} placeholder="Label" className="w-32 px-3 py-2 rounded-lg border border-border text-sm" />
                    <input value={entry.url} onChange={(e) => updatePortfolioLink(i, 'url', e.target.value)} placeholder="https://…" className="flex-1 px-3 py-2 rounded-lg border border-border text-sm" />
                    <button type="button" onClick={() => removePortfolioLink(i)} className="p-2 text-muted-foreground hover:text-destructive"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="text-muted-foreground text-sm space-y-3">
              {profile?.professional_summary ? <p>{profile.professional_summary}</p> : <p className="text-muted-foreground italic">No summary yet. Edit to add one.</p>}
              {profile?.skills?.length > 0 && (
                <div className="flex flex-wrap gap-1">
                  {profile.skills.map((s) => (
                    <span key={s} className="px-2 py-0.5 rounded-full bg-muted text-foreground/90 text-xs">{s}</span>
                  ))}
                </div>
              )}
              {profile?.availability && (
                <p><span className="font-medium text-foreground/90">Availability:</span> {AVAILABILITY_OPTIONS.find((o) => o.id === profile.availability)?.label || profile.availability}</p>
              )}
              {profile?.work_experience?.length > 0 && (
                <div>
                  <p className="font-medium text-foreground/90 mb-1">Experience</p>
                  <ul className="space-y-2">
                    {profile.work_experience.map((w, i) => (
                      <li key={i} className="border-l-2 border-primary/30 pl-3">
                        <p className="font-medium text-foreground">{w.role}{w.company ? `, ${w.company}` : ''}</p>
                        {w.period && <p className="text-xs text-muted-foreground">{w.period}</p>}
                        {w.description && <p className="text-xs mt-0.5">{w.description}</p>}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              {profile?.portfolio_links?.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {profile.portfolio_links.map((l, i) => (
                    <a key={i} href={l.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary text-sm hover:underline">
                      {l.label || 'Portfolio'} <ExternalLink className="w-3 h-3" />
                    </a>
                  ))}
                </div>
              )}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className={stb.uiSubheading}>Credentials & documents</h2>
            <Link to={createPageUrl('PortfolioCredentials')}>
              <Button size="sm" className="bg-primary text-white rounded-lg gap-1">
                <Upload className="w-4 h-4" /> Upload
              </Button>
            </Link>
          </div>
          <ul className="space-y-3">
            {credentials.map((c) => (
              <li key={c.id} className="flex items-center gap-3 p-4 bg-card rounded-lg border border-border">
                {c.type === 'cv' && <FileText className="w-5 h-5 text-primary shrink-0" />}
                {c.type === 'certificate' && <Award className="w-5 h-5 text-primary shrink-0" />}
                {c.type === 'portfolio' && <FileEdit className="w-5 h-5 text-primary shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground truncate">{c.file_name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{c.type}{c.file_size ? `, ${Math.round(c.file_size / 1024)} KB` : ''}</p>
                </div>
                <button type="button" onClick={() => sovereign.applicant.downloadCredential(c.id, c.file_name)} className="p-2 text-muted-foreground hover:text-primary" aria-label="Download">
                  <Download className="w-4 h-4" />
                </button>
                <button type="button" onClick={() => deleteCredentialMutation.mutate(c.id)} className="p-2 text-muted-foreground hover:text-destructive" aria-label="Delete">
                  <Trash2 className="w-4 h-4" />
                </button>
              </li>
            ))}
          </ul>
          {credentials.length === 0 && (
            <p className="text-muted-foreground text-sm py-4">Upload your CV and certificates to strengthen applications.</p>
          )}
        </section>

        <section className="stb-panel p-5">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">Career readiness</h2>
          <div className="h-2 bg-muted rounded-full overflow-hidden mb-3">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${percent}%` }} />
          </div>
          <ul className="grid grid-cols-2 gap-1 text-xs text-muted-foreground mb-3">
            {[
              ['Summary', checks.summary],
              ['Skills', checks.skills],
              ['Experience', checks.experience],
              ['CV uploaded', checks.cv],
              ['Certifications', checks.certifications],
              ['Availability', checks.availability],
            ].map(([label, done]) => (
              <li key={label} className={done ? 'text-success' : 'text-muted-foreground'}>{done ? '✓' : '○'} {label}</li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            {readyToApply
              ? 'Your profile is ready, employers will see a strong application.'
              : 'Add a summary, skills, and a CV (or work history) before applying.'}
          </p>
        </section>

        <Button
          onClick={() => navigate(createPageUrl('CareerHub'))}
          className="w-full bg-primary text-white hover:bg-primary/90 py-6 rounded-lg gap-2"
        >
          <Send className="w-5 h-5" /> Browse jobs & apply
        </Button>
      </PageContent>
    </div>
  );
}

function PortfolioImagePreview({ credentialId, alt }) {
  const [src, setSrc] = useState(null);
  useEffect(() => {
    let objectUrl = null;
    sovereign.applicant
      .getCredentialBlobUrl(credentialId)
      .then((url) => {
        objectUrl = url;
        setSrc(url);
      })
      .catch(() => {});
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [credentialId]);
  if (!src) {
    return <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm">Loading showcase…</div>;
  }
  return <img src={src} alt={alt} className="w-full h-full object-cover" />;
}

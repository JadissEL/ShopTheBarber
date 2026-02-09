import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link, useNavigate } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { ArrowLeft, FileText, Award, FileEdit, Upload, Send, Pencil } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { toast } from 'sonner';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

export default function ProfessionalPortfolio() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { isAuthenticated } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({ professional_summary: '', years_experience: '', skills: '' });

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
        skills: typeof profile.skills === 'string' ? profile.skills : (Array.isArray(profile.skills) ? profile.skills.join(', ') : (profile.skills ? JSON.stringify(profile.skills) : '')),
      });
    }
  }, [profile]);

  const saveProfileMutation = useMutation({
    mutationFn: () => sovereign.applicant.saveProfile({
      professional_summary: form.professional_summary || undefined,
      years_experience: form.years_experience ? parseInt(form.years_experience, 10) : undefined,
      skills: form.skills ? form.skills.split(',').map((s) => s.trim()).filter(Boolean) : undefined,
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

  const hasSummary = !!profile?.professional_summary;
  const hasExperience = !!profile?.work_experience;
  const hasSkills = !!profile?.skills;
  const hasCerts = !!profile?.certifications || credentials.some((c) => c.type === 'certificate');
  const hasCV = credentials.some((c) => c.type === 'cv');
  const score = [hasSummary, hasExperience, hasSkills, hasCerts, hasCV].filter(Boolean).length;
  const percent = Math.round((score / 5) * 100);

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
        <MetaTags title="Professional Portfolio | Shop The Barber" />
        <p className="text-slate-600 mb-4">Sign in to manage your professional portfolio.</p>
        <Link to={createPageUrl('SignIn') + '?return=' + encodeURIComponent('/ProfessionalPortfolio')}>
          <Button className="bg-slate-900 text-white">Sign in</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-12">
      <MetaTags title="Professional Portfolio | Shop The Barber" description="Your credentials and career readiness." />
      <header className="sticky top-0 z-40 bg-primary text-primary-foreground px-4 py-4 flex items-center justify-between">
        <button type="button" onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/10" aria-label="Back">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="text-center">
          <h1 className="text-lg font-bold">Professional Portfolio</h1>
          <p className="text-primary text-xs uppercase tracking-wider">Elite Specialist</p>
        </div>
        <button type="button" className="p-2 rounded-full hover:bg-white/10" aria-label="Menu">
          <span className="text-xl">⋯</span>
        </button>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        <div className="aspect-[4/3] rounded-2xl bg-slate-200 overflow-hidden">
          <div className="w-full h-full flex items-center justify-center text-slate-500">Portfolio showcase</div>
        </div>

        <div className="flex gap-4 text-slate-600">
          <span className="font-semibold text-foreground">5.8k</span> Views
          <span className="font-semibold text-foreground">4.9 ⭐</span> Rating
          <span className="font-semibold text-foreground">{profile?.years_experience ?? 0} yrs</span> Experience
        </div>

        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-foreground">Professional profile</h2>
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
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Professional summary</label>
                <textarea value={form.professional_summary} onChange={(e) => setForm((f) => ({ ...f, professional_summary: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200 min-h-[80px]" placeholder="A brief overview of your experience and goals..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Years of experience</label>
                <input type="number" min="0" value={form.years_experience} onChange={(e) => setForm((f) => ({ ...f, years_experience: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200" placeholder="e.g. 8" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Skills (comma-separated)</label>
                <input type="text" value={form.skills} onChange={(e) => setForm((f) => ({ ...f, skills: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200" placeholder="e.g. Cutting, Styling, Beard work" />
              </div>
            </div>
          ) : (
            <div className="text-slate-600 text-sm space-y-2">
              {profile?.professional_summary ? <p>{profile.professional_summary}</p> : <p className="text-slate-400 italic">No summary yet. Edit to add one.</p>}
              {(() => {
                const s = profile?.skills;
                const skillsStr = Array.isArray(s) ? s.join(', ') : (typeof s === 'string' && s) ? (s.startsWith('[') ? (() => { try { return JSON.parse(s).join(', '); } catch { return s; } })() : s) : '';
                return skillsStr ? <p><span className="font-medium text-slate-700">Skills:</span> {skillsStr}</p> : null;
              })()}
            </div>
          )}
        </section>

        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-bold text-foreground">Credentials & Vault</h2>
            <Link to={createPageUrl('PortfolioCredentials')}>
              <Button size="sm" className="bg-primary text-white rounded-lg gap-1">
                <Upload className="w-4 h-4" /> Upload
              </Button>
            </Link>
          </div>
          <ul className="space-y-3">
            {credentials.map((c) => (
              <li key={c.id} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-slate-200">
                {c.type === 'cv' && <FileText className="w-5 h-5 text-primary shrink-0" />}
                {c.type === 'certificate' && <Award className="w-5 h-5 text-primary shrink-0" />}
                {c.type === 'portfolio' && <FileEdit className="w-5 h-5 text-primary shrink-0" />}
                <div className="min-w-0 flex-1">
                  <p className="font-medium text-foreground">{c.file_name}</p>
                  <p className="text-xs text-slate-500">{c.verified ? 'Verified' : 'Uploaded'}</p>
                </div>
                <span className="text-slate-400">→</span>
              </li>
            ))}
          </ul>
          {credentials.length === 0 && (
            <p className="text-slate-500 text-sm py-4">No credentials yet. Add a CV or certificate to strengthen your profile.</p>
          )}
        </section>

        <section className="bg-white rounded-2xl border border-slate-200 p-5">
          <h2 className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Career Readiness</h2>
          <div className="h-2 bg-slate-100 rounded-full overflow-hidden mb-2">
            <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${percent}%` }} />
          </div>
          <p className="text-sm text-slate-600">
            Your profile is {percent >= 80 ? 'highly competitive' : percent >= 60 ? 'getting strong' : 'in progress'}. {percent < 100 && 'Adding a Hygiene Safety Certificate could increase your application success rate.'}
          </p>
        </section>

        <Button onClick={() => navigate(createPageUrl('CareerHub'))} className="w-full bg-primary text-white hover:bg-primary/90 py-6 rounded-xl gap-2">
          <Send className="w-5 h-5" /> Apply with Profile
        </Button>
      </main>
      <ClientBottomNav />
    </div>
  );
}

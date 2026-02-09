import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { User, Bell, MapPin, Briefcase, Bookmark, Send, Compass } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { createPageUrl } from '@/utils';
import { useAuth } from '@/lib/AuthContext';
import { useIsDesktop } from '@/hooks/useMediaQuery';

const CATEGORIES = [
  { id: 'artistry', label: 'Artistry' },
  { id: 'grooming', label: 'Grooming' },
  { id: 'management', label: 'Operations' },
  { id: 'logistics', label: 'Logistics' },
  { id: 'branding', label: 'Branding' },
  { id: 'accounting', label: 'Accounting' },
];

const EMPLOYMENT_TYPES = [
  { value: '', label: 'Any' },
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
];

const LOCATION_TYPES = [
  { value: '', label: 'Any' },
  { value: 'on_site', label: 'On-site' },
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
];

function formatSalary(job) {
  if (job.salary_min != null || job.salary_max != null) {
    const sym = job.salary_currency === 'GBP' ? '£' : '$';
    if (job.salary_min != null && job.salary_max != null) return `${sym}${Number(job.salary_min / 1000).toFixed(0)}k – ${Number(job.salary_max / 1000).toFixed(0)}k`;
    if (job.salary_min != null) return `${sym}${Number(job.salary_min / 1000).toFixed(0)}k`;
    if (job.salary_max != null) return `${sym}${Number(job.salary_max / 1000).toFixed(0)}k`;
  }
  return null;
}

export default function CareerHub() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') || 'explore';
  const { isAuthenticated } = useAuth();
  const isDesktop = useIsDesktop();

  const [category, setCategory] = useState('');
  const [employmentType, setEmploymentType] = useState('');
  const [locationType, setLocationType] = useState('');

  const { data: featured = [], isLoading: isFeaturedLoading } = useQuery({
    queryKey: ['jobs-featured'],
    queryFn: () => sovereign.jobs.featured(),
  });

  const { data: allJobs = [], isLoading: isAllJobsLoading } = useQuery({
    queryKey: ['jobs', category, employmentType, locationType],
    queryFn: () => sovereign.jobs.list({ category: category || undefined, employment_type: employmentType || undefined, location_type: locationType || undefined }),
  });

  const isExploreLoading = isFeaturedLoading || isAllJobsLoading;

  const { data: savedJobs = [] } = useQuery({
    queryKey: ['applicant-saved'],
    queryFn: () => sovereign.applicant.getSaved(),
    enabled: isAuthenticated && (tab === 'saved' || tab === 'explore'),
  });

  const { data: applications = [] } = useQuery({
    queryKey: ['applicant-applications'],
    queryFn: () => sovereign.applicant.getApplications(),
    enabled: isAuthenticated && (tab === 'applied' || tab === 'explore'),
  });

  const filteredJobs = useMemo(() => {
    let list = allJobs;
    if (category) list = list.filter((j) => j.category === category);
    if (employmentType) list = list.filter((j) => j.employment_type === employmentType);
    if (locationType) list = list.filter((j) => j.location_type === locationType);
    return list;
  }, [allJobs, category, employmentType, locationType]);

  const recentJobs = useMemo(() => filteredJobs.slice(0, 10), [filteredJobs]);

  return (
    <div className="min-h-screen bg-background pb-20 lg:pb-8">
      <MetaTags title="Elite Career Hub | Shop The Barber" description="Jobs and employment in grooming and beyond." />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-card border-b border-border px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to={createPageUrl('Dashboard')} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-muted" aria-label="Back">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </Link>
          <h1 className="text-xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'Georgia, serif' }}>Elite Career Hub</h1>
        </div>
        <div className="flex items-center gap-2">
          <Link to={createPageUrl('AccountSettings')} className="p-2 rounded-full text-muted-foreground hover:bg-muted" aria-label="Profile">
            <User className="w-5 h-5" />
          </Link>
          <button type="button" className="p-2 rounded-full text-muted-foreground hover:bg-muted" aria-label="Notifications">
            <Bell className="w-5 h-5" />
          </button>
        </div>
      </header>

      {isDesktop && (
        <div className="max-w-6xl mx-auto px-4 pt-2 pb-2 border-b border-border bg-card">
          <div className="flex gap-1">
            {[
              { id: 'explore', label: 'Explore', Icon: Compass },
              { id: 'saved', label: 'Saved', Icon: Bookmark },
              { id: 'applied', label: 'Applied', Icon: Send },
              { id: 'profile', label: 'Profile', Icon: User },
            ].map(({ id, label, Icon }) => (
              <button key={id} type="button" onClick={() => setSearchParams({ tab: id })} className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === id ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted'}`}>
                <Icon className="w-4 h-4" /> {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <main className="max-w-6xl mx-auto px-4 py-6">
        {tab === 'explore' && (
          <>
            {isExploreLoading ? (
              <div className="flex justify-center py-12">
                <div className="w-8 h-8 border-2 border-border border-t-primary rounded-full animate-spin" />
              </div>
            ) : (
            <>
            {/* Category tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4 scrollbar-hide">
              {CATEGORIES.map((c) => (
                <button
                  key={c.id}
                  type="button"
                  onClick={() => setCategory(category === c.id ? '' : c.id)}
                  className={`shrink-0 px-4 py-2.5 rounded-full text-sm font-medium transition-colors ${
                    category === c.id ? 'bg-primary text-primary-foreground' : 'bg-card text-muted-foreground border border-border hover:border-primary/30'
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>

            {/* Filters */}
            <div className="flex flex-wrap gap-2 mb-6">
              <select
                value={employmentType}
                onChange={(e) => setEmploymentType(e.target.value)}
                className="px-3 py-2 rounded-full border border-border bg-card text-sm text-foreground"
              >
                {EMPLOYMENT_TYPES.map((o) => (
                  <option key={o.value || 'any'} value={o.value}>{o.label}</option>
                ))}
              </select>
              <select
                value={locationType}
                onChange={(e) => setLocationType(e.target.value)}
                className="px-3 py-2 rounded-full border border-border bg-card text-sm text-foreground"
              >
                {LOCATION_TYPES.map((o) => (
                  <option key={o.value || 'any'} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>

            {/* Featured */}
            <section className="mb-10">
              <h2 className="text-lg font-bold text-foreground mb-1" style={{ fontFamily: 'Georgia, serif' }}>Featured Operations</h2>
              <p className="text-muted-foreground text-sm mb-4">Curated leadership roles for premium brands.</p>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {featured.map((job) => (
                  <Link key={job.id} to={createPageUrl('JobDetail') + '?id=' + encodeURIComponent(job.id)} className="group block bg-card rounded-2xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all">
                    <div className="aspect-[4/3] relative bg-muted overflow-hidden">
                      {job.image_url ? (
                        <OptimizedImage src={job.image_url} alt="" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="w-full h-full bg-muted" />
                      )}
                      <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-primary text-white text-xs font-semibold uppercase">
                        {job.category}
                      </span>
                    </div>
                    <div className="p-4">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider mb-1">{job.employer_name || 'Employer'}</p>
                      <h3 className="font-bold text-foreground group-hover:text-primary transition-colors">{job.title}</h3>
                      <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                        <MapPin className="w-4 h-4 shrink-0" />
                        <span>{job.location_text || job.location_type}</span>
                      </div>
                      {formatSalary(job) && (
                        <div className="flex items-center gap-2 mt-1 text-sm text-muted-foreground">
                          <Briefcase className="w-4 h-4 shrink-0" />
                          <span>{formatSalary(job)}</span>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
              {featured.length === 0 && (
                <p className="text-muted-foreground text-sm py-6">No featured roles right now. Check back soon.</p>
              )}
            </section>

            {/* Recent Opportunities */}
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-foreground" style={{ fontFamily: 'Georgia, serif' }}>Recent Opportunities</h2>
                <span className="text-sm text-muted-foreground">{filteredJobs.length} roles</span>
              </div>
              <ul className="space-y-3">
                {recentJobs.map((job) => (
                  <li key={job.id}>
                    <Link
                      to={createPageUrl('JobDetail') + '?id=' + encodeURIComponent(job.id)}
                      className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-sm transition-all"
                    >
                      <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
                        <Briefcase className="w-6 h-6 text-muted-foreground" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground truncate">{job.title}</p>
                        <p className="text-sm text-muted-foreground">{job.employer_name} • {job.location_text || job.location_type}</p>
                      </div>
                      <div className="text-right shrink-0">
                        {formatSalary(job) && <p className="font-semibold text-foreground">{formatSalary(job)}</p>}
                        <p className="text-xs text-muted-foreground uppercase">{job.employment_type?.replace('_', '-')}</p>
                      </div>
                    </Link>
                  </li>
                ))}
              </ul>
              {recentJobs.length === 0 && (
                <p className="text-muted-foreground text-sm py-8 text-center">No jobs match your filters.</p>
              )}
            </section>
            </>
            )}
          </>
        )}

        {tab === 'saved' && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4">Saved Jobs</h2>
            {!isAuthenticated ? (
              <p className="text-muted-foreground py-6">Sign in to see your saved jobs.</p>
            ) : savedJobs.length === 0 ? (
              <p className="text-muted-foreground py-6">You haven’t saved any jobs yet. Browse and tap “Save for later” on a job.</p>
            ) : (
              <ul className="space-y-3">
                {savedJobs.map((job) => (
                  <li key={job.id}>
                    <Link to={createPageUrl('JobDetail') + '?id=' + encodeURIComponent(job.id)} className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border hover:shadow-sm">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">{job.title}</p>
                        <p className="text-sm text-muted-foreground">{job.employer_name} • {job.location_text}</p>
                      </div>
                      {formatSalary(job) && <p className="font-semibold text-foreground shrink-0">{formatSalary(job)}</p>}
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === 'applied' && (
          <section>
            <h2 className="text-lg font-bold text-foreground mb-4">Applied</h2>
            {!isAuthenticated ? (
              <p className="text-muted-foreground py-6">Sign in to see your applications.</p>
            ) : applications.length === 0 ? (
              <p className="text-muted-foreground py-6">You haven’t applied to any jobs yet.</p>
            ) : (
              <ul className="space-y-3">
                {applications.map((app) => (
                  <li key={app.id}>
                    <div className="flex items-center gap-4 p-4 bg-card rounded-xl border border-border">
                      <div className="min-w-0 flex-1">
                        <p className="font-semibold text-foreground">{app.job_title}</p>
                        <p className="text-sm text-muted-foreground">{app.employer_name}</p>
                      </div>
                      <span className={`shrink-0 px-2.5 py-1 rounded-full text-xs font-medium ${
                        app.status === 'hired' ? 'bg-green-100 text-green-800' :
                        app.status === 'shortlisted' ? 'bg-primary/10 text-primary' :
                        app.status === 'rejected' ? 'bg-red-100 text-red-800' : 'bg-muted text-foreground'
                      }`}>
                        {app.status.replace('_', ' ')}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        )}

        {tab === 'profile' && (
          <section className="space-y-6">
            <div>
              <p className="text-muted-foreground mb-4">Manage your professional portfolio and credentials.</p>
              <Button onClick={() => navigate(createPageUrl('ProfessionalPortfolio'))} className="bg-primary text-primary-foreground hover:opacity-95 rounded-xl">
                Open Professional Portfolio
              </Button>
            </div>
            <div className="pt-6 border-t border-border">
              <p className="text-muted-foreground mb-2">Are you hiring?</p>
              <p className="text-sm text-muted-foreground mb-3">Create and manage job postings for your shop or company.</p>
              <Button variant="outline" onClick={() => navigate(createPageUrl('MyJobs'))} className="rounded-xl border-border">
                My job postings
              </Button>
            </div>
          </section>
        )}
      </main>

      {/* Career Hub bottom nav (mobile only) */}
      {!isDesktop && (
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border flex justify-around py-2 safe-area-pb lg:hidden">
          <button type="button" onClick={() => setSearchParams({ tab: 'explore' })} className={`flex flex-col items-center gap-0.5 py-2 px-4 ${tab === 'explore' ? 'text-primary' : 'text-muted-foreground'}`}>
            <Compass className="w-5 h-5" />
            <span className="text-[10px] font-medium">Explore</span>
          </button>
          <button type="button" onClick={() => setSearchParams({ tab: 'saved' })} className={`flex flex-col items-center gap-0.5 py-2 px-4 ${tab === 'saved' ? 'text-primary' : 'text-muted-foreground'}`}>
            <Bookmark className="w-5 h-5" />
            <span className="text-[10px] font-medium">Saved</span>
          </button>
          <button type="button" onClick={() => setSearchParams({ tab: 'applied' })} className={`flex flex-col items-center gap-0.5 py-2 px-4 ${tab === 'applied' ? 'text-primary' : 'text-muted-foreground'}`}>
            <Send className="w-5 h-5" />
            <span className="text-[10px] font-medium">Applied</span>
          </button>
          <button type="button" onClick={() => setSearchParams({ tab: 'profile' })} className={`flex flex-col items-center gap-0.5 py-2 px-4 ${tab === 'profile' ? 'text-primary' : 'text-muted-foreground'}`}>
            <User className="w-5 h-5" />
            <span className="text-[10px] font-medium">Profile</span>
          </button>
        </nav>
      )}

    </div>
  );
}

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { Scissors, Briefcase } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';
const ROLE_TYPES = [
  { id: 'creative', label: 'Creative Role', description: 'Barbers, Stylists, and Colorists.', icon: Scissors },
  { id: 'operations', label: 'Business Operations', description: 'Management, logistics, and support roles.', icon: Briefcase },
];

const CATEGORY_MAP = { creative: 'grooming', operations: 'management' };

export default function CreateJob() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [step, setStep] = useState(1);
  const [roleType, setRoleType] = useState('');
  const [form, setForm] = useState({
    title: '',
    employment_type: 'full_time',
    location_type: 'on_site',
    location_text: '',
    description: '',
    company_id: '',
    shop_id: '',
    employer_type: 'company',
  });

  const { data: employerProfiles } = useQuery({
    queryKey: ['jobs-employer-profiles'],
    queryFn: () => sovereign.jobs.employerProfiles(),
  });
  const companies = employerProfiles?.companies ?? [];
  const shops = employerProfiles?.shops ?? [];
  const canUseCompany = employerProfiles?.canUseCompany ?? false;

  const createMutation = useMutation({
    mutationFn: () =>
      sovereign.jobs.create({
        title: form.title,
        category: CATEGORY_MAP[roleType] || 'management',
        employer_type: canUseCompany && form.employer_type === 'company' ? 'company' : 'shop',
        company_id: canUseCompany && form.employer_type === 'company' ? form.company_id || undefined : undefined,
        shop_id: !canUseCompany || form.employer_type === 'shop' ? form.shop_id : undefined,
        employment_type: form.employment_type,
        location_type: form.location_type,
        location_text: form.location_text || undefined,
        description: form.description || undefined,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs-my'] });
      toast.success('Job created as draft');
      navigate(createPageUrl('MyJobs'));
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className={`${stb.page  } lg:pb-8`}>
      <MetaTags title="New opening | Shop The Barber" />
      <PageHeader
        label="Careers"
        title="New opening"
        subtitle={`Step ${step} of 4`}
        compact
        variant="light"
        tier="app"
      >
        <button type="button" onClick={() => navigate(createPageUrl('MyJobs'))} className="text-primary text-sm font-medium">
          Cancel
        </button>
      </PageHeader>
      <PageContent narrow>
        <div className="h-1.5 bg-muted rounded-full mb-6">
          <div className="h-full bg-primary rounded-full w-1/4" />
        </div>

        {step === 1 && (
          <>
            <h2 className={`${stb.uiSubheading  } mb-1`}>Select the role type</h2>
            <p className="text-muted-foreground text-sm mb-6">Choose the category that best describes the position.</p>
            <div className="space-y-4">
              {ROLE_TYPES.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRoleType(r.id)}
                    className={`w-full text-left p-5 rounded-lg border-2 transition-all ${roleType === r.id ? 'border-primary bg-primary/5' : 'border-border bg-card hover:border-foreground/20'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-lg flex items-center justify-center shrink-0 ${roleType === r.id ? 'bg-primary/20' : 'bg-muted'}`}>
                        <Icon className={`w-6 h-6 ${roleType === r.id ? 'text-primary' : 'text-muted-foreground'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{r.label}</p>
                        <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${roleType === r.id ? 'border-primary bg-primary' : 'border-foreground/20'}`}>
                        {roleType === r.id && <span className="text-white text-xs">✓</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <Button onClick={() => setStep(2)} disabled={!roleType} className="w-full mt-8 bg-primary text-white rounded-lg py-6">
              Continue to Requirements
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className={`${stb.uiSubheading  } mb-6`}>Job details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">Job title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2 rounded-lg border border-border"
                  placeholder="e.g. Senior Barber"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">Employer</label>
                {canUseCompany ? (
                  <select value={form.employer_type} onChange={(e) => setForm((f) => ({ ...f, employer_type: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-border">
                    <option value="company">Company</option>
                    <option value="shop">Shop</option>
                  </select>
                ) : (
                  <p className="text-sm text-muted-foreground px-4 py-2 rounded-lg border border-border bg-muted/50">Shop (your managed locations)</p>
                )}
              </div>
              {canUseCompany && form.employer_type === 'company' && (
                <div>
                  <label className="block text-sm font-medium text-foreground/90 mb-1">Company</label>
                  <select value={form.company_id} onChange={(e) => setForm((f) => ({ ...f, company_id: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-border">
                    <option value="">Select company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {( !canUseCompany || form.employer_type === 'shop') && (
                <div>
                  <label className="block text-sm font-medium text-foreground/90 mb-1">Shop</label>
                  <select value={form.shop_id} onChange={(e) => setForm((f) => ({ ...f, shop_id: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-border">
                    <option value="">Select shop</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">Employment type</label>
                <select value={form.employment_type} onChange={(e) => setForm((f) => ({ ...f, employment_type: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-border">
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">Location type</label>
                <select value={form.location_type} onChange={(e) => setForm((f) => ({ ...f, location_type: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-border">
                  <option value="on_site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">Location (e.g. London, UK)</label>
                <input value={form.location_text} onChange={(e) => setForm((f) => ({ ...f, location_text: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-border" placeholder="London, UK" />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground/90 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2 rounded-lg border border-border min-h-[100px]" placeholder="The mission and role..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-lg">Back</Button>
              <Button onClick={() => createMutation.mutate()} disabled={!form.title || !form.description || createMutation.isPending} className="flex-1 bg-primary text-white rounded-lg">
                Create draft
              </Button>
            </div>
          </>
        )}
        <p className="text-muted-foreground text-sm mt-6">You can save this draft and return to it later from your dashboard.</p>
      </PageContent>
    </div>
  );
}

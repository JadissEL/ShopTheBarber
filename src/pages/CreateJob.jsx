import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { ArrowLeft, Scissors, Briefcase } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

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

  const { data: companies = [] } = useQuery({
    queryKey: ['companies'],
    queryFn: () => sovereign.companies.list(),
  });
  const { data: shops = [] } = useQuery({
    queryKey: ['shops'],
    queryFn: () => sovereign.shops.list(),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      sovereign.jobs.create({
        title: form.title,
        category: CATEGORY_MAP[roleType] || 'management',
        employer_type: form.employer_type,
        company_id: form.employer_type === 'company' ? form.company_id || undefined : undefined,
        shop_id: form.employer_type === 'shop' ? form.shop_id : undefined,
        employment_type: form.employment_type,
        location_type: form.location_type,
        location_text: form.location_text || undefined,
        description: form.description || undefined,
        status: 'draft',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['jobs-my'] });
      toast.success('Job created as draft');
      navigate(createPageUrl('MyJobs'));
    },
    onError: (e) => toast.error(e.message),
  });

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <MetaTags title="New opening | Shop The Barber" />
      <header className="sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center justify-between">
        <button type="button" onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="font-bold text-foreground">NEW OPENING</h1>
        <button type="button" onClick={() => navigate(createPageUrl('MyJobs'))} className="text-primary text-sm font-medium">
          Cancel
        </button>
      </header>
      <main className="max-w-2xl mx-auto px-4 py-6">
        <p className="text-primary text-sm font-medium mb-2">STEP {step} OF 4</p>
        <div className="h-1.5 bg-slate-100 rounded-full mb-6">
          <div className="h-full bg-primary rounded-full w-1/4" />
        </div>

        {step === 1 && (
          <>
            <h2 className="text-xl font-bold text-foreground mb-1">Select the role type</h2>
            <p className="text-slate-500 text-sm mb-6">Choose the category that best describes the position.</p>
            <div className="space-y-4">
              {ROLE_TYPES.map((r) => {
                const Icon = r.icon;
                return (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setRoleType(r.id)}
                    className={`w-full text-left p-5 rounded-2xl border-2 transition-all ${roleType === r.id ? 'border-primary bg-primary/5' : 'border-slate-200 bg-white hover:border-slate-300'}`}
                  >
                    <div className="flex items-start gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${roleType === r.id ? 'bg-primary/20' : 'bg-slate-100'}`}>
                        <Icon className={`w-6 h-6 ${roleType === r.id ? 'text-primary' : 'text-slate-500'}`} />
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground">{r.label}</p>
                        <p className="text-sm text-slate-500 mt-1">{r.description}</p>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center shrink-0 ${roleType === r.id ? 'border-primary bg-primary' : 'border-slate-300'}`}>
                        {roleType === r.id && <span className="text-white text-xs">✓</span>}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            <Button onClick={() => setStep(2)} disabled={!roleType} className="w-full mt-8 bg-primary text-white rounded-xl py-6">
              Continue to Requirements
            </Button>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="text-xl font-bold text-foreground mb-6">Job details</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Job title</label>
                <input
                  value={form.title}
                  onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                  className="w-full px-4 py-2 rounded-xl border border-slate-200"
                  placeholder="e.g. Senior Barber"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employer</label>
                <select value={form.employer_type} onChange={(e) => setForm((f) => ({ ...f, employer_type: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200">
                  <option value="company">Company</option>
                  <option value="shop">Shop</option>
                </select>
              </div>
              {form.employer_type === 'company' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Company</label>
                  <select value={form.company_id} onChange={(e) => setForm((f) => ({ ...f, company_id: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200">
                    <option value="">Select company</option>
                    {companies.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              )}
              {form.employer_type === 'shop' && (
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Shop</label>
                  <select value={form.shop_id} onChange={(e) => setForm((f) => ({ ...f, shop_id: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200">
                    <option value="">Select shop</option>
                    {shops.map((s) => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Employment type</label>
                <select value={form.employment_type} onChange={(e) => setForm((f) => ({ ...f, employment_type: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200">
                  <option value="full_time">Full-time</option>
                  <option value="part_time">Part-time</option>
                  <option value="contract">Contract</option>
                  <option value="freelance">Freelance</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location type</label>
                <select value={form.location_type} onChange={(e) => setForm((f) => ({ ...f, location_type: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200">
                  <option value="on_site">On-site</option>
                  <option value="remote">Remote</option>
                  <option value="hybrid">Hybrid</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Location (e.g. London, UK)</label>
                <input value={form.location_text} onChange={(e) => setForm((f) => ({ ...f, location_text: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200" placeholder="London, UK" />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <textarea value={form.description} onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))} className="w-full px-4 py-2 rounded-xl border border-slate-200 min-h-[100px]" placeholder="The mission and role..." />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <Button variant="outline" onClick={() => setStep(1)} className="flex-1 rounded-xl">Back</Button>
              <Button onClick={() => createMutation.mutate()} disabled={!form.title || createMutation.isPending} className="flex-1 bg-primary text-white rounded-xl">
                Create draft
              </Button>
            </div>
          </>
        )}
        <p className="text-slate-500 text-sm mt-6">You can save this draft and return to it later from your dashboard.</p>
      </main>
      <ClientBottomNav />
    </div>
  );
}

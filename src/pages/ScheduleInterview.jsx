import { useSearchParams, useNavigate } from 'react-router-dom';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Calendar } from 'lucide-react';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

export default function ScheduleInterview() {
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  const navigate = useNavigate();
  if (!applicationId) {
    navigate(createPageUrl('MyJobs'));
    return null;
  }
  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <MetaTags title="Schedule interview | Shop The Barber" />
      <header className="sticky top-0 z-40 bg-white border-b px-4 py-3 flex items-center gap-3">
        <button type="button" onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-slate-100"><ArrowLeft className="w-5 h-5" /></button>
        <h1 className="font-bold text-foreground">Schedule Interview</h1>
      </header>
      <main className="max-w-lg mx-auto px-4 py-6">
        <p className="text-slate-600 mb-6">Use the Applicant Review page and click “Schedule” on an applicant to set a date and format.</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="rounded-xl gap-2"><Calendar className="w-4 h-4" /> Back to review</Button>
      </main>
      <ClientBottomNav />
    </div>
  );
}

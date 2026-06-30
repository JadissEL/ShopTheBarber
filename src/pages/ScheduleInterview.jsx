import { useSearchParams, useNavigate } from 'react-router-dom';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { Calendar } from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import ContextualBackLink from '@/components/ui/ContextualBackLink';
import { stb } from '@/lib/stbUi';
export default function ScheduleInterview() {
  const [searchParams] = useSearchParams();
  const applicationId = searchParams.get('applicationId');
  const navigate = useNavigate();
  if (!applicationId) {
    navigate(createPageUrl('MyJobs'));
    return null;
  }
  return (
    <div className={stb.page}>
      <MetaTags title="Schedule interview | Shop The Barber" />
      <PageHeader
        label="Careers"
        title="Schedule interview"
        subtitle="Set a date and format from the applicant review page."
        compact
        variant="light"
        tier="app"
      />
      <PageContent narrow>
        <ContextualBackLink className="mb-6" />
        <p className="text-muted-foreground mb-6">Use the Applicant Review page and click “Schedule” on an applicant to set a date and format.</p>
        <Button variant="outline" onClick={() => navigate(-1)} className="gap-2"><Calendar className="w-4 h-4" /> Back to review</Button>
      </PageContent>
    </div>
  );
}

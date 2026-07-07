import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { dashboardPageForAccountType } from '@/lib/accountType';
import { useCompanyDashboardData } from '@/hooks/dashboard/useCompanyDashboardData';
import { MetaTags } from '@/components/seo/MetaTags';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import MetricCard from '@/components/dashboard/MetricCard';
import DashboardSection from '@/components/dashboard/shared/DashboardSection';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoading } from '@/components/ui/page-loading';
import OnboardingSetupBanner from '@/components/onboarding/OnboardingSetupBanner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { stb } from '@/lib/stbUi';
import { Briefcase, Users, FileEdit, Package, Plus } from 'lucide-react';

export default function CompanyDashboard() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: roleLoading, accountType, role } = useEffectiveRole();

  useEffect(() => {
    if (roleLoading) return;
    if (isAdmin) {
      navigate(createPageUrl('GlobalFinancials'), { replace: true });
      return;
    }
    if (accountType && accountType !== 'company') {
      navigate(createPageUrl(dashboardPageForAccountType(accountType)), { replace: true });
    }
  }, [roleLoading, isAdmin, accountType, navigate]);

  const data = useCompanyDashboardData({
    enabled: accountType === 'company',
    accountType,
    role,
  });

  if (roleLoading || data.isLoading) {
    return <PageLoading message="Loading company hub…" />;
  }

  return (
    <div className={stb.page}>
      <MetaTags
        title="Company hub | Shop The Barber"
        description="Recruitment pipeline, employer brand, and company commerce."
      />
      <PageHeader
        label="Company"
        title="Company hub"
        subtitle="Open roles, applicant pipeline, and employer brand — commerce when activated."
        compact
        variant="light"
        tier="app"
      >
        <Button asChild className="h-11">
          <Link to={createPageUrl('CreateJob')}>
            <Plus className="w-4 h-4 mr-2 inline" /> Post job
          </Link>
        </Button>
      </PageHeader>

      <PageContent>
        <OnboardingSetupBanner autoOpenModal />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Open roles"
            value={String(data.openRoles)}
            subValue={`${data.totalJobs} total postings`}
            icon={Briefcase}
          />
          <MetricCard
            title="Applicants"
            value={String(data.applicantCount)}
            subValue={`${data.pendingApplicantCount} pending review`}
            icon={Users}
          />
          <MetricCard
            title="Drafts"
            value={String(data.draftRoles)}
            subValue={`${data.pendingReview} awaiting approval`}
            icon={FileEdit}
          />
          {data.commerceActive ? (
            <MetricCard
              title="Live products"
              value={String(data.productCount)}
              subValue="Company marketplace"
              icon={Package}
            />
          ) : (
            <MetricCard
              title="Commerce"
              value="Off"
              subValue="Request activation to sell products"
              icon={Package}
            />
          )}
        </div>

        {!data.hasJobs ? (
          <EmptyState
            icon={Briefcase}
            title="No jobs yet"
            description="Post your first role to start building your applicant pipeline."
            actionLabel="Post your first role"
            actionHref={createPageUrl('CreateJob')}
          />
        ) : (
          <>
            <DashboardSection
              title="Recruitment pipeline"
              subtitle="Your latest job postings."
              actionLabel="All jobs"
              actionPage="MyJobs"
            >
              <ul className="space-y-3">
                {data.recentJobs.map((job) => (
                  <li key={job.id} className={cnRow}>
                    <div>
                      <p className="font-semibold text-foreground text-sm">{job.title}</p>
                      <p className="text-xs text-muted-foreground capitalize">{job.status?.replace('_', ' ')}</p>
                    </div>
                    <Button asChild size="sm" variant="outline">
                      <Link to={`${createPageUrl('ApplicantReview')}?jobId=${encodeURIComponent(job.id)}`}>
                        Applicants
                      </Link>
                    </Button>
                  </li>
                ))}
              </ul>
            </DashboardSection>

            <DashboardSection
              title="Recent applicants"
              subtitle="Candidates awaiting your review."
              actionLabel="Review"
              actionPage="MyJobs"
            >
              {data.recentApplicants.length === 0 ? (
                <Card className={stb.surface}>
                  <p className="p-6 text-sm text-muted-foreground">No pending applicants on live roles.</p>
                </Card>
              ) : (
                <ul className="space-y-3">
                  {data.recentApplicants.map((applicant) => (
                    <li key={applicant.id} className={cnRow}>
                      <div>
                        <p className="font-semibold text-foreground text-sm">
                          {applicant.applicant_name || applicant.applicant_email || 'Applicant'}
                        </p>
                        <p className="text-xs text-muted-foreground capitalize">
                          {applicant.status?.replace('_', ' ')}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardSection>

            {data.commerceActive ? (
              <DashboardSection
                title="Company commerce"
                subtitle="Products and orders (on-request module)."
                actionLabel="Products"
                actionPage="ProviderMarketplaceProducts"
              >
                <Card className={stb.surface}>
                  <p className="p-6 text-sm text-muted-foreground">
                    {data.productCount} live product{data.productCount === 1 ? '' : 's'} in your company catalog.
                  </p>
                </Card>
              </DashboardSection>
            ) : null}
          </>
        )}
      </PageContent>
    </div>
  );
}

const cnRow = `${stb.panel} p-4 flex items-center justify-between gap-3`;

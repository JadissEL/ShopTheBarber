import { useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { dashboardPageForAccountType } from '@/lib/accountType';
import { useBloggerDashboardData } from '@/hooks/dashboard/useBloggerDashboardData';
import { MetaTags } from '@/components/seo/MetaTags';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import MetricCard from '@/components/dashboard/MetricCard';
import DashboardSection from '@/components/dashboard/shared/DashboardSection';
import NextAppointmentCard from '@/components/dashboard/NextAppointmentCard';
import { EmptyState } from '@/components/ui/empty-state';
import { PageLoading } from '@/components/ui/page-loading';
import OnboardingSetupBanner from '@/components/onboarding/OnboardingSetupBanner';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { stb } from '@/lib/stbUi';
import { Eye, PenLine, FileText, Package, Plus, Calendar } from 'lucide-react';
import { format } from 'date-fns';

export default function BloggerDashboard() {
  const navigate = useNavigate();
  const { isAdmin, isLoading: roleLoading, accountType } = useEffectiveRole();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => sovereign.auth.me(),
  });

  useEffect(() => {
    if (roleLoading) return;
    if (isAdmin) {
      navigate(createPageUrl('GlobalFinancials'), { replace: true });
      return;
    }
    if (accountType && accountType !== 'blogger') {
      navigate(createPageUrl(dashboardPageForAccountType(accountType)), { replace: true });
    }
  }, [roleLoading, isAdmin, accountType, navigate]);

  const data = useBloggerDashboardData({
    enabled: accountType === 'blogger',
    userId: user?.id,
    userEmail: user?.email,
  });

  if (roleLoading || data.isLoading) {
    return <PageLoading message="Loading creator studio…" />;
  }

  return (
    <div className={stb.page}>
      <MetaTags
        title="Creator studio | Shop The Barber"
        description="Article performance, drafts, and publishing workflow."
      />
      <PageHeader
        label="Blogger"
        title="Creator studio"
        subtitle="Article performance, drafts, audience growth, and your client bookings."
        compact
        variant="light"
        tier="app"
      >
        <Button asChild className="h-11">
          <Link to={createPageUrl('BlogArticleEditor')}>
            <Plus className="w-4 h-4 mr-2 inline" /> New draft
          </Link>
        </Button>
      </PageHeader>

      <PageContent>
        <OnboardingSetupBanner autoOpenModal />

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <MetricCard
            title="Published"
            value={String(data.publishedCount)}
            subValue={`${data.articleCount} total articles`}
            icon={FileText}
          />
          <MetricCard
            title="Drafts"
            value={String(data.draftCount)}
            subValue={`${data.pendingReviewCount} in review`}
            icon={PenLine}
          />
          <MetricCard
            title="Total views"
            value={data.totalViews.toLocaleString()}
            subValue="Across published articles"
            icon={Eye}
          />
          <MetricCard
            title="Products"
            value={String(data.productCount)}
            subValue="Live marketplace listings"
            icon={Package}
          />
        </div>

        {data.nextBooking ? (
          <DashboardSection title="Next appointment" subtitle="Book services as a client anytime.">
            <NextAppointmentCard booking={data.nextBooking} />
          </DashboardSection>
        ) : (
          <DashboardSection title="Book as a client" subtitle="Discover barbers and book your next visit.">
            <Card className={stb.surface}>
              <div className="p-6 flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-primary" />
                  <p className="text-sm text-muted-foreground">No upcoming appointments.</p>
                </div>
                <Button asChild variant="outline" size="sm">
                  <Link to={createPageUrl('Explore')}>Find a barber</Link>
                </Button>
              </div>
            </Card>
          </DashboardSection>
        )}

        {!data.hasArticles ? (
          <EmptyState
            icon={PenLine}
            title="No articles yet"
            description="Write your first story to launch your author profile."
            actionLabel="Write your first post"
            actionHref={createPageUrl('BlogArticleEditor')}
          />
        ) : (
          <>
            <DashboardSection
              title="Draft queue"
              subtitle="Pick up where you left off."
              actionLabel="All articles"
              actionPage="ProviderBlogArticles"
            >
              {data.drafts.length === 0 ? (
                <Card className={stb.surface}>
                  <p className="p-6 text-sm text-muted-foreground">No drafts — start a new article anytime.</p>
                </Card>
              ) : (
                <ul className="space-y-3">
                  {data.drafts.map((article) => (
                    <li key={article.id} className={cnRow}>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{article.title || 'Untitled draft'}</p>
                        <p className="text-xs text-muted-foreground capitalize">{article.status?.replace('_', ' ')}</p>
                      </div>
                      <Button asChild size="sm" variant="outline">
                        <Link to={`${createPageUrl('BlogArticleEditor')}?id=${article.id}`}>Edit</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardSection>

            <DashboardSection title="Published performance" subtitle="Your live content reach.">
              {data.recentPublished.length === 0 ? (
                <Card className={stb.surface}>
                  <p className="p-6 text-sm text-muted-foreground">No published articles yet.</p>
                </Card>
              ) : (
                <ul className="space-y-3">
                  {data.recentPublished.map((article) => (
                    <li key={article.id} className={cnRow}>
                      <div>
                        <p className="font-semibold text-foreground text-sm">{article.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {article.published_at
                            ? format(new Date(article.published_at), 'MMM d, yyyy')
                            : 'Published'}
                        </p>
                      </div>
                      <span className="text-xs font-medium text-muted-foreground">
                        {(article.view_count ?? 0).toLocaleString()} views
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </DashboardSection>
          </>
        )}
      </PageContent>
    </div>
  );
}

const cnRow = `${stb.panel} p-4 flex items-center justify-between gap-3`;

import { useMemo } from 'react';
import { useQueries, useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { hasCapability, capabilityContextFromUser } from '@/lib/capabilities';

/**
 * @param {{
 *   enabled?: boolean,
 *   accountType?: string | null,
 *   role?: string | null,
 *   companyCommerceEnabled?: boolean,
 * }} [options]
 */
export function useCompanyDashboardData(options = {}) {
  const enabled = options.enabled !== false;
  const ctx = capabilityContextFromUser({
    accountType: options.accountType,
    role: options.role,
    companyCommerceEnabled: options.companyCommerceEnabled,
  });
  const commerceActive = hasCapability(ctx, 'company.commerce');

  const jobsQuery = useQuery({
    queryKey: ['company-dashboard-jobs'],
    queryFn: () => sovereign.jobs.my(),
    enabled,
  });

  const productsQuery = useQuery({
    queryKey: ['company-dashboard-products'],
    queryFn: () => sovereign.products.mine(),
    enabled: enabled && commerceActive,
  });

  const jobs = jobsQuery.data ?? [];
  const publishedJobs = useMemo(
    () => jobs.filter((j) => j.status === 'published'),
    [jobs],
  );

  const applicantQueries = useQueries({
    queries: publishedJobs.slice(0, 5).map((job) => ({
      queryKey: ['company-dashboard-applicants', job.id],
      queryFn: () => sovereign.applications.listForJob(job.id),
      enabled: enabled && !!job.id,
    })),
  });

  const summary = useMemo(() => {
    const openRoles = publishedJobs.length;
    const draftRoles = jobs.filter((j) => j.status === 'draft').length;
    const pendingReview = jobs.filter((j) => j.status === 'pending_review').length;

    const allApplicants = applicantQueries.flatMap((q) => q.data ?? []);
    const pendingApplicants = allApplicants.filter(
      (a) => a.status === 'received' || a.status === 'under_review',
    );

    const products = productsQuery.data ?? [];
    const publishedProducts = products.filter((p) => p.status === 'published');

    return {
      openRoles,
      draftRoles,
      pendingReview,
      totalJobs: jobs.length,
      applicantCount: allApplicants.length,
      pendingApplicantCount: pendingApplicants.length,
      recentApplicants: pendingApplicants.slice(0, 5),
      recentJobs: jobs.slice(0, 5),
      commerceActive,
      productCount: publishedProducts.length,
      hasJobs: jobs.length > 0,
    };
  }, [jobs, publishedJobs, applicantQueries, productsQuery.data, commerceActive]);

  const applicantsLoading = applicantQueries.some((q) => q.isLoading);

  return {
    isLoading: jobsQuery.isLoading || (commerceActive && productsQuery.isLoading) || applicantsLoading,
    isFetching: jobsQuery.isFetching,
    ...summary,
  };
}

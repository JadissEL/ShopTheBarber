import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { AlertCircle, Filter, Clock, CheckCircle2 } from 'lucide-react';
import SearchField from '@/components/ui/search-field';
import { Card, CardContent } from '@/components/ui/card';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import DisputeCard from '@/components/dispute/DisputeCard';
import AdminDisputeAppealsPanel from '@/components/admin/AdminDisputeAppealsPanel';
import { PageLoading } from '@/components/ui/page-loading';
import { PageError } from '@/components/ui/page-error';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { normalizeDisputeStatus, disputeStatusLabel } from '@/utils/disputeStatus';

function toCardDispute(row) {
  return {
    ...row,
    status: row.status_label || disputeStatusLabel(row.status),
    amount: row.booking_amount,
    booking_date: row.date_text,
  };
}

export default function AdminDisputes() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => sovereign.auth.me(),
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: disputes = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['all-disputes'],
    queryFn: () => sovereign.providerStats.listAdminDisputes(100),
    enabled: user?.role === 'admin',
    initialData: [],
  });

  const cardDisputes = disputes.map(toCardDispute);

  const filteredDisputes = cardDisputes.filter((d) => {
    const matchesSearch =
      d.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.barber_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.reason?.toLowerCase().includes(searchTerm.toLowerCase());

    const normalized = normalizeDisputeStatus(d.status);
    const matchesStatus =
      filterStatus === 'all' ||
      (filterStatus === 'Open' && normalized === 'open') ||
      (filterStatus === 'In Review' && normalized === 'in_review') ||
      (filterStatus === 'Resolved' && normalized === 'resolved');

    return matchesSearch && matchesStatus;
  });

  const openCount = disputes.filter((d) => normalizeDisputeStatus(d.status) === 'open').length;
  const reviewCount = disputes.filter((d) => normalizeDisputeStatus(d.status) === 'in_review').length;
  const resolvedCount = disputes.filter((d) => normalizeDisputeStatus(d.status) === 'resolved').length;
  const totalAmount = disputes.reduce((sum, d) => sum + (parseFloat(d.booking_amount) || 0), 0);

  if (isLoading) return <PageLoading message="Loading disputes..." />;
  if (isError) return <PageError onRetry={refetch} />;

  if (user?.role !== 'admin') {
    return (
      <div className="stb-page flex items-center justify-center p-4">
        <MetaTags title="Access Denied" />
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <p className="text-foreground font-semibold">Admin Access Required</p>
            <p className="text-muted-foreground text-sm mt-2">You must be an admin to view disputes.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="stb-page pb-16">
      <MetaTags
        title="Dispute Resolution"
        description="Manage and resolve customer disputes"
      />

      <PageHeader
        label="Admin"
        title="Dispute resolution"
        subtitle="Review and resolve customer disputes and claims"
        compact
        variant="light"
        tier="app"
      />

      <PageContent>

        <div className="mb-8">
          <AdminDisputeAppealsPanel />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open Cases</p>
                  <h3 className="text-3xl font-bold">{openCount}</h3>
                </div>
                <AlertCircle className="w-8 h-8 text-destructive opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Review</p>
                  <h3 className="text-3xl font-bold">{reviewCount}</h3>
                </div>
                <Clock className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <h3 className="text-3xl font-bold">{resolvedCount}</h3>
                </div>
                <CheckCircle2 className="w-8 h-8 text-success opacity-50" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total At Risk</p>
                  <h3 className="text-3xl font-bold">${totalAmount.toFixed(0)}</h3>
                </div>
                <AlertCircle className="w-8 h-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <SearchField
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              onClear={() => setSearchTerm('')}
              placeholder="Search by client, barber, or reason..."
              className="flex-1"
              aria-label="Search disputes"
            />
            <div className="flex gap-2">
              <Filter className="w-4 h-4 text-muted-foreground mt-3" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="px-4 py-2 rounded-lg border border-border bg-background text-foreground text-sm"
              >
                <option value="all">All Status</option>
                <option value="Open">Open</option>
                <option value="In Review">In Review</option>
                <option value="Resolved">Resolved</option>
              </select>
            </div>
          </div>
        </div>

        {filteredDisputes.length > 0 ? (
          <div className="space-y-4">
            {filteredDisputes.map((dispute) => (
              <Link key={dispute.id} to={createPageUrl(`DisputeDetail?id=${dispute.id}`)}>
                <DisputeCard dispute={dispute} />
              </Link>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="py-12 text-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No disputes found</p>
            </CardContent>
          </Card>
        )}
      </PageContent>
    </div>
  );
}

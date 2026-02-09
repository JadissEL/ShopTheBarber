import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { AlertCircle, Filter, Search, Clock, CheckCircle2 } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import DisputeCard from '@/components/dispute/DisputeCard';

export default function AdminDisputes() {
  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => sovereign.auth.me(),
  });

  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');

  const { data: disputes = [], isLoading } = useQuery({
    queryKey: ['all-disputes'],
    queryFn: () => sovereign.entities.Dispute.list('-created_date', 100),
    initialData: []
  });

  const queryClient = useQueryClient();

  const _updateDisputeMutation = useMutation({
    mutationFn: ({ id, data }) => sovereign.entities.Dispute.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['all-disputes'] });
    }
  });

  // Filter disputes
  const filteredDisputes = disputes.filter(d => {
    const matchesSearch = 
      d.client_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.barber_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      d.reason?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || d.status === filterStatus;
    
    return matchesSearch && matchesStatus;
  });

  // Calculate metrics
  const openCount = disputes.filter(d => d.status === 'Open').length;
  const reviewCount = disputes.filter(d => d.status === 'In Review').length;
  const resolvedCount = disputes.filter(d => d.status === 'Resolved').length;
  const totalAmount = disputes.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0);

  // Role check
  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
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
    <div className="min-h-screen bg-background text-foreground pb-16">
      <MetaTags 
        title="Dispute Resolution" 
        description="Manage and resolve customer disputes"
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-2">Dispute Resolution</h1>
          <p className="text-muted-foreground">Review and resolve customer disputes and claims</p>
        </div>

        {/* Metrics */}
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
                <Clock className="w-8 h-8 text-amber-600 opacity-50" />
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
                <CheckCircle2 className="w-8 h-8 text-green-600 opacity-50" />
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
                <AlertCircle className="w-8 h-8 text-orange-600 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search & Filter */}
        <div className="space-y-4 mb-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by client, barber, or reason..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
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

        {/* Disputes List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading disputes...</p>
          </div>
        ) : filteredDisputes.length > 0 ? (
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
      </div>
    </div>
  );
}

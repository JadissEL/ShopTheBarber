import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { ArrowLeft, AlertCircle, CheckCircle2, MessageSquare, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import ResolutionActions from '@/components/dispute/ResolutionActions';
import { disputeStatusLabel } from '@/utils/disputeStatus';

export default function DisputeDetail() {
  const navigate = useNavigate();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => sovereign.auth.me(),
  });

  const params = new URLSearchParams(window.location.search);
  const disputeId = params.get('id');

  const { data: dispute } = useQuery({
    queryKey: ['dispute', disputeId],
    queryFn: () => sovereign.providerStats.getAdminDispute(disputeId),
    enabled: !!disputeId && user?.role === 'admin',
  });

  const disputeForUi = dispute
    ? {
        ...dispute,
        status: dispute.status_label || disputeStatusLabel(dispute.status),
        amount: dispute.booking_amount,
        booking_date: dispute.date_text,
      }
    : null;

  const { data: booking } = useQuery({
    queryKey: ['dispute-booking', dispute?.booking_id],
    queryFn: () => sovereign.entities.Booking.get(dispute?.booking_id),
    enabled: !!dispute?.booking_id
  });

  if (user?.role !== 'admin') {
    return (
      <div className="stb-page flex items-center justify-center p-4">
        <MetaTags title="Access Denied" />
        <Card>
          <CardContent className="py-8 text-center">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-3" />
            <p className="text-foreground font-semibold">Admin Access Required</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!disputeForUi) {
    return (
      <div className="stb-page flex items-center justify-center p-4">
        <MetaTags title="Dispute Not Found" />
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Dispute not found</p>
            <Link to={createPageUrl('AdminDisputes')}>
              <Button>Back to Disputes</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusConfig = {
    'Open': { color: 'bg-red-50 text-red-700', icon: AlertCircle },
    'In Review': { color: 'bg-amber-50 text-amber-700', icon: Clock },
    'Resolved': { color: 'bg-green-50 text-green-700', icon: CheckCircle2 }
  };

  const config = statusConfig[disputeForUi.status] || statusConfig['Open'];
  const _Icon = config.icon;

  return (
    <div className="stb-page pb-16">
      <MetaTags 
        title={`Dispute: ${disputeForUi.client_name} vs ${disputeForUi.barber_name}`}
        description="Manage dispute resolution"
      />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('AdminDisputes')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{disputeForUi.client_name} vs {disputeForUi.barber_name}</h1>
            <p className="text-muted-foreground text-sm mt-1">{disputeForUi.booking_date}</p>
          </div>
          <Badge className={config.color}>
            {disputeForUi.status}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Dispute Summary */}
            <Card>
              <CardHeader>
                <CardTitle>Dispute Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Claimant</p>
                    <p className="font-semibold">{disputeForUi.client_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Defendant</p>
                    <p className="font-semibold">{disputeForUi.barber_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Amount at Risk</p>
                    <p className="text-2xl font-bold text-destructive">${disputeForUi.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date of Booking</p>
                    <p className="font-semibold">{disputeForUi.booking_date}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Reason for Dispute</p>
                  <p className="text-foreground">{disputeForUi.reason || 'No reason provided'}</p>
                </div>
                {disputeForUi.resolution_notes && (
                  <div className="border-t pt-4">
                    <p className="text-sm text-muted-foreground mb-2">Resolution Notes</p>
                    <p className="text-foreground whitespace-pre-wrap">{disputeForUi.resolution_notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Booking Context */}
            {booking && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Booking Context</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Service:</span>
                    <span className="font-semibold">{booking.service_snapshot?.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Price:</span>
                    <span className="font-semibold">${booking.price_at_booking}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Payment Status:</span>
                    <Badge variant="outline">{booking.payment_status}</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Booking Status:</span>
                    <Badge variant="outline">{booking.status}</Badge>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Admin Notes */}
            {disputeForUi.resolution_notes && disputeForUi.status === 'Resolved' && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Resolution Record
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-muted/50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                  {disputeForUi.resolution_notes}
                </div>
              </CardContent>
            </Card>
            )}
          </div>

          {/* Resolution Panel */}
          <div>
            <ResolutionActions 
              dispute={disputeForUi}
              onResolved={() => navigate(createPageUrl('AdminDisputes'))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

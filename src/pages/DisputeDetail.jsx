import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { ArrowLeft, AlertCircle, CheckCircle2, MessageSquare, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Link, useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import { toast } from 'sonner';
import ResolutionActions from '@/components/dispute/ResolutionActions';

export default function DisputeDetail() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => sovereign.auth.me(),
  });

  const params = new URLSearchParams(window.location.search);
  const disputeId = params.get('id');

  const { data: dispute } = useQuery({
    queryKey: ['dispute', disputeId],
    queryFn: () => sovereign.entities.Dispute.get(disputeId),
    enabled: !!disputeId
  });

  const { data: booking } = useQuery({
    queryKey: ['dispute-booking', dispute?.booking_id],
    queryFn: () => sovereign.entities.Booking.get(dispute?.booking_id),
    enabled: !!dispute?.booking_id
  });

  const [internalNotes, setInternalNotes] = useState('');

  const updateMutation = useMutation({
    mutationFn: (data) => sovereign.entities.Dispute.update(disputeId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute', disputeId] });
      queryClient.invalidateQueries({ queryKey: ['all-disputes'] });
      setInternalNotes('');
      toast.success('Dispute updated');
    }
  });

  const handleAddNotes = () => {
    if (!internalNotes.trim()) return;
    updateMutation.mutate({
      notes: (dispute?.notes || '') + '\n[Admin: ' + new Date().toLocaleString() + ']\n' + internalNotes
    });
  };

  if (user?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
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

  if (!dispute) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
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

  const config = statusConfig[dispute.status] || statusConfig['Open'];
  const _Icon = config.icon;

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <MetaTags 
        title={`Dispute: ${dispute.client_name} vs ${dispute.barber_name}`}
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
            <h1 className="text-3xl font-bold tracking-tight">{dispute.client_name} vs {dispute.barber_name}</h1>
            <p className="text-muted-foreground text-sm mt-1">{dispute.booking_date}</p>
          </div>
          <Badge className={config.color}>
            {dispute.status}
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
                    <p className="font-semibold">{dispute.client_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Defendant</p>
                    <p className="font-semibold">{dispute.barber_name}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Amount at Risk</p>
                    <p className="text-2xl font-bold text-destructive">${dispute.amount}</p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Date of Booking</p>
                    <p className="font-semibold">{dispute.booking_date}</p>
                  </div>
                </div>

                <div className="border-t pt-4">
                  <p className="text-sm text-muted-foreground mb-2">Reason for Dispute</p>
                  <p className="text-foreground">{dispute.reason || 'No reason provided'}</p>
                </div>
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
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <MessageSquare className="w-4 h-4" />
                  Internal Notes
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {dispute.notes && (
                  <div className="bg-muted/50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                    {dispute.notes}
                  </div>
                )}
                <div className="space-y-2">
                  <Textarea
                    placeholder="Add internal notes..."
                    value={internalNotes}
                    onChange={(e) => setInternalNotes(e.target.value)}
                    className="min-h-24"
                  />
                  <Button
                    onClick={handleAddNotes}
                    disabled={!internalNotes.trim() || updateMutation.isPending}
                    size="sm"
                  >
                    Add Note
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Resolution Panel */}
          <div>
            <ResolutionActions 
              dispute={dispute}
              onResolved={() => navigate(createPageUrl('AdminDisputes'))}
            />
          </div>
        </div>
      </div>
    </div>
  );
}

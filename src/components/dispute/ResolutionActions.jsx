import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, DollarSign } from 'lucide-react';

const RESOLUTION_TYPES = {
  'Approve Claim': {
    icon: CheckCircle2,
    color: 'bg-green-50 text-green-700 hover:bg-green-100',
    action: 'approved',
    showRefund: true
  },
  'Reject Claim': {
    icon: XCircle,
    color: 'bg-red-50 text-red-700 hover:bg-red-100',
    action: 'rejected',
    showRefund: false
  },
  'Request More Info': {
    icon: null,
    color: 'bg-amber-50 text-amber-700 hover:bg-amber-100',
    action: 'info_requested',
    showRefund: false
  }
};

export default function ResolutionActions({ dispute, onResolved }) {
  const queryClient = useQueryClient();
  const [selectedAction, setSelectedAction] = useState(null);
  const [resolution, setResolution] = useState('');
  const [refundAmount, setRefundAmount] = useState(dispute?.amount || '0');

  const updateMutation = useMutation({
    mutationFn: (data) => sovereign.entities.Dispute.update(dispute.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute', dispute.id] });
      queryClient.invalidateQueries({ queryKey: ['all-disputes'] });
      toast.success('Dispute resolved');
      setSelectedAction(null);
      setResolution('');
      if (onResolved) onResolved();
    },
    onError: () => {
      toast.error('Failed to resolve dispute');
    }
  });

  const handleResolve = () => {
    if (!resolution.trim()) {
      toast.error('Please provide a resolution explanation');
      return;
    }

    const outcome = `${selectedAction} - ${resolution}`;
    
    updateMutation.mutate({
      status: 'Resolved',
      resolution_notes: outcome,
      resolution_date: new Date().toISOString(),
      refund_amount: RESOLUTION_TYPES[selectedAction].showRefund ? refundAmount : 0
    });
  };

  const handleMarkInReview = () => {
    updateMutation.mutate({
      status: 'In Review'
    });
  };

  return (
    <div className="space-y-4">
      {/* Status Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {dispute.status === 'Open' && (
            <Button
              onClick={handleMarkInReview}
              disabled={updateMutation.isPending}
              variant="outline"
              className="w-full"
            >
              Mark as In Review
            </Button>
          )}

          {['Open', 'In Review'].includes(dispute.status) && (
            <div className="space-y-2">
              <p className="text-sm font-semibold text-foreground">Resolve Dispute</p>
              <div className="space-y-1">
                {Object.entries(RESOLUTION_TYPES).map(([action, config]) => (
                  <button
                    key={action}
                    onClick={() => setSelectedAction(action)}
                    className={`w-full p-3 rounded-lg text-sm font-semibold transition-all ${
                      selectedAction === action
                        ? 'bg-primary text-white'
                        : `${config.color}`
                    }`}
                  >
                    {action}
                  </button>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Resolution Details */}
      {selectedAction && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Resolution Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Refund Option */}
            {RESOLUTION_TYPES[selectedAction].showRefund && (
              <div>
                <label className="text-sm font-semibold text-foreground mb-2 block">
                  Refund Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input
                    type="number"
                    value={refundAmount}
                    onChange={(e) => setRefundAmount(e.target.value)}
                    className="w-full pl-8 pr-4 py-2 rounded-lg border border-border bg-background text-foreground"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Claimed: ${dispute.amount}
                </p>
              </div>
            )}

            {/* Resolution Notes */}
            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Resolution Explanation (required)
              </label>
              <Textarea
                placeholder={`Explain why you are ${selectedAction.toLowerCase()}...`}
                value={resolution}
                onChange={(e) => setResolution(e.target.value)}
                className="min-h-24 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This will be visible to both parties in a formal resolution letter.
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => {
                  setSelectedAction(null);
                  setResolution('');
                  setRefundAmount(dispute?.amount || '0');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleResolve}
                disabled={updateMutation.isPending || !resolution.trim()}
                className="flex-1 bg-primary hover:bg-primary/90"
              >
                {updateMutation.isPending ? 'Resolving...' : 'Resolve Dispute'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Resolved Status */}
      {dispute.status === 'Resolved' && (
        <Card className="border-green-200 bg-green-50/50">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="w-5 h-5 text-green-600" />
              <div>
                <p className="font-semibold text-green-900">Case Closed</p>
                <p className="text-xs text-green-700">{dispute.resolution_notes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Info Box */}
      <Card className="bg-muted/30 border-muted">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            <span className="font-semibold">Note:</span> Both parties will be notified of the resolution via email. Approved refunds are processed within 2-3 business days.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

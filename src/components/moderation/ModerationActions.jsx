import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { AlertCircle, Ban, Eye, Shield } from 'lucide-react';

const ACTION_TYPES = {
  'flag': { label: 'Flag Account', icon: AlertCircle, color: 'bg-orange-50 text-orange-700 hover:bg-orange-100', severity: 'warning' },
  'suspend': { label: 'Suspend Account', icon: Eye, color: 'bg-amber-50 text-amber-700 hover:bg-amber-100', severity: 'danger' },
  'ban': { label: 'Ban Account', icon: Ban, color: 'bg-red-50 text-red-700 hover:bg-red-100', severity: 'critical' },
  'restore': { label: 'Restore Account', icon: Shield, color: 'bg-green-50 text-green-700 hover:bg-green-100', severity: 'info' }
};

export default function ModerationActions({ targetUser }) {
  const queryClient = useQueryClient();
  const [selectedAction, setSelectedAction] = useState(null);
  const [reason, setReason] = useState('');

  const currentStatus = targetUser.moderation_status || 'active';

  const updateMutation = useMutation({
    mutationFn: (data) => sovereign.entities.User.update(targetUser.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['user-detail', targetUser.id] });
      queryClient.invalidateQueries({ queryKey: ['all-users'] });
      toast.success('User account updated');
      setSelectedAction(null);
      setReason('');
    },
    onError: () => {
      toast.error('Failed to update user account');
    }
  });

  const handleAction = () => {
    if (!reason.trim()) {
      toast.error('Please provide a reason for this action');
      return;
    }

    const timestamp = new Date().toLocaleString();
    const previousNotes = targetUser.moderation_notes || '';
    const newNote = `[${timestamp}] ${selectedAction.toUpperCase()}: ${reason}`;
    const allNotes = previousNotes ? `${previousNotes}\n${newNote}` : newNote;

    let newStatus = currentStatus;
    if (selectedAction === 'flag') newStatus = 'flagged';
    if (selectedAction === 'suspend') newStatus = 'suspended';
    if (selectedAction === 'ban') newStatus = 'banned';
    if (selectedAction === 'restore') newStatus = 'active';

    updateMutation.mutate({
      moderation_status: newStatus,
      moderation_notes: allNotes
    });
  };

  // Determine available actions based on current status
  const availableActions = {
    'active': ['flag', 'suspend'],
    'flagged': ['suspend', 'restore'],
    'suspended': ['ban', 'restore'],
    'banned': ['restore']
  };

  const allowedActions = availableActions[currentStatus] || [];

  return (
    <div className="space-y-4">
      {/* Current Status */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Current Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge 
            className={
              currentStatus === 'active' ? 'bg-green-50 text-green-700' :
              currentStatus === 'flagged' ? 'bg-orange-50 text-orange-700' :
              currentStatus === 'suspended' ? 'bg-amber-50 text-amber-700' :
              'bg-red-50 text-red-700'
            }
          >
            {currentStatus.charAt(0).toUpperCase() + currentStatus.slice(1)}
          </Badge>
          <p className="text-xs text-muted-foreground mt-2">
            {currentStatus === 'active' && 'User account is in good standing.'}
            {currentStatus === 'flagged' && 'User account is under review.'}
            {currentStatus === 'suspended' && 'User account access is restricted.'}
            {currentStatus === 'banned' && 'User account has been permanently banned.'}
          </p>
        </CardContent>
      </Card>

      {/* Actions */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Moderation Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          {allowedActions.length > 0 ? (
            <>
              {allowedActions.map((action) => {
                const config = ACTION_TYPES[action];
                const Icon = config.icon;
                return (
                  <button
                    key={action}
                    onClick={() => setSelectedAction(action)}
                    className={`w-full p-3 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                      selectedAction === action
                        ? 'bg-primary text-white'
                        : config.color
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {config.label}
                  </button>
                );
              })}
            </>
          ) : (
            <p className="text-xs text-muted-foreground">No further actions available for this account status.</p>
          )}
        </CardContent>
      </Card>

      {/* Action Details */}
      {selectedAction && (
        <Card className="border-primary/30 bg-primary/5">
          <CardHeader>
            <CardTitle className="text-base">Confirm Action</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm font-semibold text-foreground mb-2">Action</p>
              <Badge className="capitalize">
                {ACTION_TYPES[selectedAction].label}
              </Badge>
              <p className="text-xs text-muted-foreground mt-2">
                User: <span className="font-mono">{targetUser.email}</span>
              </p>
            </div>

            <div>
              <label className="text-sm font-semibold text-foreground mb-2 block">
                Reason (required)
              </label>
              <Textarea
                placeholder={`Explain why you are ${selectedAction}ing this account...`}
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                className="min-h-20 text-sm"
              />
              <p className="text-xs text-muted-foreground mt-1">
                This will be logged in the moderation history and may be communicated to the user.
              </p>
            </div>

            <div className="flex gap-2 pt-4 border-t">
              <Button
                onClick={() => {
                  setSelectedAction(null);
                  setReason('');
                }}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAction}
                disabled={updateMutation.isPending || !reason.trim()}
                className={`flex-1 ${
                  ACTION_TYPES[selectedAction].severity === 'critical'
                    ? 'bg-destructive hover:bg-destructive/90'
                    : 'bg-primary hover:bg-primary/90'
                }`}
              >
                {updateMutation.isPending ? 'Processing...' : 'Confirm'}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Warning */}
      {selectedAction && ACTION_TYPES[selectedAction].severity === 'critical' && (
        <Card className="border-destructive/30 bg-destructive/5">
          <CardContent className="p-4">
            <p className="text-xs text-destructive leading-relaxed">
              <span className="font-semibold">Warning:</span> This action is permanent and will prevent the user from accessing the platform. This should only be used in cases of severe violations.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Info */}
      <Card className="bg-muted/30 border-muted">
        <CardContent className="p-4">
          <p className="text-xs text-muted-foreground leading-relaxed">
            All moderation actions are logged with timestamps and reasons for audit purposes. Users will be notified of account changes via email.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

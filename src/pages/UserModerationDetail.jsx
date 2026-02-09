import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { ArrowLeft, AlertCircle, Mail, Calendar, Shield } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import ModerationActions from '@/components/moderation/ModerationActions';

export default function UserModerationDetail() {
  const { data: currentUser } = useQuery({
    queryKey: ['currentUser'],
    queryFn: () => sovereign.auth.me(),
  });

  const params = new URLSearchParams(window.location.search);
  const userId = params.get('id');

  const { data: targetUser } = useQuery({
    queryKey: ['user-detail', userId],
    queryFn: () => sovereign.entities.User.get(userId),
    enabled: !!userId
  });

  const statusConfig = {
    'active': { color: 'bg-green-50 text-green-700', label: 'Active' },
    'flagged': { color: 'bg-orange-50 text-orange-700', label: 'Flagged' },
    'suspended': { color: 'bg-amber-50 text-amber-700', label: 'Suspended' },
    'banned': { color: 'bg-red-50 text-red-700', label: 'Banned' }
  };

  const status = targetUser?.moderation_status || 'active';
  const config = statusConfig[status];

  if (currentUser?.role !== 'admin') {
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

  if (!targetUser) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center p-4">
        <MetaTags title="User Not Found" />
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">User not found</p>
            <Link to={createPageUrl('AdminUserModeration')}>
              <Button>Back to Moderation</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground pb-16">
      <MetaTags 
        title={`Moderation: ${targetUser.full_name}`}
        description="User moderation details"
      />

      <div className="max-w-4xl mx-auto px-4 md:px-6 py-8">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl('AdminUserModeration')}>
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold tracking-tight">{targetUser.full_name}</h1>
            <p className="text-muted-foreground text-sm mt-1">{targetUser.email}</p>
          </div>
          <Badge className={config.color}>{config.label}</Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* User Info */}
            <Card>
              <CardHeader>
                <CardTitle>Account Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Email</p>
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <p className="font-semibold text-sm">{targetUser.email}</p>
                    </div>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Role</p>
                    <Badge variant="outline">{targetUser.role}</Badge>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1 flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      Joined
                    </p>
                    <p className="font-semibold text-sm">
                      {new Date(targetUser.created_date).toLocaleDateString()}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">Account Status</p>
                    <p className="font-semibold text-sm capitalize">{status}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Moderation History */}
            {targetUser.moderation_notes && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Shield className="w-4 h-4" />
                    Moderation History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="bg-muted/50 p-4 rounded-lg text-sm whitespace-pre-wrap">
                    {targetUser.moderation_notes}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Activity Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Activity Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Last Active</span>
                    <span className="font-semibold">
                      {targetUser.updated_date 
                        ? new Date(targetUser.updated_date).toLocaleDateString()
                        : 'Never'
                      }
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Account Created</span>
                    <span className="font-semibold">
                      {new Date(targetUser.created_date).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Moderation Panel */}
          <div>
            <ModerationActions targetUser={targetUser} />
          </div>
        </div>
      </div>
    </div>
  );
}

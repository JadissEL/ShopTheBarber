import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import ModerationActions from '@/components/moderation/ModerationActions';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Mail, Calendar, Shield } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import ContextualBackLink from '@/components/ui/ContextualBackLink';
import { useSetBreadcrumbTitle } from '@/components/layout/DashboardBreadcrumbContext';
import { stb } from '@/lib/stbUi';

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
    'active': { color: 'bg-success/10 text-success', label: 'Active' },
    'flagged': { color: 'bg-warning/15 text-foreground', label: 'Flagged' },
    'suspended': { color: 'bg-primary/10 text-muted-foreground', label: 'Suspended' },
    'banned': { color: 'bg-destructive/10 text-destructive', label: 'Banned' }
  };

  const status = targetUser?.moderation_status || 'active';
  const config = statusConfig[status];

  useSetBreadcrumbTitle(targetUser?.full_name ?? null);

  if (currentUser?.role !== 'admin') {
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

  if (!targetUser) {
    return (
      <div className="stb-page flex items-center justify-center p-4">
        <MetaTags title="User Not Found" />
        <Card>
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">User not found</p>
            <ContextualBackLink label="Back to moderation" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className={stb.page}>
      <MetaTags 
        title={`Moderation: ${targetUser.full_name}`}
        description="User moderation details"
      />

      <PageHeader
        label="Admin"
        title={targetUser.full_name}
        subtitle={targetUser.email}
        compact
        variant="light"
        tier="app"
      >
        <Badge className={config.color}>{config.label}</Badge>
      </PageHeader>

      <PageContent narrow>
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
      </PageContent>
    </div>
  );
}

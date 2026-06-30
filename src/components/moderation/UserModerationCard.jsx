import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mail, Shield, ChevronRight } from 'lucide-react';

export default function UserModerationCard({ user }) {
  const statusConfig = {
    'active': { color: 'bg-success/10 text-success', label: 'Active' },
    'flagged': { color: 'bg-warning/15 text-foreground', label: 'Flagged' },
    'suspended': { color: 'bg-primary/10 text-muted-foreground', label: 'Suspended' },
    'banned': { color: 'bg-destructive/10 text-destructive', label: 'Banned' }
  };

  const status = user.moderation_status || 'active';
  const config = statusConfig[status];

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          {/* Left Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${config.color} bg-opacity-10`}>
                <Shield className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-foreground truncate">
                  {user.full_name}
                </h3>
                <div className="flex items-center gap-1 mt-1 text-sm text-muted-foreground truncate">
                  <Mail className="w-3 h-3 flex-shrink-0" />
                  <span className="truncate">{user.email}</span>
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <Badge className={config.color}>{config.label}</Badge>
              <Badge variant="outline" className="text-xs">{user.role}</Badge>
              <span className="text-xs text-muted-foreground">•</span>
              <span className="text-xs text-muted-foreground">
                Joined {new Date(user.created_date).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Right Action */}
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, Clock, CheckCircle2, ChevronRight } from 'lucide-react';

export default function DisputeCard({ dispute }) {
  const statusConfig = {
    'Open': { color: 'bg-red-50 text-red-700', icon: AlertCircle, label: 'New' },
    'In Review': { color: 'bg-amber-50 text-amber-700', icon: Clock, label: 'Reviewing' },
    'Resolved': { color: 'bg-green-50 text-green-700', icon: CheckCircle2, label: 'Resolved' }
  };

  const config = statusConfig[dispute.status] || statusConfig['Open'];
  const Icon = config.icon;

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          {/* Left Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-3">
              <div className={`p-2 rounded-lg ${config.color} bg-opacity-10`}>
                <Icon className={`w-5 h-5 ${config.color.split(' ')[1]}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-foreground">
                  {dispute.client_name} <span className="text-muted-foreground font-normal">vs</span> {dispute.barber_name}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">{dispute.reason || 'Dispute claim'}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <Badge className={config.color}>{config.label}</Badge>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm text-muted-foreground">{dispute.booking_date}</span>
              <span className="text-sm text-muted-foreground">•</span>
              <span className="text-sm font-semibold text-destructive">${dispute.amount}</span>
            </div>
          </div>

          {/* Right Action */}
          <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
        </div>
      </CardContent>
    </Card>
  );
}
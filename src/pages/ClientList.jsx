import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import { Users, ArrowLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';

/**
 * Client list — provider view of clients (e.g. who has booked).
 * Participates in routing; can be linked from provider dashboard or messages.
 */
export default function ClientList() {
  const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => sovereign.auth.me() });
  const isProvider = user && ['provider', 'barber', 'shop_owner', 'admin'].includes(user.role);

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <MetaTags title="Client List" description="View your clients" />
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">Sign in to view client list.</p>
            <Link to={createPageUrl('SignIn')} className="text-primary font-semibold hover:underline">Sign in</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!isProvider) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <MetaTags title="Client List" description="View your clients" />
        <Card className="max-w-md w-full">
          <CardContent className="py-8 text-center">
            <p className="text-muted-foreground mb-4">This page is for providers.</p>
            <Link to={createPageUrl('Dashboard')} className="text-primary font-semibold hover:underline">Back to Dashboard</Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <MetaTags title="Client List" description="Clients who have booked with you" />
      <div className="max-w-4xl mx-auto px-4 py-8">
        <Link to={createPageUrl('ProviderDashboard')} className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-3 mb-6">
          <Users className="w-8 h-8 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Client List</h1>
            <p className="text-muted-foreground text-sm">Clients who have booked with your shop</p>
          </div>
        </div>
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            Client list data can be shown here (e.g. from bookings). Use Provider Bookings to see who has appointments.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

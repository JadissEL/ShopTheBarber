import { MetaTags } from '@/components/seo/MetaTags';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, HelpCircle, Mail, MessageCircle, BookOpen } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

export default function HelpCenter() {
  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <MetaTags title="Help Center" description="Get help and support for ShopTheBarber" />
      <div className="w-full max-w-3xl lg:max-w-4xl mx-auto px-4 lg:px-8 py-12">
        <Link to={createPageUrl('Dashboard')} className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <HelpCircle className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Help Center</h1>
            <p className="text-muted-foreground">Find answers and get support</p>
          </div>
        </div>
        <div className="grid gap-4">
          <Link to={createPageUrl('Explore')}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center gap-4">
                <BookOpen className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h2 className="font-semibold text-lg">How to book</h2>
                  <p className="text-sm text-muted-foreground">Browse barbers, pick a time, and confirm your appointment.</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Link to={createPageUrl('UserBookings')}>
            <Card className="hover:shadow-md transition-shadow">
              <CardContent className="p-6 flex items-center gap-4">
                <MessageCircle className="w-8 h-8 text-primary shrink-0" />
                <div>
                  <h2 className="font-semibold text-lg">Manage bookings</h2>
                  <p className="text-sm text-muted-foreground">View, reschedule, or cancel your appointments.</p>
                </div>
              </CardContent>
            </Card>
          </Link>
          <Card>
            <CardContent className="p-6 flex items-center gap-4">
              <Mail className="w-8 h-8 text-primary shrink-0" />
              <div>
                <h2 className="font-semibold text-lg">Contact us</h2>
                <p className="text-sm text-muted-foreground">Email support@shopthebarber.com for assistance.</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ClientBottomNav />
    </div>
  );
}

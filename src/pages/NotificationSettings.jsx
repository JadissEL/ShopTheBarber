import { MetaTags } from '@/components/seo/MetaTags';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ArrowLeft, Bell } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useState } from 'react';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

export default function NotificationSettings() {
  const [emailReminders, setEmailReminders] = useState(true);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [promos, setPromos] = useState(false);

  return (
    <div className="min-h-screen bg-background pb-24 lg:pb-8">
      <MetaTags title="Notification Settings" description="Manage your notification preferences" />
      <div className="w-full max-w-xl lg:max-w-4xl mx-auto px-4 lg:px-8 py-12">
        <Link to={createPageUrl('Dashboard')} className="inline-flex items-center gap-2 text-primary hover:text-primary/80 mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>
        <div className="flex items-center gap-3 mb-8">
          <Bell className="w-10 h-10 text-primary" />
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Notification Settings</h1>
            <p className="text-muted-foreground text-sm">Choose how you want to be notified</p>
          </div>
        </div>
        <Card>
          <CardContent className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <Label htmlFor="email-reminders" className="text-base">Booking reminders</Label>
              <Switch id="email-reminders" checked={emailReminders} onCheckedChange={setEmailReminders} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="push" className="text-base">Push notifications</Label>
              <Switch id="push" checked={pushEnabled} onCheckedChange={setPushEnabled} />
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="promos" className="text-base">Promotions & offers</Label>
              <Switch id="promos" checked={promos} onCheckedChange={setPromos} />
            </div>
          </CardContent>
        </Card>
      </div>
      <ClientBottomNav />
    </div>
  );
}

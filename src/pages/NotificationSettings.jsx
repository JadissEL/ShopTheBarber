import { MetaTags } from '@/components/seo/MetaTags';
import { Bell, Smartphone, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { toast } from 'sonner';
import { PageLoading } from '@/components/ui/page-loading';
import ContextualBackLink from '@/components/ui/ContextualBackLink';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { stb } from '@/lib/stbUi';
import { useState, useEffect } from 'react';
import {
  browserWaitlistAlertsEnabled,
  ensureNotificationPermission,
  setBrowserWaitlistAlertsEnabled,
} from '@/lib/browserNotifications';

export default function NotificationSettings() {
  const queryClient = useQueryClient();
  const [phoneInput, setPhoneInput] = useState('');
  const [browserWaitlistAlerts, setBrowserWaitlistAlerts] = useState(() => browserWaitlistAlertsEnabled());

  useEffect(() => {
    setBrowserWaitlistAlerts(browserWaitlistAlertsEnabled());
  }, []);

  const { data: prefs, isLoading } = useQuery({
    queryKey: ['reminder-preferences'],
    queryFn: () => sovereign.reminders.getPreferences(),
  });

  const { data: status } = useQuery({
    queryKey: ['reminder-status'],
    queryFn: () => sovereign.reminders.getStatus(),
  });

  useEffect(() => {
    if (prefs?.phone != null) setPhoneInput(prefs.phone);
  }, [prefs?.phone]);

  const saveMutation = useMutation({
    mutationFn: (payload) => sovereign.reminders.updatePreferences(payload),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['reminder-preferences'] });
      queryClient.invalidateQueries({ queryKey: ['reminder-status'] });
      queryClient.invalidateQueries({ queryKey: ['currentUser'] });
      if (data.phone != null) setPhoneInput(data.phone);
      toast.success('Notification preferences saved');
    },
    onError: (err) => toast.error(err.message || 'Failed to save preferences'),
  });

  const testSmsMutation = useMutation({
    mutationFn: () => sovereign.reminders.sendTestSms(),
    onSuccess: (data) => {
      toast.success(data.message || 'Test SMS sent');
    },
    onError: (err) => toast.error(err.message || 'Test SMS failed'),
  });

  if (isLoading) return <PageLoading message="Loading preferences..." />;

  const smsEnabled = prefs?.sms_reminders_enabled !== false;
  const rebookNudgesEnabled = prefs?.sms_rebook_nudges_enabled !== false;
  const emailEnabled = prefs?.email_reminders_enabled !== false;
  const phoneValid = prefs?.phone_valid === true;
  const twilioReady = status?.twilio_configured === true;

  return (
    <div className={`${stb.page  } lg:pb-8`}>
      <MetaTags title="Notification Settings" description="Manage your notification preferences" />
      <PageHeader
        label="Account"
        title="Notification settings"
        subtitle={`SMS & email reminders ~${status?.hours_before ?? 24}h before appointments`}
        compact
        variant="light"
        tier="app"
      >
        <Badge variant={twilioReady ? 'default' : 'secondary'}>
          {twilioReady ? 'Twilio connected' : 'Twilio not configured'}
        </Badge>
        {phoneValid && (
          <Badge variant="outline" className="text-primary border-primary/30">
            <CheckCircle2 className="w-3 h-3 mr-1" /> Valid phone
          </Badge>
        )}
      </PageHeader>
      <PageContent narrow>
        <ContextualBackLink className="mb-6" />

        <div className={`${stb.panel  } mb-6`}>
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-3 pb-4 border-b border-border">
              <Bell className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className={stb.uiSubheading}>Browser waitlist alerts</p>
                <p className="text-sm text-muted-foreground">
                  Desktop notifications and a short sound when a waitlist slot opens (15 min to accept).
                  Requires permission in your browser.
                </p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="browser-waitlist" className="text-base">Waitlist slot alerts</Label>
              <Switch
                id="browser-waitlist"
                checked={browserWaitlistAlerts}
                onCheckedChange={async (v) => {
                  if (v) {
                    const perm = await ensureNotificationPermission();
                    if (perm !== 'granted' && perm !== 'unsupported') {
                      toast.error('Enable notifications in your browser settings to receive waitlist alerts.');
                      return;
                    }
                  }
                  setBrowserWaitlistAlerts(v);
                  setBrowserWaitlistAlertsEnabled(v);
                }}
              />
            </div>
          </div>
        </div>

        <div className={`${stb.panel  } mb-6`}>
          <div className="p-6 space-y-6">
            <div className="flex items-start gap-3 pb-4 border-b border-border">
              <Smartphone className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <p className={stb.uiSubheading}>SMS reminders</p>
                <p className="text-sm text-muted-foreground">
                  Text alerts via Twilio. Use international format (e.g. +15551234567 or +33612345678).
                  Reply STOP to any message to opt out. We can also text when you&apos;re usually due for another visit.
                </p>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Mobile number</Label>
              <Input
                id="phone"
                type="tel"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                placeholder="+1 555 123 4567"
                onBlur={() => {
                  const phone = phoneInput.trim();
                  if (phone !== (prefs?.phone || '')) {
                    saveMutation.mutate({ phone: phone || null });
                  }
                }}
              />
              {phoneInput && !phoneValid && prefs?.phone === phoneInput && (
                <p className="text-xs text-primary flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />
                  Could not validate this number, check the country code.
                </p>
              )}
              {prefs?.phone_e164 && (
                <p className="text-xs text-muted-foreground">Stored as {prefs.phone_e164}</p>
              )}
            </div>
            <div className="flex items-center justify-between">
              <Label htmlFor="sms-reminders" className="text-base">SMS booking reminders</Label>
              <Switch
                id="sms-reminders"
                checked={smsEnabled}
                disabled={!phoneValid}
                onCheckedChange={(v) => saveMutation.mutate({ sms_reminders_enabled: v })}
              />
            </div>
            <div className="flex items-center justify-between border-t border-border pt-4">
              <div className="pr-4">
                <Label htmlFor="rebook-nudges" className="text-base">Smart rebook reminders</Label>
                <p className="text-xs text-muted-foreground mt-1">
                  We learn your usual visit rhythm (e.g. every 3-4 weeks) and text when you&apos;re likely due for your usual cut or beard trim.
                </p>
              </div>
              <Switch
                id="rebook-nudges"
                checked={rebookNudgesEnabled}
                disabled={!phoneValid || !smsEnabled}
                onCheckedChange={(v) => saveMutation.mutate({ sms_rebook_nudges_enabled: v })}
              />
            </div>
            <Button
              type="button"
              variant="outline"
              className="w-full"
              disabled={!phoneValid || testSmsMutation.isPending}
              onClick={() => testSmsMutation.mutate()}
            >
              <Send className="w-4 h-4 mr-2" />
              {testSmsMutation.isPending ? 'Sending…' : 'Send test SMS'}
            </Button>
          </div>
        </div>

        <div className={stb.panel}>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="email-reminders" className="text-base">Email booking reminders</Label>
                <p className="text-xs text-muted-foreground mt-1">Same ~24h window as SMS (requires Resend on server).</p>
              </div>
              <Switch
                id="email-reminders"
                checked={emailEnabled}
                onCheckedChange={(v) => saveMutation.mutate({ email_reminders_enabled: v })}
              />
            </div>
            <p className="text-xs text-muted-foreground border-t border-border pt-4">
              Booking confirmations are always sent when email is on file. Scheduled reminders respect these toggles.
            </p>
          </div>
        </div>
      </PageContent>
    </div>
  );
}

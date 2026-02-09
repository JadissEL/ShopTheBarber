import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { toast } from 'sonner';
import { MetaTags } from '@/components/seo/MetaTags';
import { User, Shield, Bell, MapPin, Key, LogOut, Loader, CheckCircle, ExternalLink, Calendar, Link2, Unlink } from 'lucide-react';
import { useSearchParams } from 'react-router-dom';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { clientProfileSchema } from '@/lib/validations';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

export default function AccountSettings() {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const { data: user, isLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => sovereign.auth.me()
    });

    const { data: googleCalendarStatus, isLoading: googleCalendarLoading, refetch: refetchGoogleCalendar } = useQuery({
        queryKey: ['integrations', 'googleCalendar'],
        queryFn: () => sovereign.integrations.googleCalendar.getStatus(),
        enabled: !!user
    });

    const disconnectGoogleMutation = useMutation({
        mutationFn: () => sovereign.integrations.googleCalendar.disconnect(),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['integrations', 'googleCalendar'] });
            toast.success('Google Calendar disconnected');
        },
        onError: (e) => toast.error(e.message || 'Failed to disconnect')
    });

    useEffect(() => {
        const status = searchParams.get('google_calendar');
        if (status === 'connected') {
            toast.success('Google Calendar connected. New bookings will sync to your calendar.');
            refetchGoogleCalendar();
            setSearchParams((p) => { p.delete('google_calendar'); p.delete('message'); return p; }, { replace: true });
        } else if (status === 'error') {
            const msg = searchParams.get('message') || 'Connection failed';
            toast.error(msg);
            setSearchParams((p) => { p.delete('google_calendar'); p.delete('message'); return p; }, { replace: true });
        }
    }, [searchParams, refetchGoogleCalendar, setSearchParams]);

    const [notifSettings, setNotifSettings] = useState({
        booking_reminders: true,
        marketing: false,
        security_alerts: true
    });

    const form = useForm({
        resolver: zodResolver(clientProfileSchema),
        defaultValues: {
            full_name: '',
            email: '',
            phone: '',
            address: ''
        }
    });

    useEffect(() => {
        if (user) {
            form.reset({
                full_name: user.full_name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: user.address || ''
            });
        }
    }, [user, form]);

    const updateProfileMutation = useMutation({
        mutationFn: (data) => sovereign.entities.User.update(user.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            toast.success("Profile updated successfully");
        },
        onError: (err) => toast.error(err.message || "Failed to update profile")
    });

    const handleLogout = async () => {
        await sovereign.auth.logout();
        window.location.href = '/';
    };

    if (isLoading) return (
        <div className="min-h-[60vh] flex items-center justify-center">
            <Loader className="w-8 h-8 animate-spin text-primary" />
        </div>
    );

    if (!user) {
        return (
            <div className="w-full max-w-md lg:max-w-4xl mx-auto mt-20 text-center p-12 bg-card rounded-3xl shadow-xl border border-border">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-6" />
                <h2 className="text-2xl font-black text-foreground mb-2">Session Expired</h2>
                <p className="text-muted-foreground mb-8 font-medium">Please sign in to access your account settings.</p>
                <Button onClick={() => window.location.href = '/SignIn'} className="w-full h-12 rounded-2xl bg-primary text-primary-foreground font-bold">Return to Login</Button>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-background pb-24 lg:pb-8">
            <div className="max-w-5xl mx-auto px-4 md:px-6 lg:px-8 py-10">
            <MetaTags title="Account Settings" description="Manage your personal profile, security, and preferences." />

            <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-6">
                <div>
                    <h1 className="text-4xl font-black text-foreground tracking-tight mb-2">My Account</h1>
                    <p className="text-muted-foreground font-bold uppercase text-xs tracking-widest bg-muted inline-block px-3 py-1 rounded-full border border-border">
                        {user.role || 'Client'} • ID: {user.id?.substring(0, 8)}
                    </p>
                </div>
                <div className="flex items-center gap-3">
                    <Button variant="outline" onClick={handleLogout} className="rounded-2xl h-12 px-6 border-border hover:bg-red-50 hover:text-red-600 hover:border-red-100 transition-all font-bold">
                        <LogOut className="w-4 h-4 mr-2" /> Sign Out
                    </Button>
                </div>
            </div>

            <Tabs defaultValue="profile" className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-3">
                    <TabsList className="flex flex-col bg-transparent w-full space-y-2 h-auto p-0">
                        <TabsTrigger value="profile" className="justify-start px-6 py-4 rounded-2xl w-full data-[state=active]:bg-card data-[state=active]:shadow-xl data-[state=active]:border-border border border-transparent transition-all font-bold text-muted-foreground data-[state=active]:text-primary">
                            <User className="w-4 h-4 mr-3" /> Profile Info
                        </TabsTrigger>
                        <TabsTrigger value="preferences" className="justify-start px-6 py-4 rounded-2xl w-full data-[state=active]:bg-card data-[state=active]:shadow-xl data-[state=active]:border-border border border-transparent transition-all font-bold text-muted-foreground data-[state=active]:text-primary">
                            <Bell className="w-4 h-4 mr-3" /> Notifications
                        </TabsTrigger>
                        <TabsTrigger value="integrations" className="justify-start px-6 py-4 rounded-2xl w-full data-[state=active]:bg-card data-[state=active]:shadow-xl data-[state=active]:border-border border border-transparent transition-all font-bold text-muted-foreground data-[state=active]:text-primary">
                            <Calendar className="w-4 h-4 mr-3" /> Integrations
                        </TabsTrigger>
                        <TabsTrigger value="security" className="justify-start px-6 py-4 rounded-2xl w-full data-[state=active]:bg-card data-[state=active]:shadow-xl data-[state=active]:border-border border border-transparent transition-all font-bold text-muted-foreground data-[state=active]:text-primary">
                            <Shield className="w-4 h-4 mr-3" /> Login & Safety
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-9">
                        <TabsContent value="profile" className="mt-0">
                            <Card className="border-none shadow-2xl rounded-[32px] overflow-hidden bg-card border border-border">
                                <CardHeader className="bg-primary border-none p-10 text-primary-foreground">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 rounded-3xl bg-primary-foreground/20 border border-primary-foreground/30 flex items-center justify-center text-3xl font-black italic text-primary-foreground">
                                            {user.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <CardTitle className="text-2xl font-black tracking-tight">{user.full_name}</CardTitle>
                                            <p className="text-primary-foreground/80 font-medium">{user.email}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10">
                                    <form onSubmit={form.handleSubmit((d) => {
                                                const { email: _e, ...editable } = d;
                                                updateProfileMutation.mutate(editable);
                                            })} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <Label className="text-foreground font-bold ml-1">Full Identity</Label>
                                                <Input {...form.register('full_name')} className="h-12 rounded-2xl border-border bg-muted/50 focus:bg-card transition-colors text-foreground font-medium" />
                                                {form.formState.errors.full_name && <p className="text-red-500 text-xs mt-1 font-bold">{form.formState.errors.full_name.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground font-bold ml-1">Secure Email</Label>
                                                <Input {...form.register('email')} className="h-12 rounded-2xl border-border bg-muted cursor-not-allowed font-medium text-muted-foreground" disabled />
                                                <p className="text-xs text-muted-foreground font-medium ml-1">Managed by your sign-in provider. Change it in your account settings there.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground font-bold ml-1">Direct Phone</Label>
                                                <Input {...form.register('phone')} className="h-12 rounded-2xl border-border bg-muted/50 focus:bg-card transition-colors font-medium text-foreground" placeholder="E.g. 5550123456" />
                                                {form.formState.errors.phone && <p className="text-red-500 text-xs mt-1 font-bold">{form.formState.errors.phone.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground font-bold ml-1">Preferred Location</Label>
                                                <div className="relative">
                                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                                                    <Input {...form.register('address')} className="h-12 rounded-2xl border-border bg-muted/50 focus:bg-card transition-colors pl-11 font-medium text-foreground placeholder:text-muted-foreground" placeholder="Home or Work address" />
                                                </div>
                                                <p className="text-xs text-muted-foreground font-medium ml-1">Optional – used for nearby barbers and directions.</p>
                                            </div>
                                        </div>
                                        <div className="pt-6 border-t border-border flex justify-end">
                                            <Button type="submit" className="h-12 px-10 rounded-2xl bg-primary text-primary-foreground font-black transition-all active:scale-95 hover:opacity-95" disabled={updateProfileMutation.isPending}>
                                                {updateProfileMutation.isPending ? (
                                                    <><Loader className="w-4 h-4 mr-2 animate-spin" /> Syncing Details</>
                                                ) : 'Sync Profile'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="preferences" className="mt-0">
                            <Card className="border-none shadow-2xl rounded-[32px] bg-card border border-border p-10 space-y-8">
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <h2 className="text-2xl font-black text-foreground mb-2">Alert Preferences</h2>
                                        <p className="text-muted-foreground font-medium">Control how and when you hear from us.</p>
                                    </div>
                                    <Link to={createPageUrl('NotificationSettings')} className="text-sm font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1">
                                        Full notification settings <ExternalLink className="w-3.5 h-3.5" />
                                    </Link>
                                </div>

                                <div className="space-y-4">
                                    <div className="flex items-center justify-between p-6 bg-muted/50 rounded-3xl border border-border hover:border-primary/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-primary/10 text-primary rounded-2xl flex items-center justify-center">
                                                <CheckCircle className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">Booking Confirmations</p>
                                                <p className="text-xs text-muted-foreground font-medium">Automatic alerts for any new appointments.</p>
                                            </div>
                                        </div>
                                        <Switch checked={notifSettings.booking_reminders} onCheckedChange={(v) => setNotifSettings(s => ({ ...s, booking_reminders: v }))} />
                                    </div>

                                    <div className="flex items-center justify-between p-6 bg-muted/50 rounded-3xl border border-border hover:border-primary/30 transition-colors">
                                        <div className="flex items-center gap-4">
                                            <div className="w-12 h-12 bg-amber-100 text-amber-600 rounded-2xl flex items-center justify-center">
                                                <Shield className="w-6 h-6" />
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">Security & Login Alerts</p>
                                                <p className="text-xs text-muted-foreground font-medium">Critical alerts for security sensitive actions.</p>
                                            </div>
                                        </div>
                                        <Switch checked={notifSettings.security_alerts} onCheckedChange={(v) => setNotifSettings(s => ({ ...s, security_alerts: v }))} />
                                    </div>
                                </div>
                            </Card>
                        </TabsContent>

                        <TabsContent value="integrations" className="mt-0">
                            <Card className="border-none shadow-2xl rounded-[32px] bg-card border border-border p-10 space-y-8">
                                <div>
                                    <h2 className="text-2xl font-black text-foreground mb-2">Integrations</h2>
                                    <p className="text-muted-foreground font-medium">Connect your calendar and other services.</p>
                                </div>
                                <div className="p-6 bg-muted/50 rounded-3xl border border-border space-y-4">
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center">
                                            <Calendar className="w-6 h-6" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-bold text-foreground">Google Calendar</p>
                                            <p className="text-xs text-muted-foreground font-medium">New bookings will appear in your Google Calendar automatically.</p>
                                        </div>
                                    </div>
                                    {googleCalendarLoading ? (
                                        <div className="flex items-center gap-2 text-muted-foreground"><Loader className="w-4 h-4 animate-spin" /> Checking…</div>
                                    ) : !googleCalendarStatus?.configured ? (
                                        <p className="text-sm text-muted-foreground">Google Calendar is not configured for this app yet.</p>
                                    ) : googleCalendarStatus?.connected ? (
                                        <div className="flex flex-wrap items-center gap-3">
                                            <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
                                                <CheckCircle className="w-4 h-4" /> Connected
                                            </span>
                                            <Button variant="outline" size="sm" className="rounded-xl" onClick={() => disconnectGoogleMutation.mutate()} disabled={disconnectGoogleMutation.isPending}>
                                                <Unlink className="w-4 h-4 mr-1.5" /> Disconnect
                                            </Button>
                                        </div>
                                    ) : (
                                        <Button
                                            className="rounded-xl bg-primary text-primary-foreground hover:opacity-95"
                                            onClick={async () => {
                                                try {
                                                    const url = await sovereign.integrations.googleCalendar.getAuthorizeUrl();
                                                    window.location.href = url;
                                                } catch (e) {
                                                    toast.error(e.message || 'Could not open Google');
                                                }
                                            }}
                                        >
                                            <Link2 className="w-4 h-4 mr-2" /> Connect Google Calendar
                                        </Button>
                                    )}
                                </div>
                            </Card>
                        </TabsContent>

                        <TabsContent value="security" className="mt-0">
                            <Card className="border-none shadow-2xl rounded-[32px] bg-card border border-border p-10 space-y-8">
                                <div>
                                    <h2 className="text-2xl font-black text-foreground mb-2">Security & Identity</h2>
                                    <p className="text-muted-foreground font-medium">Manage your access and active sessions.</p>
                                </div>

                                <div className="p-8 border-2 border-dashed border-border rounded-[32px] text-center">
                                    <div className="w-16 h-16 bg-muted rounded-2xl flex items-center justify-center mx-auto mb-6">
                                        <Key className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">Change Password</h3>
                                    <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-8 font-medium">Upgrade your security level with a new robust password.</p>
                                    <Button variant="outline" className="h-12 px-8 rounded-2xl border-border font-black hover:bg-muted">Reset credentials</Button>
                                </div>
                            </Card>
                        </TabsContent>
                </div>
            </div>
            </Tabs>
            </div>
            <ClientBottomNav />
        </div>
    );
}

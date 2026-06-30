import { useEffect } from 'react';
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
import ClientPaymentMethodsPanel from '@/components/payments/ClientPaymentMethodsPanel';
import { User, Shield, Bell, MapPin, Key, LogOut, Loader, CheckCircle, ExternalLink, Truck } from 'lucide-react';
import SavedAddressesManager from '@/components/shipping/SavedAddressesManager';
import { PageLoading } from '@/components/ui/page-loading';
import { MetaTags } from '@/components/seo/MetaTags';
import { Link, useSearchParams } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { clientProfileSchema } from '@/lib/validations';
import AddressAutocomplete from '@/components/maps/AddressAutocomplete';
import { loadPreferredLocation, savePreferredLocation } from '@/lib/userLocation';
import { ReplaySetupGuideLink } from '@/components/onboarding/ReplaySetupGuideLink';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

function AccountNotificationPrefs({ user }) {
    const queryClient = useQueryClient();
    const { data: prefs } = useQuery({
        queryKey: ['reminder-preferences'],
        queryFn: () => sovereign.reminders.getPreferences(),
        enabled: !!user?.id,
    });
    const saveMutation = useMutation({
        mutationFn: (payload) => sovereign.reminders.updatePreferences(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['reminder-preferences'] });
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            toast.success('Reminder preferences updated');
        },
    });

    return (
        <>
            <div className="flex items-center justify-between p-6 bg-muted/50  border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 text-primary rounded-lg flex items-center justify-center">
                        <CheckCircle className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="font-bold text-foreground">SMS appointment reminders</p>
                        <p className="text-xs text-muted-foreground font-medium">Text alert ~24h before your cut (requires phone on profile).</p>
                    </div>
                </div>
                <Switch
                    checked={prefs?.sms_reminders_enabled !== false}
                    disabled={prefs?.phone_valid === false && !prefs?.phone?.trim() && !user?.phone?.trim()}
                    onCheckedChange={(v) => saveMutation.mutate({ sms_reminders_enabled: v })}
                />
            </div>
            <div className="flex items-center justify-between p-6 bg-muted/50  border border-border hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-warning/15 text-primary rounded-lg flex items-center justify-center">
                        <Shield className="w-6 h-6" />
                    </div>
                    <div>
                        <p className="font-bold text-foreground">Email booking reminders</p>
                        <p className="text-xs text-muted-foreground font-medium">Confirmation and reminder emails.</p>
                    </div>
                </div>
                <Switch
                    checked={prefs?.email_reminders_enabled !== false}
                    onCheckedChange={(v) => saveMutation.mutate({ email_reminders_enabled: v })}
                />
            </div>
        </>
    );
}

export default function AccountSettings() {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();

    useEffect(() => {
        const card = searchParams.get('card');
        if (card === 'success') {
            toast.success('Card saved successfully');
            queryClient.invalidateQueries({ queryKey: ['payment-methods'] });
        } else if (card === 'cancelled') {
            toast.info('Card setup cancelled');
        }
        if (card) {
            searchParams.delete('card');
            setSearchParams(searchParams, { replace: true });
        }
    }, [searchParams, setSearchParams, queryClient]);

    const { data: user, isLoading } = useQuery({
        queryKey: ['currentUser'],
        queryFn: () => sovereign.auth.me()
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
            const saved = loadPreferredLocation();
            form.reset({
                full_name: user.full_name || '',
                email: user.email || '',
                phone: user.phone || '',
                address: saved?.address || user.address || ''
            });
        }
    }, [user, form]);

    const updateProfileMutation = useMutation({
        mutationFn: async (data) => {
            await sovereign.entities.User.update(user.id, data).catch(() => null);
            if (data.phone !== undefined) {
                await sovereign.reminders.updatePreferences({ phone: data.phone || null });
            }
        },
        onSuccess: (_data, _variables) => {
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            toast.success("Profile updated successfully");
        },
        onError: (err) => toast.error(err.message || "Failed to update profile")
    });

    const handleLogout = async () => {
        await sovereign.auth.logout();
        window.location.href = '/';
    };

    if (isLoading) return <PageLoading message="Loading account..." />;

    if (!user) {
        return (
            <div className="w-full max-w-md lg:max-w-4xl mx-auto mt-20 text-center p-12 bg-card  shadow-elevation-lg border border-border">
                <Shield className="w-12 h-12 text-muted-foreground mx-auto mb-6" />
                <h2 className={cn(stb.uiHeading, 'text-2xl text-foreground mb-2')}>Session Expired</h2>
                <p className="text-muted-foreground mb-8 font-medium">Please sign in to access your account settings.</p>
                <Button onClick={() => window.location.href = '/login'} className="w-full h-12 rounded-lg bg-primary text-primary-foreground font-bold">Return to Login</Button>
            </div>
        );
    }

    return (
        <div className="stb-page lg:pb-8">
            <MetaTags title="Account Settings" description="Manage your personal profile, security, and preferences." />

            <PageHeader
                label="Account"
                title="My account"
                subtitle={`${user.role || 'Client'} • ID: ${user.id?.substring(0, 8)}`}
                compact
                variant="light"
                tier="app"
            >
                <ReplaySetupGuideLink />
                <Button variant="outline" onClick={handleLogout} className="h-12 px-6 border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/20 transition-all font-bold">
                    <LogOut className="w-4 h-4 mr-2" /> Sign Out
                </Button>
            </PageHeader>

            <PageContent>
            <Tabs defaultValue="profile" className="w-full">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                {/* Navigation Sidebar */}
                <div className="lg:col-span-3">
                    <TabsList className="flex flex-col bg-transparent w-full space-y-2 h-auto p-0">
                        <TabsTrigger value="profile" className="justify-start px-6 py-4 rounded-lg w-full data-[state=active]:bg-card data-[state=active]:shadow-elevation-lg data-[state=active]:border-border border border-transparent transition-all font-bold text-muted-foreground data-[state=active]:text-primary">
                            <User className="w-4 h-4 mr-3" /> Profile Info
                        </TabsTrigger>
                        <TabsTrigger value="shipping" className="justify-start px-6 py-4 rounded-lg w-full data-[state=active]:bg-card data-[state=active]:shadow-elevation-lg data-[state=active]:border-border border border-transparent transition-all font-bold text-muted-foreground data-[state=active]:text-primary">
                            <Truck className="w-4 h-4 mr-3" /> Shipping
                        </TabsTrigger>
                        <TabsTrigger value="preferences" className="justify-start px-6 py-4 rounded-lg w-full data-[state=active]:bg-card data-[state=active]:shadow-elevation-lg data-[state=active]:border-border border border-transparent transition-all font-bold text-muted-foreground data-[state=active]:text-primary">
                            <Bell className="w-4 h-4 mr-3" /> Notifications
                        </TabsTrigger>
                        <TabsTrigger value="security" className="justify-start px-6 py-4 rounded-lg w-full data-[state=active]:bg-card data-[state=active]:shadow-elevation-lg data-[state=active]:border-border border border-transparent transition-all font-bold text-muted-foreground data-[state=active]:text-primary">
                            <Shield className="w-4 h-4 mr-3" /> Login & Safety
                        </TabsTrigger>
                    </TabsList>
                </div>

                {/* Content Area */}
                <div className="lg:col-span-9">
                        <TabsContent value="profile" className="mt-0">
                            <Card className={cn(stb.panel, 'overflow-hidden border border-border p-0')}>
                                <CardHeader className="bg-primary border-none p-10 text-primary-foreground">
                                    <div className="flex items-center gap-6">
                                        <div className="w-20 h-20 bg-primary-foreground/20 border border-primary-foreground/30 flex items-center justify-center text-3xl font-semibold italic text-primary-foreground">
                                            {user.full_name?.charAt(0) || 'U'}
                                        </div>
                                        <div>
                                            <CardTitle className={cn(stb.uiHeading, 'text-2xl tracking-tight')}>{user.full_name}</CardTitle>
                                            <p className="text-primary-foreground/80 font-medium">{user.email}</p>
                                        </div>
                                    </div>
                                </CardHeader>
                                <CardContent className="p-10">
                                    <form onSubmit={form.handleSubmit((d) => {
                                                const { email: _e, address: _addressField, ...editable } = d;
                                                updateProfileMutation.mutate(editable);
                                            })} className="space-y-8">
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                            <div className="space-y-2">
                                                <Label className="text-foreground font-bold ml-1">Full Identity</Label>
                                                <Input {...form.register('full_name')} className="h-12 rounded-lg border-border bg-muted/50 focus:bg-card transition-colors text-foreground font-medium" />
                                                {form.formState.errors.full_name && <p className="text-destructive text-xs mt-1 font-bold">{form.formState.errors.full_name.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground font-bold ml-1">Secure Email</Label>
                                                <Input {...form.register('email')} className="h-12 rounded-lg border-border bg-muted cursor-not-allowed font-medium text-muted-foreground" disabled />
                                                <p className="text-xs text-muted-foreground font-medium ml-1">Managed by your sign-in provider. Change it in your account settings there.</p>
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground font-bold ml-1">Direct Phone</Label>
                                                <Input {...form.register('phone')} className="h-12 rounded-lg border-border bg-muted/50 focus:bg-card transition-colors font-medium text-foreground" placeholder="E.g. 5550123456" />
                                                {form.formState.errors.phone && <p className="text-destructive text-xs mt-1 font-bold">{form.formState.errors.phone.message}</p>}
                                            </div>
                                            <div className="space-y-2">
                                                <Label className="text-foreground font-bold ml-1">Preferred Location</Label>
                                                <div className="relative pl-0">
                                                    <AddressAutocomplete
                                                        value={form.watch('address') || ''}
                                                        onChange={(value) => form.setValue('address', value)}
                                                        onSelect={(item) => {
                                                            form.setValue('address', item.formatted_address);
                                                            savePreferredLocation({
                                                                address: item.formatted_address,
                                                                latitude: item.latitude,
                                                                longitude: item.longitude,
                                                            });
                                                        }}
                                                        placeholder="Home or work address"
                                                        inputClassName="h-12 rounded-lg border-border bg-muted/50 focus:bg-card pl-11 font-medium text-foreground"
                                                    />
                                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none z-10" />
                                                </div>
                                                <p className="text-xs text-muted-foreground font-medium ml-1">Used for nearby barbers, map distance, and booking defaults.</p>
                                            </div>
                                        </div>
                                        <div className="pt-6 border-t border-border flex justify-end">
                                            <Button type="submit" className={cn(stb.btn, 'h-12 px-10 transition-all active:scale-95')} disabled={updateProfileMutation.isPending}>
                                                {updateProfileMutation.isPending ? (
                                                    <><Loader className="w-4 h-4 mr-2 animate-spin" /> Syncing Details</>
                                                ) : 'Sync Profile'}
                                            </Button>
                                        </div>
                                    </form>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        <TabsContent value="shipping" className="mt-0">
                            <Card className={cn(stb.panel, 'p-10')}>
                                <h2 className={cn(stb.uiHeading, 'text-2xl text-foreground mb-2')}>Saved shipping addresses</h2>
                                <p className="text-muted-foreground font-medium mb-8">Manage addresses for marketplace checkout and order delivery.</p>
                                <SavedAddressesManager />
                            </Card>
                        </TabsContent>

                        <TabsContent value="preferences" className="mt-0">
                            <Card className={cn(stb.panel, 'p-10 space-y-8')}>
                                <div className="flex flex-wrap items-center justify-between gap-4">
                                    <div>
                                        <h2 className={cn(stb.uiHeading, 'text-2xl text-foreground mb-2')}>Alert Preferences</h2>
                                        <p className="text-muted-foreground font-medium">Control how and when you hear from us.</p>
                                    </div>
                                    <Link to={createPageUrl('NotificationSettings')} className="text-sm font-semibold text-primary hover:text-primary/80 inline-flex items-center gap-1">
                                        Full notification settings <ExternalLink className="w-3.5 h-3.5" />
                                    </Link>
                                </div>

                                <div className="space-y-4">
                                    <AccountNotificationPrefs user={user} />
                                </div>
                            </Card>
                        </TabsContent>

                        <TabsContent value="security" className="mt-0">
                            <Card className={cn(stb.panel, 'p-10 space-y-8')}>
                                <div>
                                    <h2 className={cn(stb.uiHeading, 'text-2xl text-foreground mb-2')}>Security & Identity</h2>
                                    <p className="text-muted-foreground font-medium">Manage your access and active sessions.</p>
                                </div>

                                <ClientPaymentMethodsPanel />

                                <div className="p-8 border-2 border-dashed border-border rounded-lg text-center">
                                    <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center mx-auto mb-6">
                                        <Key className="w-8 h-8 text-muted-foreground" />
                                    </div>
                                    <h3 className="text-xl font-bold text-foreground mb-2">Change Password</h3>
                                    <p className="text-muted-foreground text-sm max-w-xs mx-auto mb-8 font-medium">Upgrade your security level with a new robust password.</p>
                                    <Button variant="outline" className="h-12 px-8 rounded-lg border-border font-semibold hover:bg-muted">Reset credentials</Button>
                                </div>
                            </Card>
                        </TabsContent>
                </div>
            </div>
            </Tabs>
            </PageContent>
        </div>
    );
}

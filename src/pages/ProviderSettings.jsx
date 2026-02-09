import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { toast } from 'sonner';
import { MetaTags } from '@/components/seo/MetaTags';
import { Plus, AlertCircle, CheckCircle, Trash2, Edit3 } from 'lucide-react';
import ShopHoursEditor from '@/components/scheduling/ShopHoursEditor';
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { UserAvatar } from '@/components/ui/user-avatar';
import { shopDetailsSchema, serviceSchema, clientProfileSchema } from '@/lib/validations';

export default function ProviderSettings() {
    const queryClient = useQueryClient();
    const { data: user } = useQuery({ queryKey: ['currentUser'], queryFn: () => sovereign.auth.me() });

    // 1. Resolve Barber & Shop Context
    const { data: barber } = useQuery({
        queryKey: ['my-barber-profile', user?.email],
        queryFn: async () => {
            if (!user) return null;
            const barbers = await sovereign.entities.Barber.filter({ created_by: user.email });
            if (barbers.length > 0) return barbers[0];
            if (user.id) {
                const byUserId = await sovereign.entities.Barber.filter({ user_id: user.id });
                if (byUserId.length > 0) return byUserId[0];
            }
            return null;
        },
        enabled: !!user
    });

    const { data: myShopMembership } = useQuery({
        queryKey: ['my-shop-membership-settings', barber?.id],
        queryFn: async () => {
            if (!barber) return null;
            const members = await sovereign.entities.ShopMember.filter({ barber_id: barber.id });
            return members.find(m => ['owner', 'manager'].includes(m.role));
        },
        enabled: !!barber
    });

    const shopId = myShopMembership?.shop_id;
    const { data: myShop } = useQuery({
        queryKey: ['my-shop', shopId],
        queryFn: () => shopId ? sovereign.entities.Shop.get(shopId) : null,
        enabled: !!shopId
    });

    const { data: services = [] } = useQuery({
        queryKey: ['my-shop-services', shopId],
        queryFn: () => shopId ? sovereign.entities.Service.filter({ shop_id: shopId }) : [],
        enabled: !!shopId
    });

    const { data: _promotions = [] } = useQuery({
        queryKey: ['my-shop-promotions', shopId],
        queryFn: () => shopId ? sovereign.entities.PromoCode.filter({ is_active: true }) : [], // Filter logic simplified for demo
        enabled: !!shopId
    });

    // 2. Form States
    const [isServiceDialogOpen, setIsServiceDialogOpen] = useState(false);
    const [selectedService, setSelectedService] = useState(null);

    const profileForm = useForm({
        resolver: zodResolver(clientProfileSchema),
        defaultValues: { full_name: user?.full_name || '', email: user?.email || '', phone: user?.phone || '', address: user?.address || '' }
    });

    const businessForm = useForm({
        resolver: zodResolver(shopDetailsSchema),
        defaultValues: { name: '', location: '', description: '', phone: '' }
    });

    const serviceForm = useForm({
        resolver: zodResolver(serviceSchema),
        defaultValues: { name: '', category: 'Hair', price: 0, duration_min: 30, description: '' }
    });

    useEffect(() => {
        if (user) profileForm.reset({ full_name: user.full_name || '', email: user.email || '', phone: user.phone || '', address: user.address || '' });
    }, [user, profileForm]);

    useEffect(() => {
        if (myShop) businessForm.reset({
            name: myShop.name || '',
            location: myShop.location || '',
            description: myShop.description || '',
            phone: myShop.phone || ''
        });
    }, [myShop, businessForm]);

    // 3. Mutations
    const updateProfileMutation = useMutation({
        mutationFn: (data) => sovereign.entities.User.update(user.id, data),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['currentUser'] });
            toast.success("Profile updated");
        }
    });

    const updateShopMutation = useMutation({
        mutationFn: (data) => shopId ? sovereign.entities.Shop.update(shopId, data) : sovereign.entities.Shop.create({ ...data, owner_id: user.id }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-shop'] });
            toast.success("Shop details saved");
        }
    });

    const saveServiceMutation = useMutation({
        mutationFn: (data) => selectedService ? sovereign.entities.Service.update(selectedService.id, data) : sovereign.entities.Service.create({ ...data, shop_id: shopId }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-shop-services'] });
            setIsServiceDialogOpen(false);
            setSelectedService(null);
            serviceForm.reset();
            toast.success("Service saved");
        }
    });

    const deleteServiceMutation = useMutation({
        mutationFn: (id) => sovereign.entities.Service.delete(id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-shop-services'] });
            toast.success("Service removed");
        }
    });

    const checkStripeStatusMutation = useMutation({
        mutationFn: () => sovereign.functions.invoke('checkStripeConnectStatus', { userId: user?.id }),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['currentUser'] })
    });

    const initiateStripeMutation = useMutation({
        mutationFn: () => sovereign.functions.invoke('initiateStripeConnect', { userId: user?.id }),
        onSuccess: (data) => { if (data.data?.url) window.location.href = data.data.url; }
    });

    const handleServiceEdit = (svc) => {
        setSelectedService(svc);
        serviceForm.reset({
            name: svc.name,
            category: svc.category,
            price: svc.price,
            duration_min: svc.duration_min,
            description: svc.description || ''
        });
        setIsServiceDialogOpen(true);
    };

    return (
        <div className="max-w-7xl mx-auto px-4 md:px-6 lg:px-8 py-8">
            <MetaTags title="Provider Settings" description="Manage your professional shop profile and account." />

            <div className="flex items-center justify-between mb-8">
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight">Console Settings</h1>
                    <p className="text-muted-foreground font-medium">Configure your professional presence and financial rails.</p>
                </div>
                <UserAvatar src={user?.avatar_url} name={user?.full_name} className="w-12 h-12 border-2 border-slate-100 shadow-sm" />
            </div>

            <Tabs defaultValue="general" className="w-full">
                <TabsList className="bg-slate-100/50 p-1.5 rounded-2xl mb-8 flex-wrap">
                    <TabsTrigger value="general" className="rounded-xl px-5">General</TabsTrigger>
                    <TabsTrigger value="business" className="rounded-xl px-5">Business</TabsTrigger>
                    <TabsTrigger value="services" className="rounded-xl px-5">Services</TabsTrigger>
                    <TabsTrigger value="hours" className="rounded-xl px-5">Hours</TabsTrigger>
                    <TabsTrigger value="payments" className="rounded-xl px-5">Payments</TabsTrigger>
                    <TabsTrigger value="notifications" className="rounded-xl px-5">Alerts</TabsTrigger>
                </TabsList>

                {/* GENERAL PROFILE */}
                <TabsContent value="general">
                    <Card className="border-slate-200 shadow-sm rounded-3xl overflow-hidden bg-white">
                        <CardHeader className="border-b border-border">
                            <CardTitle className="text-xl font-bold">Personal Profile</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={profileForm.handleSubmit((d) => updateProfileMutation.mutate(d))} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700">Display Name</Label>
                                        <Input {...profileForm.register('full_name')} className="rounded-xl border-slate-200 hover:border-slate-300 transition-colors" />
                                        {profileForm.formState.errors.full_name && <p className="text-red-500 text-xs mt-1">{profileForm.formState.errors.full_name.message}</p>}
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700">Email Address</Label>
                                        <Input {...profileForm.register('email')} className="rounded-xl border-slate-200" disabled />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700">Phone</Label>
                                        <Input {...profileForm.register('phone')} className="rounded-xl border-slate-200" placeholder="10 digits number" />
                                    </div>
                                </div>
                                <div className="pt-4 border-t border-border flex justify-end">
                                    <Button type="submit" className="rounded-xl px-8 font-bold shadow-lg" disabled={updateProfileMutation.isPending}>
                                        {updateProfileMutation.isPending ? 'Syncing...' : 'Update Profile'}
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* BUSINESS INFO */}
                <TabsContent value="business">
                    <Card className="border-slate-200 shadow-sm rounded-3xl bg-white">
                        <CardHeader className="border-b border-border">
                            <CardTitle className="text-xl font-bold">Shop Identity</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8">
                            <form onSubmit={businessForm.handleSubmit((d) => updateShopMutation.mutate(d))} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700">Shop Name</Label>
                                        <Input {...businessForm.register('name')} className="rounded-xl border-slate-200" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700">Physical Address</Label>
                                        <Input {...businessForm.register('location')} className="rounded-xl border-slate-200" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700">Public Description</Label>
                                    <textarea {...businessForm.register('description')} className="w-full min-h-[120px] rounded-2xl border-border border p-4 text-sm focus:ring-2 focus:ring-primary outline-none" placeholder="Tell your clients about your vibe..." />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <Button type="submit" className="rounded-xl px-8 font-bold" disabled={updateShopMutation.isPending}>
                                        Save Changes
                                    </Button>
                                </div>
                            </form>
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* SERVICES MENU */}
                <TabsContent value="services">
                    <Card className="border-slate-200 shadow-sm rounded-3xl bg-white">
                        <CardHeader className="flex flex-row items-center justify-between p-8">
                            <div>
                                <CardTitle className="text-xl font-bold">Service Menu</CardTitle>
                                <p className="text-muted-foreground text-sm mt-1">Manage what you offer and for how much.</p>
                            </div>
                            <Button onClick={() => { setSelectedService(null); serviceForm.reset(); setIsServiceDialogOpen(true); }} className="rounded-xl bg-primary text-primary-foreground font-bold">
                                <Plus className="w-4 h-4 mr-2" /> Add Service
                            </Button>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {services.length > 0 ? services.map((svc) => (
                                    <div key={svc.id} className="group p-5 border border-border rounded-2xl flex items-center justify-between hover:border-primary/30 hover:shadow-sm transition-all bg-muted/30">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 rounded-xl bg-card border border-border flex items-center justify-center font-bold text-muted-foreground group-hover:text-primary">
                                                {svc.category?.charAt(0) || 'S'}
                                            </div>
                                            <div>
                                                <p className="font-bold text-foreground">{svc.name}</p>
                                                <p className="text-[11px] text-muted-foreground font-bold uppercase">{svc.duration_min}m • ${svc.price}</p>
                                            </div>
                                        </div>
                                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <Button variant="ghost" size="icon" onClick={() => handleServiceEdit(svc)} className="h-9 w-9 rounded-full hover:bg-white border border-transparent hover:border-slate-100">
                                                <Edit3 className="w-4 h-4 text-muted-foreground" />
                                            </Button>
                                            <Button variant="ghost" size="icon" onClick={() => deleteServiceMutation.mutate(svc.id)} className="h-9 w-9 rounded-full hover:bg-red-50 border border-transparent hover:border-red-100">
                                                <Trash2 className="w-4 h-4 text-red-400" />
                                            </Button>
                                        </div>
                                    </div>
                                )) : (
                                    <div className="col-span-full py-12 flex flex-col items-center justify-center border border-dashed border-slate-200 rounded-3xl text-slate-400 font-medium">
                                        No services yet. Define your first service.
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>

                    <Dialog open={isServiceDialogOpen} onOpenChange={setIsServiceDialogOpen}>
                        <DialogContent className="rounded-3xl border-none shadow-2xl p-0 overflow-hidden max-w-md">
                            <div className="bg-primary p-8 text-primary-foreground">
                                <h2 className="text-2xl font-black">{selectedService ? 'Update' : 'Add'} Service</h2>
                                <p className="text-slate-400 text-sm">Define pricing and duration for this offering.</p>
                            </div>
                            <form onSubmit={serviceForm.handleSubmit((d) => saveServiceMutation.mutate(d))} className="p-8 space-y-5 bg-white">
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700">Display Name</Label>
                                    <Input {...serviceForm.register('name')} placeholder="e.g. Sharp Cut" className="rounded-xl" />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700">Price ($)</Label>
                                        <Input {...serviceForm.register('price', { valueAsNumber: true })} type="number" className="rounded-xl" />
                                    </div>
                                    <div className="space-y-2">
                                        <Label className="font-bold text-slate-700">Duration (Min)</Label>
                                        <Input {...serviceForm.register('duration_min', { valueAsNumber: true })} type="number" className="rounded-xl" />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <Label className="font-bold text-slate-700">Category</Label>
                                    <select {...serviceForm.register('category')} className="w-full rounded-xl border-slate-200 border p-2 text-sm outline-none">
                                        <option value="Hair">Hair</option>
                                        <option value="Beard">Beard</option>
                                        <option value="Shave">Shave</option>
                                        <option value="Kids">Kids</option>
                                    </select>
                                </div>
                                <Button type="submit" className="w-full rounded-xl h-12 bg-primary text-primary-foreground font-bold tracking-tight" disabled={saveServiceMutation.isPending}>
                                    {saveServiceMutation.isPending ? 'Processing...' : (selectedService ? 'Update Service' : 'Confirm Service')}
                                </Button>
                            </form>
                        </DialogContent>
                    </Dialog>
                </TabsContent>

                {/* PAYMENTS & STRIPE */}
                <TabsContent value="payments">
                    <Card className="border-slate-200 shadow-sm rounded-3xl bg-white">
                        <CardHeader className="p-8 pb-4">
                            <CardTitle className="text-xl font-bold">Financial Rails</CardTitle>
                        </CardHeader>
                        <CardContent className="p-8 pt-0">
                            {user?.stripe_account_id ? (
                                <div className={`p-6 rounded-2xl border transition-colors ${user.stripe_connect_status === 'active' ? 'bg-primary/5 border-primary/20' : 'bg-amber-50/50 border-amber-100'}`}>
                                    <div className="flex items-start gap-4">
                                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${user.stripe_connect_status === 'active' ? 'bg-primary text-primary-foreground' : 'bg-amber-500 text-white'}`}>
                                            {user.stripe_connect_status === 'active' ? <CheckCircle className="w-6 h-6" /> : <AlertCircle className="w-6 h-6" />}
                                        </div>
                                        <div className="flex-1">
                                            <h4 className={`text-lg font-bold ${user.stripe_connect_status === 'active' ? 'text-primary' : 'text-amber-900'}`}>
                                                {user.stripe_connect_status === 'active' ? 'Payment Engine Active' : 'Account Onboarding'}
                                            </h4>
                                            <p className={`text-sm font-medium ${user.stripe_connect_status === 'active' ? 'text-primary/90' : 'text-amber-700'}`}>
                                                {user.stripe_connect_status === 'active'
                                                    ? 'Your bank account is successfully linked and verified.'
                                                    : 'Your account setup is incomplete. Complete onboarding to receive payouts.'}
                                            </p>
                                        </div>
                                        <Button variant="outline" onClick={() => checkStripeStatusMutation.mutate()} className="rounded-xl font-bold" disabled={checkStripeStatusMutation.isPending}>
                                            Refetch Status
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-10 text-center border-2 border-dashed border-slate-100 rounded-3xl">
                                    <div className="w-16 h-16 bg-muted flex items-center justify-center rounded-3xl mx-auto mb-6 text-muted-foreground">
                                        <AlertCircle className="w-8 h-8" />
                                    </div>
                                    <h3 className="text-2xl font-black text-foreground mb-2">Setup Payouts</h3>
                                    <p className="text-muted-foreground max-w-sm mx-auto mb-8 font-medium">Link your bank account via Stripe to accept automatic credit card payments from clients.</p>
                                    <Button onClick={() => initiateStripeMutation.mutate()} className="bg-primary text-primary-foreground rounded-2xl h-14 px-10 font-bold transition-transform active:scale-95" disabled={initiateStripeMutation.isPending}>
                                        <CheckCircle className="w-5 h-5 mr-3" /> Connect Stripe Account
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* OPENING HOURS */}
                <TabsContent value="hours">
                    <Card className="border-slate-200 shadow-sm rounded-3xl bg-white">
                        <CardHeader className="p-8">
                            <CardTitle className="text-xl font-bold">Standard Availability</CardTitle>
                            <p className="text-muted-foreground text-sm mt-1">Define your weekly operating routine.</p>
                        </CardHeader>
                        <CardContent className="px-8 pb-8">
                            {shopId && barber?.id && <ShopHoursEditor shopId={shopId} barberId={barber.id} />}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    );
}
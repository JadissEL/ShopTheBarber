import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Trash2, Clock, DollarSign } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { FormField } from '@/components/ui/form-field';
import { serviceSchema } from '@/components/schemas';

export default function ServiceSetup({ shopId, onNext, onBack, context = 'shop', barberId }) {
    const queryClient = useQueryClient();

    const form = useForm({
        resolver: zodResolver(serviceSchema),
        defaultValues: {
            name: '',
            price_text: '',
            duration_text: '',
            category: 'Haircuts'
        }
    });

    const { data: services = [] } = useQuery({
        queryKey: ['services', shopId, context, barberId],
        queryFn: async () => {
            if (context === 'independent' && barberId) {
                return sovereign.entities.Service.filter({ barber_id: barberId });
            }
            return shopId ? sovereign.entities.Service.filter({ shop_id: shopId }) : [];
        },
        enabled: !!(shopId || (context === 'independent' && barberId))
    });


    const createServiceMutation = useMutation({
        mutationFn: (data) => {
            const payload = {
                name: data.name,
                category: data.category,
                price: parseFloat(data.price_text),
                duration_minutes: parseInt(data.duration_text),
                image_url: "https://images.unsplash.com/photo-1621605815971-fbc98d6d4e84?w=400&auto=format&fit=crop"
            };
            if (context === 'independent') payload.barber_id = barberId;
            else payload.shop_id = shopId;

            return sovereign.entities.Service.create(payload);
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['services'] });
            form.reset();
        }
    });

    const deleteServiceMutation = useMutation({
        mutationFn: (id) => sovereign.entities.Service.delete(id),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: ['services'] })
    });

    const onSubmit = (data) => {
        if (context === 'shop' && !shopId) return;
        if (context === 'independent' && !barberId) return;
        createServiceMutation.mutate(data);
    };

    const handleContinue = () => {
        // Allow continuing even if no services are added (though ideally should validate)
        onNext();
    };

    return (
        <div className="space-y-6">
            <div className="text-center mb-8">
                <h2 className="text-2xl font-bold mb-2">Add Your Services</h2>
                <p className="text-gray-400">List the main services you offer. You can add more later.</p>
            </div>

            <div className="bg-[#1A1D24] p-6 rounded-xl border border-white/10">
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="name"
                            label="Service Name"
                            render={(field) => (
                                <Input {...field} placeholder="e.g. Skin Fade" className="bg-slate-950 border-white/10 text-white" />
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="category"
                            label="Category"
                            render={(field) => (
                                <Input {...field} placeholder="e.g. Hair" className="bg-slate-950 border-white/10 text-white" />
                            )}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="price_text"
                            label="Price"
                            render={(field) => (
                                <Input {...field} placeholder="35" type="number" className="bg-slate-950 border-white/10 text-white" />
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="duration_text"
                            label="Duration (min)"
                            render={(field) => (
                                <Input {...field} placeholder="45" type="number" className="bg-slate-950 border-white/10 text-white" />
                            )}
                        />
                    </div>
                    <Button type="submit" disabled={createServiceMutation.isPending || (context === 'shop' && !shopId) || (context === 'independent' && !barberId)} className="w-full bg-slate-800 hover:bg-slate-700 text-white">
                        {createServiceMutation.isPending ? 'Adding...' : 'Add Service'}
                    </Button>
                </form>
            </div>

            <div className="space-y-3">
                {services.map(service => (
                    <div key={service.id} className="bg-[#1A1D24] p-4 rounded-xl border border-white/5 flex justify-between items-center">
                        <div>
                            <h3 className="font-bold text-white">{service.name}</h3>
                            <div className="flex gap-3 text-sm text-gray-400">
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {service.duration_min || service.duration_text}m</span>
                                <span className="flex items-center gap-1"><DollarSign className="w-3 h-3" /> {service.price || service.price_text}</span>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => deleteServiceMutation.mutate(service.id)}
                            className="text-red-400 hover:text-red-300 hover:bg-red-500/10"
                        >
                            <Trash2 className="w-4 h-4" />
                        </Button>
                    </div>
                ))}
                {services.length === 0 && (
                    <div className="text-center py-8 text-gray-500 border border-dashed border-white/10 rounded-xl">
                        No services added yet.
                    </div>
                )}
            </div>

            <div className="flex justify-between pt-4">
                <Button variant="ghost" onClick={onBack} className="text-gray-400 hover:text-white">
                    Back
                </Button>
                <Button onClick={handleContinue} className="bg-emerald-500 hover:bg-emerald-600 text-white px-8" disabled={services.length === 0}>
                    Continue
                </Button>
            </div>
        </div>
    );
}

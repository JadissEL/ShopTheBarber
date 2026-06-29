import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { MapPin } from 'lucide-react';
import { toast } from 'sonner';
import { cityLandingUrl } from '@/lib/seoUtils';
import AddressAutocomplete from '@/components/maps/AddressAutocomplete';

const CUSTOM_CITY = '__custom__';

export default function ProviderSeoLocationPanel({ barber }) {
    const queryClient = useQueryClient();

    const { data: catalog } = useQuery({
        queryKey: ['seo-cities-catalog'],
        queryFn: () => sovereign.seo.listCities(),
        staleTime: 60_000 * 30,
    });

    const seoCities = catalog?.cities ?? [];
    const curatedNames = seoCities.map((c) => c.name);

    const form = useForm({
        defaultValues: {
            city: '',
            location: '',
            citySelect: CUSTOM_CITY,
        },
    });

    const citySelect = form.watch('citySelect');

    useEffect(() => {
        if (!barber) return;
        const city = barber.city || '';
        const isCurated = curatedNames.includes(city);
        form.reset({
            city,
            location: barber.location || '',
            citySelect: city ? (isCurated ? city : CUSTOM_CITY) : '',
        });
    }, [barber, form, curatedNames.join('|')]);

    const saveMutation = useMutation({
        mutationFn: (data) => {
            const city =
                data.citySelect && data.citySelect !== CUSTOM_CITY
                    ? data.citySelect
                    : data.city?.trim() || null;
            return sovereign.entities.Barber.update(barber.id, {
                city,
                location: data.location?.trim() || null,
            });
        },
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['my-barber-profile'] });
            toast.success('Location saved, you may appear on city landing pages');
        },
        onError: (err) => toast.error(err.message || 'Failed to save location'),
    });

    if (!barber) return null;

    const previewSlug = seoCities.find((c) => c.name === (form.watch('citySelect') !== CUSTOM_CITY ? form.watch('citySelect') : form.watch('city')))?.slug;

    return (
        <div className="space-y-6">
            <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-primary/10 text-primary">
                    <MapPin className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="text-lg font-bold text-foreground">Discoverability & city pages</h3>
                    <p className="text-sm text-muted-foreground mt-1 max-w-xl">
                        Set your primary city so clients find you on local SEO pages like Paris, London, or Athens.
                    </p>
                </div>
            </div>

            <form onSubmit={form.handleSubmit((d) => saveMutation.mutate(d))} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <Label className="font-bold text-foreground/90">Primary city</Label>
                    <Select
                        value={citySelect || ''}
                        onValueChange={(v) => {
                            form.setValue('citySelect', v);
                            if (v !== CUSTOM_CITY) form.setValue('city', v);
                        }}
                    >
                        <SelectTrigger className="rounded-xl">
                            <SelectValue placeholder="Choose a featured city" />
                        </SelectTrigger>
                        <SelectContent>
                            {seoCities.map((c) => (
                                <SelectItem key={c.slug} value={c.name}>
                                    {c.name} ({c.barber_count} barbers)
                                </SelectItem>
                            ))}
                            <SelectItem value={CUSTOM_CITY}>Other / custom city</SelectItem>
                        </SelectContent>
                    </Select>
                    {citySelect === CUSTOM_CITY && (
                        <Input
                            {...form.register('city')}
                            placeholder="e.g. Thessaloniki"
                            className="rounded-xl mt-2"
                        />
                    )}
                </div>
                <div className="space-y-2">
                    <Label className="font-bold text-foreground/90">Neighborhood or full address</Label>
                    <AddressAutocomplete
                        value={form.watch('location') || ''}
                        onChange={(value) => form.setValue('location', value)}
                        placeholder="Paris, Le Marais"
                        inputClassName="rounded-xl h-11"
                    />
                </div>
                <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-4 pt-2 border-t border-border">
                    {previewSlug ? (
                        <a
                            href={cityLandingUrl(previewSlug)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary font-medium hover:underline"
                        >
                            Preview {form.watch('citySelect') !== CUSTOM_CITY ? form.watch('citySelect') : form.watch('city')} city page
                        </a>
                    ) : (
                        <span className="text-sm text-muted-foreground">Pick a featured city to preview your landing page.</span>
                    )}
                    <Button type="submit" className="rounded-xl px-8 font-bold" disabled={saveMutation.isPending}>
                        {saveMutation.isPending ? 'Saving…' : 'Save location'}
                    </Button>
                </div>
            </form>
        </div>
    );
}

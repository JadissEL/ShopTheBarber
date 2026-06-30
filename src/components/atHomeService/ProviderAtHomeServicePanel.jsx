import { useState, useEffect } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { MapPin, Plus, Trash2, Navigation } from 'lucide-react';
import ServiceRadiusMap from '@/components/atHomeService/ServiceRadiusMap';
import AddressAutocomplete from '@/components/maps/AddressAutocomplete';

function ZoneEditor({ zones, onChange, radiusKm }) {
    const updateZone = (index, patch) => {
        const next = zones.map((z, i) => (i === index ? { ...z, ...patch } : z));
        onChange(next);
    };

    const addZone = () => {
        const last = zones[zones.length - 1];
        const min = last ? last.max_distance_km : 0;
        const max = Math.min(min + 10, radiusKm);
        onChange([
            ...zones,
            {
                label: `${min}-${max} km`,
                min_distance_km: min,
                max_distance_km: max,
                fee_amount: 0,
                sort_order: zones.length,
            },
        ]);
    };

    return (
        <div className="space-y-3">
            {zones.map((zone, index) => (
                <div
                    key={`zone-${index}`}
                    className="grid grid-cols-1 sm:grid-cols-[1fr_80px_80px_80px_auto] gap-2 items-end rounded-lg border border-border p-3 bg-muted/20"
                >
                    <div>
                        <Label className="text-xs">Label</Label>
                        <Input
                            value={zone.label}
                            onChange={(e) => updateZone(index, { label: e.target.value })}
                            className="h-9"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Min km</Label>
                        <Input
                            type="number"
                            min={0}
                            step={0.1}
                            value={zone.min_distance_km}
                            onChange={(e) =>
                                updateZone(index, { min_distance_km: Number(e.target.value) })
                            }
                            className="h-9"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Max km</Label>
                        <Input
                            type="number"
                            min={0}
                            step={0.1}
                            value={zone.max_distance_km}
                            onChange={(e) =>
                                updateZone(index, { max_distance_km: Number(e.target.value) })
                            }
                            className="h-9"
                        />
                    </div>
                    <div>
                        <Label className="text-xs">Fee $</Label>
                        <Input
                            type="number"
                            min={0}
                            step={1}
                            value={zone.fee_amount}
                            onChange={(e) => updateZone(index, { fee_amount: Number(e.target.value) })}
                            className="h-9"
                        />
                    </div>
                    <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => onChange(zones.filter((_, i) => i !== index))}
                        disabled={zones.length <= 1}
                    >
                        <Trash2 className="w-4 h-4" />
                    </Button>
                </div>
            ))}
            <Button type="button" variant="outline" size="sm" onClick={addZone} className="gap-1">
                <Plus className="w-4 h-4" /> Add zone
            </Button>
        </div>
    );
}

function AtHomeAreaForm({ title, description, area, defaultZones, onSave, isSaving, mobileEnabled }) {
    const [baseAddress, setBaseAddress] = useState(area?.base_address ?? '');
    const [baseLat, setBaseLat] = useState(area?.base_latitude ?? null);
    const [baseLng, setBaseLng] = useState(area?.base_longitude ?? null);
    const [radiusKm, setRadiusKm] = useState(area?.service_radius_km ?? 25);
    const [feesEnabled, setFeesEnabled] = useState(area?.travel_fees_enabled ?? false);
    const [zones, setZones] = useState(
        area?.zones?.length ? area.zones : defaultZones ?? []
    );

    useEffect(() => {
        if (!area) return;
        setBaseAddress(area.base_address ?? '');
        setBaseLat(area.base_latitude ?? null);
        setBaseLng(area.base_longitude ?? null);
        setRadiusKm(area.service_radius_km ?? 25);
        setFeesEnabled(area.travel_fees_enabled ?? false);
        if (area.zones?.length) setZones(area.zones);
    }, [area?.id, area?.base_address, area?.base_latitude, area?.base_longitude, area?.service_radius_km, area?.travel_fees_enabled, area?.zones]);

    const geocodeMutation = useMutation({
        mutationFn: (address) => sovereign.atHomeService.geocode(address),
        onSuccess: (data) => {
            setBaseLat(data.latitude);
            setBaseLng(data.longitude);
            setBaseAddress(data.formatted_address);
            toast.success('Base location found');
        },
        onError: (e) => toast.error(e.message),
    });

    if (!mobileEnabled) {
        return (
            <div className=" border border-border bg-muted/20 p-4 text-sm text-muted-foreground">
                Enable at-home visits in service location settings to configure travel zones for {title}.
            </div>
        );
    }

    const handleSave = () => {
        onSave({
            base_address: baseAddress,
            base_latitude: baseLat,
            base_longitude: baseLng,
            service_radius_km: radiusKm,
            travel_fees_enabled: feesEnabled,
            zones,
        });
    };

    return (
        <div className="space-y-5">
            <div>
                <h4 className="font-bold text-foreground">{title}</h4>
                {description && <p className="text-sm text-muted-foreground mt-1">{description}</p>}
            </div>

            <div className="space-y-2">
                <Label className="flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Base location (where you travel from)
                </Label>
                <div className="flex gap-2">
                    <AddressAutocomplete
                        value={baseAddress}
                        onChange={setBaseAddress}
                        onSelect={(item) => {
                            setBaseLat(item.latitude);
                            setBaseLng(item.longitude);
                            setBaseAddress(item.formatted_address);
                        }}
                        placeholder="Street, city, postal code…"
                    />
                    <Button
                        type="button"
                        variant="secondary"
                        disabled={geocodeMutation.isPending || !baseAddress.trim()}
                        onClick={() => geocodeMutation.mutate(baseAddress.trim())}
                    >
                        <Navigation className="w-4 h-4" />
                    </Button>
                </div>
            </div>

            <div className="space-y-2">
                <Label>Service radius: {radiusKm} km</Label>
                <input
                    type="range"
                    min={5}
                    max={100}
                    step={1}
                    value={radiusKm}
                    onChange={(e) => setRadiusKm(Number(e.target.value))}
                    className="w-full accent-primary"
                />
                <p className="text-xs text-muted-foreground">
                    Clients outside this radius cannot book at-home visits.
                </p>
            </div>

            <ServiceRadiusMap
                baseLatitude={baseLat}
                baseLongitude={baseLng}
                serviceRadiusKm={radiusKm}
            />

            <div className="flex items-center justify-between rounded-lg border border-border p-4 bg-muted/20">
                <div>
                    <p className="font-bold">Travel fees by zone</p>
                    <p className="text-sm text-muted-foreground">
                        Charge extra based on distance from your base (at-home bookings only).
                    </p>
                </div>
                <Switch checked={feesEnabled} onCheckedChange={setFeesEnabled} />
            </div>

            {feesEnabled && (
                <ZoneEditor zones={zones} onChange={setZones} radiusKm={radiusKm} />
            )}

            <Button type="button" onClick={handleSave} disabled={isSaving} className="rounded-full">
                {isSaving ? 'Saving…' : 'Save at-home coverage'}
            </Button>
        </div>
    );
}

export function ProviderAtHomeServicePanel() {
    const queryClient = useQueryClient();

    const { data, isLoading } = useQuery({
        queryKey: ['provider-at-home-service'],
        queryFn: () => sovereign.atHomeService.getMySettings(),
    });

    const barberMutation = useMutation({
        mutationFn: (payload) => sovereign.atHomeService.updateBarber(payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider-at-home-service'] });
            toast.success('At-home coverage saved');
        },
        onError: (e) => toast.error(e.message),
    });

    const shopMutation = useMutation({
        mutationFn: ({ shopId, payload }) => sovereign.atHomeService.updateShop(shopId, payload),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['provider-at-home-service'] });
            toast.success('Shop at-home coverage saved');
        },
        onError: (e) => toast.error(e.message),
    });

    if (isLoading) {
        return <p className="text-sm text-muted-foreground">Loading at-home service settings…</p>;
    }

    const barber = data?.barber;
    const shop = data?.shop;
    const defaults = data?.default_zones ?? [];

    const showBarber = barber?.offers_mobile_service;
    const showShop = shop?.offers_mobile_service;

    if (!showBarber && !showShop) {
        return (
            <p className="text-sm text-muted-foreground rounded-lg border border-border bg-muted/20 p-4">
                At-home travel zones apply only when you offer at-home visits. Enable at-home service in
                &ldquo;Where you serve clients&rdquo; above.
            </p>
        );
    }

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-bold text-foreground">At-home travel zones</h3>
                <p className="text-sm text-muted-foreground mt-1">
                    Set your service radius, geocode your base, and charge travel fees by distance. Applies
                    only to at-home bookings, not in-shop visits.
                </p>
            </div>

            {showShop && shop?.id && (
                <AtHomeAreaForm
                    title={shop.name ? `${shop.name}, at-home coverage` : 'Shop at-home coverage'}
                    description="Used when clients book at-home service through your shop."
                    area={shop.area}
                    defaultZones={defaults}
                    mobileEnabled={shop.offers_mobile_service}
                    isSaving={shopMutation.isPending}
                    onSave={(payload) => shopMutation.mutate({ shopId: shop.id, payload })}
                />
            )}

            {showBarber && (
                <AtHomeAreaForm
                    title={shop?.id ? 'Your personal at-home coverage' : 'Your at-home coverage'}
                    description={
                        shop?.id
                            ? 'Used for independent at-home bookings outside the shop.'
                            : 'Define where you travel and what you charge.'
                    }
                    area={barber?.area}
                    defaultZones={defaults}
                    mobileEnabled={barber?.offers_mobile_service}
                    isSaving={barberMutation.isPending}
                    onSave={(payload) => barberMutation.mutate(payload)}
                />
            )}
        </div>
    );
}

export default ProviderAtHomeServicePanel;

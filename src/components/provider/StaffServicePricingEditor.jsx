import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { toast } from 'sonner';

/**
 * Per-barber service pricing, duration, and enable/disable toggles.
 */
export default function StaffServicePricingEditor({ shopId, memberId, memberName }) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState({});

  const { data: services = [] } = useQuery({
    queryKey: ['shop-services', shopId],
    queryFn: () => sovereign.entities.Service.filter({ shop_id: shopId }),
    enabled: !!shopId,
  });

  const { data: member, isLoading } = useQuery({
    queryKey: ['team-member', shopId, memberId],
    queryFn: () => sovereign.shop.getTeamMember(shopId, memberId),
    enabled: !!shopId && !!memberId,
  });

  const configsByService = {};
  (member?.staff_configs ?? []).forEach((c) => {
    if (c.service_id) configsByService[c.service_id] = c;
  });

  const saveMutation = useMutation({
    mutationFn: () => {
      const configs = services.map((svc) => {
        const existing = configsByService[svc.id];
        const d = draft[svc.id] ?? {};
        const isEnabled = d.is_enabled !== undefined ? d.is_enabled : (existing?.is_enabled !== false);
        const customPrice = d.custom_price !== undefined
          ? (d.custom_price === '' ? null : Number(d.custom_price))
          : (existing?.custom_price ?? null);
        const customDuration = d.custom_duration !== undefined
          ? (d.custom_duration === '' ? null : Number(d.custom_duration))
          : (existing?.custom_duration ?? null);
        return {
          service_id: svc.id,
          is_enabled: isEnabled,
          custom_price: customPrice,
          custom_duration: customDuration,
        };
      });
      return sovereign.shop.updateMemberServices(shopId, memberId, configs);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['team-member'] });
      queryClient.invalidateQueries({ queryKey: ['shop-team'] });
      setDraft({});
      toast.success('Service settings saved');
    },
    onError: (e) => toast.error(e.message),
  });

  if (isLoading) return <p className="text-sm text-muted-foreground p-4">Loading services…</p>;

  return (
    <Card className=" border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-bold">Services & pricing, {memberName}</CardTitle>
        <p className="text-xs text-muted-foreground">
          Override default menu prices and durations for this barber. Disabled services won&apos;t appear at booking.
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {services.length === 0 ? (
          <p className="text-sm text-muted-foreground">Add services in Settings Services first.</p>
        ) : (
          services.map((svc) => {
            const cfg = configsByService[svc.id];
            const d = draft[svc.id] ?? {};
            const enabled = d.is_enabled !== undefined ? d.is_enabled : (cfg?.is_enabled !== false);
            const price = d.custom_price !== undefined ? d.custom_price : (cfg?.custom_price ?? '');
            const duration = d.custom_duration !== undefined ? d.custom_duration : (cfg?.custom_duration ?? '');

            return (
              <div
                key={svc.id}
                className={`flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-lg border ${enabled ? 'bg-card border-border' : 'bg-muted/50 border-border opacity-70'}`}
              >
                <div className="flex-1 min-w-0">
                  <p className="font-bold text-sm truncate">{svc.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Default: ${svc.price}, {svc.duration_minutes ?? svc.duration_min} min
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch
                    checked={enabled}
                    onCheckedChange={(val) => setDraft((prev) => ({ ...prev, [svc.id]: { ...prev[svc.id], is_enabled: val } }))}
                  />
                  <span className="text-xs font-bold w-8">{enabled ? 'ON' : 'OFF'}</span>
                </div>
                <div className="flex gap-2">
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Price $</Label>
                    <Input
                      type="number"
                      min={0}
                      step={0.01}
                      placeholder={String(svc.price)}
                      value={price}
                      disabled={!enabled}
                      className="w-24 h-9 rounded-lg"
                      onChange={(e) => setDraft((prev) => ({ ...prev, [svc.id]: { ...prev[svc.id], custom_price: e.target.value } }))}
                    />
                  </div>
                  <div>
                    <Label className="text-[10px] uppercase text-muted-foreground">Min</Label>
                    <Input
                      type="number"
                      min={5}
                      placeholder={String(svc.duration_minutes ?? svc.duration_min ?? 30)}
                      value={duration}
                      disabled={!enabled}
                      className="w-20 h-9 rounded-lg"
                      onChange={(e) => setDraft((prev) => ({ ...prev, [svc.id]: { ...prev[svc.id], custom_duration: e.target.value } }))}
                    />
                  </div>
                </div>
              </div>
            );
          })
        )}
        {services.length > 0 && (
          <Button
            className="w-full rounded-lg font-bold mt-2"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? 'Saving…' : 'Save service settings'}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}

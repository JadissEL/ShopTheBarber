import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Users, Plus, Minus } from 'lucide-react';

export default function GroupBookingPartyPanel({
    capabilities,
    guests,
    onGuestsChange,
    groupEventLabel,
    onGroupEventLabelChange,
    groupQuote,
}) {
    if (!capabilities?.offers_group_booking) return null;

    const min = capabilities.min_party ?? 2;
    const max = capabilities.max_party ?? 8;

    const setPartySize = (size) => {
        const next = Math.max(min, Math.min(max, size));
        const updated = [...guests];
        while (updated.length < next) {
            updated.push({ guest_name: '' });
        }
        while (updated.length > next) updated.pop();
        onGuestsChange(updated);
    };

    return (
        <div className="rounded-2xl border border-violet-200 bg-violet-50/50 p-6 space-y-5">
            <div>
                <h3 className="font-bold text-lg flex items-center gap-2 text-violet-950">
                    <Users className="w-5 h-5 text-violet-600" />
                    Group party ({guests.length} guests)
                </h3>
                <p className="text-sm text-violet-800/80 mt-1">
                    {min}-{max} guests, friends &amp; family, no account needed
                    {capabilities.group_discount_percent > 0
                        ? `, ${capabilities.group_discount_percent}% group discount applied`
                        : ''}
                </p>
            </div>

            <div className="flex items-center gap-3">
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={guests.length <= min}
                    onClick={() => setPartySize(guests.length - 1)}
                    aria-label="Remove guest"
                >
                    <Minus className="w-4 h-4" />
                </Button>
                <span className="font-bold text-lg w-8 text-center">{guests.length}</span>
                <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    disabled={guests.length >= max}
                    onClick={() => setPartySize(guests.length + 1)}
                    aria-label="Add guest"
                >
                    <Plus className="w-4 h-4" />
                </Button>
                <span className="text-sm text-muted-foreground">Party size</span>
            </div>

            <div className="space-y-2">
                <Label>Event name (optional)</Label>
                <Input
                    placeholder="e.g. Wedding groomsmen, Birthday party"
                    value={groupEventLabel}
                    onChange={(e) => onGroupEventLabelChange(e.target.value)}
                    className="rounded-xl bg-card"
                />
            </div>

            <div className="space-y-3">
                <Label>Guest names</Label>
                <p className="text-xs text-violet-800/70">
                    Enter each person&apos;s name, they do not need a ShopTheBarber account.
                </p>
                {guests.map((g, i) => (
                    <Input
                        key={i}
                        placeholder={`Guest ${i + 1} name`}
                        value={g.guest_name}
                        onChange={(e) => {
                            const updated = [...guests];
                            updated[i] = { ...updated[i], guest_name: e.target.value };
                            onGuestsChange(updated);
                        }}
                        className="rounded-xl bg-card"
                    />
                ))}
            </div>

            {groupQuote && (
                <div className="text-sm border-t border-violet-200 pt-4 space-y-1">
                    <div className="flex justify-between">
                        <span>Group subtotal</span>
                        <span>€{groupQuote.group_subtotal?.toFixed(2)}</span>
                    </div>
                    {groupQuote.group_discount_amount > 0 && (
                        <div className="flex justify-between text-violet-700">
                            <span>Group discount</span>
                            <span>-€{groupQuote.group_discount_amount?.toFixed(2)}</span>
                        </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-1">
                        <span>Total</span>
                        <span>€{groupQuote.final_price?.toFixed(2)}</span>
                    </div>
                    <p className="text-muted-foreground text-xs">
                        ~{groupQuote.total_duration_minutes} min total (sequential cuts)
                    </p>
                </div>
            )}
        </div>
    );
}

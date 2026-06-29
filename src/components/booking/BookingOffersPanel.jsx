import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Layers, Tag, Plus, Check, ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export default function BookingOffersPanel({
  offers,
  isLoading,
  selectedServices = [],
  onAddServices,
  onAddBundle,
  onApplyPromoCode,
  compact = false,
}) {
  if (isLoading) {
    return (
      <div className="rounded-2xl border border-border bg-muted/30 p-4 animate-pulse">
        <div className="h-4 w-40 bg-muted rounded mb-2" />
        <div className="h-10 bg-muted rounded" />
      </div>
    );
  }

  if (!offers) return null;

  const {
    promotions = [],
    matched_bundle,
    near_miss_bundles = [],
    available_bundles = [],
  } = offers;

  const hasContent =
    promotions.length > 0 ||
    matched_bundle ||
    near_miss_bundles.length > 0 ||
    (available_bundles.length > 0 && selectedServices.length === 0);

  if (!hasContent) return null;

  return (
    <div className={cn('space-y-4', compact ? 'mb-4' : 'mb-8')}>
      {promotions.length > 0 && (
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-4">
          <div className="flex items-center gap-2 mb-3">
            <Tag className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm">Promotions available</h3>
          </div>
          <div className="flex flex-wrap gap-2">
            {promotions.map((p) => (
              <button
                key={p.id}
                type="button"
                onClick={() => onApplyPromoCode?.(p.code)}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-primary/30 bg-card hover:bg-primary/10 transition-colors text-left"
              >
                <span className="font-mono font-bold text-sm">{p.code}</span>
                <Badge variant="secondary" className="text-xs">
                  {p.discount_text}
                </Badge>
                {p.type === 'platform' && (
                  <span className="text-[10px] uppercase text-muted-foreground">Platform</span>
                )}
              </button>
            ))}
          </div>
          {onApplyPromoCode && (
            <p className="text-xs text-muted-foreground mt-2">Tap a code to apply at checkout</p>
          )}
        </div>
      )}

      {matched_bundle && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 flex items-start gap-3">
          <Check className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-emerald-900">{matched_bundle.bundle_name} applied</p>
            <p className="text-sm text-emerald-700">
              You&apos;re saving ${matched_bundle.combo_savings.toFixed(2)} with this combo
            </p>
          </div>
        </div>
      )}

      {near_miss_bundles.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            <h3 className="font-bold text-sm">Unlock a combo deal</h3>
          </div>
          {near_miss_bundles.map((offer) => (
            <div
              key={offer.bundle_id}
              className="rounded-2xl border border-amber-200/80 bg-gradient-to-r from-amber-50 to-orange-50 p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <div className="flex-1 min-w-0">
                <p className="font-bold text-foreground">{offer.bundle_name}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  Add{' '}
                  <strong>{offer.missing_services.map((s) => s.name).join(' + ')}</strong>
                  {' '}for ${offer.add_on_price.toFixed(2)} more pay ${offer.combo_price.toFixed(2)} total
                </p>
                <p className="text-xs text-emerald-700 font-semibold mt-1">
                  Save ${offer.savings.toFixed(2)} vs booking separately
                </p>
              </div>
              <Button
                size="sm"
                className="rounded-xl shrink-0"
                onClick={() =>
                  onAddBundle
                    ? onAddBundle(offer.service_ids)
                    : onAddServices?.(offer.missing_service_ids)
                }
              >
                <Plus className="w-4 h-4 mr-1" />
                Add & save
              </Button>
            </div>
          ))}
        </div>
      )}

      {available_bundles.length > 0 && selectedServices.length === 0 && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-primary" />
            <h3 className="font-bold text-sm">Popular combos</h3>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {available_bundles.map((offer) => (
              <div
                key={offer.bundle_id}
                className="rounded-2xl border border-border bg-card p-4 hover:border-primary/40 transition-colors"
              >
                <p className="font-bold">{offer.bundle_name}</p>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                  {offer.services.map((s) => s.name).join(' + ')}
                </p>
                <div className="flex items-center justify-between mt-3">
                  <div>
                    <span className="text-lg font-bold text-primary">${offer.combo_price.toFixed(2)}</span>
                    <span className="text-xs text-muted-foreground line-through ml-2">
                      ${offer.full_sum_price.toFixed(2)}
                    </span>
                    <Badge className="ml-2 bg-emerald-100 text-emerald-800 hover:bg-emerald-100">
                      Save ${offer.savings.toFixed(2)}
                    </Badge>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    className="rounded-xl"
                    onClick={() => onAddBundle?.(offer.service_ids)}
                  >
                    Add combo <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

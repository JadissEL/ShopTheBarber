import { useMemo, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  computeRoi,
  DEFAULT_AVG_SERVICE_PRICE,
  DEFAULT_NO_SHOWS_PER_MONTH,
  formatMoney,
  GTM_PRICING_DEFAULTS,
} from '@/lib/gtmPricing';
import { Calculator, TrendingUp } from 'lucide-react';

/**
 * Cutly-style ROI: one prevented no-show vs flat monthly fee.
 * @param {{ monthlyFee?: number; currency?: string }} props
 */
export function RoiCalculator({
  monthlyFee = GTM_PRICING_DEFAULTS.monthly_fee_barber,
  currency = GTM_PRICING_DEFAULTS.currency,
}) {
  const [avgPrice, setAvgPrice] = useState(String(DEFAULT_AVG_SERVICE_PRICE));
  const [noShows, setNoShows] = useState(String(DEFAULT_NO_SHOWS_PER_MONTH));

  const roi = useMemo(
    () =>
      computeRoi({
        avgServicePrice: Number(avgPrice) || 0,
        noShowsPerMonth: Number(noShows) || 0,
        monthlyFee,
        recoveryRate: 1,
      }),
    [avgPrice, noShows, monthlyFee],
  );

  const oneNoShowCovers = roi.recoveredPerNoShow >= roi.monthlyFee;

  return (
    <Card className="border-primary/20 bg-primary/5 overflow-hidden">
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2 text-xl">
          <Calculator className="w-5 h-5 text-primary" />
          ROI calculator
        </CardTitle>
        <p className="text-sm text-muted-foreground font-normal">
          Simple math, like Cutly: if card-on-file and reminders stop even one no-show, the platform
          often pays for itself.
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="roi-avg-price">Average service price</Label>
            <Input
              id="roi-avg-price"
              type="number"
              min={0}
              step={1}
              value={avgPrice}
              onChange={(e) => setAvgPrice(e.target.value)}
              className=""
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="roi-noshows">No-shows per month (today)</Label>
            <Input
              id="roi-noshows"
              type="number"
              min={0}
              step={1}
              value={noShows}
              onChange={(e) => setNoShows(e.target.value)}
              className=""
            />
          </div>
        </div>

        <div
          className={`rounded-lg border p-5 space-y-3 ${
            oneNoShowCovers
              ? 'border-primary/30 stb-notice-warm dark:bg-emerald-950/20'
              : 'border-border bg-card'
          }`}
        >
          <div className="flex items-start gap-3">
            <TrendingUp
              className={`w-5 h-5 shrink-0 mt-0.5 ${oneNoShowCovers ? 'text-primary' : 'text-muted-foreground'}`}
            />
            <div>
              <p className="font-semibold text-foreground">
                {oneNoShowCovers
                  ? 'One prevented no-show pays for the month'
                  : 'Raise recovery or service price to break even faster'}
              </p>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Platform fee:{' '}
                <strong>{formatMoney(roi.monthlyFee, currency)}</strong>/mo, One recovered slot:{' '}
                <strong>{formatMoney(roi.recoveredPerNoShow, currency)}</strong>
                {oneNoShowCovers && (
                  <>
                    {' '}
                   , surplus of{' '}
                    <strong>{formatMoney(roi.surplusOneNoShow, currency)}</strong> after one save.
                  </>
                )}
              </p>
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Assumes you collect a no-show fee or deposit at your average service price. Reminders +
            card on file are included in ShopTheBarber.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

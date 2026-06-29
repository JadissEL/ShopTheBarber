import { CheckCircle2, Circle, Sparkles } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import {
    computeBarberShowcaseCompleteness,
    computeShopShowcaseCompleteness,
} from '@/utils/showcaseCompleteness';

export default function ShowcaseCompletenessCard({ barber, shop }) {
    const barberCompleteness = barber ? computeBarberShowcaseCompleteness({
        bio: barber.bio,
        profile_highlights: barber.profile_highlights,
        career_entries: barber.career_entries,
        portfolio: barber.portfolio,
        years_experience: barber.years_experience,
        career_started_year: barber.career_started_year,
    }) : null;

    const shopCompleteness = shop ? computeShopShowcaseCompleteness({
        description: shop.description,
        profile_highlights: shop.profile_highlights,
        career_entries: shop.career_entries,
        founded_year: shop.founded_year,
    }) : null;

    const primary = barberCompleteness ?? shopCompleteness;
    if (!primary) return null;

    const secondary = barberCompleteness && shopCompleteness ? shopCompleteness : null;
    const isComplete = primary.percent >= 100 && (!secondary || secondary.percent >= 100);

    if (isComplete) {
        return (
            <Card className="border-emerald-200 bg-emerald-50/50 shadow-sm rounded-3xl">
                <CardContent className="py-5 flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                    <div>
                        <p className="font-semibold text-sm text-emerald-900">Your story is live for discovery</p>
                        <p className="text-xs text-emerald-800/80">
                            Clients can explore your portfolio and background on ShopTheBarber, no separate app needed.
                        </p>
                    </div>
                </CardContent>
            </Card>
        );
    }

    return (
        <Card className="border-primary/20 bg-primary/5 shadow-sm rounded-3xl">
            <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-4">
                    <div>
                        <CardTitle className="text-lg flex items-center gap-2">
                            <Sparkles className="w-5 h-5 text-primary" />
                            Get discovered on ShopTheBarber
                        </CardTitle>
                        <CardDescription>
                            Complete your profile story so clients choose you from Explore, not from an app store.
                        </CardDescription>
                    </div>
                    <span className="text-sm font-bold text-primary shrink-0">{primary.percent}%</span>
                </div>
                <Progress value={primary.percent} className="h-2 mt-3" />
            </CardHeader>
            <CardContent className="space-y-4 pt-0">
                <ul className="space-y-2">
                    {primary.items.map((item) => (
                        <li key={item.id} className="flex items-start gap-2 text-sm">
                            {item.done ? (
                                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                            ) : (
                                <Circle className="w-4 h-4 text-muted-foreground shrink-0 mt-0.5" />
                            )}
                            <div>
                                <span className={item.done ? 'text-muted-foreground line-through' : 'font-medium'}>
                                    {item.label}
                                </span>
                                {!item.done && (
                                    <p className="text-xs text-muted-foreground mt-0.5">{item.tip}</p>
                                )}
                            </div>
                        </li>
                    ))}
                </ul>
                {secondary && secondary.percent < 100 && (
                    <div className="pt-3 border-t border-border/60">
                        <p className="text-xs font-semibold text-muted-foreground mb-2 uppercase tracking-wide">
                            Shop story, {secondary.percent}%
                        </p>
                        <ul className="space-y-1">
                            {secondary.items.filter((i) => !i.done).slice(0, 2).map((item) => (
                                <li key={item.id} className="text-xs text-muted-foreground flex items-center gap-2">
                                    <Circle className="w-3 h-3 shrink-0" />
                                    {item.label}
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

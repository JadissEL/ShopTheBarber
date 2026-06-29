import { Sparkles, ImageIcon, BookOpen, Store, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';

const VARIANTS = {
    portfolio: {
        icon: ImageIcon,
        title: 'Portfolio coming soon',
        body: (name) =>
            `${name} is building their on-platform portfolio. Book now, after your visit you can leave a review and see their story grow here on ShopTheBarber.`,
        cta: 'Book appointment',
    },
    about: {
        icon: BookOpen,
        title: 'Professional story',
        body: (name) =>
            `${name} hasn't published their full story yet. Ratings, services, and booking are live, everything you need to choose them is right here on ShopTheBarber.`,
        cta: 'View services & book',
    },
    shop_story: {
        icon: Store,
        title: 'Shop story',
        body: () =>
            'This shop is still setting up their story on ShopTheBarber. Browse the team below or message them, no app download required.',
        cta: 'Message shop',
    },
    portfolio_partial: {
        icon: Scissors,
        title: 'More work on the way',
        body: (name) =>
            `${name} is adding portfolio photos. Check the About tab for highlights and career background, all on ShopTheBarber.`,
        cta: 'See about & book',
    },
};

export default function ShowcaseEmptyState({
    variant = 'portfolio',
    name = 'This barber',
    onAction,
    actionVariant = 'default',
    className = '',
}) {
    const config = VARIANTS[variant] ?? VARIANTS.portfolio;
    const Icon = config.icon;

    return (
        <div
            className={`text-center py-12 px-6 space-y-4 rounded-2xl border border-dashed border-border bg-muted/30 ${className}`}
        >
            <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                <Icon className="w-7 h-7 text-primary" />
            </div>
            <div className="space-y-2 max-w-md mx-auto">
                <h3 className="font-bold text-foreground">{config.title}</h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{config.body(name)}</p>
            </div>
            <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                <Sparkles className="w-3.5 h-3.5 text-primary" />
                <span>Discovery on ShopTheBarber, not an app store listing</span>
            </div>
            {onAction && (
                <Button onClick={onAction} variant={actionVariant} className="rounded-xl">
                    {config.cta}
                </Button>
            )}
        </div>
    );
}

import { useQuery } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Megaphone } from 'lucide-react';

export default function ProviderAdCreditsPanel() {
    const { data, isLoading, isError } = useQuery({
        queryKey: ['ad-credits-wallet'],
        queryFn: () => sovereign.adCredits.getWallet(),
        retry: false,
    });

    if (isLoading) {
        return <div className="h-20 rounded-2xl bg-muted/40 animate-pulse" aria-busy="true" />;
    }
    if (isError || !data) return null;

    const balance = data.balance ?? 0;

    return (
        <Card className="rounded-2xl border-border/60">
            <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                    <Megaphone className="w-5 h-5 text-primary" />
                    Ad credits
                    <Badge variant="secondary" className="ml-auto tabular-nums">
                        €{Number(balance).toFixed(2)}
                    </Badge>
                </CardTitle>
            </CardHeader>
            <CardContent>
                <p className="text-sm text-muted-foreground">
                    Use credits to boost your profile in search and featured placements.
                    Contact support or your account manager to purchase more credits.
                </p>
            </CardContent>
        </Card>
    );
}

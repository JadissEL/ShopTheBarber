import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Gift, ShoppingBag, Plus, Minus } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import PageHeader from '@/components/layout/PageHeader';
import PageContent from '@/components/layout/PageContent';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';

export default function GiftCards() {
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();
    const [amount, setAmount] = useState(50);
    const [recipientEmail, setRecipientEmail] = useState('');
    const [redeemCode, setRedeemCode] = useState('');
    const [redeemAmount, setRedeemAmount] = useState(25);
    const presetAmounts = [25, 50, 100, 150];

    const { data: mine } = useQuery({
        queryKey: ['my-gift-cards'],
        queryFn: () => sovereign.giftCards.listMine(),
        retry: false,
    });

    const myGiftCards = mine?.cards ?? [];

    useEffect(() => {
        const purchase = searchParams.get('purchase');
        if (purchase === 'success') {
            toast.success('Payment received — your gift card will appear shortly.');
            queryClient.invalidateQueries({ queryKey: ['my-gift-cards'] });
            setSearchParams({}, { replace: true });
        } else if (purchase === 'cancelled') {
            toast.info('Gift card checkout cancelled');
            setSearchParams({}, { replace: true });
        }
    }, [searchParams, setSearchParams, queryClient]);

    const purchaseMutation = useMutation({
        mutationFn: () =>
            sovereign.giftCards.purchase({
                amount,
                recipient_email: recipientEmail.trim() || undefined,
            }),
        onSuccess: (result) => {
            if (result?.url) {
                window.location.href = result.url;
                return;
            }
            toast.error('Checkout could not be started');
        },
        onError: (e) => toast.error(e.message || 'Purchase failed'),
    });

    const redeemMutation = useMutation({
        mutationFn: () => sovereign.giftCards.redeem({ code: redeemCode, amount: redeemAmount }),
        onSuccess: (r) => {
            toast.success(`Redeemed €${r.redeemed}. Remaining on card: €${r.remaining}`);
            setRedeemCode('');
            queryClient.invalidateQueries({ queryKey: ['my-gift-cards'] });
        },
        onError: (e) => toast.error(e.message || 'Redeem failed'),
    });

    return (
        <div className="stb-page pb-24 lg:pb-8">
            <MetaTags title="Gift Cards" description="Give the gift of a perfect cut with ShopTheBarber digital gift cards." />

            <PageHeader
                label="Gifts"
                title="Gift cards"
                subtitle="Digital cards they can redeem with any barber on the platform."
            />

            <PageContent>
                <div className="grid lg:grid-cols-2 gap-6">
                    <Card className={cn(stb.surface, 'p-0')}>
                        <CardContent className="p-6 md:p-8">
                            <h2 className={cn(stb.uiHeading, 'text-xl mb-6')}>Buy a gift card</h2>
                            <div className="space-y-6">
                                <div className="grid grid-cols-4 gap-2">
                                    {presetAmounts.map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setAmount(preset)}
                                            className={cn(
                                                'py-3 rounded-lg text-sm font-semibold transition-all duration-200',
                                                amount === preset ? 'bg-primary text-primary-foreground shadow-sm' : 'bg-muted text-foreground hover:bg-muted/80',
                                            )}
                                        >
                                            {preset}€
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button type="button" variant="outline" size="icon" onClick={() => setAmount(Math.max(10, amount - 10))}>
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                    <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="text-center text-xl font-semibold" />
                                    <Button type="button" variant="outline" size="icon" onClick={() => setAmount(Math.min(500, amount + 10))}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <Input placeholder="Recipient email (optional)" value={recipientEmail} onChange={(e) => setRecipientEmail(e.target.value)} />
                                <Button className="w-full h-12" disabled={purchaseMutation.isPending} onClick={() => purchaseMutation.mutate()}>
                                    <ShoppingBag className="w-5 h-5 mr-2" />
                                    Pay €{amount} with card
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className={cn(stb.surface, 'p-0')}>
                        <CardContent className="p-6 md:p-8">
                            <h2 className={cn(stb.uiHeading, 'text-xl mb-4')}>Redeem to wallet</h2>
                            <div className="space-y-3">
                                <Input placeholder="GIFT-XXXX" value={redeemCode} onChange={(e) => setRedeemCode(e.target.value)} />
                                <Input type="number" placeholder="Amount" value={redeemAmount} onChange={(e) => setRedeemAmount(Number(e.target.value))} />
                                <Button className="w-full" disabled={redeemMutation.isPending} onClick={() => redeemMutation.mutate()}>
                                    Redeem
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                </div>

                {myGiftCards.length > 0 && (
                    <div className="mt-12">
                        <h2 className={cn(stb.uiHeading, 'text-xl mb-6')}>Your gift cards</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {myGiftCards.map((card) => (
                                <Card key={card.id} className={stb.surfaceHover}>
                                    <CardContent className="p-5 flex justify-between items-center gap-4">
                                        <div>
                                            <p className="font-mono font-semibold">{card.code}</p>
                                            <p className="text-sm text-muted-foreground">Balance: €{card.balance} / €{card.original_amount}</p>
                                        </div>
                                        <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>{card.status}</Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </PageContent>
        </div>
    );
}

import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Gift, ShoppingBag, Plus, Minus, Check } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'sonner';

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
        <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
            <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8 text-center">
                    <Gift className="w-16 h-16 text-primary mx-auto mb-4" />
                    <h1 className="text-4xl font-display font-bold text-charcoal dark:text-white mb-2">Gift Cards</h1>
                    <p className="text-lg text-slate dark:text-matte-silver">Give the gift of a perfect cut</p>
                </motion.div>

                <div className="grid lg:grid-cols-2 gap-8">
                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-8">
                            <h2 className="text-2xl font-bold text-charcoal dark:text-white mb-6">Buy a gift card</h2>
                            <div className="space-y-6">
                                <div className="grid grid-cols-4 gap-3">
                                    {presetAmounts.map((preset) => (
                                        <button
                                            key={preset}
                                            type="button"
                                            onClick={() => setAmount(preset)}
                                            className={`py-3 rounded-xl font-bold transition-all ${amount === preset ? 'bg-primary text-white shadow-md' : 'bg-background-light dark:bg-background-dark'}`}
                                        >
                                            {preset}€
                                        </button>
                                    ))}
                                </div>
                                <div className="flex items-center gap-3">
                                    <Button type="button" variant="outline" size="icon" onClick={() => setAmount(Math.max(10, amount - 10))}>
                                        <Minus className="w-4 h-4" />
                                    </Button>
                                    <Input type="number" value={amount} onChange={(e) => setAmount(Number(e.target.value))} className="text-center text-2xl font-bold" />
                                    <Button type="button" variant="outline" size="icon" onClick={() => setAmount(Math.min(500, amount + 10))}>
                                        <Plus className="w-4 h-4" />
                                    </Button>
                                </div>
                                <Input
                                    placeholder="Recipient email (optional)"
                                    value={recipientEmail}
                                    onChange={(e) => setRecipientEmail(e.target.value)}
                                />
                                <Button
                                    className="w-full h-14 text-lg font-bold rounded-xl"
                                    disabled={purchaseMutation.isPending}
                                    onClick={() => purchaseMutation.mutate()}
                                >
                                    <ShoppingBag className="w-5 h-5 mr-2" />
                                    Pay €{amount} with card
                                </Button>
                            </div>
                        </CardContent>
                    </Card>

                    <Card className="rounded-2xl border-none shadow-soft bg-surface-light dark:bg-surface-dark">
                        <CardContent className="p-8">
                            <h2 className="text-2xl font-bold mb-4">Redeem to wallet</h2>
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
                        <h2 className="text-2xl font-bold mb-6">Your gift cards</h2>
                        <div className="grid md:grid-cols-2 gap-4">
                            {myGiftCards.map((card) => (
                                <Card key={card.id} className="rounded-xl">
                                    <CardContent className="p-6 flex justify-between items-center">
                                        <div>
                                            <p className="font-mono font-bold">{card.code}</p>
                                            <p className="text-sm text-muted-foreground">Balance: €{card.balance} / €{card.original_amount}</p>
                                        </div>
                                        <Badge variant={card.status === 'active' ? 'default' : 'secondary'}>{card.status}</Badge>
                                    </CardContent>
                                </Card>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

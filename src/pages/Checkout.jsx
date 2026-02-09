import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { ChevronLeft, Lock, CreditCard, ArrowRight } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useCart } from '@/components/context/CartContext';
import { useAuth } from '@/lib/AuthContext';
import { sovereign } from '@/api/apiClient';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

const STEPS = ['SHIPPING', 'PAYMENT', 'REVIEW'];
const TAX_RATE = 0.085;

export default function Checkout() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');
    const { items, itemCount } = useCart();
    const { isAuthenticated } = useAuth();

    const [step, setStep] = useState(0);
    const [shipping, setShipping] = useState({
        fullName: '',
        street: '',
        city: '',
        zip: '',
        phone: '',
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const subtotal = items.reduce((sum, i) => sum + Number(i.product?.price ?? 0) * (i.quantity || 0), 0);
    const tax = Math.round((subtotal * TAX_RATE) * 100) / 100;
    const total = Math.round((subtotal + tax) * 100) / 100;

    useEffect(() => {
        if (status === 'success' && orderId) {
            setStep(2);
            return;
        }
        if (!isAuthenticated) {
            navigate(createPageUrl('SignIn') + '?return=' + encodeURIComponent('/Checkout'));
            return;
        }
        if (itemCount === 0 && step < 2) {
            navigate(createPageUrl('ShoppingBag'));
        }
    }, [status, orderId, isAuthenticated, itemCount, navigate, step]);

    const handleContinueToPayment = async () => {
        if (!shipping.fullName?.trim() || !shipping.street?.trim() || !shipping.city?.trim() || !shipping.zip?.trim()) {
            toast.error('Please fill in all required shipping fields');
            return;
        }
        setIsSubmitting(true);
        try {
            const { url } = await sovereign.functions.invoke('create-product-checkout-session', {
                shipping_full_name: shipping.fullName,
                shipping_street: shipping.street,
                shipping_city: shipping.city,
                shipping_zip: shipping.zip,
                shipping_phone: shipping.phone,
            });
            if (url) {
                window.location.href = url;
            } else {
                toast.error('Could not start checkout');
            }
        } catch (e) {
            toast.error(e.message || 'Checkout failed');
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isAuthenticated) {
        return null;
    }

    const isSuccess = status === 'success' && orderId;

    return (
        <div className="min-h-screen bg-background pb-24 lg:pb-8">
            <MetaTags
                title="Checkout – Shop The Barber"
                description="Secure checkout for your order."
            />

            <header className="sticky top-0 z-40 bg-white border-b border-slate-100">
                <div className="w-full max-w-2xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => (step > 0 ? setStep(step - 1) : navigate(createPageUrl('ShoppingBag')))}
                        className="p-2 -ml-2 rounded-full text-slate-600 hover:bg-slate-100"
                        aria-label="Back"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-lg font-bold text-foreground">Checkout</h1>
                    <div className="w-10 h-10 flex items-center justify-center text-primary">
                        <Lock className="w-5 h-5" />
                    </div>
                </div>

                {!isSuccess && (
                    <div className="w-full max-w-2xl mx-auto px-4 lg:px-8 pb-4 flex items-center justify-center gap-2">
                        {STEPS.map((label, i) => (
                            <div key={label} className="flex items-center gap-1">
                                <span
                                    className={`text-xs font-semibold uppercase tracking-wider ${
                                        i === step ? 'text-primary' : 'text-slate-400'
                                    }`}
                                >
                                    {label}
                                </span>
                                {i < STEPS.length - 1 && (
                                    <span className="w-4 h-px bg-slate-200 mx-0.5" aria-hidden />
                                )}
                            </div>
                        ))}
                    </div>
                )}
            </header>

            <main className="w-full max-w-2xl mx-auto px-4 lg:px-8 py-8">
                {isSuccess ? (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold text-foreground mb-2">Thank you for your order</h2>
                        <p className="text-slate-600 mb-1">Order #{orderId?.slice(-8)}</p>
                        <p className="text-slate-500 text-sm mb-6">A confirmation email has been sent to your inbox.</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link to={createPageUrl('OrderTracking') + '?id=' + encodeURIComponent(orderId || '')}>
                                <Button className="rounded-xl bg-primary text-primary-foreground hover:opacity-95 w-full sm:w-auto">Track Order</Button>
                            </Link>
                            <Link to={createPageUrl('Marketplace')}>
                                <Button variant="outline" className="rounded-xl w-full sm:w-auto">Continue Shopping</Button>
                            </Link>
                        </div>
                    </div>
                ) : step === 0 ? (
                    <>
                        <div className="mb-6">
                            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-3">Express Checkout</p>
                            <button
                                type="button"
                                className="w-full flex items-center justify-center gap-2 rounded-xl bg-primary text-primary-foreground font-semibold h-12 px-4"
                                onClick={handleContinueToPayment}
                            >
                                <CreditCard className="w-5 h-5" />
                                Pay with Card (Stripe)
                            </button>
                        </div>
                        <p className="text-center text-xs text-slate-400 uppercase tracking-wider mb-6">Or continue with shipping</p>

                        <section className="mb-8">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="font-bold text-foreground">Shipping Address</h2>
                                <button type="button" className="text-sm text-primary hover:underline">
                                    Saved Addresses
                                </button>
                            </div>
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="fullName" className="text-slate-700">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        placeholder="Alexander Sterling"
                                        value={shipping.fullName}
                                        onChange={(e) => setShipping((s) => ({ ...s, fullName: e.target.value }))}
                                        className="mt-1.5 h-11 rounded-xl bg-slate-100 border-0 focus-visible:ring-2 focus-visible:ring-slate-300"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="street" className="text-slate-700">Street Address</Label>
                                    <Input
                                        id="street"
                                        placeholder="742 Evergreen Terrace"
                                        value={shipping.street}
                                        onChange={(e) => setShipping((s) => ({ ...s, street: e.target.value }))}
                                        className="mt-1.5 h-11 rounded-xl bg-slate-100 border-0 focus-visible:ring-2 focus-visible:ring-slate-300"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="city" className="text-slate-700">City</Label>
                                        <Input
                                            id="city"
                                            placeholder="Beverly Hills"
                                            value={shipping.city}
                                            onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value }))}
                                            className="mt-1.5 h-11 rounded-xl bg-slate-100 border-0 focus-visible:ring-2 focus-visible:ring-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="zip" className="text-slate-700">Zip Code</Label>
                                        <Input
                                            id="zip"
                                            placeholder="90210"
                                            value={shipping.zip}
                                            onChange={(e) => setShipping((s) => ({ ...s, zip: e.target.value }))}
                                            className="mt-1.5 h-11 rounded-xl bg-slate-100 border-0 focus-visible:ring-2 focus-visible:ring-slate-300"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="phone" className="text-slate-700">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+1 (555) 000-0000"
                                        value={shipping.phone}
                                        onChange={(e) => setShipping((s) => ({ ...s, phone: e.target.value }))}
                                        className="mt-1.5 h-11 rounded-xl bg-slate-100 border-0 focus-visible:ring-2 focus-visible:ring-slate-300"
                                    />
                                </div>
                            </div>
                        </section>
                    </>
                ) : null}
            </main>

            {!isSuccess && itemCount > 0 && (
                <footer className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-slate-200 p-4 safe-area-pb lg:static lg:border-0 lg:bg-transparent lg:pt-0">
                    <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-lg">${total.toFixed(2)}</span>
                            <span className="text-sm text-slate-500">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                        </div>
                        <Button
                            className="rounded-xl h-12 bg-primary text-primary-foreground hover:opacity-95 font-semibold gap-2 w-full sm:w-auto px-8"
                            onClick={handleContinueToPayment}
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? 'Redirecting…' : 'Continue to Payment'}
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </footer>
            )}

            <ClientBottomNav />
        </div>
    );
}

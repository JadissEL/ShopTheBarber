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
import { useQuery } from '@tanstack/react-query';
import SavedAddressesManager, { addressToShipping } from '@/components/shipping/SavedAddressesManager';
import { MarketplaceCheckoutLegalNotice } from '@/components/marketplace/MarketplaceCheckoutLegalNotice';
import {
  BUYER_TERMS_PATH,
  MARKETPLACE_VAT_LABEL,
  PLATFORM_FREE_SHIPPING_MIN,
  computeMarketplaceShipping,
  computeMarketplaceTax,
  getMarketplaceVatRate,
} from '@/lib/marketplaceLegal';

const STEPS = ['SHIPPING', 'PAYMENT', 'REVIEW'];

export default function Checkout() {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const status = searchParams.get('status');
    const orderId = searchParams.get('orderId');
    const { items, itemCount } = useCart();
    const { isAuthenticated, isLoadingAuth, isSignedIn, syncStatus } = useAuth();

    const [step, setStep] = useState(0);
    const [shipping, setShipping] = useState({
        fullName: '',
        street: '',
        city: '',
        state: '',
        zip: '',
        phone: '',
        savedAddressId: null,
    });
    const [saveAddress, setSaveAddress] = useState(false);
    const [showSavedPicker, setShowSavedPicker] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [acceptedBuyerTerms, setAcceptedBuyerTerms] = useState(false);

    const { data: defaultAddressLoaded } = useQuery({
        queryKey: ['saved-addresses-checkout'],
        queryFn: () => sovereign.shipping.listAddresses(),
        enabled: isAuthenticated,
    });

    useEffect(() => {
        if (!defaultAddressLoaded?.length || shipping.savedAddressId || shipping.fullName) return;
        const def = defaultAddressLoaded.find((a) => a.is_default) || defaultAddressLoaded[0];
        const mapped = addressToShipping(def);
        if (mapped) setShipping(mapped);
    }, [defaultAddressLoaded, shipping.savedAddressId, shipping.fullName]);

    const subtotal = items.reduce((sum, i) => sum + Number(i.product?.price ?? 0) * (i.quantity || 0), 0);
    const shippingFee = computeMarketplaceShipping(subtotal);
    const tax = computeMarketplaceTax(subtotal, shippingFee, getMarketplaceVatRate());
    const total = Math.round((subtotal + shippingFee + tax) * 100) / 100;

    useEffect(() => {
        // Handle success state first (no auth needed)
        if (status === 'success' && orderId) {
            setStep(2);
            return;
        }
        
        // Don't redirect while Clerk or backend sync is in progress
        if (isLoadingAuth) return;

        // Signed in with Clerk but backend not ready, avoid SignIn redirect loop
        if (isSignedIn && !isAuthenticated) {
            if (syncStatus === 'error') {
                navigate(createPageUrl('SetupGuide'), { replace: true });
            }
            return;
        }
        
        // Auth check
        if (!isAuthenticated) {
            navigate(`${createPageUrl('SignIn')  }?return=${  encodeURIComponent('/Checkout')}`, { replace: true });
            return;
        }
        
        // Cart check (only if authenticated and not on success page)
        if (itemCount === 0 && step < 2) {
            navigate(createPageUrl('ShoppingBag'), { replace: true });
        }
    }, [status, orderId, isAuthenticated, isLoadingAuth, isSignedIn, syncStatus, itemCount, navigate, step]);

    const handleContinueToPayment = async () => {
        if (!acceptedBuyerTerms) {
            toast.error('Please accept the marketplace purchase terms');
            return;
        }
        const useSaved = !!shipping.savedAddressId;
        if (!useSaved && (!shipping.fullName?.trim() || !shipping.street?.trim() || !shipping.city?.trim() || !shipping.zip?.trim())) {
            toast.error('Please fill in all required shipping fields');
            return;
        }
        setIsSubmitting(true);
        try {
            const payload = shipping.savedAddressId
                ? { saved_address_id: shipping.savedAddressId }
                : {
                    shipping_full_name: shipping.fullName,
                    shipping_street: shipping.street,
                    shipping_city: shipping.city,
                    shipping_state: shipping.state,
                    shipping_zip: shipping.zip,
                    shipping_phone: shipping.phone,
                    save_address: saveAddress,
                };
            const { url } = await sovereign.functions.invoke('create-product-checkout-session', payload);
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
        <div className="stb-page pb-24 lg:pb-8">
            <MetaTags
                title="Checkout - Shop The Barber"
                description="Secure checkout for your order."
            />

            <header className="sticky top-0 z-40 bg-card border-b border-slate-100">
                <div className="w-full max-w-2xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => (step > 0 ? setStep(step - 1) : navigate(createPageUrl('ShoppingBag')))}
                        className="p-2 -ml-2 rounded-full text-muted-foreground hover:bg-muted"
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
                        <p className="text-muted-foreground mb-1">Order #{orderId?.slice(-8)}</p>
                        <p className="text-muted-foreground text-sm mb-6">A confirmation email has been sent to your inbox.</p>
                        <div className="flex flex-col sm:flex-row gap-3 justify-center">
                            <Link to={`${createPageUrl('OrderTracking')  }?id=${  encodeURIComponent(orderId || '')}`}>
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
                                <button
                                    type="button"
                                    className="text-sm text-primary hover:underline"
                                    onClick={() => setShowSavedPicker((v) => !v)}
                                >
                                    {showSavedPicker ? 'Enter manually' : 'Saved addresses'}
                                </button>
                            </div>

                            {showSavedPicker ? (
                                <SavedAddressesManager
                                    compact
                                    selectedId={shipping.savedAddressId}
                                    onSelect={(addr) => {
                                        const mapped = addressToShipping(addr);
                                        if (mapped) {
                                            setShipping(mapped);
                                            setShowSavedPicker(false);
                                        }
                                    }}
                                />
                            ) : (
                            <div className="space-y-4">
                                <div>
                                    <Label htmlFor="fullName" className="text-foreground/90">Full Name</Label>
                                    <Input
                                        id="fullName"
                                        placeholder="Alexander Sterling"
                                        value={shipping.fullName}
                                        onChange={(e) => setShipping((s) => ({ ...s, fullName: e.target.value, savedAddressId: null }))}
                                        className="mt-1.5 h-11 rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-slate-300"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="street" className="text-foreground/90">Street Address</Label>
                                    <Input
                                        id="street"
                                        placeholder="742 Evergreen Terrace"
                                        value={shipping.street}
                                        onChange={(e) => setShipping((s) => ({ ...s, street: e.target.value, savedAddressId: null }))}
                                        className="mt-1.5 h-11 rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-slate-300"
                                    />
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <Label htmlFor="city" className="text-foreground/90">City</Label>
                                        <Input
                                            id="city"
                                            placeholder="Beverly Hills"
                                            value={shipping.city}
                                            onChange={(e) => setShipping((s) => ({ ...s, city: e.target.value, savedAddressId: null }))}
                                            className="mt-1.5 h-11 rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-slate-300"
                                        />
                                    </div>
                                    <div>
                                        <Label htmlFor="state" className="text-foreground/90">State</Label>
                                        <Input
                                            id="state"
                                            placeholder="CA"
                                            value={shipping.state}
                                            onChange={(e) => setShipping((s) => ({ ...s, state: e.target.value, savedAddressId: null }))}
                                            className="mt-1.5 h-11 rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-slate-300"
                                        />
                                    </div>
                                </div>
                                <div>
                                    <Label htmlFor="zip" className="text-foreground/90">Zip Code</Label>
                                    <Input
                                        id="zip"
                                        placeholder="90210"
                                        value={shipping.zip}
                                        onChange={(e) => setShipping((s) => ({ ...s, zip: e.target.value, savedAddressId: null }))}
                                        className="mt-1.5 h-11 rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-slate-300"
                                    />
                                </div>
                                <div>
                                    <Label htmlFor="phone" className="text-foreground/90">Phone Number</Label>
                                    <Input
                                        id="phone"
                                        type="tel"
                                        placeholder="+1 (555) 000-0000"
                                        value={shipping.phone}
                                        onChange={(e) => setShipping((s) => ({ ...s, phone: e.target.value, savedAddressId: null }))}
                                        className="mt-1.5 h-11 rounded-xl bg-muted border-0 focus-visible:ring-2 focus-visible:ring-slate-300"
                                    />
                                </div>
                                {!shipping.savedAddressId && (
                                    <label className="flex items-center gap-2 text-sm text-muted-foreground cursor-pointer">
                                        <input
                                            type="checkbox"
                                            checked={saveAddress}
                                            onChange={(e) => setSaveAddress(e.target.checked)}
                                            className="rounded border-border"
                                        />
                                        Save this address to my profile
                                    </label>
                                )}
                            </div>
                            )}
                            {shippingFee === 0 ? (
                                <p className="text-xs text-emerald-600 mt-3 font-medium">Free shipping on orders over ${PLATFORM_FREE_SHIPPING_MIN}</p>
                            ) : (
                                <p className="text-xs text-muted-foreground mt-3">Shipping: ${shippingFee.toFixed(2)}, Free over ${PLATFORM_FREE_SHIPPING_MIN}</p>
                            )}
                            <div className="mt-6 rounded-xl border border-border p-4 space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Subtotal</span>
                                    <span>${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Shipping</span>
                                    <span>{shippingFee === 0 ? 'Free' : `$${shippingFee.toFixed(2)}`}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">{MARKETPLACE_VAT_LABEL}</span>
                                    <span>${tax.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between font-semibold pt-2 border-t border-border">
                                    <span>Total</span>
                                    <span>${total.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="mt-4">
                                <MarketplaceCheckoutLegalNotice />
                            </div>
                            <label className="flex items-start gap-2 text-sm text-muted-foreground mt-4 cursor-pointer">
                                <input
                                    type="checkbox"
                                    checked={acceptedBuyerTerms}
                                    onChange={(e) => setAcceptedBuyerTerms(e.target.checked)}
                                    className="rounded border-border mt-0.5"
                                />
                                <span>
                                    I agree to the{' '}
                                    <Link to={BUYER_TERMS_PATH} className="text-primary hover:underline">
                                        Marketplace Purchase Terms
                                    </Link>{' '}
                                    and understand products ship from individual sellers.
                                </span>
                            </label>
                        </section>
                    </>
                ) : null}
            </main>

            {!isSuccess && itemCount > 0 && (
                <footer className="fixed bottom-0 left-0 right-0 z-40 bg-card border-t border-slate-200 p-4 safe-area-pb lg:static lg:border-0 lg:bg-transparent lg:pt-0">
                    <div className="max-w-2xl mx-auto flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground text-lg">${total.toFixed(2)}</span>
                            <span className="text-sm text-muted-foreground">{itemCount} {itemCount === 1 ? 'item' : 'items'}</span>
                        </div>
                        <Button
                            className="rounded-xl h-12 bg-primary text-primary-foreground hover:opacity-95 font-semibold gap-2 w-full sm:w-auto px-8"
                            onClick={handleContinueToPayment}
                            disabled={isSubmitting || !acceptedBuyerTerms}
                        >
                            {isSubmitting ? 'Redirecting…' : 'Continue to Payment'}
                            <ArrowRight className="w-4 h-4" />
                        </Button>
                    </div>
                </footer>
            )}
        </div>
    );
}

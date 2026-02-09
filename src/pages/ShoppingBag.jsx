import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { ChevronLeft, MoreHorizontal, Tag, Lock } from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import { Button } from '@/components/ui/button';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { useCart } from '@/components/context/CartContext';
import { useAuth } from '@/lib/AuthContext';
import { createPageUrl } from '@/utils';
import { toast } from 'sonner';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

const SHIPPING_FREE_THRESHOLD = 50;
const TAX_RATE = 0.085;

export default function ShoppingBag() {
    const navigate = useNavigate();
    const { items, isLoading, updateQuantity, removeItem, itemCount } = useCart();
    const { isAuthenticated } = useAuth();
    const [_promoCode, setPromoCode] = useState('');
    const [appliedPromo, _setAppliedPromo] = useState(null);

    const subtotal = items.reduce((sum, i) => sum + Number(i.product?.price ?? 0) * (i.quantity || 0), 0);
    const shipping = subtotal >= SHIPPING_FREE_THRESHOLD ? 0 : 0;
    const tax = Math.round((subtotal + shipping) * TAX_RATE * 100) / 100;
    const total = Math.round((subtotal + shipping + tax) * 100) / 100;

    const handleQuantityChange = (productId, delta) => {
        const item = items.find((i) => i.product_id === productId);
        if (!item) return;
        const next = (item.quantity || 1) + delta;
        if (next < 1) {
            removeItem(productId);
            toast.success('Item removed');
        } else {
            updateQuantity(productId, next);
        }
    };

    const handleSecureCheckout = () => {
        if (itemCount === 0) {
            toast.error('Your bag is empty');
            return;
        }
        if (!isAuthenticated) {
            toast.error('Sign in to checkout');
            navigate(createPageUrl('SignIn') + '?return=' + encodeURIComponent('/Checkout'));
            return;
        }
        navigate(createPageUrl('Checkout'));
    };

    return (
        <div className="min-h-screen bg-background pb-24 lg:pb-8">
            <MetaTags
                title="Shopping Bag – Shop The Barber"
                description="Review your luxury grooming selections and proceed to secure checkout."
            />

            <header className="sticky top-0 z-40 bg-white border-b border-slate-100">
                <div className="w-full max-w-3xl mx-auto px-4 lg:px-8 py-4 flex items-center justify-between">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="p-2 -ml-2 rounded-full text-slate-600 hover:bg-slate-100"
                        aria-label="Back"
                    >
                        <ChevronLeft className="w-5 h-5" />
                    </button>
                    <h1 className="text-xl font-bold text-foreground tracking-tight" style={{ fontFamily: 'var(--font-serif, Georgia, serif)' }}>
                        Shopping Bag
                    </h1>
                    <button type="button" className="p-2 rounded-full text-slate-600 hover:bg-slate-100" aria-label="Options">
                        <MoreHorizontal className="w-5 h-5" />
                    </button>
                </div>
            </header>

            <main className="w-full max-w-3xl mx-auto px-4 lg:px-8 py-6">
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <div className="w-8 h-8 border-2 border-slate-200 border-t-slate-700 rounded-full animate-spin" />
                    </div>
                ) : items.length === 0 ? (
                    <div className="text-center py-16">
                        <p className="text-slate-600 font-medium mb-2">Your bag is empty</p>
                        <p className="text-slate-500 text-sm mb-6">Add premium products from the marketplace.</p>
                        <Link to={createPageUrl('Marketplace')}>
                            <Button className="rounded-xl bg-primary text-primary-foreground hover:opacity-95">Continue Shopping</Button>
                        </Link>
                    </div>
                ) : (
                    <>
                        <ul className="space-y-4 mb-8">
                            {items.map((item) => {
                                const price = Number(item.product?.price ?? 0);
                                const _lineTotal = price * (item.quantity || 1);
                                const details = [item.product?.vendor_name, item.product?.category].filter(Boolean).join(' • ') || 'Premium';
                                return (
                                    <li key={item.product_id} className="rounded-2xl bg-slate-50 border border-slate-100 p-4 flex gap-4">
                                        <div className="w-20 h-20 rounded-xl overflow-hidden bg-slate-200 shrink-0">
                                            <OptimizedImage
                                                src={item.product?.image_url || ''}
                                                alt={item.product?.name || ''}
                                                className="w-full h-full object-cover"
                                                width={80}
                                            />
                                        </div>
                                        <div className="flex-1 min-w-0 flex flex-col">
                                            <p className="font-semibold text-foreground truncate">{item.product?.name || 'Product'}</p>
                                            <p className="text-xs text-slate-500 mt-0.5">{details}</p>
                                            <p className="font-bold text-foreground mt-1">${price.toFixed(2)}</p>
                                            <div className="mt-2 flex items-center rounded-full bg-slate-200/80 overflow-hidden w-fit">
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuantityChange(item.product_id, -1)}
                                                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-300 font-medium"
                                                    aria-label="Decrease quantity"
                                                >
                                                    −
                                                </button>
                                                <span className="w-10 text-center text-sm font-semibold text-foreground">{item.quantity}</span>
                                                <button
                                                    type="button"
                                                    onClick={() => handleQuantityChange(item.product_id, 1)}
                                                    className="w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-300 font-medium"
                                                    aria-label="Increase quantity"
                                                >
                                                    +
                                                </button>
                                            </div>
                                        </div>
                                    </li>
                                );
                            })}
                        </ul>

                        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-4 mb-8">
                            <button
                                type="button"
                                className="w-full flex items-center justify-between text-slate-500 hover:text-slate-700"
                                onClick={() => setPromoCode(appliedPromo ? '' : '')}
                            >
                                <span className="flex items-center gap-2">
                                    <Tag className="w-4 h-4" />
                                    {appliedPromo ? `Promo: ${appliedPromo}` : 'Add promo code'}
                                </span>
                                <ChevronLeft className="w-4 h-4 rotate-180" />
                            </button>
                        </div>

                        <section className="mb-8">
                            <h2 className="font-bold text-foreground mb-3">Summary</h2>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Subtotal</span>
                                    <span className="font-semibold text-foreground">${subtotal.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Shipping</span>
                                    <span className="text-primary font-medium">Free</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-600">Tax</span>
                                    <span className="font-semibold text-foreground">${tax.toFixed(2)}</span>
                                </div>
                            </div>
                            <div className="flex justify-between items-baseline mt-4 pt-4 border-t border-slate-200">
                                <span className="font-bold text-foreground text-lg">Total</span>
                                <span className="font-bold text-foreground text-xl">${total.toFixed(2)}</span>
                            </div>
                        </section>

                        <Button
                            className="w-full rounded-xl h-12 bg-primary text-primary-foreground hover:opacity-95 font-semibold gap-2"
                            onClick={handleSecureCheckout}
                        >
                            <Lock className="w-4 h-4" />
                            Secure Checkout
                        </Button>

                        <p className="text-center text-xs text-slate-400 uppercase tracking-wider mt-6">
                            Complimentary 2-day shipping applied
                        </p>
                    </>
                )}
            </main>

            <ClientBottomNav />
        </div>
    );
}

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { createPageUrl } from '@/components/utils';
import { MetaTags } from '@/components/seo/MetaTags';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { motion, AnimatePresence } from 'framer-motion';
import { Apple, Mail, Lock, User, ArrowLeft, Loader2 } from 'lucide-react';
import { sovereign } from '@/api/apiClient';
import { toast } from 'sonner';

export default function SignIn() {
    const [mode, setMode] = useState('login'); // 'login' | 'register'
    const [isLoading, setIsLoading] = useState(false);

    const [formData, setFormData] = useState({
        email: '',
        password: '',
        full_name: '',
        role: 'client'
    });

    const handleInputChange = (e) => {
        const { id, value } = e.target;
        setFormData(prev => ({ ...prev, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (mode === 'register') {
            const name = (formData.full_name || '').trim();
            if (name.length < 2) {
                toast.error('Please enter your full name (at least 2 characters).');
                return;
            }
            if ((formData.password || '').length < 8) {
                toast.error('Password must be at least 8 characters.');
                return;
            }
        }
        setIsLoading(true);

        try {
            if (mode === 'login') {
                await sovereign.auth.login(formData.email, formData.password);
                toast.success("Welcome back!");
            } else {
                await sovereign.auth.signup(formData.email, formData.password, {
                    full_name: (formData.full_name || '').trim() || 'New User',
                    role: formData.role
                });
                toast.success("Account created successfully!");
            }

            // Redirect back to the page the user came from (e.g. booking flow) or Dashboard
            const urlParams = new URLSearchParams(window.location.search);
            const returnPath = urlParams.get('return'); // from redirectToLogin (e.g. /BookingFlow?barberId=...)
            const next = urlParams.get('next');        // legacy: page name only
            if (returnPath && returnPath.startsWith('/')) {
                window.location.href = returnPath;
            } else if (next) {
                window.location.href = createPageUrl(next);
            } else {
                window.location.href = createPageUrl('Dashboard');
            }

        } catch (err) {
            const isNetworkError = err?.message === 'Failed to fetch' || err?.name === 'TypeError';
            const message = isNetworkError
                ? "Cannot reach the server. Make sure the backend is running (in the server folder: npm run dev)."
                : (err?.message || "Authentication failed. Please try again.");
            toast.error(message);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background text-foreground flex">
            <MetaTags
                title={mode === 'login' ? "Sign In" : "Join the Platform"}
                description="Access your account to book appointments and manage your style."
            />

            {/* Left Side - Brand (Rich Visuals) */}
            <div className="hidden lg:flex lg:w-5/12 relative overflow-hidden bg-muted">
                <OptimizedImage
                    src="https://images.unsplash.com/photo-1599351431202-1e0f0137899a?q=80&w=2000&auto=format&fit=crop"
                    alt="Barber Shop Atmosphere"
                    fill
                    className="opacity-50 object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/30 to-transparent" />
                <div className="relative z-10 flex flex-col justify-end p-20 h-full">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6 }}
                    >
                        <div className="text-primary font-bold mb-4 tracking-widest text-sm">PREMIUM GROOMING</div>
                        <h2 className="text-5xl font-bold text-foreground mb-6 leading-tight">Elevate Your<br />Standard.</h2>
                        <p className="text-xl text-muted-foreground max-w-sm leading-relaxed">
                            Join thousands of professionals and clients setting the new gold standard in personal style.
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Right Side - Functional Form */}
            <div className="w-full lg:w-7/12 flex items-center justify-center p-8 bg-background relative overflow-y-auto">
                <div className="absolute top-8 right-8">
                    <Button variant="ghost" onClick={() => window.location.href = createPageUrl('Home')} className="text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="max-w-md w-full py-12"
                >
                    <div className="text-center mb-10">
                        <motion.div
                            whileHover={{ scale: 1.05 }}
                            className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-6 border border-primary/20"
                        >
                            <span className="text-2xl">💈</span>
                        </motion.div>
                        <h1 className="text-3xl font-bold text-foreground mb-3">
                            {mode === 'login' ? 'Welcome Back' : 'Get Started'}
                        </h1>
                        <p className="text-muted-foreground">
                            {mode === 'login'
                                ? 'Sign in to manage your appointments'
                                : 'Create an account to join the community'}
                        </p>
                    </div>

                    <form onSubmit={handleSubmit} className="space-y-5">
                        <AnimatePresence mode="wait">
                            {mode === 'register' && (
                                <motion.div
                                    initial={{ opacity: 0, height: 0 }}
                                    animate={{ opacity: 1, height: 'auto' }}
                                    exit={{ opacity: 0, height: 0 }}
                                    className="space-y-4 pb-2"
                                >
                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <Label htmlFor="full_name" className="text-muted-foreground ml-1">Full Name</Label>
                                            <div className="relative group">
                                                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                                <Input
                                                    id="full_name"
                                                    placeholder="John Doe"
                                                    required
                                                    className="h-13 bg-card border-border rounded-xl pl-12 focus:ring-primary/50 focus:border-primary transition-all text-foreground"
                                                    value={formData.full_name}
                                                    onChange={handleInputChange}
                                                />
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <Label className="text-muted-foreground ml-1">Account Type</Label>
                                            <div className="grid grid-cols-2 gap-2 bg-muted p-1 rounded-xl border border-border">
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, role: 'client' }))}
                                                    className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.role === 'client' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
                                                >
                                                    Client
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => setFormData(p => ({ ...p, role: 'barber' }))}
                                                    className={`py-2 rounded-lg text-sm font-bold transition-all ${formData.role === 'barber' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'}`}
                                                >
                                                    Barber / Shop
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>

                        <div className="space-y-2">
                            <Label htmlFor="email" className="text-muted-foreground ml-1">Email Address</Label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors" />
                                <Input
                                    id="email"
                                    type="email"
                                    placeholder="name@example.com"
                                    required
                                    className="h-13 bg-card border-border rounded-xl pl-12 focus:ring-primary/50 focus:border-primary transition-all text-foreground"
                                    value={formData.email}
                                    onChange={handleInputChange}
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="flex justify-between items-center ml-1">
                                <Label htmlFor="password" name="password" className="text-muted-foreground">Password</Label>
                                {mode === 'login' && (
                                    <button type="button" className="text-xs text-primary hover:underline">Forgot password?</button>
                                )}
                            </div>
                            <div className="group">
                                <div className="relative">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground group-focus-within:text-primary transition-colors pointer-events-none" />
                                    <Input
                                        id="password"
                                        type="password"
                                        placeholder="••••••••"
                                        required
                                        minLength={8}
                                        className="h-13 bg-card border-border rounded-xl pl-12 focus:ring-primary/50 focus:border-primary transition-all text-foreground"
                                        value={formData.password}
                                        onChange={handleInputChange}
                                    />
                                </div>
                                {mode === 'register' && (
                                    <p className="text-xs text-muted-foreground mt-1 ml-1">At least 8 characters</p>
                                )}
                            </div>
                        </div>

                        <Button
                            type="submit"
                            disabled={isLoading}
                            className="w-full bg-primary text-primary-foreground hover:opacity-95 h-13 text-base rounded-xl font-bold transition-all shadow-lg mt-2 mt-2"
                        >
                            {isLoading ? (
                                <Loader2 className="w-5 h-5 animate-spin" />
                            ) : (
                                mode === 'login' ? 'Sign In' : 'Create Account'
                            )}
                        </Button>
                    </form>

                    <div className="relative py-8">
                        <div className="absolute inset-0 flex items-center">
                            <span className="w-full border-t border-border" />
                        </div>
                        <div className="relative flex justify-center text-xs uppercase">
                            <span className="bg-background px-4 text-muted-foreground font-medium tracking-widest">Or social login</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <Button variant="outline" className="h-12 bg-card border-border hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-all">
                            <Apple className="w-5 h-5 mr-2" /> Apple
                        </Button>
                        <Button variant="outline" className="h-12 bg-card border-border hover:bg-muted rounded-xl text-muted-foreground hover:text-foreground transition-all">
                            <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24"><path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" /><path fill="currentColor" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" /><path fill="currentColor" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.84z" /><path fill="currentColor" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" /></svg>
                            Google
                        </Button>
                    </div>

                    <div className="mt-8 text-center text-sm">
                        <span className="text-muted-foreground">
                            {mode === 'login' ? "Don't have an account?" : "Already have an account?"}
                        </span>
                        <button
                            onClick={() => setMode(mode === 'login' ? 'register' : 'login')}
                            className="ml-2 text-primary font-bold hover:underline transition-all"
                        >
                            {mode === 'login' ? 'Join Now' : 'Sign In'}
                        </button>
                    </div>

                    <p className="text-[10px] text-center text-muted-foreground mt-10 max-w-xs mx-auto leading-relaxed uppercase tracking-widest opacity-70">
                        Encrypted for your protection. 256-bit SSL secure.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

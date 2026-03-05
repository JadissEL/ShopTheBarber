import { SignUp as ClerkSignUp } from '@clerk/react';
import { MetaTags } from '@/components/seo/MetaTags';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/components/utils';

/**
 * Sign Up Page with Clerk
 * 
 * Clerk handles:
 * - Email/password registration
 * - Social sign up (Google, Apple, etc.)
 * - Email verification
 * - User profile creation
 */
export default function SignUp() {
    return (
        <div className="min-h-screen bg-background text-foreground flex">
            <MetaTags
                title="Join the Platform"
                description="Create an account to book appointments and manage your style."
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

            {/* Right Side - Clerk Sign Up Component */}
            <div className="w-full lg:w-7/12 flex items-center justify-center p-8 bg-background relative overflow-y-auto">
                <div className="absolute top-8 right-8">
                    <Button variant="ghost" onClick={() => window.location.href = createPageUrl('Home')} className="text-muted-foreground hover:text-foreground transition-colors">
                        <ArrowLeft className="w-4 h-4 mr-2" /> Back
                    </Button>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md py-12"
                >
                    <ClerkSignUp
                        appearance={{
                            elements: {
                                rootBox: "mx-auto",
                                card: "bg-card border-border shadow-lg",
                                headerTitle: "text-foreground text-2xl font-bold",
                                headerSubtitle: "text-muted-foreground",
                                socialButtonsBlockButton: "border-border hover:bg-muted text-foreground",
                                formButtonPrimary: "bg-primary hover:bg-primary/90 text-primary-foreground",
                                formFieldInput: "bg-card border-border text-foreground",
                                formFieldLabel: "text-muted-foreground",
                                footerActionLink: "text-primary hover:text-primary/90",
                                dividerLine: "bg-border",
                                dividerText: "text-muted-foreground",
                                identityPreviewText: "text-foreground",
                                identityPreviewEditButton: "text-primary",
                                formFieldInputShowPasswordButton: "text-muted-foreground hover:text-foreground",
                                otpCodeFieldInput: "border-border text-foreground",
                                formResendCodeLink: "text-primary hover:text-primary/90",
                                alertText: "text-foreground",
                            },
                        }}
                        routing="path"
                        path="/signup"
                        signInUrl="/signin"
                        redirectUrl="/dashboard"
                        afterSignUpUrl="/dashboard"
                    />

                    <p className="text-[10px] text-center text-muted-foreground mt-10 max-w-xs mx-auto leading-relaxed uppercase tracking-widest opacity-70">
                        Encrypted for your protection. 256-bit SSL secure.
                    </p>
                </motion.div>
            </div>
        </div>
    );
}

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { createPageUrl } from '@/components/utils';

/**
 * OAuth Callback Handler
 * 
 * This page handles the OAuth redirect from Google/Apple.
 * The backend redirects here with a JWT token after successful authentication.
 */
export default function OAuthCallback() {
    const navigate = useNavigate();
    const [status, setStatus] = useState('processing');

    useEffect(() => {
        const handleOAuthCallback = async () => {
            try {
                const urlParams = new URLSearchParams(window.location.search);
                const token = urlParams.get('token');
                const provider = urlParams.get('provider');
                const error = urlParams.get('error');

                if (error) {
                    let errorMessage = 'Authentication failed';
                    if (error === 'oauth_cancelled') {
                        errorMessage = 'Sign-in was cancelled';
                    } else if (error === 'oauth_failed') {
                        errorMessage = 'Authentication failed. Please try again.';
                    }
                    
                    setStatus('error');
                    toast.error(errorMessage);
                    
                    setTimeout(() => {
                        window.location.href = createPageUrl('SignIn');
                    }, 2000);
                    return;
                }

                if (!token) {
                    setStatus('error');
                    toast.error('No authentication token received');
                    setTimeout(() => {
                        window.location.href = createPageUrl('SignIn');
                    }, 2000);
                    return;
                }

                // Store the JWT token
                localStorage.setItem('sovereign_token', token);

                setStatus('success');
                toast.success(`Signed in with ${provider || 'social account'}!`);

                // Fetch user info to determine dashboard
                try {
                    const response = await fetch('/api/auth/me', {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    });

                    if (response.ok) {
                        const user = await response.json();
                        const userRole = user?.role || 'client';
                        const dashTarget = userRole === 'admin' ? 'GlobalFinancials'
                            : ['barber', 'shop_owner'].includes(userRole) ? 'ProviderDashboard'
                            : 'Dashboard';
                        
                        setTimeout(() => {
                            window.location.href = createPageUrl(dashTarget);
                        }, 1000);
                    } else {
                        // Fallback to client dashboard
                        setTimeout(() => {
                            window.location.href = createPageUrl('Dashboard');
                        }, 1000);
                    }
                } catch (err) {
                    // Fallback to client dashboard
                    setTimeout(() => {
                        window.location.href = createPageUrl('Dashboard');
                    }, 1000);
                }

            } catch (err) {
                console.error('OAuth callback error:', err);
                setStatus('error');
                toast.error('An error occurred during sign-in');
                setTimeout(() => {
                    window.location.href = createPageUrl('SignIn');
                }, 2000);
            }
        };

        handleOAuthCallback();
    }, [navigate]);

    return (
        <div className="min-h-screen bg-background flex items-center justify-center">
            <div className="text-center">
                {status === 'processing' && (
                    <>
                        <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                        <p className="text-foreground text-lg font-medium">Completing sign-in...</p>
                        <p className="text-muted-foreground text-sm mt-2">Please wait a moment</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                        </div>
                        <p className="text-foreground text-lg font-medium">Success!</p>
                        <p className="text-muted-foreground text-sm mt-2">Redirecting to your dashboard...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <div className="w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-6 h-6 text-destructive" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </div>
                        <p className="text-foreground text-lg font-medium">Authentication failed</p>
                        <p className="text-muted-foreground text-sm mt-2">Returning to sign-in...</p>
                    </>
                )}
            </div>
        </div>
    );
}

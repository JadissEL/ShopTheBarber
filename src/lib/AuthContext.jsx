import React, { createContext, useState, useContext, useEffect, useRef, useCallback } from 'react';
import { useUser, useAuth as useClerkAuth, useSignIn, useSignUp } from '@clerk/react';
import { sovereign } from '@/api/apiClient';
import { toast } from 'sonner';
import { claimPendingGuestBookings } from '@/lib/guestBooking';
import { createPageUrl } from '@/utils';

const AuthContext = createContext();

const REF_STORAGE_KEY = 'stb_referral_code';

const SYNC_ERROR_DEFAULT =
  'Could not connect your account to the server. Check that the API is running and CLERK_SECRET_KEY is set in server/.env.';

async function tryClaimPendingGuestBookings() {
  try {
    const result = await claimPendingGuestBookings();
    if (result?.linked_count > 0) {
      toast.success(
        result.linked_count === 1
          ? 'Your guest booking is now on your account'
          : `${result.linked_count} guest bookings linked to your account`
      );
      return { status: 'claimed', count: result.linked_count };
    }
    return { status: 'none' };
  } catch (err) {
    return { status: 'failed', reason: err instanceof Error ? err.message : 'claim failed' };
  }
}

async function tryClaimPendingReferral() {
  const code = localStorage.getItem(REF_STORAGE_KEY);
  if (!code?.trim()) return { status: 'none' };
  try {
    const result = await sovereign.referral.claim(code.trim());
    localStorage.removeItem(REF_STORAGE_KEY);
    toast.success(result.message || 'Referral applied, welcome bonus unlocked at checkout!');
    return { status: 'claimed' };
  } catch (err) {
    const msg = err instanceof Error ? err.message : 'Could not apply referral code';
    if (/already|own code|invalid/i.test(msg)) {
      localStorage.removeItem(REF_STORAGE_KEY);
      return { status: 'skipped', reason: msg };
    }
    return { status: 'failed', reason: msg };
  }
}

function mapClerkUser(clerkUser, serverUser) {
  const email = serverUser?.email ?? clerkUser.primaryEmailAddress?.emailAddress;
  return {
    id: serverUser?.id,
    uid: clerkUser.id,
    email,
    full_name: serverUser?.full_name || clerkUser.fullName || clerkUser.firstName || 'User',
    avatar_url: serverUser?.avatar_url || clerkUser.imageUrl,
    role: serverUser?.role || clerkUser.publicMetadata?.role || 'client',
    created_at: serverUser?.created_at || clerkUser.createdAt,
    phone: serverUser?.phone,
    stripe_connect_status: serverUser?.stripe_connect_status,
    stripe_account_id: serverUser?.stripe_account_id,
  };
}

export const AuthProvider = ({ children }) => {
  const { user: clerkUser, isLoaded: userLoaded } = useUser();
  const { isLoaded: sessionLoaded, isSignedIn, signOut, getToken } = useClerkAuth();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();

  const [user, setUser] = useState(null);
  const [syncStatus, setSyncStatus] = useState('idle');
  const [syncError, setSyncError] = useState(null);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({ public_settings: {} });
  const referralClaimAttempted = useRef(false);
  const guestClaimAttempted = useRef(false);
  const autoRetryDone = useRef(false);
  const syncInFlight = useRef(false);
  const syncedClerkIdRef = useRef(null);

  const runBackendSync = useCallback(async () => {
    if (!sessionLoaded || !userLoaded || !isSignedIn || !clerkUser?.id) {
      if (sessionLoaded && !isSignedIn) {
        setUser(null);
        setSyncStatus('idle');
        setSyncError(null);
        localStorage.removeItem('clerk_token');
        autoRetryDone.current = false;
        syncedClerkIdRef.current = null;
      }
      return;
    }

    const clerkId = clerkUser.id;
    if (syncedClerkIdRef.current === clerkId) {
      return;
    }

    if (syncInFlight.current) return;
    syncInFlight.current = true;
    setSyncStatus('syncing');
    setSyncError(null);

    try {
      const token = await getToken();
      if (token) {
        localStorage.setItem('clerk_token', token);
      } else {
        throw new Error('Could not obtain a Clerk session token. Try signing out and back in.');
      }

      const { user: serverUser, error } = await sovereign.auth.meResult();

      if (!serverUser?.id) {
        const message =
          error?.hint && error?.message
            ? `${error.message} ${error.hint}`
            : error?.hint || error?.message || SYNC_ERROR_DEFAULT;

        if (!autoRetryDone.current) {
          autoRetryDone.current = true;
          syncInFlight.current = false;
          await new Promise((r) => setTimeout(r, 800));
          return runBackendSync();
        }

        setUser(null);
        setSyncStatus('error');
        setSyncError(message);
        setAuthError({ type: 'sync_error', message });
        syncedClerkIdRef.current = null;
        return;
      }

      const mappedUser = mapClerkUser(clerkUser, serverUser);
      setUser(mappedUser);
      setSyncStatus('ready');
      setSyncError(null);
      setAuthError(null);
      autoRetryDone.current = false;
      syncedClerkIdRef.current = clerkId;

      void (async () => {
        sovereign.analytics.identify?.();
        const claimResult = await tryClaimPendingReferral();
        if (claimResult.status === 'failed' && !referralClaimAttempted.current) {
          referralClaimAttempted.current = true;
        } else if (claimResult.status === 'claimed' || claimResult.status === 'skipped') {
          referralClaimAttempted.current = true;
        }

        const guestClaim = await tryClaimPendingGuestBookings();
        if (guestClaim.status === 'claimed' || guestClaim.status === 'none') {
          guestClaimAttempted.current = true;
        } else if (!guestClaimAttempted.current) {
          guestClaimAttempted.current = true;
        }
      })();
    } catch (error) {
      console.error('Error syncing Clerk user:', error);
      const message = error instanceof Error ? error.message : SYNC_ERROR_DEFAULT;
      setUser(null);
      setSyncStatus('error');
      setSyncError(message);
      setAuthError({ type: 'sync_error', message });
      syncedClerkIdRef.current = null;
    } finally {
      syncInFlight.current = false;
    }
  }, [sessionLoaded, userLoaded, isSignedIn, clerkUser?.id, getToken]);

  useEffect(() => {
    void runBackendSync();
  }, [runBackendSync]);

  const retrySync = useCallback(async () => {
    autoRetryDone.current = false;
    syncedClerkIdRef.current = null;
    await runBackendSync();
  }, [runBackendSync]);

  const logout = async (shouldRedirect = true) => {
    await signOut();
    setUser(null);
    setSyncStatus('idle');
    setSyncError(null);
    autoRetryDone.current = false;
    syncedClerkIdRef.current = null;
    localStorage.removeItem('clerk_token');

    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    window.location.href = createPageUrl('SignIn');
  };

  const login = async (email, password) => {
    try {
      if (!signIn) throw new Error('SignIn not ready');

      const result = await signIn.create({
        identifier: email,
        password,
      });

      if (result.status === 'complete') {
        await signIn.setActive({ session: result.createdSessionId });
        return { success: true };
      }

      throw new Error('Login incomplete');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  };

  const register = async (email, password, userData) => {
    try {
      if (!signUp) throw new Error('SignUp not ready');

      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName: userData?.full_name?.split(' ')[0] || 'User',
        lastName: userData?.full_name?.split(' ').slice(1).join(' ') || '',
      });

      if (userData?.role) {
        await signUp.update({
          unsafeMetadata: { role: userData.role },
        });
      }

      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      if (result.status === 'complete') {
        await signUp.setActive({ session: result.createdSessionId });
        return { success: true };
      }

      return { success: true, verificationRequired: true };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const checkUserAuth = async () => user;

  const refreshUser = async () => {
    if (!sessionLoaded || !isSignedIn || !clerkUser) return null;
    try {
      const token = await getToken();
      if (token) localStorage.setItem('clerk_token', token);
      const serverUser = await sovereign.auth.me();
      if (!serverUser?.id) return user;
      const mappedUser = mapClerkUser(clerkUser, serverUser);
      setUser(mappedUser);
      setSyncStatus('ready');
      setSyncError(null);
      return mappedUser;
    } catch (error) {
      console.error('Error refreshing user:', error);
      return user;
    }
  };

  const checkAppState = async () => {};

  const role = user?.role ?? 'client';
  const clerkReady = sessionLoaded && userLoaded;
  const isLoading = !clerkReady;
  const isAuthenticated = !!isSignedIn && syncStatus === 'ready' && !!user?.id;
  const isLoadingAuth = !clerkReady || (isSignedIn && (syncStatus === 'syncing' || syncStatus === 'idle'));

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isSignedIn: !!isSignedIn,
        isLoadingAuth,
        isLoading,
        isLoadingPublicSettings,
        authError,
        appPublicSettings,
        role,
        syncStatus,
        syncError,
        retrySync,
        logout,
        navigateToLogin,
        checkAppState,
        checkSession: checkUserAuth,
        login,
        register,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

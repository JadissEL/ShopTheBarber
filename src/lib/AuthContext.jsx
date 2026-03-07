import React, { createContext, useState, useContext, useEffect } from 'react';
import { useUser, useAuth as useClerkAuth, useSignIn, useSignUp } from '@clerk/react';
import { sovereign } from '@/api/apiClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const { user: clerkUser, isLoaded: clerkLoaded, isSignedIn } = useUser();
  const { signOut, getToken } = useClerkAuth();
  const { signIn } = useSignIn();
  const { signUp } = useSignUp();
  
  const [user, setUser] = useState(null);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(false);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState({ public_settings: {} });

  // Sync Clerk user to backend and local state
  useEffect(() => {
    const syncUser = async () => {
      if (clerkLoaded && isSignedIn && clerkUser) {
        try {
          // Get Clerk JWT token
          const token = await getToken();
          
          // Store token for API calls
          if (token) {
            localStorage.setItem('clerk_token', token);
          }

          // Map Clerk user to our user format
          const mappedUser = {
            uid: clerkUser.id,
            email: clerkUser.primaryEmailAddress?.emailAddress,
            full_name: clerkUser.fullName || clerkUser.firstName || 'User',
            avatar_url: clerkUser.imageUrl,
            role: clerkUser.publicMetadata?.role || 'client',
            created_at: clerkUser.createdAt,
          };

          setUser(mappedUser);
          setAuthError(null);
        } catch (error) {
          console.error('Error syncing Clerk user:', error);
          setAuthError({
            type: 'sync_error',
            message: 'Failed to sync user data'
          });
        }
      } else if (clerkLoaded && !isSignedIn) {
        setUser(null);
      }
    };

    syncUser();
  }, [clerkLoaded, isSignedIn, clerkUser, getToken]);

  const logout = async (shouldRedirect = true) => {
    await signOut();
    setUser(null);
    localStorage.removeItem('clerk_token');
    
    if (shouldRedirect) {
      window.location.href = '/';
    }
  };

  const navigateToLogin = () => {
    window.location.href = '/signin';
  };

  // Email/password login via Clerk
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

  // Email/password registration via Clerk
  const register = async (email, password, userData) => {
    try {
      if (!signUp) throw new Error('SignUp not ready');
      
      const result = await signUp.create({
        emailAddress: email,
        password,
        firstName: userData?.full_name?.split(' ')[0] || 'User',
        lastName: userData?.full_name?.split(' ').slice(1).join(' ') || '',
      });

      // Set role in public metadata
      if (userData?.role) {
        await signUp.update({
          unsafeMetadata: { role: userData.role }
        });
      }

      // Send email verification
      await signUp.prepareEmailAddressVerification({ strategy: 'email_code' });

      if (result.status === 'complete') {
        await signUp.setActive({ session: result.createdSessionId });
        return { success: true };
      }
      
      // If verification needed, return pending status
      return { success: true, verificationRequired: true };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  };

  const checkUserAuth = async () => {
    // Clerk handles auth checking automatically
    return user;
  };

  const checkAppState = async () => {
    // No-op for Clerk - it handles state automatically
  };

  const role = user?.role ?? 'client';
  const isLoading = !clerkLoaded;
  const isAuthenticated = isSignedIn; // Use Clerk's auth state directly
  const isLoadingAuth = !clerkLoaded;

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoading,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      role,
      logout,
      navigateToLogin,
      checkAppState,
      checkSession: checkUserAuth,
      login,
      register
    }}>
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

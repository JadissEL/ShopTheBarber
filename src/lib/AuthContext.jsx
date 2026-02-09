import React, { createContext, useState, useContext, useEffect } from 'react';
import { sovereign } from '@/api/apiClient';
import { appParams } from '@/lib/app-params';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [appPublicSettings, setAppPublicSettings] = useState(null); // Contains only { id, public_settings }

  useEffect(() => {
    checkAppState();
  }, []);

  const checkAppState = async () => {
    try {
      setIsLoadingPublicSettings(true);
      setAuthError(null);

      // Sovereign Mode: Skip sovereign public settings check
      // Directly check for user authentication via our sovereign backend
      await checkUserAuth();

      // Mock public settings to keep downstream components happy
      setAppPublicSettings({ public_settings: {} });
      setIsLoadingPublicSettings(false);

    } catch (error) {
      console.error('Unexpected error:', error);
      setAuthError({
        type: 'unknown',
        message: error.message || 'An unexpected error occurred'
      });
      setIsLoadingPublicSettings(false);
      setIsLoadingAuth(false);
    }
  };

  const checkUserAuth = async () => {
    try {
      // Now check if the user is authenticated
      setIsLoadingAuth(true);
      const currentUser = await sovereign.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setIsLoadingAuth(false);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);

      // If user auth fails, it might be an expired token
      if (error.status === 401 || error.status === 403) {
        setAuthError({
          type: 'auth_required',
          message: 'Authentication required'
        });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      sovereign.auth.logout(window.location.href);
    } else {
      sovereign.auth.logout();
    }
  };

  const navigateToLogin = () => {
    sovereign.auth.redirectToLogin(window.location.href);
  };

  const login = async (email, password) => {
    try {
      setIsLoadingAuth(true);
      const data = await sovereign.auth.login(email, password);
      const userProfile = await sovereign.auth.me();
      setUser(userProfile);
      setIsAuthenticated(true);
      setAuthError(null);
      return data;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const register = async (email, password, userData) => {
    try {
      setIsLoadingAuth(true);
      const data = await sovereign.auth.signup(email, password, userData);
      const userProfile = await sovereign.auth.me();
      setUser(userProfile);
      setIsAuthenticated(true);
      setAuthError(null);
      return data;
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const role = user?.role ?? 'client';
  const isLoading = isLoadingAuth;

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

import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';
import { APP_ZONES } from '@/components/navigationConfig';

/**
 * APP LAYOUT
 * 
 * Layout wrapper for authenticated app pages (CLIENT, PROVIDER, ADMIN zones).
 * Unified light experience: all zones use bg-background and design tokens.
 */
export default function AppLayout({ children, zone, branding: _branding, menuItems: _menuItems }) {
  const [_isSidebarOpen, _setIsSidebarOpen] = useState(false);
  const _location = useLocation();

  const _handleLogout = async () => {
    await sovereign.auth.logout();
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground">
      {/* Skip Link for accessibility */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-background focus:text-foreground focus:border focus:border-border focus:rounded-md shadow-lg"
      >
        Skip to content
      </a>

      {/* 
        Children are rendered directly here.
        GlobalNavigation (sticky) is passed as first child from Layout.jsx.
        This ensures sticky positioning works correctly since it's a direct
        child of the flex-col container.
      */}
      {children}
    </div>
  );
}

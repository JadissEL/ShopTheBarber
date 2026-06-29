import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { sovereign } from '@/api/apiClient';

/**
 * APP LAYOUT
 *
 * Layout wrapper for authenticated app pages (CLIENT, PROVIDER, ADMIN zones).
 * Shell uses design tokens (`bg-background`). Provider/admin zones also set `forcedTheme="dark"` in Layout.jsx ThemeProvider alongside this shell.
 */
export default function AppLayout({ children, zone: _zone, branding: _branding, menuItems: _menuItems }) {
  const [_isSidebarOpen, _setIsSidebarOpen] = useState(false);
  const _location = useLocation();

  const _handleLogout = async () => {
    await sovereign.auth.logout();
  };

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground stb-site-bg">
      {/* Skip link: single instance in Layout.jsx (SkipLink) avoids duplicate focus targets */}

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

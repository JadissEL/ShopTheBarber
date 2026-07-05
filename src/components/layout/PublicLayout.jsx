import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';
import ProviderBottomNav from '@/components/layout/ProviderBottomNav';
import { useAuth } from '@/lib/AuthContext';
import { useEffectiveRole } from '@/hooks/useEffectiveRole';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { shouldShowClientBottomNav, shouldShowProviderBottomNav } from '@/lib/mobileLayout';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getPublicNavItems, getPublicBusinessNavItems } from '@/lib/featureRegistry';

export default function PublicLayout({ children }) {
  const { isAuthenticated } = useAuth();
  const { effectiveRole } = useEffectiveRole();
  const isDesktop = useIsDesktop();
  const location = useLocation();
  const showClientBottomNav = shouldShowClientBottomNav({
    pathname: location.pathname,
    isAuthenticated,
    isDesktop,
    role: effectiveRole,
  });
  const showProviderBottomNav = shouldShowProviderBottomNav({
    pathname: location.pathname,
    isAuthenticated,
    isDesktop,
    role: effectiveRole,
  });
  const showBottomNav = showClientBottomNav || showProviderBottomNav;

  const navLinks = getPublicNavItems();
  const businessLinks = getPublicBusinessNavItems();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground stb-site-bg stb-page transition-colors duration-300">
      <Navbar navLinks={navLinks} businessLinks={businessLinks} />

      <div className="flex flex-1 min-h-0">
        <main
          id="main-content"
          className={cn(
            'flex-1 min-w-0 focus:outline-none',
            showBottomNav ? 'pb-nav lg:pb-0' : 'pb-0',
          )}
          tabIndex="-1"
        >
          {children}
        </main>
      </div>

      <ClientBottomNav />
      {showProviderBottomNav ? <ProviderBottomNav /> : null}

      <div className={cn(showBottomNav ? 'hidden lg:block' : 'block')}>
        <Footer />
      </div>
    </div>
  );
}

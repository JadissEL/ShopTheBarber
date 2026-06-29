import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';
import ClientDesktopSidebar from '@/components/layout/ClientDesktopSidebar';
import { useAuth } from '@/lib/AuthContext';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { shouldShowClientBottomNav } from '@/lib/mobileLayout';
import { useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import { getPublicNavItems, getPublicBusinessNavItems } from '@/lib/featureRegistry';

export default function PublicLayout({ children }) {
  const { isAuthenticated } = useAuth();
  const isDesktop = useIsDesktop();
  const location = useLocation();
  const showBottomNav = shouldShowClientBottomNav({
    pathname: location.pathname,
    isAuthenticated,
    isDesktop,
  });

  const navLinks = getPublicNavItems();
  const businessLinks = getPublicBusinessNavItems();

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground stb-site-bg transition-colors duration-300">
      <Navbar navLinks={navLinks} businessLinks={businessLinks} />

      <div className={cn('flex flex-1 min-h-0', isAuthenticated && isDesktop && 'lg:flex-row')}>
        {isAuthenticated && isDesktop && <ClientDesktopSidebar />}

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

      <div className={cn(showBottomNav ? 'hidden lg:block' : 'block')}>
        <Footer />
      </div>
    </div>
  );
}

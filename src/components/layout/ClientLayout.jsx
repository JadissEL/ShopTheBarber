import ClientDesktopSidebar from '@/components/layout/ClientDesktopSidebar';
import ClientBottomNav from '@/components/dashboard/ClientBottomNav';

/**
 * Client zone layout: desktop = sidebar + main; mobile = main + bottom nav.
 * ClientBottomNav is rendered once here; hidden on desktop via useIsDesktop.
 * Breakpoint: lg (1024px).
 */
export default function ClientLayout({ children }) {
  return (
    <div className="flex-1 flex min-h-0 bg-background">
      <ClientDesktopSidebar />
      <main id="main-content" className="flex-1 min-w-0 overflow-auto pb-20 lg:pb-0">
        {children}
      </main>
      <ClientBottomNav />
    </div>
  );
}

import ClientDesktopSidebar from '@/components/layout/ClientDesktopSidebar';

/**
 * Client zone layout: desktop = sidebar + main; mobile = main only.
 * Bottom nav is rendered by each page and hidden on desktop via ClientBottomNav.
 * Breakpoint: lg (1024px).
 */
export default function ClientLayout({ children }) {
  return (
    <div className="flex-1 flex min-h-0 bg-background">
      <ClientDesktopSidebar />
      <main id="main-content" className="flex-1 min-w-0 overflow-auto">
        {children}
      </main>
    </div>
  );
}

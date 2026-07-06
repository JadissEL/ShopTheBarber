import ProviderDesktopSidebar from '@/components/layout/ProviderDesktopSidebar';
import ProviderBottomNav from '@/components/layout/ProviderBottomNav';
import { DashboardShellProvider } from '@/components/layout/DashboardShellContext';
import { DashboardBreadcrumbProvider } from '@/components/layout/DashboardBreadcrumbContext';
import DashboardBreadcrumbs from '@/components/layout/DashboardBreadcrumbs';

/**
 * Provider zone layout: desktop = sidebar + main; mobile = main + bottom nav.
 * Mirrors ClientLayout — persistent shell for all provider workflows.
 */
export default function ProviderLayout({ children }) {
  return (
    <DashboardShellProvider>
      <DashboardBreadcrumbProvider>
        <div className="flex-1 flex min-h-0 bg-background stb-site-bg">
          <ProviderDesktopSidebar />
          <main id="main-content" className="flex-1 min-w-0 flex flex-col overflow-auto pb-nav lg:pb-0">
            <DashboardBreadcrumbs />
            <div className="flex-1 min-h-0">{children}</div>
          </main>
          <ProviderBottomNav />
        </div>
      </DashboardBreadcrumbProvider>
    </DashboardShellProvider>
  );
}

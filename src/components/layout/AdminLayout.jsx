import AdminDesktopSidebar from '@/components/layout/AdminDesktopSidebar';
import AdminBottomNav from '@/components/layout/AdminBottomNav';
import { DashboardShellProvider } from '@/components/layout/DashboardShellContext';
import { DashboardBreadcrumbProvider } from '@/components/layout/DashboardBreadcrumbContext';
import DashboardBreadcrumbs from '@/components/layout/DashboardBreadcrumbs';

/**
 * Admin console layout: desktop = sidebar + main; mobile = main + bottom nav.
 * Mirrors ClientLayout — persistent shell for all platform admin workflows.
 */
export default function AdminLayout({ children }) {
  return (
    <DashboardShellProvider>
      <DashboardBreadcrumbProvider>
        <div className="flex-1 flex min-h-0 bg-background stb-site-bg">
          <AdminDesktopSidebar />
          <main id="main-content" className="flex-1 min-w-0 flex flex-col overflow-auto pb-nav lg:pb-0">
            <DashboardBreadcrumbs />
            <div className="flex-1 min-h-0">{children}</div>
          </main>
          <AdminBottomNav />
        </div>
      </DashboardBreadcrumbProvider>
    </DashboardShellProvider>
  );
}

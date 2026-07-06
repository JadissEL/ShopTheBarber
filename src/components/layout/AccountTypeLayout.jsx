import AccountTypeDesktopSidebar from '@/components/layout/AccountTypeDesktopSidebar';
import AccountTypeBottomNav from '@/components/layout/AccountTypeBottomNav';
import { DashboardShellProvider } from '@/components/layout/DashboardShellContext';
import { DashboardBreadcrumbProvider } from '@/components/layout/DashboardBreadcrumbContext';
import DashboardBreadcrumbs from '@/components/layout/DashboardBreadcrumbs';

export default function AccountTypeLayout({ navItems, brandLabel, children }) {
  return (
    <DashboardShellProvider>
      <DashboardBreadcrumbProvider>
        <div className="flex-1 flex min-h-0 bg-background stb-site-bg">
          <AccountTypeDesktopSidebar navItems={navItems} brandLabel={brandLabel} />
          <main id="main-content" className="flex-1 min-w-0 flex flex-col overflow-auto pb-nav lg:pb-0">
            <DashboardBreadcrumbs />
            <div className="flex-1 min-h-0">{children}</div>
          </main>
          <AccountTypeBottomNav navItems={navItems} />
        </div>
      </DashboardBreadcrumbProvider>
    </DashboardShellProvider>
  );
}

import AccountTypeDashboard from '@/components/dashboard/AccountTypeDashboard';
import { COMPANY_NAV } from '@/lib/accountTypeNav';

export default function CompanyDashboard() {
  return (
    <AccountTypeDashboard
      label="Company"
      title="Company dashboard"
      subtitle="Manage recruitment, employer branding, and company marketplace presence."
      quickLinks={COMPANY_NAV.filter((n) => n.page !== 'CompanyDashboard')}
    />
  );
}

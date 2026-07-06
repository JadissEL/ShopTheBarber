import AccountTypeDashboard from '@/components/dashboard/AccountTypeDashboard';
import { BLOGGER_NAV } from '@/lib/accountTypeNav';

export default function BloggerDashboard() {
  return (
    <AccountTypeDashboard
      label="Blogger"
      title="Blogger dashboard"
      subtitle="Publish content, engage your audience, and book services as a client."
      quickLinks={BLOGGER_NAV.filter((n) => n.page !== 'BloggerDashboard')}
    />
  );
}

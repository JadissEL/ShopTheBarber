import AccountTypeDashboard from '@/components/dashboard/AccountTypeDashboard';
import { SELLER_NAV } from '@/lib/accountTypeNav';

export default function SellerDashboard() {
  return (
    <AccountTypeDashboard
      label="Seller"
      title="Seller dashboard"
      subtitle="Manage your product catalog, orders, and marketplace performance."
      quickLinks={SELLER_NAV.filter((n) => n.page !== 'SellerDashboard')}
    />
  );
}

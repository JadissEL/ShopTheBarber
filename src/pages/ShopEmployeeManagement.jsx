import { Navigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';

/** Legacy route, redirects to the live team management console. */
export default function ShopEmployeeManagement() {
  return <Navigate to={createPageUrl('StaffRoster')} replace />;
}

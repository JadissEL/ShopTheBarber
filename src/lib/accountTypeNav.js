import {
  LayoutDashboard,
  ShoppingBag,
  Package,
  Briefcase,
  Users,
  PenLine,
  Search,
  MessageSquare,
  Settings,
} from 'lucide-react';

/** @typedef {{ label: string, page: string, icon: import('lucide-react').LucideIcon, feature?: string, capability?: string }} AccountTypeNavItem */

/** @type {AccountTypeNavItem[]} */
export const SELLER_NAV = [
  { label: 'Dashboard', page: 'SellerDashboard', icon: LayoutDashboard },
  { label: 'Products', page: 'ProviderMarketplaceProducts', icon: Package, feature: 'marketplace', capability: 'product.write' },
  { label: 'Orders', page: 'SellerOrders', icon: ShoppingBag, feature: 'marketplace', capability: 'order.manage' },
  { label: 'Jobs', page: 'MyJobs', icon: Briefcase, feature: 'careers', capability: 'job.write' },
  { label: 'Settings', page: 'SellerSettings', icon: Settings },
];

/** @type {AccountTypeNavItem[]} */
export const COMPANY_NAV = [
  { label: 'Dashboard', page: 'CompanyDashboard', icon: LayoutDashboard },
  { label: 'Jobs', page: 'MyJobs', icon: Briefcase, feature: 'careers', capability: 'job.write' },
  { label: 'Applicants', page: 'ApplicantReview', icon: Users, feature: 'careers', capability: 'job.write' },
  { label: 'Products', page: 'ProviderMarketplaceProducts', icon: Package, feature: 'marketplace', capability: 'company.commerce' },
  { label: 'Settings', page: 'AccountSettings', icon: Settings },
];

/** @type {AccountTypeNavItem[]} */
export const BLOGGER_NAV = [
  { label: 'Dashboard', page: 'BloggerDashboard', icon: LayoutDashboard },
  { label: 'Explore', page: 'Explore', icon: Search },
  { label: 'Articles', page: 'ProviderBlogArticles', icon: PenLine, feature: 'content', capability: 'article.write' },
  { label: 'Products', page: 'ProviderMarketplaceProducts', icon: Package, feature: 'marketplace', capability: 'product.write' },
  { label: 'Messages', page: 'Chat', icon: MessageSquare, feature: 'communication' },
  { label: 'Settings', page: 'AccountSettings', icon: Settings },
];

export { filterNavItemsByCapabilities } from '@/lib/navCapabilities';

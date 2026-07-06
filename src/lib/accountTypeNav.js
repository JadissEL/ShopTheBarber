import { LayoutDashboard, ShoppingBag, Package, FileText, Briefcase, Users, PenLine, Search, MessageSquare } from 'lucide-react';

export const SELLER_NAV = [
  { label: 'Dashboard', page: 'SellerDashboard', icon: LayoutDashboard },
  { label: 'Products', page: 'ProviderMarketplaceProducts', icon: Package },
  { label: 'Orders', page: 'SellerOrders', icon: ShoppingBag },
  { label: 'Blog', page: 'ProviderBlogArticles', icon: FileText },
  { label: 'Settings', page: 'ProviderSettings', icon: Users },
];

export const COMPANY_NAV = [
  { label: 'Dashboard', page: 'CompanyDashboard', icon: LayoutDashboard },
  { label: 'Jobs', page: 'MyJobs', icon: Briefcase },
  { label: 'Applicants', page: 'ApplicantReview', icon: Users },
  { label: 'Products', page: 'ProviderMarketplaceProducts', icon: Package },
  { label: 'Settings', page: 'AccountSettings', icon: Users },
];

export const BLOGGER_NAV = [
  { label: 'Dashboard', page: 'BloggerDashboard', icon: LayoutDashboard },
  { label: 'Explore', page: 'Explore', icon: Search },
  { label: 'Articles', page: 'ProviderBlogArticles', icon: PenLine },
  { label: 'Messages', page: 'Chat', icon: MessageSquare },
  { label: 'Settings', page: 'AccountSettings', icon: Users },
];

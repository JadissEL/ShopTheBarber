import { LayoutDashboard } from 'lucide-react';
import { IcpPageLayout } from '@/components/gtm/IcpPageLayout';

export default function ForNetworkAdmins() {
  return (
    <IcpPageLayout
      title="For Network & Franchise Admins"
      description="Multi-location barbershop groups: centralized promos, financial roll-ups, provider insights, and pilot-friendly onboarding on ShopTheBarber."
      canonicalPath="/for-networks"
      badge="ICP, Network admin"
      headline="One network. Many locations. One source of truth."
      subhead="Franchise groups, school chains, and multi-shop operators need admin-grade visibility, not another consumer marketplace login. ShopTheBarber gives network admins roll-up analytics, promo targeting, and provider health without forcing each shop into a commission model."
      icon={<LayoutDashboard className="w-12 h-12" />}
      pains={[
        'Each location reports numbers differently and HQ finds out too late',
        'Brand-wide promos are impossible to target without manual spreadsheets',
        'Onboarding a new shop takes weeks of custom setup',
        'You need pilot control in one city before a national rollout',
      ]}
      wins={[
        {
          title: 'Admin financials',
          body: 'Global financials, provider insights, and product analytics across the network.',
        },
        {
          title: 'Targeted promos',
          body: 'Run city, shop, or audience-specific campaigns from one admin console.',
        },
        {
          title: 'Pilot-first rollout',
          body: 'Launch 5-10 shops in a single city, prove ROI, then expand with the same playbook.',
        },
      ]}
      ctaLabel="Talk about a network pilot"
      ctaHref="/pilot"
      secondaryHref="/pricing"
      secondaryLabel="Pricing overview"
    />
  );
}

import React, { useState } from "react";
import { DashboardLayout } from "./dashboard-layout";
import { AnalyticsCard } from "./analytics-card";
import { ChartContainer, SimpleLineChart } from "./chart-container";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import MoroccanPattern from "@/components/ui/MoroccanPattern";
import { MoroccanScissors } from "@/components/ui/MoroccanIcons";
import { cn } from "@/lib/utils";

export const DashboardShowcase = () => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'barber' | 'client'>('admin');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  // Mock data for charts
  const revenueData = [
    { label: 'Jan', value: 12000 },
    { label: 'Fév', value: 15000 },
    { label: 'Mar', value: 18000 },
    { label: 'Avr', value: 22000 },
    { label: 'Mai', value: 25000 },
    { label: 'Jun', value: 28000 },
  ];

  const appointmentData = [
    { label: 'Lun', value: 45 },
    { label: 'Mar', value: 52 },
    { label: 'Mer', value: 38 },
    { label: 'Jeu', value: 61 },
    { label: 'Ven', value: 67 },
    { label: 'Sam', value: 73 },
    { label: 'Dim', value: 28 },
  ];

  const userGrowthData = [
    { label: 'Jan', value: 150 },
    { label: 'Fév', value: 180 },
    { label: 'Mar', value: 220 },
    { label: 'Avr', value: 280 },
    { label: 'Mai', value: 320 },
    { label: 'Jun', value: 380 },
  ];

  const getSidebarItems = (role: string) => {
    const baseItems = [
      {
        title: 'Tableau de bord',
        href: '/dashboard',
        icon: (
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
          </svg>
        ),
      },
    ];

    switch (role) {
      case 'admin':
        return [
          ...baseItems,
          {
            title: 'Utilisateurs',
            href: '/admin/users',
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
              </svg>
            ),
            badge: 15,
          },
          {
            title: 'Barbiers',
            href: '/admin/barbers',
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            ),
            badge: 8,
          },
          {
            title: 'Analytics',
            href: '/admin/analytics',
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
          },
          {
            title: 'Modération',
            href: '/admin/moderation',
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
            badge: 3,
          },
        ];
      case 'barber':
        return [
          ...baseItems,
          {
            title: 'Rendez-vous',
            href: '/barber/appointments',
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
            badge: 12,
          },
          {
            title: 'Clients',
            href: '/barber/clients',
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ),
          },
          {
            title: 'Revenus',
            href: '/barber/earnings',
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            ),
          },
          {
            title: 'Services',
            href: '/barber/services',
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            ),
          },
        ];
      case 'client':
        return [
          ...baseItems,
          {
            title: 'Mes RDV',
            href: '/client/appointments',
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
            badge: 2,
          },
          {
            title: 'Barbiers',
            href: '/client/barbers',
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            ),
          },
          {
            title: 'Favoris',
            href: '/client/favorites',
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            ),
          },
          {
            title: 'Historique',
            href: '/client/history',
            icon: (
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            ),
          },
        ];
      default:
        return baseItems;
    }
  };

  const getAnalyticsData = (role: string) => {
    switch (role) {
      case 'admin':
        return [
          {
            title: 'Utilisateurs Total',
            value: '2,847',
            change: 12.5,
            changeLabel: 'vs mois dernier',
            icon: <MoroccanScissors size={20} color="#C7A253" />, // Moroccan icon
            trend: 'up' as const,
            variant: 'info' as const,
            pattern: true, // custom flag to add pattern
          },
          {
            title: 'Barbiers Actifs',
            value: '156',
            change: 8.2,
            changeLabel: 'vs mois dernier',
            icon: (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zM21 5a2 2 0 00-2-2h-4a2 2 0 00-2 2v12a4 4 0 004 4h4a2 2 0 002-2V5z" />
              </svg>
            ),
            trend: 'up' as const,
            variant: 'success' as const,
          },
          {
            title: 'Réservations',
            value: '1,234',
            change: 15.7,
            changeLabel: 'vs mois dernier',
            icon: (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
            trend: 'up' as const,
            variant: 'warning' as const,
          },
          {
            title: 'Revenus Total',
            value: '45,230 MAD',
            change: 22.3,
            changeLabel: 'vs mois dernier',
            icon: (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            ),
            trend: 'up' as const,
            variant: 'success' as const,
          },
        ];
      case 'barber':
        return [
          {
            title: 'RDV Aujourd\'hui',
            value: '8',
            change: 2,
            changeLabel: 'vs hier',
            icon: (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
            trend: 'up' as const,
            variant: 'success' as const,
          },
          {
            title: 'Clients Fidèles',
            value: '24',
            change: 5.2,
            changeLabel: 'vs mois dernier',
            icon: (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            ),
            trend: 'up' as const,
            variant: 'info' as const,
          },
          {
            title: 'Note Moyenne',
            value: '4.8',
            change: 0.2,
            changeLabel: 'vs mois dernier',
            icon: (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            ),
            trend: 'up' as const,
            variant: 'warning' as const,
          },
          {
            title: 'Revenus Mois',
            value: '3,450 MAD',
            change: 12.8,
            changeLabel: 'vs mois dernier',
            icon: (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            ),
            trend: 'up' as const,
            variant: 'success' as const,
          },
        ];
      case 'client':
        return [
          {
            title: 'RDV Prochains',
            value: '3',
            change: 1,
            changeLabel: 'vs semaine dernière',
            icon: (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            ),
            trend: 'up' as const,
            variant: 'info' as const,
          },
          {
            title: 'Barbiers Favoris',
            value: '5',
            change: 0,
            changeLabel: 'vs mois dernier',
            icon: (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            ),
            trend: 'neutral' as const,
            variant: 'default' as const,
          },
          {
            title: 'Visites Total',
            value: '12',
            change: 2,
            changeLabel: 'vs mois dernier',
            icon: (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            ),
            trend: 'up' as const,
            variant: 'success' as const,
          },
          {
            title: 'Économies',
            value: '180 MAD',
            change: 15.5,
            changeLabel: 'vs mois dernier',
            icon: (
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            ),
            trend: 'up' as const,
            variant: 'warning' as const,
          },
        ];
      default:
        return [];
    }
  };

  return (
    <DashboardLayout
      title="Dashboard Showcase"
      subtitle="Démonstration des composants dashboard avec style marocain"
      userRole={selectedRole}
      notifications={5}
      sidebarItems={getSidebarItems(selectedRole)}
      actions={
        <div className="flex items-center space-x-2">
          <select
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value as any)}
            className="px-3 py-1 border border-moroccan-charcoal/20 rounded-md text-sm bg-white"
          >
            <option value="admin">Admin</option>
            <option value="barber">Barbier</option>
            <option value="client">Client</option>
          </select>
          <Button variant="outline" size="sm">
            <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Exporter
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getAnalyticsData(selectedRole).map((card, index) => (
            <Card
              key={card.title}
              className={cn(
                'relative',
                card.pattern ? 'moroccan-bg overflow-hidden' : '',
              )}
            >
              {card.pattern && (
                <MoroccanPattern className="absolute inset-0 w-full h-full" color="#C7A253" opacity={0.10} size={96} style={{zIndex:0}} />
              )}
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-moroccan-charcoal">
                  {card.title}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <AnalyticsCard
                  title={card.title}
                  value={card.value}
                  change={card.change}
                  changeLabel={card.changeLabel}
                  icon={card.icon}
                  trend={card.trend}
                  variant={card.variant}
                />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer
            title="Évolution des Revenus"
            subtitle="Performance financière sur 6 mois"
            periodOptions={[
              { value: 'weekly', label: 'Hebdomadaire' },
              { value: 'monthly', label: 'Mensuel' },
            ]}
            selectedPeriod={selectedPeriod}
            onPeriodChange={setSelectedPeriod}
            showLegend
            legendItems={[
              { label: 'Revenus', color: 'hsl(var(--moroccan-gold))', value: '45,230 MAD' },
            ]}
          >
            <SimpleLineChart data={revenueData} height={300} />
          </ChartContainer>

          <ChartContainer
            title="Rendez-vous par Jour"
            subtitle="Activité de la semaine"
            showLegend
            legendItems={[
              { label: 'RDV', color: 'hsl(var(--moroccan-green))', value: '364 total' },
            ]}
          >
            <SimpleLineChart data={appointmentData} height={300} />
          </ChartContainer>
        </div>

        {/* Additional Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="bg-white shadow-moroccan">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-moroccan-charcoal">
                Actions Rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button variant="outline" size="sm" className="w-full justify-start">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Nouveau Rendez-vous
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-5 5v-5zM4 19h6v-2H4v2zM4 15h6v-2H4v2zM4 11h6V9H4v2zM4 7h6V5H4v2zM10 7h10V5H10v2zM10 11h10V9H10v2zM10 15h10v-2H10v2zM10 19h10v-2H10v2z" />
                </svg>
                Voir Rapports
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start">
                <svg className="h-4 w-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Paramètres
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-moroccan">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-moroccan-charcoal">
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg">
                <div className="h-2 w-2 bg-green-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">Nouveau client</p>
                  <p className="text-xs text-green-700">Ahmed a réservé un RDV</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg">
                <div className="h-2 w-2 bg-blue-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">Paiement reçu</p>
                  <p className="text-xs text-blue-700">150 MAD de Youssef</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 bg-amber-50 rounded-lg">
                <div className="h-2 w-2 bg-amber-500 rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">Avis positif</p>
                  <p className="text-xs text-amber-700">5 étoiles de Karim</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white shadow-moroccan">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg text-moroccan-charcoal">
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-moroccan-darkgrey">Taux de satisfaction</span>
                  <span className="font-medium text-moroccan-charcoal">94%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-moroccan-gold h-2 rounded-full" style={{ width: '94%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-moroccan-darkgrey">Clients fidèles</span>
                  <span className="font-medium text-moroccan-charcoal">78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-moroccan-green h-2 rounded-full" style={{ width: '78%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-moroccan-darkgrey">Disponibilité</span>
                  <span className="font-medium text-moroccan-charcoal">92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-moroccan-copper h-2 rounded-full" style={{ width: '92%' }}></div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}; 
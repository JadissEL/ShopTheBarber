import React, { useState } from "react";
import { DashboardLayout } from "./dashboard-layout";
import { MoroccanAnalyticsCard } from "./moroccan-analytics-card";
import { MoroccanChartContainer, MoroccanLineChart } from "./moroccan-chart-container";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import MoroccanPattern from "@/components/ui/MoroccanPattern";
import { MoroccanLantern, MoroccanArch, MoroccanScissors, MoroccanStar } from "@/components/ui/MoroccanIcons";
import { cn } from "@/lib/utils";

export const MoroccanDashboardShowcase = () => {
  const [selectedRole, setSelectedRole] = useState<'admin' | 'barber' | 'client'>('admin');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');

  // Enhanced mock data for charts
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
            icon: <MoroccanStar size={16} />,
            badge: 15,
          },
          {
            title: 'Barbiers',
            href: '/admin/barbers',
            icon: <MoroccanScissors size={16} />,
            badge: 8,
          },
          {
            title: 'Analytics',
            href: '/admin/analytics',
            icon: <MoroccanArch size={16} />,
          },
          {
            title: 'Modération',
            href: '/admin/moderation',
            icon: <MoroccanLantern size={16} />,
            badge: 3,
          },
        ];
      case 'barber':
        return [
          ...baseItems,
          {
            title: 'Rendez-vous',
            href: '/barber/appointments',
            icon: <MoroccanStar size={16} />,
            badge: 12,
          },
          {
            title: 'Clients',
            href: '/barber/clients',
            icon: <MoroccanArch size={16} />,
          },
          {
            title: 'Revenus',
            href: '/barber/earnings',
            icon: <MoroccanLantern size={16} />,
          },
          {
            title: 'Services',
            href: '/barber/services',
            icon: <MoroccanScissors size={16} />,
          },
        ];
      case 'client':
        return [
          ...baseItems,
          {
            title: 'Mes RDV',
            href: '/client/appointments',
            icon: <MoroccanStar size={16} />,
            badge: 2,
          },
          {
            title: 'Barbiers',
            href: '/client/barbers',
            icon: <MoroccanScissors size={16} />,
          },
          {
            title: 'Favoris',
            href: '/client/favorites',
            icon: <MoroccanArch size={16} />,
          },
          {
            title: 'Historique',
            href: '/client/history',
            icon: <MoroccanLantern size={16} />,
          },
        ];
      default:
        return baseItems;
    }
  };

  const getMoroccanAnalyticsData = (role: string) => {
    switch (role) {
      case 'admin':
        return [
          {
            title: 'Utilisateurs Total',
            value: '2,847',
            change: 12.5,
            changeLabel: 'vs mois dernier',
            moroccanIcon: 'star' as const,
            trend: 'up' as const,
            variant: 'premium' as const,
            showPattern: true,
            gradient: true,
          },
          {
            title: 'Barbiers Actifs',
            value: '156',
            change: 8.2,
            changeLabel: 'vs mois dernier',
            moroccanIcon: 'scissors' as const,
            trend: 'up' as const,
            variant: 'success' as const,
            showPattern: true,
          },
          {
            title: 'Réservations',
            value: '1,234',
            change: 15.7,
            changeLabel: 'vs mois dernier',
            moroccanIcon: 'arch' as const,
            trend: 'up' as const,
            variant: 'warning' as const,
            showPattern: true,
          },
          {
            title: 'Revenus Total',
            value: '45,230 MAD',
            change: 22.3,
            changeLabel: 'vs mois dernier',
            moroccanIcon: 'lantern' as const,
            trend: 'up' as const,
            variant: 'premium' as const,
            showPattern: true,
            gradient: true,
          },
        ];
      case 'barber':
        return [
          {
            title: 'RDV Aujourd\'hui',
            value: '8',
            change: 2,
            changeLabel: 'vs hier',
            moroccanIcon: 'star' as const,
            trend: 'up' as const,
            variant: 'success' as const,
            showPattern: true,
          },
          {
            title: 'Clients Fidèles',
            value: '24',
            change: 5.2,
            changeLabel: 'vs mois dernier',
            moroccanIcon: 'arch' as const,
            trend: 'up' as const,
            variant: 'info' as const,
            showPattern: true,
          },
          {
            title: 'Note Moyenne',
            value: '4.8',
            change: 0.2,
            changeLabel: 'vs mois dernier',
            moroccanIcon: 'lantern' as const,
            trend: 'up' as const,
            variant: 'warning' as const,
            showPattern: true,
          },
          {
            title: 'Revenus Mois',
            value: '3,450 MAD',
            change: 12.8,
            changeLabel: 'vs mois dernier',
            moroccanIcon: 'scissors' as const,
            trend: 'up' as const,
            variant: 'premium' as const,
            showPattern: true,
            gradient: true,
          },
        ];
      case 'client':
        return [
          {
            title: 'RDV Prochains',
            value: '3',
            change: 1,
            changeLabel: 'vs semaine dernière',
            moroccanIcon: 'star' as const,
            trend: 'up' as const,
            variant: 'info' as const,
            showPattern: true,
          },
          {
            title: 'Barbiers Favoris',
            value: '5',
            change: 0,
            changeLabel: 'vs mois dernier',
            moroccanIcon: 'scissors' as const,
            trend: 'neutral' as const,
            variant: 'default' as const,
            showPattern: true,
          },
          {
            title: 'Visites Total',
            value: '12',
            change: 2,
            changeLabel: 'vs mois dernier',
            moroccanIcon: 'arch' as const,
            trend: 'up' as const,
            variant: 'success' as const,
            showPattern: true,
          },
          {
            title: 'Économies',
            value: '180 MAD',
            change: 15.5,
            changeLabel: 'vs mois dernier',
            moroccanIcon: 'lantern' as const,
            trend: 'up' as const,
            variant: 'premium' as const,
            showPattern: true,
            gradient: true,
          },
        ];
      default:
        return [];
    }
  };

  return (
    <DashboardLayout
      title="Dashboard Premium Marocain"
      subtitle="Démonstration des composants analytics avec style marocain premium"
      userRole={selectedRole}
      notifications={5}
      sidebarItems={getSidebarItems(selectedRole)}
      actions={
        <div className="flex items-center space-x-2">
          <Select value={selectedRole} onValueChange={(value) => setSelectedRole(value as any)}>
            <SelectTrigger className="w-32 border-moroccan-gold/30 bg-white/80 backdrop-blur-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="barber">Barbier</SelectItem>
              <SelectItem value="client">Client</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="moroccan-outline" size="sm" icon="moroccan-star">
            Exporter
          </Button>
        </div>
      }
    >
      <div className="space-y-8">
        {/* Premium Moroccan Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {getMoroccanAnalyticsData(selectedRole).map((card, index) => (
            <MoroccanAnalyticsCard
              key={card.title}
              title={card.title}
              value={card.value}
              change={card.change}
              changeLabel={card.changeLabel}
              moroccanIcon={card.moroccanIcon}
              trend={card.trend}
              variant={card.variant}
              showPattern={card.showPattern}
              gradient={card.gradient}
            />
          ))}
        </div>

        {/* Premium Moroccan Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <MoroccanChartContainer
            title="Évolution des Revenus"
            subtitle="Performance financière sur 6 mois"
            variant="premium"
            showPattern={true}
            gradient={true}
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
            <MoroccanLineChart 
              data={revenueData} 
              height={300} 
              variant="premium"
              animated={true}
            />
          </MoroccanChartContainer>

          <MoroccanChartContainer
            title="Rendez-vous par Jour"
            subtitle="Activité de la semaine"
            variant="success"
            showPattern={true}
            showLegend
            legendItems={[
              { label: 'RDV', color: 'hsl(var(--moroccan-green))', value: '364 total' },
            ]}
          >
            <MoroccanLineChart 
              data={appointmentData} 
              height={300} 
              variant="success"
              animated={true}
            />
          </MoroccanChartContainer>
        </div>

        {/* Additional Premium Info Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-moroccan-cream/30 border-moroccan-gold/30 shadow-moroccan hover:shadow-moroccan-lg transition-all duration-300">
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <MoroccanPattern color="#C7A253" opacity={0.08} size={64} className="w-full h-full" />
            </div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-lg text-moroccan-gold font-semibold">
                Actions Rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10">
              <Button variant="moroccan-outline" size="sm" className="w-full justify-start" icon="moroccan-star">
                Nouveau Rendez-vous
              </Button>
              <Button variant="moroccan-outline" size="sm" className="w-full justify-start" icon="moroccan-arch">
                Voir Rapports
              </Button>
              <Button variant="moroccan-outline" size="sm" className="w-full justify-start" icon="moroccan-scissors">
                Paramètres
              </Button>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-moroccan-gold via-moroccan-copper to-moroccan-gold" />
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-moroccan-green/10 border-moroccan-green/30 shadow-moroccan hover:shadow-moroccan-lg transition-all duration-300">
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <MoroccanPattern color="#2D5A27" opacity={0.08} size={64} className="w-full h-full" />
            </div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-lg text-moroccan-green font-semibold">
                Notifications
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 relative z-10">
              <div className="flex items-center space-x-3 p-2 bg-green-50 rounded-lg border border-green-200">
                <div className="h-2 w-2 bg-moroccan-green rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-green-900">Nouveau client</p>
                  <p className="text-xs text-green-700">Ahmed a réservé un RDV</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 bg-blue-50 rounded-lg border border-blue-200">
                <div className="h-2 w-2 bg-moroccan-royal-blue rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-blue-900">Paiement reçu</p>
                  <p className="text-xs text-blue-700">150 MAD de Youssef</p>
                </div>
              </div>
              <div className="flex items-center space-x-3 p-2 bg-amber-50 rounded-lg border border-amber-200">
                <div className="h-2 w-2 bg-moroccan-copper rounded-full"></div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-amber-900">Avis positif</p>
                  <p className="text-xs text-amber-700">5 étoiles de Karim</p>
                </div>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-moroccan-green via-moroccan-green to-moroccan-green" />
          </Card>

          <Card className="relative overflow-hidden bg-gradient-to-br from-white to-moroccan-copper/10 border-moroccan-copper/30 shadow-moroccan hover:shadow-moroccan-lg transition-all duration-300">
            <div className="absolute inset-0 opacity-5 pointer-events-none">
              <MoroccanPattern color="#B45309" opacity={0.08} size={64} className="w-full h-full" />
            </div>
            <CardHeader className="pb-3 relative z-10">
              <CardTitle className="text-lg text-moroccan-copper font-semibold">
                Statistiques
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 relative z-10">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-moroccan-darkgrey">Taux de satisfaction</span>
                  <span className="font-medium text-moroccan-charcoal">94%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-moroccan-gold h-2 rounded-full transition-all duration-1000" style={{ width: '94%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-moroccan-darkgrey">Clients fidèles</span>
                  <span className="font-medium text-moroccan-charcoal">78%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-moroccan-green h-2 rounded-full transition-all duration-1000" style={{ width: '78%' }}></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-moroccan-darkgrey">Disponibilité</span>
                  <span className="font-medium text-moroccan-charcoal">92%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-moroccan-copper h-2 rounded-full transition-all duration-1000" style={{ width: '92%' }}></div>
                </div>
              </div>
            </CardContent>
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-moroccan-copper via-moroccan-copper to-moroccan-copper" />
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}; 
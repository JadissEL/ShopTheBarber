import React, { useState, useEffect } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  DollarSign,
  TrendingUp,
  TrendingDown,
  Calendar,
  Clock,
  ArrowLeft,
  Download,
  RefreshCw,
  Filter,
  CalendarDays,
  CreditCard,
  Wallet,
  PiggyBank,
  Target,
  Award,
  BarChart3,
  PieChart,
  LineChart,
  Activity,
  Users,
  Scissors,
  Star,
  Eye,
  EyeOff,
  Loader2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { analyticsAPI } from "../../shared/api";
import { ChartComponent } from "../components/analytics/ChartComponent";

export default function BarberEarnings() {
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [earningsData, setEarningsData] = useState<any>(null);
  const [revenueChart, setRevenueChart] = useState<any[]>([]);
  const [servicesChart, setServicesChart] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'year'>('month');
  const [showDetailedStats, setShowDetailedStats] = useState(false);

  // Ajout d'un effet pour capturer les erreurs non catchées
  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setGlobalError(event.message || 'Erreur inconnue');
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  // Ajout d'un log pour vérifier le render
  console.log('Rendering BarberEarnings page...');

  useEffect(() => {
    loadEarningsData();
  }, [selectedPeriod]);

  const loadEarningsData = async () => {
    setIsLoading(true);
    try {
      // Charger les vraies données depuis l'API
      const [overview, revenue, appointments] = await Promise.all([
        analyticsAPI.getOverview(),
        analyticsAPI.getRevenue(selectedPeriod),
        analyticsAPI.getAppointments({ period: 'monthly', status: 'completed' }),
      ]);

      // Calculer les vraies métriques
      const totalRevenue = overview?.totalRevenue || 0;
      const totalAppointments = overview?.totalAppointments || 0;
      const completedAppointments = appointments?.length || 0;
      const cancelledAppointments = totalAppointments - completedAppointments;
      const averagePerAppointment = completedAppointments > 0 ? totalRevenue / completedAppointments : 0;
      
      // Calculer le taux de croissance (pour l'instant 0 car pas d'historique)
      const growthRate = 0;

      // Données réelles pour les graphiques
      const realRevenueChart = revenue?.map((item: any, index: number) => ({
        name: `Sem ${index + 1}`,
        revenus: item.revenue || 0,
        rendezVous: item.appointments || 0,
      })) || [];

      // Si pas de données, créer un graphique vide
      if (realRevenueChart.length === 0) {
        for (let i = 1; i <= 8; i++) {
          realRevenueChart.push({
            name: `Sem ${i}`,
            revenus: 0,
            rendezVous: 0,
          });
        }
      }

      // Services réels (pour l'instant vide car pas encore implémenté)
      const realServicesChart = [
        { name: "Aucun service", value: 0, percentage: 100 },
      ];

      const realEarningsData = {
        totalEarnings: totalRevenue,
        thisMonth: totalRevenue, // Pour l'instant, on utilise le total
        lastMonth: 0, // Pas d'historique pour l'instant
        growthRate: growthRate,
        totalAppointments: totalAppointments,
        completedAppointments: completedAppointments,
        cancelledAppointments: cancelledAppointments,
        averagePerAppointment: averagePerAppointment,
        topServices: [], // Vide car pas encore de services
        recentTransactions: [], // Vide car pas encore de transactions
      };

      setEarningsData(realEarningsData);
      setRevenueChart(realRevenueChart);
      setServicesChart(realServicesChart);
    } catch (error) {
      console.error("Erreur lors du chargement des données de revenus:", error);
      // En cas d'erreur, initialiser avec des données vides
      setEarningsData({
        totalEarnings: 0,
        thisMonth: 0,
        lastMonth: 0,
        growthRate: 0,
        totalAppointments: 0,
        completedAppointments: 0,
        cancelledAppointments: 0,
        averagePerAppointment: 0,
        topServices: [],
        recentTransactions: [],
      });
      setRevenueChart([]);
      setServicesChart([{ name: "Aucun service", value: 0, percentage: 100 }]);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => `${value.toFixed(2)} MAD`;
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const exportEarningsReport = () => {
    const dataStr = JSON.stringify(earningsData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `revenus-barbier-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-500';
      case 'pending': return 'bg-yellow-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPaymentMethodIcon = (method: string) => {
    switch (method) {
      case 'card': return <CreditCard className="h-4 w-4" />;
      case 'cash': return <Wallet className="h-4 w-4" />;
      default: return <DollarSign className="h-4 w-4" />;
    }
  };

  try {
    if (globalError) {
      return (
        <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
          <b>Erreur dans la page revenus barbier :</b>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{globalError}</pre>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/95 backdrop-blur">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-4">
              <Link to="/barber-dashboard">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <DollarSign className="h-6 w-6 text-amber-500" />
                <span className="font-display text-xl font-bold text-white">
                  Mes Revenus
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Select value={selectedPeriod} onValueChange={(value: any) => setSelectedPeriod(value)}>
                <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="week">Cette semaine</SelectItem>
                  <SelectItem value="month">Ce mois</SelectItem>
                  <SelectItem value="year">Cette année</SelectItem>
                </SelectContent>
              </Select>
              <Button onClick={loadEarningsData} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button onClick={exportEarningsReport} className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
              <span className="ml-2 text-gray-400">Chargement des données...</span>
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Revenus Totaux</p>
                        <p className="text-2xl font-bold text-white">
                          {formatCurrency(earningsData?.totalEarnings || 0)}
                        </p>
                        <div className="flex items-center mt-1">
                          {earningsData?.growthRate > 0 ? (
                            <>
                              <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                              <span className="text-sm text-green-500">
                                +{formatPercentage(earningsData.growthRate)}
                              </span>
                            </>
                          ) : (
                            <span className="text-sm text-gray-400">Aucune croissance</span>
                          )}
                        </div>
                      </div>
                      <DollarSign className="h-8 w-8 text-amber-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Ce Mois</p>
                        <p className="text-2xl font-bold text-white">
                          {formatCurrency(earningsData?.thisMonth || 0)}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          vs {formatCurrency(earningsData?.lastMonth || 0)} mois dernier
                        </p>
                      </div>
                      <Calendar className="h-8 w-8 text-blue-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Rendez-vous</p>
                        <p className="text-2xl font-bold text-white">
                          {earningsData?.completedAppointments || 0}/{earningsData?.totalAppointments || 0}
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {formatCurrency(earningsData?.averagePerAppointment || 0)} en moyenne
                        </p>
                      </div>
                      <Users className="h-8 w-8 text-green-500" />
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-gray-800 border-gray-700">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-400">Taux de Réussite</p>
                        <p className="text-2xl font-bold text-white">
                          {earningsData?.totalAppointments > 0 ? 
                            Math.round((earningsData.completedAppointments / earningsData.totalAppointments) * 100) : 0}%
                        </p>
                        <p className="text-sm text-gray-400 mt-1">
                          {earningsData?.cancelledAppointments || 0} annulations
                        </p>
                      </div>
                      <Target className="h-8 w-8 text-purple-500" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Charts Section */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                {/* Revenue Chart */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <LineChart className="h-5 w-5" />
                      <span>Évolution des Revenus</span>
                    </CardTitle>
                    <CardDescription>
                      Progression des revenus sur les dernières semaines
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {revenueChart.length > 0 ? (
                      <ChartComponent
                        data={revenueChart}
                        type="line"
                        xKey="name"
                        yKeys={[{ key: "revenus", color: "#f59e0b", label: "Revenus (MAD)" }]}
                        height={300}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-64 text-gray-400">
                        <div className="text-center">
                          <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                          <p>Aucune donnée de revenus disponible</p>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Services Revenue Chart */}
                <Card className="bg-gray-800 border-gray-700">
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <PieChart className="h-5 w-5" />
                      <span>Répartition par Service</span>
                    </CardTitle>
                    <CardDescription>
                      Répartition des revenus par type de service
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {servicesChart.length > 0 && servicesChart[0].value > 0 ? (
                      <ChartComponent
                        data={servicesChart}
                        type="pie"
                        dataKey="value"
                        nameKey="name"
                        height={300}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-64 text-gray-400">
                        <div className="text-center">
                          <Scissors className="h-12 w-12 mx-auto mb-4" />
                          <p>Aucun service configuré</p>
                          <Link to="/barber-services">
                            <Button className="mt-4 bg-amber-500 hover:bg-amber-600 text-black">
                              <Scissors className="h-4 w-4 mr-2" />
                              Ajouter des Services
                            </Button>
                          </Link>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Top Services */}
              <Card className="bg-gray-800 border-gray-700 mb-8">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Scissors className="h-5 w-5" />
                    <span>Services les Plus Lucratifs</span>
                  </CardTitle>
                  <CardDescription>
                    Vos services qui génèrent le plus de revenus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {earningsData?.topServices?.length > 0 ? (
                    <div className="space-y-4">
                      {earningsData.topServices.map((service: any, index: number) => (
                        <div key={index} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-amber-500/20 rounded-full flex items-center justify-center">
                              <span className="text-amber-500 font-bold">{index + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium text-white">{service.name}</p>
                              <p className="text-sm text-gray-400">{service.count} rendez-vous</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">{formatCurrency(service.revenue)}</p>
                            <p className="text-sm text-gray-400">
                              {formatCurrency(service.revenue / service.count)} en moyenne
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Scissors className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-300 mb-2">
                        Aucun Service Configuré
                      </h3>
                      <p className="text-gray-500 mb-6">
                        Ajoutez vos services pour commencer à générer des revenus.
                      </p>
                      <Link to="/barber-services">
                        <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                          <Scissors className="h-4 w-4 mr-2" />
                          Configurer mes Services
                        </Button>
                      </Link>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Recent Transactions */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Activity className="h-5 w-5" />
                    <span>Transactions Récentes</span>
                  </CardTitle>
                  <CardDescription>
                    Historique des derniers paiements reçus
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {earningsData?.recentTransactions?.length > 0 ? (
                    <div className="space-y-4">
                      {earningsData.recentTransactions.map((transaction: any) => (
                        <div key={transaction.id} className="flex items-center justify-between p-4 bg-gray-700 rounded-lg">
                          <div className="flex items-center space-x-4">
                            <div className="h-10 w-10 bg-green-500/20 rounded-full flex items-center justify-center">
                              {getPaymentMethodIcon(transaction.paymentMethod)}
                            </div>
                            <div>
                              <p className="font-medium text-white">{transaction.client}</p>
                              <p className="text-sm text-gray-400">{transaction.service}</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">{formatCurrency(transaction.amount)}</p>
                            <div className="flex items-center space-x-2 mt-1">
                              <Badge className={`${getStatusColor(transaction.status)} text-white`}>
                                {transaction.status}
                              </Badge>
                              <span className="text-sm text-gray-400">{transaction.date}</span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                      <h3 className="text-xl font-semibold text-gray-300 mb-2">
                        Aucune Transaction
                      </h3>
                      <p className="text-gray-500">
                        Aucune transaction enregistrée pour le moment.
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </div>
      </div>
    );
  } catch (err: any) {
    setGlobalError(err?.message || String(err));
    return (
      <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
        <b>Erreur dans la page revenus barbier (render) :</b>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{err?.message || String(err)}</pre>
      </div>
    );
  }
} 
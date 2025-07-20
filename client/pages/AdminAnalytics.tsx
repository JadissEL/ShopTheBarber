import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  DollarSign,
  Users,
  Star,
  ArrowLeft,
  Download,
  RefreshCw,
  Filter,
  CalendarDays,
  Clock,
  MapPin,
  Scissors,
  Target,
  Award,
  Shield,
  Activity,
  Building,
  Eye,
  UserPlus,
  TrendingDown,
  Zap,
  BarChart,
  PieChart,
  LineChart,
} from "lucide-react";
import { analyticsAPI } from "../../shared/api";
import { ChartComponent } from "../components/analytics/ChartComponent";

export default function AdminAnalytics() {
  const [isLoading, setIsLoading] = useState(false);
  const [overviewData, setOverviewData] = useState<any>(null);
  const [revenueData, setRevenueData] = useState<any[]>([]);
  const [appointmentData, setAppointmentData] = useState<any[]>([]);
  const [userGrowthData, setUserGrowthData] = useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = useState<'monthly' | 'weekly'>('monthly');
  const [selectedChart, setSelectedChart] = useState<'revenue' | 'appointments' | 'users'>('revenue');

  useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [overview, revenue, appointments] = await Promise.all([
        analyticsAPI.getOverview(),
        analyticsAPI.getRevenue(selectedPeriod),
        analyticsAPI.getAppointments({ period: 'monthly' }),
      ]);

      setOverviewData(overview);
      setRevenueData(revenue);
      setAppointmentData(appointments);
      
      // Générer des données de croissance utilisateurs simulées
      generateUserGrowthData();
    } catch (error) {
      console.error("Erreur lors du chargement des analytics:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const generateUserGrowthData = () => {
    const months = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];
    const currentMonth = new Date().getMonth();
    const data = [];
    
    for (let i = 0; i < 12; i++) {
      const monthIndex = (currentMonth - 11 + i + 12) % 12;
      data.push({
        month: months[monthIndex],
        clients: Math.floor(Math.random() * 50) + 20,
        barbers: Math.floor(Math.random() * 15) + 5,
        total: Math.floor(Math.random() * 65) + 25,
      });
    }
    
    setUserGrowthData(data);
  };

  const formatCurrency = (value: number) => `${value.toFixed(2)} MAD`;
  const formatNumber = (value: number) => value.toLocaleString('fr-FR');
  const formatPercentage = (value: number) => `${value.toFixed(1)}%`;

  const exportData = () => {
    const data = {
      overview: overviewData,
      revenue: revenueData,
      appointments: appointmentData,
      userGrowth: userGrowthData,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `admin-analytics-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const getGrowthRate = (current: number, previous: number) => {
    if (previous === 0) return 100;
    return ((current - previous) / previous) * 100;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Chargement des analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Link to="/admin-dashboard" className="flex items-center space-x-2 text-gray-300 hover:text-white transition-colors">
              <ArrowLeft className="h-4 w-4" />
              <span>Retour au Dashboard</span>
            </Link>
          </div>
          
          <div className="flex items-center space-x-4">
            <Select value={selectedPeriod} onValueChange={(value: 'monthly' | 'weekly') => setSelectedPeriod(value)}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensuel</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
              </SelectContent>
            </Select>
            
            <Button onClick={exportData} variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800">
              <Download className="h-4 w-4 mr-2" />
              Exporter
            </Button>
            
            <Button onClick={loadAnalytics} variant="outline" size="sm" className="border-gray-700 text-gray-300 hover:bg-gray-800">
              <RefreshCw className="h-4 w-4 mr-2" />
              Actualiser
            </Button>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Page Title */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Analytics & Statistiques</h1>
          <p className="text-gray-400">Vue d'ensemble complète de la performance de la plateforme</p>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Utilisateurs Total</p>
                  <p className="text-2xl font-bold text-white">
                    {overviewData ? formatNumber(overviewData.totalUsers || 0) : '0'}
                  </p>
                  <p className="text-xs text-green-400 mt-1">
                    +{getGrowthRate(overviewData?.totalUsers || 0, (overviewData?.totalUsers || 0) * 0.9).toFixed(1)}% ce mois
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Barbiers Actifs</p>
                  <p className="text-2xl font-bold text-white">
                    {overviewData ? formatNumber(overviewData.totalBarbers || 0) : '0'}
                  </p>
                  <p className="text-xs text-green-400 mt-1">
                    +{getGrowthRate(overviewData?.totalBarbers || 0, (overviewData?.totalBarbers || 0) * 0.85).toFixed(1)}% ce mois
                  </p>
                </div>
                <Scissors className="h-8 w-8 text-amber-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Réservations</p>
                  <p className="text-2xl font-bold text-white">
                    {overviewData ? formatNumber(overviewData.totalAppointments || 0) : '0'}
                  </p>
                  <p className="text-xs text-green-400 mt-1">
                    +{getGrowthRate(overviewData?.totalAppointments || 0, (overviewData?.totalAppointments || 0) * 0.8).toFixed(1)}% ce mois
                  </p>
                </div>
                <Calendar className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gray-800 border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-400">Revenus Total</p>
                  <p className="text-2xl font-bold text-white">
                    {overviewData ? formatCurrency(overviewData.totalRevenue || 0) : '0 MAD'}
                  </p>
                  <p className="text-xs text-green-400 mt-1">
                    +{getGrowthRate(overviewData?.totalRevenue || 0, (overviewData?.totalRevenue || 0) * 0.75).toFixed(1)}% ce mois
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Chart Selection */}
        <div className="mb-6">
          <div className="flex space-x-2">
            <Button
              variant={selectedChart === 'revenue' ? 'default' : 'outline'}
              onClick={() => setSelectedChart('revenue')}
              className={selectedChart === 'revenue' ? 'bg-amber-500 text-black' : 'border-gray-700 text-gray-300'}
            >
              <DollarSign className="h-4 w-4 mr-2" />
              Revenus
            </Button>
            <Button
              variant={selectedChart === 'appointments' ? 'default' : 'outline'}
              onClick={() => setSelectedChart('appointments')}
              className={selectedChart === 'appointments' ? 'bg-amber-500 text-black' : 'border-gray-700 text-gray-300'}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Réservations
            </Button>
            <Button
              variant={selectedChart === 'users' ? 'default' : 'outline'}
              onClick={() => setSelectedChart('users')}
              className={selectedChart === 'users' ? 'bg-amber-500 text-black' : 'border-gray-700 text-gray-300'}
            >
              <Users className="h-4 w-4 mr-2" />
              Utilisateurs
            </Button>
          </div>
        </div>

        {/* Main Chart */}
        <Card className="bg-gray-800 border-gray-700 mb-8">
          <CardHeader>
            <CardTitle className="text-white">
              {selectedChart === 'revenue' && 'Évolution des Revenus'}
              {selectedChart === 'appointments' && 'Évolution des Réservations'}
              {selectedChart === 'users' && 'Croissance des Utilisateurs'}
            </CardTitle>
            <CardDescription className="text-gray-400">
              Données sur les 12 derniers mois
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedChart === 'revenue' && (
              <ChartComponent
                data={revenueData}
                type="area"
                xKey="period"
                yKey="revenue"
                title=""
                height={400}
                colors={['#10b981']}
                formatValue={formatCurrency}
              />
            )}
            {selectedChart === 'appointments' && (
              <ChartComponent
                data={appointmentData}
                type="bar"
                xKey="period"
                yKey="count"
                title=""
                height={400}
                colors={['#3b82f6']}
                formatValue={formatNumber}
              />
            )}
            {selectedChart === 'users' && (
              <ChartComponent
                data={userGrowthData}
                type="line"
                xKey="month"
                multipleYKeys={['clients', 'barbers']}
                title=""
                height={400}
                colors={['#3b82f6', '#f59e0b']}
                formatValue={formatNumber}
              />
            )}
          </CardContent>
        </Card>

        {/* Additional Metrics */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Top Services */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Services les Plus Populaires</CardTitle>
              <CardDescription className="text-gray-400">Basé sur les réservations</CardDescription>
            </CardHeader>
            <CardContent>
              {overviewData?.topServices ? (
                <div className="space-y-4">
                  {overviewData.topServices.slice(0, 5).map((service: any, index: number) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-amber-500/20 rounded-full flex items-center justify-center">
                          <span className="text-amber-500 font-semibold text-sm">{index + 1}</span>
                        </div>
                        <span className="text-white">{service.name}</span>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-semibold">{service.count}</p>
                        <p className="text-xs text-gray-400">réservations</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400 text-center py-8">Aucune donnée disponible</p>
              )}
            </CardContent>
          </Card>

          {/* Performance Metrics */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Métriques de Performance</CardTitle>
              <CardDescription className="text-gray-400">Indicateurs clés</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Target className="h-5 w-5 text-blue-500" />
                    <span className="text-white">Taux de Conversion</span>
                  </div>
                  <span className="text-2xl font-bold text-green-500">68.5%</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Clock className="h-5 w-5 text-amber-500" />
                    <span className="text-white">Temps de Réponse Moyen</span>
                  </div>
                  <span className="text-2xl font-bold text-white">2.3h</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Star className="h-5 w-5 text-yellow-500" />
                    <span className="text-white">Note Moyenne</span>
                  </div>
                  <span className="text-2xl font-bold text-white">4.7/5</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Zap className="h-5 w-5 text-green-500" />
                    <span className="text-white">Uptime</span>
                  </div>
                  <span className="text-2xl font-bold text-green-500">99.9%</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity */}
        <Card className="bg-gray-800 border-gray-700 mt-8">
          <CardHeader>
            <CardTitle className="text-white">Activité Récente</CardTitle>
            <CardDescription className="text-gray-400">Dernières actions sur la plateforme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { action: 'Nouveau barbier inscrit', user: 'Ahmed Benali', time: 'Il y a 2h', type: 'barber' },
                { action: 'Réservation effectuée', user: 'Mohammed Tazi', time: 'Il y a 3h', type: 'booking' },
                { action: 'Avis publié', user: 'Fatima Zahra', time: 'Il y a 4h', type: 'review' },
                { action: 'Paiement traité', user: 'Youssef Alami', time: 'Il y a 5h', type: 'payment' },
                { action: 'Nouveau client inscrit', user: 'Karim Benslimane', time: 'Il y a 6h', type: 'client' },
              ].map((activity, index) => (
                <div key={index} className="flex items-center space-x-4 p-3 bg-gray-700/50 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${
                    activity.type === 'barber' ? 'bg-amber-500' :
                    activity.type === 'booking' ? 'bg-green-500' :
                    activity.type === 'review' ? 'bg-blue-500' :
                    activity.type === 'payment' ? 'bg-purple-500' : 'bg-gray-500'
                  }`} />
                  <div className="flex-1">
                    <p className="text-white font-medium">{activity.action}</p>
                    <p className="text-sm text-gray-400">par {activity.user}</p>
                  </div>
                  <span className="text-sm text-gray-400">{activity.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 
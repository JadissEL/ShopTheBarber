import * as React from "react";
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
  Calendar,
  User,
  Star,
  ArrowLeft,
  Filter,
  Clock,
  MapPin,
  Scissors,
} from "lucide-react";
import { Link } from "react-router-dom";
import { analyticsAPI } from "../../shared/api";
import { ChartComponent } from "../components/analytics/ChartComponent";

export default function BarberReports() {
  const [isLoading, setIsLoading] = React.useState(false);
  const [overviewData, setOverviewData] = React.useState<any>(null);
  const [revenueData, setRevenueData] = React.useState<any[]>([]);
  const [appointmentData, setAppointmentData] = React.useState<any[]>([]);
  const [performanceData, setPerformanceData] = React.useState<any>(null);
  const [selectedPeriod, setSelectedPeriod] = React.useState<'monthly' | 'weekly'>('monthly');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('');
  const [error, setError] = React.useState<string | null>(null);

  console.log('BarberReports component rendering');

  React.useEffect(() => {
    console.log('BarberReports useEffect triggered');
    loadAnalytics();
  }, [selectedPeriod, selectedStatus]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [overview, revenue, appointments, performance] = await Promise.all([
        analyticsAPI.getOverview(),
        analyticsAPI.getRevenue(selectedPeriod),
        analyticsAPI.getAppointments({ period: 'monthly', status: selectedStatus }),
        analyticsAPI.getPerformance(),
      ]);

      setOverviewData(overview);
      setRevenueData(revenue);
      setAppointmentData(appointments);
      setPerformanceData(performance);
    } catch (error) {
      console.error("Erreur lors du chargement des analytics:", error);
      setError("Erreur lors du chargement des données. Utilisation des données de démonstration.");
      
      // Fallback data for demo purposes
      setOverviewData({
        totalAppointments: 0,
        completedAppointments: 0,
        totalRevenue: 0,
        avgRating: 0,
        monthlyRevenue: [],
        topServices: []
      });
      setRevenueData([]);
      setAppointmentData([]);
      setPerformanceData({
        monthlyPerformance: [],
        serviceBreakdown: []
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (value: number) => `${value.toFixed(2)} MAD`;
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' });
  };

  const exportData = () => {
    const data = {
      overview: overviewData,
      revenue: revenueData,
      appointments: appointmentData,
      performance: performanceData,
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `barber-reports-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin mx-auto mb-4 border-2 border-white border-t-transparent rounded-full"></div>
          <p>Chargement des rapports...</p>
        </div>
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
              <span className="text-blue-500 text-xl">📊</span>
              <span className="font-display text-xl font-bold text-white">
                Rapports Barbier
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Button onClick={loadAnalytics} variant="outline" size="sm">
              <span className="mr-2">🔄</span>
              Actualiser
            </Button>
            <Button onClick={exportData} className="bg-green-600 hover:bg-green-700">
              <span className="mr-2">⬇️</span>
              Exporter
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-yellow-900/20 border border-yellow-600/50 rounded-lg">
            <p className="text-yellow-400 text-sm">{error}</p>
          </div>
        )}
        
        {/* Overview Stats */}
        {overviewData ? (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Rendez-vous</p>
                    <p className="text-2xl font-bold text-white">
                      {overviewData.totalAppointments}
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
                    <p className="text-sm text-gray-400">Rendez-vous Terminés</p>
                    <p className="text-2xl font-bold text-white">
                      {overviewData.completedAppointments}
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
                    <p className="text-sm text-gray-400">Revenus Totaux</p>
                    <p className="text-2xl font-bold text-white">
                      {formatCurrency(overviewData.totalRevenue)}
                    </p>
                  </div>
                  <span className="text-yellow-500 text-2xl">💰</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Note Moyenne</p>
                    <p className="text-2xl font-bold text-white">
                      {parseFloat(overviewData.avgRating || 0).toFixed(1)}
                    </p>
                  </div>
                  <Star className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Rendez-vous</p>
                    <p className="text-2xl font-bold text-white">0</p>
                  </div>
                  <Calendar className="h-8 w-8 text-blue-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Rendez-vous Terminés</p>
                    <p className="text-2xl font-bold text-white">0</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Revenus Totaux</p>
                    <p className="text-2xl font-bold text-white">0.00 MAD</p>
                  </div>
                  <span className="text-yellow-500 text-2xl">💰</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Note Moyenne</p>
                    <p className="text-2xl font-bold text-white">0.0</p>
                  </div>
                  <Star className="h-8 w-8 text-red-500" />
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-8">
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-400">Période:</span>
            <Select value={selectedPeriod} onValueChange={(value: 'monthly' | 'weekly') => setSelectedPeriod(value)}>
              <SelectTrigger className="w-32 bg-gray-800 border-gray-600 text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="monthly">Mensuel</SelectItem>
                <SelectItem value="weekly">Hebdomadaire</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-400">Statut:</span>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-40 bg-gray-800 border-gray-600 text-white">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="confirmed">Confirmé</SelectItem>
                <SelectItem value="completed">Terminé</SelectItem>
                <SelectItem value="cancelled">Annulé</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* No Data Message */}
          {(!overviewData?.monthlyRevenue && !overviewData?.topServices && revenueData.length === 0 && !performanceData?.monthlyPerformance) && (
            <div className="col-span-2">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-8 text-center">
                  <div className="text-gray-400 mb-4">
                    <Calendar className="h-12 w-12 mx-auto" />
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-2">Aucune donnée disponible</h3>
                  <p className="text-gray-400">
                    Vous n'avez pas encore de données d'analytics. Les graphiques apparaîtront ici une fois que vous aurez des rendez-vous.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
          {/* Monthly Revenue Chart */}
          {overviewData?.monthlyRevenue && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>📈</span>
                  <span>Revenus Mensuels</span>
                </CardTitle>
                <CardDescription>
                  Évolution de vos revenus au fil des mois
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartComponent
                  data={overviewData.monthlyRevenue.map((item: any) => ({
                    ...item,
                    month: formatDate(item.month),
                    revenue: parseFloat(item.revenue),
                  }))}
                  type="area"
                  xKey="month"
                  yKey="revenue"
                  height={300}
                  formatValue={formatCurrency}
                  colors={['#10B981']}
                />
              </CardContent>
            </Card>
          )}

          {/* Top Services Chart */}
          {overviewData?.topServices && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Scissors className="h-5 w-5" />
                  <span>Services les Plus Populaires</span>
                </CardTitle>
                <CardDescription>
                  Services les plus demandés par vos clients
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartComponent
                  data={overviewData.topServices.map((service: any) => ({
                    name: service.name,
                    count: service.count,
                    avgPrice: parseFloat(service.avg_price || 0).toFixed(0),
                  }))}
                  type="bar"
                  xKey="name"
                  yKey="count"
                  height={300}
                  colors={['#3B82F6']}
                />
              </CardContent>
            </Card>
          )}

          {/* Revenue Chart */}
          {revenueData.length > 0 && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>💰</span>
                  <span>Revenus {selectedPeriod === 'monthly' ? 'Mensuels' : 'Hebdomadaires'}</span>
                </CardTitle>
                <CardDescription>
                  Évolution de vos revenus
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartComponent
                  data={revenueData.map((item: any) => ({
                    ...item,
                    period: selectedPeriod === 'monthly' ? formatDate(item.period) : item.period,
                    revenue: parseFloat(item.revenue),
                  }))}
                  type="line"
                  xKey="period"
                  yKey="revenue"
                  height={300}
                  formatValue={formatCurrency}
                  colors={['#F59E0B']}
                />
              </CardContent>
            </Card>
          )}

          {/* Performance Chart */}
          {performanceData?.monthlyPerformance && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🎯</span>
                  <span>Performance Mensuelle</span>
                </CardTitle>
                <CardDescription>
                  Rendez-vous, notes et revenus par mois
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ChartComponent
                  data={performanceData.monthlyPerformance.map((item: any) => ({
                    ...item,
                    month: formatDate(item.month),
                    appointments: item.appointments,
                    avgRating: parseFloat(item.avg_rating || 0),
                    revenue: parseFloat(item.revenue),
                  }))}
                  type="bar"
                  xKey="month"
                  yKey="appointments"
                  height={300}
                  multipleYKeys={['appointments', 'revenue']}
                  colors={['#8B5CF6', '#F59E0B']}
                />
              </CardContent>
            </Card>
          )}
        </div>

        {/* Service Breakdown */}
        {performanceData?.serviceBreakdown && (
          <div className="mt-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <span>🏆</span>
                  <span>Répartition par Service</span>
                </CardTitle>
                <CardDescription>
                  Analyse détaillée de vos services
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                  <ChartComponent
                    data={performanceData.serviceBreakdown.map((service: any) => ({
                      name: service.name,
                      bookings: service.bookings,
                      avgPrice: parseFloat(service.avg_price || 0).toFixed(0),
                    }))}
                    type="pie"
                    xKey="name"
                    yKey="bookings"
                    height={300}
                    colors={['#EF4444', '#10B981', '#3B82F6', '#F59E0B', '#8B5CF6']}
                  />
                  
                  <div className="space-y-4">
                    <h4 className="font-semibold text-white">Détails des Services</h4>
                    <div className="space-y-3">
                      {performanceData.serviceBreakdown.map((service: any, index: number) => (
                        <div key={index} className="flex justify-between items-center p-3 bg-gray-700 rounded-lg">
                          <div>
                            <p className="font-medium text-white">{service.name}</p>
                            <p className="text-sm text-gray-400">
                              {service.bookings} réservations • {formatCurrency(parseFloat(service.avg_price || 0))} en moyenne
                            </p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-white">
                              {formatCurrency(parseFloat(service.total_revenue || 0))}
                            </p>
                            <p className="text-sm text-gray-400">Total</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Detailed Stats */}
        {overviewData && (
          <div className="mt-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle>Statistiques Détaillées</CardTitle>
                <CardDescription>
                  Informations complètes sur votre activité
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-300">Taux de Complétion</h4>
                    <p className="text-2xl font-bold text-white">
                      {overviewData.totalAppointments > 0 
                        ? ((overviewData.completedAppointments / overviewData.totalAppointments) * 100).toFixed(1)
                        : 0}%
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-300">Revenu Moyen</h4>
                    <p className="text-2xl font-bold text-white">
                      {overviewData.completedAppointments > 0 
                        ? formatCurrency(overviewData.totalRevenue / overviewData.completedAppointments)
                        : formatCurrency(0)}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-300">Services Offerts</h4>
                    <p className="text-2xl font-bold text-white">
                      {overviewData.topServices?.length || 0}
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-300">Note Globale</h4>
                    <p className="text-2xl font-bold text-white">
                      {parseFloat(overviewData.avgRating || 0).toFixed(1)}/5
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
} 
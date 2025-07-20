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
  BarChart3,
  TrendingUp,
  Calendar,
  DollarSign,
  User,
  Star,
  ArrowLeft,
  Download,
  RefreshCw,
  Filter,
  Clock,
  MapPin,
  Scissors,
} from "lucide-react";
import { Link } from "react-router-dom";
import { analyticsAPI } from "../../shared/api";
import { ChartComponent } from "../components/analytics/ChartComponent";

export default function ClientReports() {
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState<boolean>(true);
  const [overviewData, setOverviewData] = React.useState<any>(null);
  const [revenueData, setRevenueData] = React.useState<any[]>([]);
  const [appointmentData, setAppointmentData] = React.useState<any[]>([]);
  const [selectedPeriod, setSelectedPeriod] = React.useState<'monthly' | 'weekly'>('monthly');
  const [selectedStatus, setSelectedStatus] = React.useState<string>('all');

  // Ajout d'un effet pour capturer les erreurs non catchées
  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setGlobalError(event.message || 'Erreur inconnue');
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  // Ajout d'un log pour vérifier le render
  console.log('Rendering ClientReports page...');

  React.useEffect(() => {
    loadAnalytics();
  }, [selectedPeriod, selectedStatus]);

  const loadAnalytics = async () => {
    setIsLoading(true);
    try {
      const [overview, revenue, appointments] = await Promise.all([
        analyticsAPI.getOverview(),
        analyticsAPI.getRevenue(selectedPeriod),
        analyticsAPI.getAppointments({ period: 'monthly', status: selectedStatus }),
      ]);

      setOverviewData(overview);
      setRevenueData(revenue);
      setAppointmentData(appointments);
    } catch (error) {
      console.error("Erreur lors du chargement des analytics:", error);
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
      exportDate: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `client-reports-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  try {
    if (globalError) {
      return (
        <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
          <b>Erreur dans la page rapports client :</b>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{globalError}</pre>
        </div>
      );
    }

    if (isLoading) {
      return (
        <div className="min-h-screen bg-gray-900 text-white flex items-center justify-center">
          <div className="text-center">
            <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-4" />
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
              <Link to="/client-dashboard">
                <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Retour
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <BarChart3 className="h-6 w-6 text-blue-500" />
                <span className="font-display text-xl font-bold text-white">
                  Mes Rapports
                </span>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={loadAnalytics} variant="outline" size="sm">
                <RefreshCw className="h-4 w-4 mr-2" />
                Actualiser
              </Button>
              <Button onClick={exportData} className="bg-green-600 hover:bg-green-700">
                <Download className="h-4 w-4 mr-2" />
                Exporter
              </Button>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Overview Stats */}
          {overviewData && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Total Réservations</p>
                      <p className="text-2xl font-bold text-white">
                        {overviewData.totalBookings}
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
                      <p className="text-sm text-gray-400">Réservations Terminées</p>
                      <p className="text-2xl font-bold text-white">
                        {overviewData.completedBookings}
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
                      <p className="text-sm text-gray-400">Total Dépensé</p>
                      <p className="text-2xl font-bold text-white">
                        {formatCurrency(overviewData.totalSpent)}
                      </p>
                    </div>
                    <DollarSign className="h-8 w-8 text-yellow-500" />
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-400">Barbiers Favoris</p>
                      <p className="text-2xl font-bold text-white">
                        {overviewData.favoriteBarbers}
                      </p>
                    </div>
                    <User className="h-8 w-8 text-red-500" />
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
                  <SelectItem value="all">Tous les statuts</SelectItem>
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
            {/* Monthly Spending Chart */}
            {overviewData?.monthlySpending && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5" />
                    <span>Dépenses Mensuelles</span>
                  </CardTitle>
                  <CardDescription>
                    Évolution de vos dépenses au fil des mois
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartComponent
                    data={overviewData.monthlySpending.map((item: any) => ({
                      ...item,
                      month: formatDate(item.month),
                      spent: parseFloat(item.spent),
                    }))}
                    type="area"
                    xKey="month"
                    yKey="spent"
                    height={300}
                    formatValue={formatCurrency}
                    colors={['#3B82F6']}
                  />
                </CardContent>
              </Card>
            )}

            {/* Top Barbers Chart */}
            {overviewData?.topBarbers && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Star className="h-5 w-5" />
                    <span>Mes Barbiers Préférés</span>
                  </CardTitle>
                  <CardDescription>
                    Barbiers avec qui vous avez le plus de rendez-vous
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartComponent
                    data={overviewData.topBarbers.map((barber: any) => ({
                      name: barber.name,
                      bookings: barber.bookings,
                      avgRating: parseFloat(barber.avg_rating || 0).toFixed(1),
                    }))}
                    type="bar"
                    xKey="name"
                    yKey="bookings"
                    height={300}
                    colors={['#10B981']}
                  />
                </CardContent>
              </Card>
            )}

            {/* Revenue Chart */}
            {revenueData.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <DollarSign className="h-5 w-5" />
                    <span>Revenus {selectedPeriod === 'monthly' ? 'Mensuels' : 'Hebdomadaires'}</span>
                  </CardTitle>
                  <CardDescription>
                    Évolution des revenus générés
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

            {/* Appointments Status Chart */}
            {appointmentData.length > 0 && (
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Calendar className="h-5 w-5" />
                    <span>Statut des Rendez-vous</span>
                  </CardTitle>
                  <CardDescription>
                    Répartition par statut
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ChartComponent
                    data={appointmentData}
                    type="pie"
                    xKey="status"
                    yKey="count"
                    height={300}
                    colors={['#EF4444', '#10B981', '#3B82F6', '#F59E0B']}
                  />
                </CardContent>
              </Card>
            )}
          </div>

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
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-300">Taux de Complétion</h4>
                      <p className="text-2xl font-bold text-white">
                        {overviewData.totalBookings > 0 
                          ? ((overviewData.completedBookings / overviewData.totalBookings) * 100).toFixed(1)
                          : 0}%
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-300">Dépense Moyenne</h4>
                      <p className="text-2xl font-bold text-white">
                        {overviewData.completedBookings > 0 
                          ? formatCurrency(overviewData.totalSpent / overviewData.completedBookings)
                          : formatCurrency(0)}
                      </p>
                    </div>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-gray-300">Barbiers Visités</h4>
                      <p className="text-2xl font-bold text-white">
                        {overviewData.topBarbers?.length || 0}
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
  } catch (err: any) {
    setGlobalError(err?.message || String(err));
    return (
      <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
        <b>Erreur dans la page rapports client (render) :</b>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{err?.message || String(err)}</pre>
      </div>
    );
  }
} 
import React from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Progress } from "../components/ui/progress";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "../components/ui/tabs";
import { Input } from "../components/ui/input";
import { Textarea } from "../components/ui/textarea";
import {
  Calendar,
  Clock,
  Star,
  MapPin,
  Search,
  Filter,
  Bell,
  Settings,
  User,
  Scissors,
  History,
  Phone,
  MessageSquare,
  ChevronRight,
  Edit,
  Trash2,
  Plus,
  X,
  Check,
  AlertCircle,
  BookOpen,
  Gift,
  CreditCard,
  Share2,
  ThumbsUp,
  Eye,
  EyeOff,
  Mail,
  ArrowLeft,
  Navigation,
  Loader2,
  Camera,
  StarOff,
  Upload,
  Image,
  Home,
  Building,
  Car,
  CheckCircle,
  Palette,
  Sparkles,
  Zap,
  Waves,
  ArrowRight,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Activity,
  BarChart3,
  PieChart,
  Target,
  Award,
  RefreshCw,
  Download,
  Globe,
  Shield,
  Smartphone,
  Video,
  FileText,
  HelpCircle,
  Info,
  Save,
  RotateCcw,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { analyticsAPI } from "../../shared/api";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import BarberVideoManager from "../components/BarberVideoManager";
import BlogArticleEditor from "../components/BlogArticleEditor";
import { ChartComponent } from "../components/analytics/ChartComponent";

export default function BarberDashboard() {
  const navigate = useNavigate();
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [showNotifications, setShowNotifications] =
    React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [dashboardData, setDashboardData] = React.useState<any>(null);
  const [videos, setVideos] = React.useState<any[]>([]);
  const [articles, setArticles] = React.useState<any[]>([]);
  const [barberId, setBarberId] = React.useState<number | null>(null);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [analyticsCharts, setAnalyticsCharts] = React.useState<any>(null);

  // Enhanced state management
  const [realTimeMetrics, setRealTimeMetrics] = React.useState<any>(null);
  const [barberProfile, setBarberProfile] = React.useState<any>(null);
  const [todayBookings, setTodayBookings] = React.useState<any[]>([]);
  const [weeklyStats, setWeeklyStats] = React.useState<any>(null);
  const [clientReviews, setClientReviews] = React.useState<any[]>([]);
  const [earnings, setEarnings] = React.useState<any>(null);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [profileEditMode, setProfileEditMode] = React.useState(false);

  // Enhanced data loading functions
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      await Promise.all([
        loadBarberProfile(),
        loadRealTimeMetrics(),
        loadTodayBookings(),
        loadWeeklyStats(),
        loadClientReviews(),
        loadEarnings(),
        loadNotifications(),
        loadAnalyticsCharts(),
      ]);
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadRealTimeMetrics = async () => {
    try {
      const res = await fetch("/api/barber/realtime-metrics");
      if (res.ok) {
        setRealTimeMetrics(await res.json());
      } else {
        // Mock data for demo
        setRealTimeMetrics({
          todayBookings: 8,
          pendingRequests: 3,
          todayEarnings: 420.5,
          clientsSatisfaction: 4.8,
          profileViews: 45,
          weeklyGrowth: 12.5,
        });
      }
    } catch (e) {
      setRealTimeMetrics({
        todayBookings: 8,
        pendingRequests: 3,
        todayEarnings: 420.5,
        clientsSatisfaction: 4.8,
        profileViews: 45,
        weeklyGrowth: 12.5,
      });
    }
  };

  const loadTodayBookings = async () => {
    try {
      const res = await fetch("/api/barber/today-bookings");
      if (res.ok) {
        setTodayBookings(await res.json());
      } else {
        // Mock data
        setTodayBookings([
          {
            id: 1,
            client: "Ahmed M.",
            time: "09:00",
            service: "Coupe + Barbe",
            status: "confirmed",
            duration: "45min",
            price: 35,
          },
          {
            id: 2,
            client: "Youssef K.",
            time: "10:30",
            service: "Coupe Classique",
            status: "pending",
            duration: "30min",
            price: 25,
          },
          {
            id: 3,
            client: "Omar B.",
            time: "14:00",
            service: "Rasage Traditionnel",
            status: "confirmed",
            duration: "30min",
            price: 20,
          },
          {
            id: 4,
            client: "Hassan L.",
            time: "15:30",
            service: "Coupe + Styling",
            status: "confirmed",
            duration: "60min",
            price: 45,
          },
          {
            id: 5,
            client: "Mehdi A.",
            time: "17:00",
            service: "Coupe + Barbe",
            status: "pending",
            duration: "45min",
            price: 35,
          },
        ]);
      }
    } catch (e) {
      setTodayBookings([]);
    }
  };

  const loadWeeklyStats = async () => {
    try {
      const res = await fetch("/api/barber/weekly-stats");
      if (res.ok) {
        setWeeklyStats(await res.json());
      } else {
        setWeeklyStats({
          totalBookings: 42,
          totalEarnings: 1680.0,
          avgRating: 4.7,
          repeatClients: 28,
          newClients: 14,
          canceledBookings: 3,
          completionRate: 92.8,
        });
      }
    } catch (e) {
      setWeeklyStats({
        totalBookings: 42,
        totalEarnings: 1680.0,
        avgRating: 4.7,
        repeatClients: 28,
        newClients: 14,
        canceledBookings: 3,
        completionRate: 92.8,
      });
    }
  };

  const loadClientReviews = async () => {
    try {
      const res = await fetch("/api/barber/reviews");
      if (res.ok) {
        setClientReviews(await res.json());
      } else {
        setClientReviews([
          {
            id: 1,
            client: "Ahmed M.",
            rating: 5,
            comment: "Service excellent, très professionnel !",
            date: "Il y a 2h",
            service: "Coupe + Barbe",
          },
          {
            id: 2,
            client: "Youssef K.",
            rating: 4,
            comment: "Très satisfait du résultat, je recommande.",
            date: "Il y a 1j",
            service: "Coupe Classique",
          },
          {
            id: 3,
            client: "Omar B.",
            rating: 5,
            comment: "Barbier au top, ambiance détendue.",
            date: "Il y a 2j",
            service: "Rasage Traditionnel",
          },
          {
            id: 4,
            client: "Hassan L.",
            rating: 5,
            comment: "Toujours parfait, merci !",
            date: "Il y a 3j",
            service: "Coupe + Styling",
          },
        ]);
      }
    } catch (e) {
      setClientReviews([]);
    }
  };

  const loadEarnings = async () => {
    try {
      const res = await fetch("/api/barber/earnings");
      if (res.ok) {
        setEarnings(await res.json());
      } else {
        setEarnings({
          today: 420.5,
          week: 1680.0,
          month: 6240.0,
          pending: 180.0,
          nextPayout: "2024-01-15",
          monthlyGoal: 8000.0,
          goalProgress: 78,
        });
      }
    } catch (e) {
      setEarnings({
        today: 420.5,
        week: 1680.0,
        month: 6240.0,
        pending: 180.0,
        nextPayout: "2024-01-15",
        monthlyGoal: 8000.0,
        goalProgress: 78,
      });
    }
  };

  const loadBarberProfile = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/profile", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const profile = await response.json();
        setBarberProfile(
          profile.barberProfile || {
            name: "Hassan Alami",
            salon_name: "Salon Elite",
            description: "Barbier professionnel avec 10 ans d'expérience",
            location: "Casablanca",
            phone: "+212 6 12 34 56 78",
            email: "hassan@salonelite.ma",
            rating: 4.8,
            review_count: 156,
            experience_years: 10,
            specialties: [
              "Coupe moderne",
              "Rasage traditionnel",
              "Barbe styling",
            ],
            working_hours: "09:00 - 19:00",
            accepts_home: true,
            accepts_shop: true,
          },
        );

        if (profile.barberProfile) {
          setBarberId(profile.barberProfile.id);
          loadVideos(profile.barberProfile.id);
          loadArticles();
        }
      }
    } catch (error) {
      console.error("Error loading barber profile:", error);
    }
  };

  const loadVideos = async (id: number) => {
    try {
      const response = await fetch(`/api/barber-videos/${id}`);
      if (response.ok) {
        const videosData = await response.json();
        setVideos(videosData);
      }
    } catch (error) {
      console.error("Error loading videos:", error);
    }
  };

  const loadArticles = async () => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch("/api/blog/articles?author=me", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      if (response.ok) {
        const data = await response.json();
        setArticles(data.articles || []);
      }
    } catch (error) {
      console.error("Error loading articles:", error);
    }
  };

  const loadNotifications = async () => {
    try {
      const res = await fetch("/api/barber/notifications");
      if (res.ok) {
        setNotifications(await res.json());
      } else {
        setNotifications([
          {
            id: 1,
            type: "booking",
            title: "Nouvelle réservation",
            message: "Ahmed M. a réservé pour 14h",
            time: "Il y a 10 min",
            unread: true,
          },
          {
            id: 2,
            type: "review",
            title: "Nouvel avis",
            message: "Youssef K. vous a donné 5 étoiles",
            time: "Il y a 1h",
            unread: true,
          },
          {
            id: 3,
            type: "payment",
            title: "Paiement reçu",
            message: "Paiement de 35€ confirmé",
            time: "Il y a 2h",
            unread: false,
          },
        ]);
      }
    } catch (e) {
      setNotifications([]);
    }
  };

  const loadAnalyticsCharts = async () => {
    try {
      const res = await fetch("/api/analytics/barber");
      if (res.ok) {
        setAnalyticsCharts(await res.json());
      }
    } catch (e) {
      setAnalyticsCharts(null);
    }
  };

  const refreshData = () => {
    setRefreshKey((prev) => prev + 1);
    loadAllData();
  };

  React.useEffect(() => {
    loadAllData();

    // Set up real-time updates every 30 seconds
    const interval = setInterval(() => {
      loadRealTimeMetrics();
      loadTodayBookings();
      loadNotifications();
    }, 30000);

    return () => clearInterval(interval);
  }, [refreshKey]);

  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setGlobalError(event.message || "Erreur inconnue");
    };
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);

  if (globalError) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-destructive mb-4">Erreur</h2>
          <p className="text-muted-foreground">{globalError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/90 shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-4">
            <Link to="/">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
              >
                <Home className="h-4 w-4 mr-2" />
                Accueil
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Scissors className="h-6 w-6 text-primary" />
              <span className="font-display text-xl font-bold text-foreground">
                Tableau de Bord Barbier
              </span>
              {barberProfile && (
                <Badge className="ml-2 bg-yellow-50 text-yellow-700 border-yellow-200">
                  {barberProfile.rating} ⭐ ({barberProfile.review_count} avis)
                </Badge>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={refreshData}
              className="text-muted-foreground hover:text-foreground"
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-4 w-4 ${isLoading ? "animate-spin" : ""}`}
              />
            </Button>

            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-foreground"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                <Bell className="h-4 w-4" />
                {notifications &&
                  notifications.filter((n) => n.unread).length > 0 && (
                    <span className="absolute -top-1 -right-1 bg-destructive text-destructive-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.filter((n) => n.unread).length}
                    </span>
                  )}
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                <Scissors className="h-4 w-4 text-primary" />
              </div>
              <div className="hidden md:block">
                <span className="text-sm font-medium text-foreground">
                  {barberProfile?.name || "Barbier"}
                </span>
                <p className="text-xs text-muted-foreground">
                  {barberProfile?.salon_name || "Salon"}
                </p>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="font-display text-3xl font-bold text-foreground mb-2">
            Bienvenue, {barberProfile?.name || "Barbier"}
          </h1>
          <p className="text-muted-foreground">
            Gérez votre activité et suivez vos performances depuis votre tableau
            de bord personnel.
          </p>
        </div>

        {/* Real-Time Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Rendez-vous Aujourd'hui
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {realTimeMetrics ? realTimeMetrics.todayBookings : "..."}
                  </p>
                  <div className="flex items-center text-xs text-green-600 mt-1">
                    <Calendar className="h-3 w-3 mr-1" />
                    {realTimeMetrics?.pendingRequests || 0} en attente
                  </div>
                </div>
                <div className="h-12 w-12 bg-blue-50 border border-blue-200 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300"
            style={{ animationDelay: "0.1s" }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Gains Aujourd'hui
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {realTimeMetrics
                      ? `${realTimeMetrics.todayEarnings}€`
                      : "..."}
                  </p>
                  <div className="flex items-center text-xs text-green-600 mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />+
                    {realTimeMetrics?.weeklyGrowth || 0}% cette semaine
                  </div>
                </div>
                <div className="h-12 w-12 bg-green-50 border border-green-200 rounded-lg flex items-center justify-center">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300"
            style={{ animationDelay: "0.2s" }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Satisfaction Client
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {realTimeMetrics
                      ? realTimeMetrics.clientsSatisfaction
                      : "..."}
                  </p>
                  <div className="flex items-center text-xs text-yellow-600 mt-1">
                    <Star className="h-3 w-3 mr-1 fill-current" />
                    Excellent
                  </div>
                </div>
                <div className="h-12 w-12 bg-yellow-50 border border-yellow-200 rounded-lg flex items-center justify-center">
                  <Star className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="bg-card border-border shadow-sm hover:shadow-md transition-all duration-300"
            style={{ animationDelay: "0.3s" }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Vues Profil
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {realTimeMetrics ? realTimeMetrics.profileViews : "..."}
                  </p>
                  <div className="flex items-center text-xs text-purple-600 mt-1">
                    <Eye className="h-3 w-3 mr-1" />
                    Cette semaine
                  </div>
                </div>
                <div className="h-12 w-12 bg-purple-50 border border-purple-200 rounded-lg flex items-center justify-center">
                  <Eye className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tabs */}
        <Tabs defaultValue="today" className="space-y-6">
          <TabsList className="grid w-full grid-cols-7 bg-gray-100 p-1 rounded-xl">
            <TabsTrigger
              value="today"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 rounded-lg"
            >
              <Calendar className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Aujourd'hui</span>
              <span className="sm:hidden">Jour</span>
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 rounded-lg"
            >
              <BarChart3 className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Stats</span>
            </TabsTrigger>
            <TabsTrigger
              value="clients"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 rounded-lg"
            >
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Clients</span>
              <span className="sm:hidden">Clients</span>
            </TabsTrigger>
            <TabsTrigger
              value="earnings"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 rounded-lg"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Gains</span>
              <span className="sm:hidden">€</span>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 rounded-lg"
            >
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Profil</span>
              <span className="sm:hidden">Profil</span>
            </TabsTrigger>
            <TabsTrigger
              value="content"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 rounded-lg"
            >
              <Video className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Contenu</span>
              <span className="sm:hidden">Media</span>
            </TabsTrigger>
            <TabsTrigger
              value="services"
              className="data-[state=active]:bg-white data-[state=active]:text-gray-900 rounded-lg"
            >
              <Scissors className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Services</span>
              <span className="sm:hidden">Services</span>
            </TabsTrigger>
          </TabsList>

          {/* Today Tab */}
          <TabsContent value="today" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Bookings */}
              <Card className="bg-white border-gray-200 shadow-md rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-blue-600" />
                      Rendez-vous d'Aujourd'hui
                    </div>
                    <Badge className="bg-blue-100 text-blue-700 border-blue-200">
                      {todayBookings.length} RDV
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-80 overflow-y-auto">
                  <div className="space-y-3">
                    {todayBookings.map((booking) => (
                      <div
                        key={booking.id}
                        className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">
                              {booking.client}
                            </p>
                            <p className="text-sm text-gray-600">
                              {booking.service}
                            </p>
                            <p className="text-xs text-gray-500">
                              {booking.time} • {booking.duration}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-gray-900">
                            {booking.price}€
                          </p>
                          <Badge
                            className={`text-xs ${
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-700 border-green-200"
                                : "bg-yellow-100 text-yellow-700 border-yellow-200"
                            }`}
                          >
                            {booking.status === "confirmed"
                              ? "Confirmé"
                              : "En attente"}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Recent Reviews */}
              <Card className="bg-white border-gray-200 shadow-md rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Star className="h-5 w-5 mr-2 text-yellow-600" />
                    Avis Récents
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-80 overflow-y-auto">
                  <div className="space-y-4">
                    {clientReviews.slice(0, 4).map((review) => (
                      <div
                        key={review.id}
                        className="p-3 rounded-lg border border-gray-100"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center space-x-2">
                            <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                              <User className="h-4 w-4 text-blue-600" />
                            </div>
                            <span className="font-medium text-sm text-gray-900">
                              {review.client}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < review.rating ? "text-yellow-500 fill-current" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 mb-2">
                          {review.comment}
                        </p>
                        <div className="flex justify-between items-center text-xs text-gray-500">
                          <span>{review.service}</span>
                          <span>{review.date}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Weekly Performance */}
              <Card className="bg-white border-gray-200 shadow-md rounded-xl lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    Performance Hebdomadaire
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {weeklyStats && (
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="text-center p-4 rounded-lg border border-gray-100">
                        <p className="text-2xl font-bold text-gray-900">
                          {weeklyStats.totalBookings}
                        </p>
                        <p className="text-sm text-gray-600">Rendez-vous</p>
                      </div>
                      <div className="text-center p-4 rounded-lg border border-gray-100">
                        <p className="text-2xl font-bold text-gray-900">
                          {weeklyStats.totalEarnings}€
                        </p>
                        <p className="text-sm text-gray-600">Revenus</p>
                      </div>
                      <div className="text-center p-4 rounded-lg border border-gray-100">
                        <p className="text-2xl font-bold text-gray-900">
                          {weeklyStats.avgRating}
                        </p>
                        <p className="text-sm text-gray-600">Note moyenne</p>
                      </div>
                      <div className="text-center p-4 rounded-lg border border-gray-100">
                        <p className="text-2xl font-bold text-gray-900">
                          {weeklyStats.completionRate}%
                        </p>
                        <p className="text-sm text-gray-600">
                          Taux de réalisation
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Client Stats */}
              <Card className="bg-white border-gray-200 shadow-md rounded-xl">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Users className="h-5 w-5 mr-2 text-purple-600" />
                    Clients
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {weeklyStats && (
                    <div className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Clients fidèles
                        </span>
                        <span className="font-bold text-gray-900">
                          {weeklyStats.repeatClients}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Nouveaux clients
                        </span>
                        <span className="font-bold text-gray-900">
                          {weeklyStats.newClients}
                        </span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-600">
                          Annulations
                        </span>
                        <span className="font-bold text-red-600">
                          {weeklyStats.canceledBookings}
                        </span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Chart Component */}
            {analyticsCharts && (
              <Card className="bg-white border-gray-200 shadow-md rounded-xl">
                <CardHeader>
                  <CardTitle>Évolution des Revenus</CardTitle>
                </CardHeader>
                <CardContent>
                  <ChartComponent data={analyticsCharts} />
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Other tabs remain similar with light theme colors */}
          <TabsContent value="clients" className="space-y-4">
            <Card className="bg-white border-gray-200 shadow-md rounded-xl">
              <CardHeader>
                <CardTitle>Gestion des Clients</CardTitle>
                <CardDescription>
                  Consultez votre base de clients et leurs historiques
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Base de Clients
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Gérez vos clients, consultez leurs historiques et
                    préférences.
                  </p>
                  <Button className="bg-purple-600 hover:bg-purple-700 text-white">
                    <Users className="h-4 w-4 mr-2" />
                    Voir mes Clients
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="earnings" className="space-y-4">
            <Card className="bg-white border-gray-200 shadow-md rounded-xl">
              <CardHeader>
                <CardTitle>Gestion des Gains</CardTitle>
                <CardDescription>
                  Suivez vos revenus et objectifs financiers
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <DollarSign className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Suivi des Gains
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Consultez vos revenus détaillés et suivez vos objectifs.
                  </p>
                  <Button className="bg-green-600 hover:bg-green-700 text-white">
                    <DollarSign className="h-4 w-4 mr-2" />
                    Voir mes Gains
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="profile" className="space-y-4">
            <Card className="bg-white border-gray-200 shadow-md rounded-xl">
              <CardHeader>
                <CardTitle>Mon Profil Barbier</CardTitle>
                <CardDescription>
                  Gérez les informations de votre profil professionnel
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Profil Professionnel
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Modifiez vos informations, spécialités et disponibilités.
                  </p>
                  <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                    <User className="h-4 w-4 mr-2" />
                    Modifier mon Profil
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="content" className="space-y-4">
            <Card className="bg-white border-gray-200 shadow-md rounded-xl">
              <CardHeader>
                <CardTitle>Mes Contenus</CardTitle>
                <CardDescription>
                  Gérez vos vidéos et articles de blog
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Video className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Contenu Multimédia
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Ajoutez des vidéos de votre travail et rédigez des articles.
                  </p>
                  <Button className="bg-orange-600 hover:bg-orange-700 text-white">
                    <Video className="h-4 w-4 mr-2" />
                    Gérer mon Contenu
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="services" className="space-y-4">
            <Card className="bg-white border-gray-200 shadow-md rounded-xl">
              <CardHeader>
                <CardTitle>Mes Services</CardTitle>
                <CardDescription>Gérez vos services et tarifs</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Scissors className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">
                    Gestion des Services
                  </h3>
                  <p className="text-gray-600 mb-6">
                    Ajoutez, modifiez et gérez vos services avec leurs prix et
                    détails.
                  </p>
                  <Link to="/barber-services">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Scissors className="h-4 w-4 mr-2" />
                      Gérer mes Services
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="fixed top-16 right-4 w-80 bg-white border border-gray-200 rounded-lg shadow-lg z-50">
          <div className="p-4 border-b border-gray-200">
            <h3 className="font-semibold text-gray-900">Notifications</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b border-gray-100 hover:bg-gray-50 ${notification.unread ? "bg-blue-50" : ""}`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${notification.unread ? "bg-blue-500" : "bg-gray-300"}`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      {notification.title}
                    </p>
                    <p className="text-xs text-gray-600">
                      {notification.message}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {notification.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

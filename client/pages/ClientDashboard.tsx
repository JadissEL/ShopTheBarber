import React from "react";
// Removed API imports for demo mode - using only fallback data
// import {
//   authAPI,
//   barbersAPI,
//   appointmentsAPI,
//   favoritesAPI,
//   notificationsAPI,
//   profileAPI,
//   isAuthenticated,
//   logout,
//   analyticsAPI,
// } from "../../shared/api";
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
  Heart,
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
  Bookmark,
  ShoppingBag,
  Percent,
  Wallet,
  Receipt,
  UserPlus,
  MessageCircle,
  Headphones,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import BookingModal from "../components/BookingModal";

export default function ClientDashboard() {
  const navigate = useNavigate();
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [showNotifications, setShowNotifications] =
    React.useState<boolean>(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [user, setUser] = React.useState<any>(null);
  const [upcomingAppointments, setUpcomingAppointments] = React.useState<any[]>(
    [],
  );
  const [appointmentHistory, setAppointmentHistory] = React.useState<any[]>([]);
  const [favoriteBarbers, setFavoriteBarbers] = React.useState<any[]>([]);
  const [notifications, setNotifications] = React.useState<any[]>([]);
  const [loyaltyPoints, setLoyaltyPoints] = React.useState<any>(null);
  const [preferences, setPreferences] = React.useState<any>(null);
  const [selectedBarber, setSelectedBarber] = React.useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] =
    React.useState<boolean>(false);
  const [refreshKey, setRefreshKey] = React.useState(0);
  const [profileEditMode, setProfileEditMode] = React.useState(false);

  // Enhanced data loading functions with individual error handling
  const loadAllData = async () => {
    setIsLoading(true);
    try {
      // Load each function independently to prevent one failure from breaking all
      const loadFunctions = [
        loadUserProfile,
        loadUpcomingAppointments,
        loadAppointmentHistory,
        loadFavoriteBarbers,
        loadNotifications,
        loadLoyaltyPoints,
        loadPreferences,
      ];

      // Execute all functions independently
      const results = await Promise.allSettled(loadFunctions.map((fn) => fn()));

      // Log any failures for debugging
      results.forEach((result, index) => {
        if (result.status === "rejected") {
          console.error(
            `Error in ${loadFunctions[index].name}:`,
            result.reason,
          );
        }
      });
    } catch (error) {
      console.error("Error loading dashboard data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      // Use demo data directly to avoid authentication issues
      setUser({
        id: 1,
        name: "Ahmed Benali",
        email: "ahmed.benali@gmail.com",
        phone: "+212 6 12 34 56 78",
        location: "Casablanca, Maroc",
        avatar: null,
        member_since: "2023-06-15",
        total_appointments: 24,
        total_spent: 840.0,
        preferred_services: ["Coupe moderne", "Barbe styling"],
      });
    } catch (error) {
      console.error("Error loading user profile:", error);
    }
  };

  const loadUpcomingAppointments = async () => {
    try {
      // Use demo data directly to avoid API calls
      setUpcomingAppointments([
        {
          id: 1,
          barber_name: "Hassan Alami",
          salon_name: "Salon Elite",
          date: "2024-01-15",
          time: "14:30",
          service: "Coupe + Barbe",
          price: 35,
          status: "confirmed",
          location: "Casablanca Centre",
          duration: "45min",
          can_cancel: true,
        },
        {
          id: 2,
          barber_name: "Youssef Bennani",
          salon_name: "Style Pro",
          date: "2024-01-18",
          time: "16:00",
          service: "Coupe Moderne",
          price: 28,
          status: "pending",
          location: "Maarif",
          duration: "30min",
          can_cancel: true,
        },
        {
          id: 3,
          barber_name: "Omar Tazi",
          salon_name: "Barber House",
          date: "2024-01-22",
          time: "11:00",
          service: "Rasage Traditionnel",
          price: 22,
          status: "confirmed",
          location: "Ain Diab",
          duration: "30min",
          can_cancel: true,
        },
      ]);
    } catch (error) {
      console.error("Error loading upcoming appointments:", error);
      // Use fallback data on error
      setUpcomingAppointments([
        {
          id: 1,
          barber_name: "Hassan Alami",
          salon_name: "Salon Elite",
          date: "2024-01-15",
          time: "14:30",
          service: "Coupe + Barbe",
          price: 35,
          status: "confirmed",
          location: "Casablanca Centre",
          duration: "45min",
          can_cancel: true,
        },
        {
          id: 2,
          barber_name: "Youssef Bennani",
          salon_name: "Style Pro",
          date: "2024-01-18",
          time: "16:00",
          service: "Coupe Moderne",
          price: 28,
          status: "pending",
          location: "Maarif",
          duration: "30min",
          can_cancel: true,
        },
      ]);
    }
  };

  const loadAppointmentHistory = async () => {
    try {
      // Use demo data directly to avoid API calls
      setAppointmentHistory([
        {
          id: 4,
          barber_name: "Hassan Alami",
          salon_name: "Salon Elite",
          date: "2024-01-08",
          time: "15:00",
          service: "Coupe + Barbe",
          price: 35,
          status: "completed",
          rating: 5,
          review: "Excellent service, très professionnel !",
        },
        {
          id: 5,
          barber_name: "Mehdi Benali",
          salon_name: "Modern Cut",
          date: "2024-01-02",
          time: "13:30",
          service: "Coupe Moderne",
          price: 30,
          status: "completed",
          rating: 4,
          review: "Très satisfait du résultat.",
        },
        {
          id: 6,
          barber_name: "Youssef Bennani",
          salon_name: "Style Pro",
          date: "2023-12-28",
          time: "10:00",
          service: "Barbe Styling",
          price: 25,
          status: "completed",
          rating: 5,
          review: "Parfait comme toujours !",
        },
      ]);
    } catch (error) {
      console.error("Error loading appointment history:", error);
      // Use fallback data on error
      setAppointmentHistory([
        {
          id: 4,
          barber_name: "Hassan Alami",
          salon_name: "Salon Elite",
          date: "2024-01-08",
          time: "15:00",
          service: "Coupe + Barbe",
          price: 35,
          status: "completed",
          rating: 5,
          review: "Excellent service, très professionnel !",
        },
      ]);
    }
  };

  const loadFavoriteBarbers = async () => {
    try {
      // Use demo data directly to avoid API calls
      setFavoriteBarbers([
        {
          id: 1,
          name: "Hassan Alami",
          salon_name: "Salon Elite",
          rating: 4.8,
          location: "Casablanca Centre",
          price_range: "25-45€",
          specialties: ["Coupe moderne", "Barbe styling"],
          distance: "1.2 km",
          next_available: "Aujourd'hui 16:00",
        },
        {
          id: 2,
          name: "Youssef Bennani",
          salon_name: "Style Pro",
          rating: 4.6,
          location: "Maarif",
          price_range: "20-35€",
          specialties: ["Coupe classique", "Rasage"],
          distance: "2.8 km",
          next_available: "Demain 14:30",
        },
        {
          id: 3,
          name: "Omar Tazi",
          salon_name: "Barber House",
          rating: 4.7,
          location: "Ain Diab",
          price_range: "22-40€",
          specialties: ["Rasage traditionnel", "Soins"],
          distance: "4.1 km",
          next_available: "Mercredi 11:00",
        },
      ]);
    } catch (error) {
      console.error("Error loading favorite barbers:", error);
      // Use fallback data on error
      setFavoriteBarbers([
        {
          id: 1,
          name: "Hassan Alami",
          salon_name: "Salon Elite",
          rating: 4.8,
          location: "Casablanca Centre",
          price_range: "25-45€",
          specialties: ["Coupe moderne", "Barbe styling"],
          distance: "1.2 km",
          next_available: "Aujourd'hui 16:00",
        },
      ]);
    }
  };

  const loadNotifications = async () => {
    try {
      // Use demo data directly to avoid API calls
      setNotifications([
        {
          id: 1,
          type: "reminder",
          title: "Rappel de rendez-vous",
          message: "Votre RDV avec Hassan Alami demain à 14h30",
          time: "Il y a 1h",
          unread: true,
        },
        {
          id: 2,
          type: "promotion",
          title: "Offre spéciale",
          message: "-20% chez Style Pro ce week-end",
          time: "Il y a 3h",
          unread: true,
        },
        {
          id: 3,
          type: "review",
          title: "Évaluez votre expérience",
          message: "Donnez votre avis sur votre dernier RDV",
          time: "Il y a 1j",
          unread: false,
        },
        {
          id: 4,
          type: "loyalty",
          title: "Points fidélité",
          message: "Vous avez gagné 50 points !",
          time: "Il y a 2j",
          unread: false,
        },
      ]);
    } catch (error) {
      console.error("Error loading notifications:", error);
      // Use fallback data on error
      setNotifications([
        {
          id: 1,
          type: "reminder",
          title: "Rappel de rendez-vous",
          message: "Votre RDV avec Hassan Alami demain �� 14h30",
          time: "Il y a 1h",
          unread: true,
        },
      ]);
    }
  };

  const loadLoyaltyPoints = async () => {
    try {
      // Mock loyalty points data
      setLoyaltyPoints({
        current_points: 1240,
        total_earned: 2850,
        points_to_next_reward: 260,
        next_reward: "Coupe gratuite",
        tier: "Gold",
        tier_progress: 78,
        available_rewards: [
          {
            id: 1,
            name: "Coupe gratuite",
            points_required: 1500,
            description: "Une coupe complète offerte",
          },
          {
            id: 2,
            name: "Réduction 20%",
            points_required: 800,
            description: "20% de réduction sur votre prochain RDV",
          },
          {
            id: 3,
            name: "Service premium",
            points_required: 2000,
            description: "Accès aux services premium",
          },
        ],
      });
    } catch (error) {
      console.error("Error loading loyalty points:", error);
      // Use fallback data on error
      setLoyaltyPoints({
        current_points: 1240,
        total_earned: 2850,
        points_to_next_reward: 260,
        next_reward: "Coupe gratuite",
        tier: "Gold",
        tier_progress: 78,
        available_rewards: [
          {
            id: 1,
            name: "Coupe gratuite",
            points_required: 1500,
            description: "Une coupe complète offerte",
          },
        ],
      });
    }
  };

  const loadPreferences = async () => {
    try {
      // Mock preferences data
      setPreferences({
        preferred_time_slots: ["14:00-16:00", "18:00-20:00"],
        preferred_services: ["Coupe moderne", "Barbe styling"],
        preferred_locations: ["Casablanca Centre", "Maarif"],
        budget_range: "25-40€",
        notifications_enabled: true,
        email_promotions: true,
        sms_reminders: true,
        auto_booking: false,
      });
    } catch (error) {
      console.error("Error loading preferences:", error);
      // Use fallback data on error
      setPreferences({
        preferred_time_slots: ["14:00-16:00", "18:00-20:00"],
        preferred_services: ["Coupe moderne", "Barbe styling"],
        preferred_locations: ["Casablanca Centre", "Maarif"],
        budget_range: "25-40€",
        notifications_enabled: true,
        email_promotions: true,
        sms_reminders: true,
        auto_booking: false,
      });
    }
  };

  const handleBookingClick = (barber: any) => {
    setSelectedBarber(barber);
    setIsBookingModalOpen(true);
  };

  const handleCancelAppointment = async (appointmentId: number) => {
    try {
      setUpcomingAppointments((prev) =>
        prev.filter((apt) => apt.id !== appointmentId),
      );
      // Add API call to cancel appointment
    } catch (error) {
      console.error("Error canceling appointment:", error);
    }
  };

  const refreshData = () => {
    setRefreshKey((prev) => prev + 1);
    loadAllData();
  };

  React.useEffect(() => {
    loadAllData();

    // Disabled real-time updates to prevent API calls
    // const interval = setInterval(() => {
    //   loadNotifications();
    //   loadUpcomingAppointments();
    // }, 60000); // Every minute

    // return () => clearInterval(interval);
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
    <div className="min-h-screen bg-background text-foreground">
      {/* Enhanced Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 shadow-lg">
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
              <User className="h-6 w-6 text-accent" />
              <span className="font-display text-xl font-bold text-foreground">
                Mon Espace Client
              </span>
              {loyaltyPoints && (
                <Badge className="ml-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white">
                  {loyaltyPoints.tier} • {loyaltyPoints.current_points} points
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
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                      {notifications.filter((n) => n.unread).length}
                    </span>
                  )}
              </Button>
            </div>

            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-accent-foreground" />
              </div>
              <div className="hidden md:block">
                <span className="text-sm font-medium text-foreground">
                  {user?.name || "Client"}
                </span>
                <p className="text-xs text-muted-foreground">
                  Membre depuis{" "}
                  {user?.member_since
                    ? new Date(user.member_since).getFullYear()
                    : "2023"}
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
            Bonjour, {user?.name || "Client"} !
          </h1>
          <p className="text-muted-foreground">
            Gérez vos rendez-vous, découvrez de nouveaux barbiers et profitez de
            nos offres exclusives.
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="moroccan-card animate-fade-in hover:shadow-lg transition-all duration-300">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Prochains RDV
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {upcomingAppointments.length}
                  </p>
                  <div className="flex items-center text-xs text-blue-600 mt-1">
                    <Calendar className="h-3 w-3 mr-1" />À venir
                  </div>
                </div>
                <div className="h-12 w-12 bg-blue-500/20 rounded-lg flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="moroccan-card animate-fade-in hover:shadow-lg transition-all duration-300"
            style={{ animationDelay: "0.1s" }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Points Fidélité
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {loyaltyPoints ? loyaltyPoints.current_points : "..."}
                  </p>
                  <div className="flex items-center text-xs text-yellow-600 mt-1">
                    <Gift className="h-3 w-3 mr-1" />
                    {loyaltyPoints?.tier || "Member"}
                  </div>
                </div>
                <div className="h-12 w-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <Gift className="h-6 w-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="moroccan-card animate-fade-in hover:shadow-lg transition-all duration-300"
            style={{ animationDelay: "0.2s" }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Barbiers Favoris
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {favoriteBarbers.length}
                  </p>
                  <div className="flex items-center text-xs text-red-600 mt-1">
                    <Heart className="h-3 w-3 mr-1 fill-current" />
                    Favoris
                  </div>
                </div>
                <div className="h-12 w-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <Heart className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card
            className="moroccan-card animate-fade-in hover:shadow-lg transition-all duration-300"
            style={{ animationDelay: "0.3s" }}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-muted-foreground">
                    Total Dépensé
                  </p>
                  <p className="text-2xl font-bold text-foreground">
                    {user ? `${user.total_spent}€` : "..."}
                  </p>
                  <div className="flex items-center text-xs text-green-600 mt-1">
                    <Wallet className="h-3 w-3 mr-1" />
                    {user?.total_appointments || 0} visites
                  </div>
                </div>
                <div className="h-12 w-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <Wallet className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Tabs */}
        <Tabs defaultValue="appointments" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 bg-muted">
            <TabsTrigger
              value="appointments"
              className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <Calendar className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Rendez-vous</span>
              <span className="sm:hidden">RDV</span>
            </TabsTrigger>
            <TabsTrigger
              value="favorites"
              className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <Heart className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Favoris</span>
              <span className="sm:hidden">❤️</span>
            </TabsTrigger>
            <TabsTrigger
              value="loyalty"
              className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <Gift className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Fidélité</span>
              <span className="sm:hidden">Points</span>
            </TabsTrigger>
            <TabsTrigger
              value="history"
              className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <History className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Historique</span>
              <span className="sm:hidden">Hist</span>
            </TabsTrigger>
            <TabsTrigger
              value="profile"
              className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <User className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Profil</span>
              <span className="sm:hidden">Profil</span>
            </TabsTrigger>
            <TabsTrigger
              value="support"
              className="data-[state=active]:bg-accent data-[state=active]:text-accent-foreground"
            >
              <Headphones className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Support</span>
              <span className="sm:hidden">Aide</span>
            </TabsTrigger>
          </TabsList>

          {/* Appointments Tab */}
          <TabsContent value="appointments" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Appointments */}
              <Card className="moroccan-card">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Calendar className="h-5 w-5 mr-2 text-accent" />
                      Rendez-vous à Venir
                    </div>
                    <Button size="sm" onClick={() => navigate("/barbiers")}>
                      <Plus className="h-4 w-4 mr-2" />
                      Nouveau RDV
                    </Button>
                  </CardTitle>
                </CardHeader>
                <CardContent className="max-h-80 overflow-y-auto">
                  <div className="space-y-3">
                    {upcomingAppointments.map((appointment) => (
                      <div
                        key={appointment.id}
                        className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-3">
                          <div>
                            <h4 className="font-medium text-foreground">
                              {appointment.barber_name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {appointment.salon_name}
                            </p>
                            <p className="text-sm text-muted-foreground">
                              {appointment.location}
                            </p>
                          </div>
                          <Badge
                            className={`${
                              appointment.status === "confirmed"
                                ? "bg-green-500/20 text-green-600"
                                : "bg-yellow-500/20 text-yellow-600"
                            }`}
                          >
                            {appointment.status === "confirmed"
                              ? "Confirmé"
                              : "En attente"}
                          </Badge>
                        </div>

                        <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-3">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {new Date(appointment.date).toLocaleDateString()}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {appointment.time}
                          </div>
                          <div className="flex items-center">
                            <Scissors className="h-4 w-4 mr-1" />
                            {appointment.service}
                          </div>
                        </div>

                        <div className="flex justify-between items-center">
                          <span className="font-bold text-lg text-foreground">
                            {appointment.price}€
                          </span>
                          <div className="space-x-2">
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Contacter
                            </Button>
                            {appointment.can_cancel && (
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-red-600 border-red-600 hover:bg-red-600 hover:text-white"
                                onClick={() =>
                                  handleCancelAppointment(appointment.id)
                                }
                              >
                                <X className="h-4 w-4 mr-1" />
                                Annuler
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}

                    {upcomingAppointments.length === 0 && (
                      <div className="text-center py-8">
                        <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground">
                          Aucun rendez-vous à venir
                        </p>
                        <Button
                          className="mt-4"
                          onClick={() => navigate("/barbiers")}
                        >
                          Prendre un rendez-vous
                        </Button>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quick Actions */}
              <Card className="moroccan-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Zap className="h-5 w-5 mr-2 text-accent" />
                    Actions Rapides
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col"
                      onClick={() => navigate("/barbiers")}
                    >
                      <Search className="h-6 w-6 mb-2 text-accent" />
                      Trouver un Barbier
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col"
                      onClick={() => navigate("/marketplace")}
                    >
                      <ShoppingBag className="h-6 w-6 mb-2 text-accent" />
                      Marketplace
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col"
                      onClick={() => navigate("/blog")}
                    >
                      <BookOpen className="h-6 w-6 mb-2 text-accent" />
                      Blog & Conseils
                    </Button>
                    <Button
                      variant="outline"
                      className="h-20 flex flex-col"
                      onClick={() => navigate("/client-settings")}
                    >
                      <Settings className="h-6 w-6 mb-2 text-accent" />
                      Paramètres
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Favorites Tab */}
          <TabsContent value="favorites" className="space-y-6">
            <Card className="moroccan-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Heart className="h-5 w-5 mr-2 text-accent" />
                  Mes Barbiers Favoris
                </CardTitle>
                <CardDescription>
                  Vos barbiers préférés et leurs disponibilités
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {favoriteBarbers.map((barber) => (
                    <div
                      key={barber.id}
                      className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-foreground">
                            {barber.name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {barber.salon_name}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {barber.location} • {barber.distance}
                          </p>
                        </div>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 fill-current mr-1" />
                          <span className="text-sm font-medium">
                            {barber.rating}
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-1 mb-3">
                        {barber.specialties.map(
                          (specialty: string, index: number) => (
                            <Badge key={index} variant="secondary" size="sm">
                              {specialty}
                            </Badge>
                          ),
                        )}
                      </div>

                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-sm text-muted-foreground">
                            {barber.price_range}
                          </p>
                          <p className="text-xs text-green-600">
                            {barber.next_available}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleBookingClick(barber)}
                        >
                          Réserver
                        </Button>
                      </div>
                    </div>
                  ))}

                  {favoriteBarbers.length === 0 && (
                    <div className="col-span-2 text-center py-8">
                      <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Aucun barbier favori pour le moment
                      </p>
                      <Button
                        className="mt-4"
                        onClick={() => navigate("/barbiers")}
                      >
                        Découvrir des barbiers
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loyalty Tab */}
          <TabsContent value="loyalty" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Loyalty Overview */}
              <Card className="moroccan-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Gift className="h-5 w-5 mr-2 text-accent" />
                    Programme de Fidélité
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {loyaltyPoints && (
                    <div className="space-y-6">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-r from-yellow-500 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-4">
                          <Award className="h-10 w-10 text-white" />
                        </div>
                        <h3 className="text-2xl font-bold text-foreground">
                          Membre {loyaltyPoints.tier}
                        </h3>
                        <p className="text-lg font-semibold text-accent">
                          {loyaltyPoints.current_points} points
                        </p>
                      </div>

                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Progrès vers {loyaltyPoints.next_reward}</span>
                          <span>
                            {loyaltyPoints.points_to_next_reward} points
                            restants
                          </span>
                        </div>
                        <Progress
                          value={
                            ((loyaltyPoints.current_points /
                              (loyaltyPoints.current_points +
                                loyaltyPoints.points_to_next_reward)) *
                              100) %
                            100
                          }
                          className="h-3"
                        />
                      </div>

                      <div className="text-center p-3 rounded-lg bg-muted/50">
                        <p className="text-sm text-muted-foreground">
                          Total gagné
                        </p>
                        <p className="text-lg font-bold text-foreground">
                          {loyaltyPoints.total_earned} points
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Available Rewards */}
              <Card className="moroccan-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bookmark className="h-5 w-5 mr-2 text-accent" />
                    Récompenses Disponibles
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {loyaltyPoints?.available_rewards.map((reward: any) => (
                      <div
                        key={reward.id}
                        className="p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div>
                            <h4 className="font-medium text-foreground">
                              {reward.name}
                            </h4>
                            <p className="text-sm text-muted-foreground">
                              {reward.description}
                            </p>
                          </div>
                          <Badge
                            className={`${
                              loyaltyPoints.current_points >=
                              reward.points_required
                                ? "bg-green-500/20 text-green-600"
                                : "bg-gray-500/20 text-gray-600"
                            }`}
                          >
                            {reward.points_required} pts
                          </Badge>
                        </div>
                        <Button
                          size="sm"
                          className="w-full"
                          disabled={
                            loyaltyPoints.current_points <
                            reward.points_required
                          }
                        >
                          {loyaltyPoints.current_points >=
                          reward.points_required
                            ? "Échanger"
                            : "Points insuffisants"}
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-6">
            <Card className="moroccan-card">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <History className="h-5 w-5 mr-2 text-accent" />
                  Historique des Rendez-vous
                </CardTitle>
                <CardDescription>
                  Vos derniers rendez-vous et évaluations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {appointmentHistory.map((appointment) => (
                    <div
                      key={appointment.id}
                      className="p-4 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex justify-between items-start mb-3">
                        <div>
                          <h4 className="font-medium text-foreground">
                            {appointment.barber_name}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {appointment.salon_name}
                          </p>
                          <div className="flex items-center space-x-4 text-sm text-muted-foreground mt-1">
                            <span>
                              {new Date(appointment.date).toLocaleDateString()}
                            </span>
                            <span>{appointment.time}</span>
                            <span>{appointment.service}</span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-foreground">
                            {appointment.price}€
                          </p>
                          <div className="flex items-center mt-1">
                            {[...Array(5)].map((_, i) => (
                              <Star
                                key={i}
                                className={`h-3 w-3 ${i < appointment.rating ? "text-yellow-500 fill-current" : "text-gray-300"}`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>

                      {appointment.review && (
                        <div className="p-3 bg-muted/50 rounded-lg mt-3">
                          <p className="text-sm text-muted-foreground">
                            "{appointment.review}"
                          </p>
                        </div>
                      )}

                      <div className="flex justify-end space-x-2 mt-3">
                        <Button size="sm" variant="outline">
                          Rerevoir
                        </Button>
                        <Button size="sm">Reprendre RDV</Button>
                      </div>
                    </div>
                  ))}

                  {appointmentHistory.length === 0 && (
                    <div className="text-center py-8">
                      <History className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        Aucun historique pour le moment
                      </p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Profile Tab */}
          <TabsContent value="profile" className="space-y-6">
            <Card className="moroccan-card">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <div className="flex items-center">
                    <User className="h-5 w-5 mr-2 text-accent" />
                    Mon Profil
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setProfileEditMode(!profileEditMode)}
                  >
                    {profileEditMode ? (
                      <Save className="h-4 w-4" />
                    ) : (
                      <Edit className="h-4 w-4" />
                    )}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {user && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Nom complet
                          </label>
                          {profileEditMode ? (
                            <Input defaultValue={user.name} />
                          ) : (
                            <p className="text-foreground">{user.name}</p>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Email
                          </label>
                          {profileEditMode ? (
                            <Input defaultValue={user.email} />
                          ) : (
                            <p className="text-foreground">{user.email}</p>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Téléphone
                          </label>
                          {profileEditMode ? (
                            <Input defaultValue={user.phone} />
                          ) : (
                            <p className="text-foreground">{user.phone}</p>
                          )}
                        </div>

                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Localisation
                          </label>
                          {profileEditMode ? (
                            <Input defaultValue={user.location} />
                          ) : (
                            <p className="text-foreground">{user.location}</p>
                          )}
                        </div>
                      </div>

                      <div className="space-y-4">
                        <div>
                          <label className="text-sm font-medium text-muted-foreground">
                            Services préférés
                          </label>
                          <div className="flex flex-wrap gap-2 mt-2">
                            {user.preferred_services?.map(
                              (service: string, index: number) => (
                                <Badge key={index} variant="secondary">
                                  {service}
                                </Badge>
                              ),
                            )}
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <div className="text-center p-3 rounded-lg border">
                            <p className="text-sm text-muted-foreground">
                              Membre depuis
                            </p>
                            <p className="font-bold text-foreground">
                              {user.member_since
                                ? new Date(user.member_since).getFullYear()
                                : "2023"}
                            </p>
                          </div>
                          <div className="text-center p-3 rounded-lg border">
                            <p className="text-sm text-muted-foreground">
                              Total visites
                            </p>
                            <p className="font-bold text-foreground">
                              {user.total_appointments}
                            </p>
                          </div>
                        </div>

                        <div className="text-center p-3 rounded-lg bg-accent/10">
                          <p className="text-sm text-muted-foreground">
                            Total dépensé
                          </p>
                          <p className="text-lg font-bold text-foreground">
                            {user.total_spent}€
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Support Tab */}
          <TabsContent value="support" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Contact Support */}
              <Card className="moroccan-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Headphones className="h-5 w-5 mr-2 text-accent" />
                    Support Client
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Button className="w-full justify-start" variant="outline">
                      <MessageCircle className="h-4 w-4 mr-2" />
                      Chat en direct
                    </Button>

                    <Button className="w-full justify-start" variant="outline">
                      <Mail className="h-4 w-4 mr-2" />
                      Envoyer un email
                    </Button>

                    <Button className="w-full justify-start" variant="outline">
                      <Phone className="h-4 w-4 mr-2" />
                      +212 5 22 XX XX XX
                    </Button>

                    <div className="p-3 rounded-lg bg-muted/50">
                      <p className="text-sm text-muted-foreground">
                        Horaires du support
                      </p>
                      <p className="font-medium text-foreground">
                        Lun-Ven: 9h-18h
                      </p>
                      <p className="font-medium text-foreground">Sam: 9h-13h</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* FAQ */}
              <Card className="moroccan-card">
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <HelpCircle className="h-5 w-5 mr-2 text-accent" />
                    Questions Fréquentes
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <h4 className="font-medium text-foreground mb-1">
                        Comment annuler un rendez-vous ?
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Vous pouvez annuler jusqu'à 2h avant...
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <h4 className="font-medium text-foreground mb-1">
                        Comment gagner des points ?
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Chaque visite vous fait gagner des points...
                      </p>
                    </div>

                    <div className="p-3 rounded-lg border hover:bg-muted/50 transition-colors">
                      <h4 className="font-medium text-foreground mb-1">
                        Modes de paiement acceptés ?
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        Espèces, carte bancaire, mobile money...
                      </p>
                    </div>

                    <Button className="w-full" variant="outline">
                      Voir toutes les FAQ
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>

      {/* Notifications Dropdown */}
      {showNotifications && (
        <div className="fixed top-16 right-4 w-80 bg-background border rounded-lg shadow-lg z-50">
          <div className="p-4 border-b">
            <h3 className="font-semibold text-foreground">Notifications</h3>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className={`p-3 border-b hover:bg-muted/50 ${notification.unread ? "bg-accent/10" : ""}`}
              >
                <div className="flex items-start space-x-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 ${notification.unread ? "bg-accent" : "bg-muted"}`}
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-foreground">
                      {notification.title}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {notification.time}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Booking Modal */}
      {selectedBarber && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => setIsBookingModalOpen(false)}
          barber={selectedBarber}
        />
      )}
    </div>
  );
}

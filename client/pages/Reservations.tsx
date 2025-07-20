import React, { useState, useEffect } from "react";
import { 
  Calendar, 
  Clock, 
  MapPin, 
  User, 
  Scissors, 
  Phone, 
  MessageSquare, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  AlertCircle,
  Filter,
  Search,
  ChevronDown,
  ChevronUp,
  Star,
  CreditCard,
  CalendarDays,
  Clock3,
  Building,
  Car,
  Home,
  Zap,
  Shield,
  Gift,
  Crown,
  TrendingUp,
  Users,
  Settings,
  Bell,
  BookOpen,
  Heart,
  Share2,
  Download,
  Eye,
  EyeOff,
  RefreshCw,
  Plus,
  Minus,
  ArrowRight,
  ArrowLeft,
  MoreHorizontal,
  ExternalLink,
  Copy,
  QrCode,
  Camera,
  Video,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Wifi,
  WifiOff,
  Battery,
  BatteryCharging,
  Sun,
  Moon,
  Cloud,
  CloudRain,
  Wind,
  Thermometer,
  Droplets,
  Umbrella,
  Snowflake,
  CloudLightning,
  EyeDropper,
  Palette,
  Sparkles,
  Wand2,
  Magic,
  Zap,
  Target,
  Crosshair,
  Aim,
  Focus,
  Compass,
  Navigation,
  Map,
  Globe,
  World,
  Flag,
  Award,
  Trophy,
  Medal,
  Badge,
  Certificate,
  Diploma,
  GraduationCap,
  School,
  University,
  Library,
  Book,
  BookOpen,
  Bookmark,
  BookmarkPlus,
  BookmarkMinus,
  BookmarkX,
  BookmarkCheck,
  BookmarkHeart,
  BookmarkStar,
  BookmarkUser,
  BookmarkSettings,
  BookmarkEdit,
  BookmarkTrash,
  BookmarkCopy,
  BookmarkShare,
  BookmarkDownload,
  BookmarkUpload,
  BookmarkLock,
  BookmarkUnlock,
  BookmarkKey,
  BookmarkShield
} from "lucide-react";
import { Button } from "../components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "../components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { Progress } from "../components/ui/progress";
import { Separator } from "../components/ui/separator";
import { Avatar, AvatarFallback, AvatarImage } from "../components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "../components/ui/tooltip";
import { useAuth } from "../hooks/useAuth";

interface Reservation {
  id: string;
  barberName: string;
  barberAvatar: string;
  service: string;
  date: string;
  time: string;
  duration: number;
  price: number;
  status: 'upcoming' | 'completed' | 'cancelled' | 'pending';
  location: string;
  phone: string;
  notes?: string;
  rating?: number;
  review?: string;
  paymentStatus: 'paid' | 'pending' | 'failed';
  paymentMethod: string;
  specialRequests?: string[];
  reminderSent: boolean;
  isRecurring: boolean;
  recurringPattern?: string;
  createdAt: string;
  updatedAt: string;
}

export default function Reservations() {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [filteredReservations, setFilteredReservations] = useState<Reservation[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [dateFilter, setDateFilter] = useState<string>("all");
  const [sortBy, setSortBy] = useState<string>("date");
  const [viewMode, setViewMode] = useState<"list" | "calendar" | "timeline">("list");
  const [selectedReservation, setSelectedReservation] = useState<Reservation | null>(null);
  const [showDetails, setShowDetails] = useState(false);
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [showRescheduleDialog, setShowRescheduleDialog] = useState(false);
  const [showReviewDialog, setShowReviewDialog] = useState(false);

  // Mock data - replace with actual API call
  useEffect(() => {
    const mockReservations: Reservation[] = [
      {
        id: "1",
        barberName: "Ahmed Alami",
        barberAvatar: "https://images.unsplash.com/photo-1503951914875-452162b0f3f1?w=150&h=150&fit=crop&crop=face",
        service: "Coupe + Barbe Premium",
        date: "2024-01-15",
        time: "14:30",
        duration: 45,
        price: 120,
        status: "upcoming",
        location: "Salon Royal, Casablanca",
        phone: "+212 6 12 34 56 78",
        paymentStatus: "paid",
        paymentMethod: "Carte bancaire",
        reminderSent: true,
        isRecurring: false,
        createdAt: "2024-01-10T10:00:00Z",
        updatedAt: "2024-01-10T10:00:00Z"
      },
      {
        id: "2",
        barberName: "Youssef Benali",
        barberAvatar: "https://images.unsplash.com/photo-1622286342621-4bd786c2447c?w=150&h=150&fit=crop&crop=face",
        service: "Coupe Classique",
        date: "2024-01-12",
        time: "16:00",
        duration: 30,
        price: 80,
        status: "completed",
        location: "Barber Shop Elite, Rabat",
        phone: "+212 6 98 76 54 32",
        rating: 5,
        review: "Excellent service, très professionnel !",
        paymentStatus: "paid",
        paymentMethod: "Espèces",
        reminderSent: true,
        isRecurring: true,
        recurringPattern: "Mensuel",
        createdAt: "2024-01-05T14:30:00Z",
        updatedAt: "2024-01-12T16:30:00Z"
      },
      {
        id: "3",
        barberName: "Karim Tazi",
        barberAvatar: "https://images.unsplash.com/photo-1619895862022-09114b41f16f?w=150&h=150&fit=crop&crop=face",
        service: "Coupe + Coloration",
        date: "2024-01-20",
        time: "11:00",
        duration: 60,
        price: 150,
        status: "pending",
        location: "Style & Co, Marrakech",
        phone: "+212 6 55 44 33 22",
        paymentStatus: "pending",
        paymentMethod: "En ligne",
        specialRequests: ["Coloration naturelle", "Style moderne"],
        reminderSent: false,
        isRecurring: false,
        createdAt: "2024-01-08T09:15:00Z",
        updatedAt: "2024-01-08T09:15:00Z"
      },
      {
        id: "4",
        barberName: "Hassan El Fassi",
        barberAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
        service: "Coupe + Soin Visage",
        date: "2024-01-08",
        time: "13:00",
        duration: 40,
        price: 100,
        status: "cancelled",
        location: "Gentleman's Club, Fès",
        phone: "+212 6 11 22 33 44",
        paymentStatus: "paid",
        paymentMethod: "Carte bancaire",
        reminderSent: true,
        isRecurring: false,
        createdAt: "2024-01-03T16:45:00Z",
        updatedAt: "2024-01-07T10:20:00Z"
      }
    ];

    setReservations(mockReservations);
    setFilteredReservations(mockReservations);
    setLoading(false);
  }, []);

  // Filter and sort reservations
  useEffect(() => {
    let filtered = reservations;

    // Search filter
    if (searchTerm) {
      filtered = filtered.filter(reservation =>
        reservation.barberName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.service.toLowerCase().includes(searchTerm.toLowerCase()) ||
        reservation.location.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(reservation => reservation.status === statusFilter);
    }

    // Date filter
    if (dateFilter !== "all") {
      const today = new Date();
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      const nextWeek = new Date(today);
      nextWeek.setDate(nextWeek.getDate() + 7);

      filtered = filtered.filter(reservation => {
        const reservationDate = new Date(reservation.date);
        switch (dateFilter) {
          case "today":
            return reservationDate.toDateString() === today.toDateString();
          case "tomorrow":
            return reservationDate.toDateString() === tomorrow.toDateString();
          case "this-week":
            return reservationDate >= today && reservationDate <= nextWeek;
          case "past":
            return reservationDate < today;
          default:
            return true;
        }
      });
    }

    // Sort
    filtered.sort((a, b) => {
      switch (sortBy) {
        case "date":
          return new Date(a.date).getTime() - new Date(b.date).getTime();
        case "price":
          return b.price - a.price;
        case "duration":
          return b.duration - a.duration;
        case "barber":
          return a.barberName.localeCompare(b.barberName);
        default:
          return 0;
      }
    });

    setFilteredReservations(filtered);
  }, [reservations, searchTerm, statusFilter, dateFilter, sortBy]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "upcoming":
        return "bg-blue-500 text-white";
      case "completed":
        return "bg-green-500 text-white";
      case "cancelled":
        return "bg-red-500 text-white";
      case "pending":
        return "bg-yellow-500 text-black";
      default:
        return "bg-gray-500 text-white";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "upcoming":
        return <Clock className="h-4 w-4" />;
      case "completed":
        return <Check className="h-4 w-4" />;
      case "cancelled":
        return <X className="h-4 w-4" />;
      case "pending":
        return <AlertCircle className="h-4 w-4" />;
      default:
        return <Clock className="h-4 w-4" />;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('fr-FR', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const formatTime = (timeString: string) => {
    return timeString;
  };

  const handleCancelReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowCancelDialog(true);
  };

  const handleRescheduleReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowRescheduleDialog(true);
  };

  const handleReviewReservation = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowReviewDialog(true);
  };

  const handleViewDetails = (reservation: Reservation) => {
    setSelectedReservation(reservation);
    setShowDetails(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-moroccan-charcoal flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-moroccan-gold mx-auto mb-4"></div>
          <p className="text-moroccan-sand">Chargement des réservations...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-moroccan-charcoal text-moroccan-offwhite">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold bg-moroccan-gradient-primary bg-clip-text text-transparent mb-2">
                Mes Réservations
              </h1>
              <p className="text-moroccan-sand text-lg">
                Gérez vos rendez-vous actuels et futurs
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="lg"
                className="border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold/10"
              >
                <Plus className="h-5 w-5 mr-2" />
                Nouvelle Réservation
              </Button>
              <Button 
                size="lg"
                className="bg-moroccan-gradient-primary text-moroccan-charcoal hover:scale-105 transition-transform"
              >
                <Calendar className="h-5 w-5 mr-2" />
                Voir Calendrier
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-moroccan-darkgrey border-moroccan-gold/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-moroccan-sand text-sm">Réservations à venir</p>
                    <p className="text-2xl font-bold text-moroccan-gold">
                      {reservations.filter(r => r.status === 'upcoming').length}
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-moroccan-gold" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-moroccan-darkgrey border-moroccan-gold/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-moroccan-sand text-sm">Réservations complétées</p>
                    <p className="text-2xl font-bold text-green-400">
                      {reservations.filter(r => r.status === 'completed').length}
                    </p>
                  </div>
                  <Check className="h-8 w-8 text-green-400" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-moroccan-darkgrey border-moroccan-gold/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-moroccan-sand text-sm">Total dépensé</p>
                    <p className="text-2xl font-bold text-moroccan-sand">
                      {reservations
                        .filter(r => r.status === 'completed')
                        .reduce((sum, r) => sum + r.price, 0)
                        .toLocaleString('fr-FR')} DH
                    </p>
                  </div>
                  <CreditCard className="h-8 w-8 text-moroccan-sand" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-moroccan-darkgrey border-moroccan-gold/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-moroccan-sand text-sm">Note moyenne</p>
                    <p className="text-2xl font-bold text-yellow-400">
                      {reservations
                        .filter(r => r.rating)
                        .reduce((sum, r) => sum + (r.rating || 0), 0) / 
                        reservations.filter(r => r.rating).length || 0
                      }/5
                    </p>
                  </div>
                  <Star className="h-8 w-8 text-yellow-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Filters and Search */}
        <Card className="bg-moroccan-darkgrey border-moroccan-gold/20 mb-6">
          <CardContent className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-moroccan-sand" />
                <Input
                  placeholder="Rechercher..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 bg-moroccan-charcoal/50 border-moroccan-gold/30 text-moroccan-offwhite placeholder:text-moroccan-sand/60"
                />
              </div>

              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="bg-moroccan-charcoal/50 border-moroccan-gold/30 text-moroccan-offwhite">
                  <SelectValue placeholder="Statut" />
                </SelectTrigger>
                <SelectContent className="bg-moroccan-darkgrey border-moroccan-gold/30">
                  <SelectItem value="all">Tous les statuts</SelectItem>
                  <SelectItem value="upcoming">À venir</SelectItem>
                  <SelectItem value="completed">Complétées</SelectItem>
                  <SelectItem value="cancelled">Annulées</SelectItem>
                  <SelectItem value="pending">En attente</SelectItem>
                </SelectContent>
              </Select>

              <Select value={dateFilter} onValueChange={setDateFilter}>
                <SelectTrigger className="bg-moroccan-charcoal/50 border-moroccan-gold/30 text-moroccan-offwhite">
                  <SelectValue placeholder="Période" />
                </SelectTrigger>
                <SelectContent className="bg-moroccan-darkgrey border-moroccan-gold/30">
                  <SelectItem value="all">Toutes les dates</SelectItem>
                  <SelectItem value="today">Aujourd'hui</SelectItem>
                  <SelectItem value="tomorrow">Demain</SelectItem>
                  <SelectItem value="this-week">Cette semaine</SelectItem>
                  <SelectItem value="past">Passées</SelectItem>
                </SelectContent>
              </Select>

              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="bg-moroccan-charcoal/50 border-moroccan-gold/30 text-moroccan-offwhite">
                  <SelectValue placeholder="Trier par" />
                </SelectTrigger>
                <SelectContent className="bg-moroccan-darkgrey border-moroccan-gold/30">
                  <SelectItem value="date">Date</SelectItem>
                  <SelectItem value="price">Prix</SelectItem>
                  <SelectItem value="duration">Durée</SelectItem>
                  <SelectItem value="barber">Barbier</SelectItem>
                </SelectContent>
              </Select>

              <div className="flex space-x-2">
                <Button
                  variant={viewMode === "list" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("list")}
                  className={viewMode === "list" ? "bg-moroccan-gold text-moroccan-charcoal" : "border-moroccan-gold/30 text-moroccan-gold"}
                >
                  Liste
                </Button>
                <Button
                  variant={viewMode === "calendar" ? "default" : "outline"}
                  size="sm"
                  onClick={() => setViewMode("calendar")}
                  className={viewMode === "calendar" ? "bg-moroccan-gold text-moroccan-charcoal" : "border-moroccan-gold/30 text-moroccan-gold"}
                >
                  Calendrier
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Reservations List */}
        <div className="space-y-4">
          {filteredReservations.length === 0 ? (
            <Card className="bg-moroccan-darkgrey border-moroccan-gold/20">
              <CardContent className="p-12 text-center">
                <Calendar className="h-16 w-16 text-moroccan-sand/50 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-moroccan-sand mb-2">
                  Aucune réservation trouvée
                </h3>
                <p className="text-moroccan-sand/70 mb-6">
                  {searchTerm || statusFilter !== "all" || dateFilter !== "all"
                    ? "Essayez de modifier vos filtres de recherche"
                    : "Vous n'avez pas encore de réservations"}
                </p>
                <Button className="bg-moroccan-gradient-primary text-moroccan-charcoal">
                  <Plus className="h-4 w-4 mr-2" />
                  Prendre un rendez-vous
                </Button>
              </CardContent>
            </Card>
          ) : (
            filteredReservations.map((reservation) => (
              <Card 
                key={reservation.id} 
                className="bg-moroccan-darkgrey border-moroccan-gold/20 hover:border-moroccan-gold/40 transition-all duration-300 hover:scale-[1.02] group"
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4 flex-1">
                      <Avatar className="h-16 w-16 border-2 border-moroccan-gold/30">
                        <AvatarImage src={reservation.barberAvatar} alt={reservation.barberName} />
                        <AvatarFallback className="bg-moroccan-charcoal text-moroccan-gold">
                          {reservation.barberName.split(' ').map(n => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>

                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="text-xl font-semibold text-moroccan-offwhite">
                            {reservation.barberName}
                          </h3>
                          <Badge className={getStatusColor(reservation.status)}>
                            {getStatusIcon(reservation.status)}
                            <span className="ml-1 capitalize">
                              {reservation.status === 'upcoming' ? 'À venir' :
                               reservation.status === 'completed' ? 'Complétée' :
                               reservation.status === 'cancelled' ? 'Annulée' : 'En attente'}
                            </span>
                          </Badge>
                          {reservation.isRecurring && (
                            <Badge className="bg-purple-500 text-white">
                              <RefreshCw className="h-3 w-3 mr-1" />
                              Récurrent
                            </Badge>
                          )}
                        </div>

                        <p className="text-moroccan-gold font-medium mb-1">
                          {reservation.service}
                        </p>

                        <div className="flex items-center space-x-6 text-sm text-moroccan-sand">
                          <div className="flex items-center">
                            <Calendar className="h-4 w-4 mr-1" />
                            {formatDate(reservation.date)}
                          </div>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-1" />
                            {formatTime(reservation.time)} ({reservation.duration} min)
                          </div>
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-1" />
                            {reservation.location}
                          </div>
                          <div className="flex items-center">
                            <CreditCard className="h-4 w-4 mr-1" />
                            {reservation.price} DH
                          </div>
                        </div>

                        {reservation.rating && (
                          <div className="flex items-center mt-2">
                            <div className="flex items-center">
                              {[...Array(5)].map((_, i) => (
                                <Star
                                  key={i}
                                  className={`h-4 w-4 ${
                                    i < reservation.rating! ? 'text-yellow-400 fill-current' : 'text-moroccan-sand/30'
                                  }`}
                                />
                              ))}
                            </div>
                            <span className="text-moroccan-sand text-sm ml-2">
                              {reservation.rating}/5
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleViewDetails(reservation)}
                              className="border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold/10"
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Voir les détails</p>
                          </TooltipContent>
                        </Tooltip>

                        {reservation.status === 'upcoming' && (
                          <>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleRescheduleReservation(reservation)}
                                  className="border-blue-500/30 text-blue-400 hover:bg-blue-500/10"
                                >
                                  <Edit className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Reprogrammer</p>
                              </TooltipContent>
                            </Tooltip>

                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => handleCancelReservation(reservation)}
                                  className="border-red-500/30 text-red-400 hover:bg-red-500/10"
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Annuler</p>
                              </TooltipContent>
                            </Tooltip>
                          </>
                        )}

                        {reservation.status === 'completed' && !reservation.rating && (
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleReviewReservation(reservation)}
                                className="border-yellow-500/30 text-yellow-400 hover:bg-yellow-500/10"
                              >
                                <Star className="h-4 w-4" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p>Noter</p>
                            </TooltipContent>
                          </Tooltip>
                        )}

                        <Button
                          variant="outline"
                          size="sm"
                          className="border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold/10"
                        >
                          <MessageSquare className="h-4 w-4" />
                        </Button>
                      </TooltipProvider>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Reservation Details Dialog */}
      <Dialog open={showDetails} onOpenChange={setShowDetails}>
        <DialogContent className="bg-moroccan-darkgrey border-moroccan-gold/30 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-moroccan-offwhite">
              Détails de la réservation
            </DialogTitle>
            <DialogDescription className="text-moroccan-sand">
              Informations complètes sur votre rendez-vous
            </DialogDescription>
          </DialogHeader>
          {selectedReservation && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <Avatar className="h-20 w-20 border-2 border-moroccan-gold/30">
                  <AvatarImage src={selectedReservation.barberAvatar} alt={selectedReservation.barberName} />
                  <AvatarFallback className="bg-moroccan-charcoal text-moroccan-gold text-xl">
                    {selectedReservation.barberName.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3 className="text-2xl font-bold text-moroccan-offwhite">
                    {selectedReservation.barberName}
                  </h3>
                  <p className="text-moroccan-gold">{selectedReservation.service}</p>
                  <Badge className={getStatusColor(selectedReservation.status)}>
                    {getStatusIcon(selectedReservation.status)}
                    <span className="ml-1 capitalize">
                      {selectedReservation.status === 'upcoming' ? 'À venir' :
                       selectedReservation.status === 'completed' ? 'Complétée' :
                       selectedReservation.status === 'cancelled' ? 'Annulée' : 'En attente'}
                    </span>
                  </Badge>
                </div>
              </div>

              <Separator className="bg-moroccan-gold/20" />

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h4 className="font-semibold text-moroccan-gold mb-2">Informations du rendez-vous</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-2 text-moroccan-sand" />
                      <span className="text-moroccan-offwhite">{formatDate(selectedReservation.date)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock className="h-4 w-4 mr-2 text-moroccan-sand" />
                      <span className="text-moroccan-offwhite">{formatTime(selectedReservation.time)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock3 className="h-4 w-4 mr-2 text-moroccan-sand" />
                      <span className="text-moroccan-offwhite">{selectedReservation.duration} minutes</span>
                    </div>
                    <div className="flex items-center">
                      <MapPin className="h-4 w-4 mr-2 text-moroccan-sand" />
                      <span className="text-moroccan-offwhite">{selectedReservation.location}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <h4 className="font-semibold text-moroccan-gold mb-2">Informations de paiement</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-moroccan-sand" />
                      <span className="text-moroccan-offwhite">{selectedReservation.price} DH</span>
                    </div>
                    <div className="flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-moroccan-sand" />
                      <span className="text-moroccan-offwhite capitalize">{selectedReservation.paymentStatus}</span>
                    </div>
                    <div className="flex items-center">
                      <CreditCard className="h-4 w-4 mr-2 text-moroccan-sand" />
                      <span className="text-moroccan-offwhite">{selectedReservation.paymentMethod}</span>
                    </div>
                    <div className="flex items-center">
                      <Phone className="h-4 w-4 mr-2 text-moroccan-sand" />
                      <span className="text-moroccan-offwhite">{selectedReservation.phone}</span>
                    </div>
                  </div>
                </div>
              </div>

              {selectedReservation.specialRequests && selectedReservation.specialRequests.length > 0 && (
                <>
                  <Separator className="bg-moroccan-gold/20" />
                  <div>
                    <h4 className="font-semibold text-moroccan-gold mb-2">Demandes spéciales</h4>
                    <div className="flex flex-wrap gap-2">
                      {selectedReservation.specialRequests.map((request, index) => (
                        <Badge key={index} className="bg-moroccan-gold/20 text-moroccan-gold border-moroccan-gold/30">
                          {request}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </>
              )}

              {selectedReservation.rating && (
                <>
                  <Separator className="bg-moroccan-gold/20" />
                  <div>
                    <h4 className="font-semibold text-moroccan-gold mb-2">Votre avis</h4>
                    <div className="flex items-center mb-2">
                      {[...Array(5)].map((_, i) => (
                        <Star
                          key={i}
                          className={`h-5 w-5 ${
                            i < selectedReservation.rating! ? 'text-yellow-400 fill-current' : 'text-moroccan-sand/30'
                          }`}
                        />
                      ))}
                      <span className="text-moroccan-sand text-sm ml-2">
                        {selectedReservation.rating}/5
                      </span>
                    </div>
                    {selectedReservation.review && (
                      <p className="text-moroccan-offwhite text-sm italic">
                        "{selectedReservation.review}"
                      </p>
                    )}
                  </div>
                </>
              )}

              <div className="flex justify-end space-x-2 pt-4">
                <Button
                  variant="outline"
                  onClick={() => setShowDetails(false)}
                  className="border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold/10"
                >
                  Fermer
                </Button>
                <Button className="bg-moroccan-gradient-primary text-moroccan-charcoal">
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Contacter le barbier
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Cancel Reservation Dialog */}
      <Dialog open={showCancelDialog} onOpenChange={setShowCancelDialog}>
        <DialogContent className="bg-moroccan-darkgrey border-moroccan-gold/30">
          <DialogHeader>
            <DialogTitle className="text-moroccan-offwhite">
              Annuler la réservation
            </DialogTitle>
            <DialogDescription className="text-moroccan-sand">
              Êtes-vous sûr de vouloir annuler cette réservation ? Cette action ne peut pas être annulée.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end space-x-2 pt-4">
            <Button
              variant="outline"
              onClick={() => setShowCancelDialog(false)}
              className="border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold/10"
            >
              Annuler
            </Button>
            <Button
              onClick={() => {
                // Handle cancellation logic here
                setShowCancelDialog(false);
              }}
              className="bg-red-500 hover:bg-red-600 text-white"
            >
              Confirmer l'annulation
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Review Dialog */}
      <Dialog open={showReviewDialog} onOpenChange={setShowReviewDialog}>
        <DialogContent className="bg-moroccan-darkgrey border-moroccan-gold/30">
          <DialogHeader>
            <DialogTitle className="text-moroccan-offwhite">
              Noter votre expérience
            </DialogTitle>
            <DialogDescription className="text-moroccan-sand">
              Partagez votre avis sur ce rendez-vous
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-moroccan-gold font-medium mb-2 block">Note</label>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((rating) => (
                  <Button
                    key={rating}
                    variant="outline"
                    size="sm"
                    className="border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold/10"
                  >
                    <Star className="h-4 w-4" />
                    {rating}
                  </Button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-moroccan-gold font-medium mb-2 block">Commentaire</label>
              <textarea
                className="w-full p-3 bg-moroccan-charcoal/50 border border-moroccan-gold/30 rounded-md text-moroccan-offwhite placeholder:text-moroccan-sand/60"
                placeholder="Partagez votre expérience..."
                rows={4}
              />
            </div>
            <div className="flex justify-end space-x-2 pt-4">
              <Button
                variant="outline"
                onClick={() => setShowReviewDialog(false)}
                className="border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold/10"
              >
                Annuler
              </Button>
              <Button
                onClick={() => {
                  // Handle review submission logic here
                  setShowReviewDialog(false);
                }}
                className="bg-moroccan-gradient-primary text-moroccan-charcoal"
              >
                Envoyer l'avis
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 
import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Badge } from "../components/ui/badge";
import {
  Star,
  MapPin,
  Clock,
  Scissors,
  ArrowLeft,
  Search,
  Filter,
  Home,
  Building,
  Calendar,
  Sparkles,
  Zap,
} from "lucide-react";
import { UserNav } from "../components/UserNav";
import { useAuth } from "../hooks/useAuth";
import BookingModal from "../components/BookingModal";
import MoroccanPattern from "@/components/ui/MoroccanPattern";
import { MoroccanLantern, MoroccanArch, MoroccanScissors, MoroccanStar } from "@/components/ui/MoroccanIcons";

export default function CityBarbers() {
  const navigate = useNavigate();
  const city = "casablanca"; // Mock city for demo
  const { isAuthenticated } = useAuth();
  const [selectedBarber, setSelectedBarber] = React.useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);
  const [loading, setLoading] = React.useState(true);
  const [barbers, setBarbers] = React.useState<any[]>([]);
  const [filteredBarbers, setFilteredBarbers] = React.useState<any[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [locationFilter, setLocationFilter] = React.useState<"all" | "shop" | "home">("all");
  const [ratingFilter, setRatingFilter] = React.useState<number>(0);
  const [globalError, setGlobalError] = React.useState<string | null>(null);

  // Ajout d'un effet pour capturer les erreurs non catchées
  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setGlobalError(event.message || 'Erreur inconnue');
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  // Ajout d'un log pour vérifier le render
  console.log('Rendering CityBarbers page...');

  // Images de fond pour chaque ville
  const cityBackgrounds = {
    casablanca: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&h=600&fit=crop",
    marrakech: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1920&h=600&fit=crop",
    rabat: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&h=600&fit=crop",
    fes: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=1920&h=600&fit=crop",
    tanger: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=1920&h=600&fit=crop",
    agadir: "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=1920&h=600&fit=crop",
  };

  // Données des barbiers avec images réelles
  const allBarbers = [
    {
      id: 1,
      name: "Hassan Alami",
      salon_name: "Salon Royal",
      location: "Casablanca",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      accepts_home: true,
      accepts_shop: true,
      services: [
        { id: 1, name: "Coupe Homme", price: 80 },
        { id: 2, name: "Coupe Femme", price: 120 },
        { id: 3, name: "Coloration", price: 200 }
      ]
    },
    {
      id: 2,
      name: "Youssef Bennani",
      salon_name: "Elite Barbershop",
      location: "Marrakech",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=400&fit=crop&crop=face",
      accepts_home: false,
      accepts_shop: true,
      services: [
        { id: 4, name: "Coupe Homme", price: 90 },
        { id: 5, name: "Barbe", price: 60 },
        { id: 6, name: "Shampoing", price: 40 }
      ]
    },
    {
      id: 3,
      name: "Omar Tazi",
      salon_name: "Modern Cut",
      location: "Rabat",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=400&h=400&fit=crop&crop=face",
      accepts_home: true,
      accepts_shop: true,
      services: [
        { id: 7, name: "Coupe Homme", price: 85 },
        { id: 8, name: "Coupe Femme", price: 130 },
        { id: 9, name: "Mèches", price: 180 }
      ]
    },
    {
      id: 4,
      name: "Mehdi Benali",
      salon_name: "Style Master",
      location: "Fès",
      rating: 4.7,
      image: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
      accepts_home: false,
      accepts_shop: true,
      services: [
        { id: 10, name: "Coupe Homme", price: 75 },
        { id: 11, name: "Coupe Femme", price: 110 },
        { id: 12, name: "Lissage", price: 250 }
      ]
    },
    {
      id: 5,
      name: "Karim Alaoui",
      salon_name: "Premium Cuts",
      location: "Tanger",
      rating: 4.8,
      image: "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=400&fit=crop&crop=face",
      accepts_home: true,
      accepts_shop: true,
      services: [
        { id: 13, name: "Coupe Homme", price: 95 },
        { id: 14, name: "Coupe Femme", price: 140 },
        { id: 15, name: "Extensions", price: 300 }
      ]
    },
    {
      id: 6,
      name: "Amine Zahra",
      salon_name: "Classic Cuts",
      location: "Agadir",
      rating: 4.9,
      image: "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=400&h=400&fit=crop&crop=face",
      accepts_home: false,
      accepts_shop: true,
      services: [
        { id: 16, name: "Coupe Homme", price: 70 },
        { id: 17, name: "Coupe Femme", price: 100 },
        { id: 18, name: "Soins", price: 80 }
      ]
    }
  ];

  React.useEffect(() => {
    // Simuler le chargement des données
    setTimeout(() => {
      const cityBarbers = allBarbers.filter(barber => 
        barber.location.toLowerCase() === city?.toLowerCase()
      );
      setBarbers(cityBarbers);
      setFilteredBarbers(cityBarbers);
      setLoading(false);
    }, 1000);
  }, [city]);

  React.useEffect(() => {
    let filtered = barbers;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(barber =>
        barber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barber.salon_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par type de location
    if (locationFilter === "home") {
      filtered = filtered.filter(barber => barber.accepts_home);
    } else if (locationFilter === "shop") {
      filtered = filtered.filter(barber => barber.accepts_shop);
    }

    // Filtre par note minimum
    if (ratingFilter > 0) {
      filtered = filtered.filter(barber => barber.rating >= ratingFilter);
    }

    setFilteredBarbers(filtered);
  }, [barbers, searchTerm, locationFilter, ratingFilter]);

  const handleBookingClick = (barber: any) => {
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    setSelectedBarber(barber);
    setIsBookingModalOpen(true);
  };

  const getCityDisplayName = (cityName: string) => {
    const cityMap: { [key: string]: string } = {
      casablanca: "Casablanca",
      marrakech: "Marrakech",
      rabat: "Rabat",
      fes: "Fès",
      tanger: "Tanger",
      agadir: "Agadir"
    };
    return cityMap[cityName.toLowerCase()] || cityName;
  };

  if (globalError) {
    return (
      <div className="min-h-screen bg-moroccan-charcoal text-moroccan-offwhite flex items-center justify-center">
        <div className="text-center p-8">
          <h2 className="text-2xl font-bold text-moroccan-gold mb-4">Erreur</h2>
          <p className="text-moroccan-sand">{globalError}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-moroccan-charcoal text-moroccan-offwhite">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-moroccan-darkgrey/50 bg-moroccan-charcoal/95 backdrop-blur supports-[backdrop-filter]:bg-moroccan-charcoal/60">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/')}
              className="text-moroccan-sand hover:text-moroccan-gold"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            <UserNav />
          </div>
        </div>
      </header>

      {/* Hero Section avec image de fond de la ville */}
      <section className="relative py-20 px-4 overflow-hidden">
        <div className="absolute inset-0">
          <img 
            src={cityBackgrounds[city as keyof typeof cityBackgrounds] || cityBackgrounds.casablanca}
            alt={`${getCityDisplayName(city)} - Barbiers`}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-moroccan-charcoal/90 via-moroccan-charcoal/80 to-moroccan-darkgrey/70"></div>
        </div>
        
        <div className="container mx-auto relative z-10 text-center">
          <div className="mb-6">
            <div className="bg-moroccan-gradient-primary text-moroccan-charcoal border-0 px-4 py-2 text-sm font-semibold rounded-full inline-flex items-center">
              <MapPin className="h-4 w-4 mr-2" />
              {getCityDisplayName(city)}
            </div>
          </div>
          
          <h1 className="text-4xl md:text-6xl font-heading font-bold text-moroccan-gold mb-6">
            Barbiers à {getCityDisplayName(city)}
          </h1>
          
          <p className="text-xl text-moroccan-sand max-w-2xl mx-auto mb-8">
            Découvrez les meilleurs barbiers de {getCityDisplayName(city)}. 
            Réservez en ligne et profitez de services premium.
          </p>

          {/* Search and Filters */}
          <div className="max-w-4xl mx-auto">
            <div className="grid md:grid-cols-3 gap-4 mb-8">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-moroccan-sand" />
                <input
                  type="text"
                  placeholder="Rechercher un barbier..."
                  className="w-full pl-12 pr-4 py-3 bg-moroccan-darkgrey/50 border border-moroccan-gold/30 text-moroccan-offwhite placeholder:text-moroccan-sand/60 focus:border-moroccan-gold focus:ring-moroccan-gold/20 rounded-lg"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* Location Filter */}
              <select
                className="w-full px-4 py-3 bg-moroccan-darkgrey/50 border border-moroccan-gold/30 text-moroccan-offwhite focus:border-moroccan-gold focus:ring-moroccan-gold/20 rounded-lg"
                value={locationFilter}
                onChange={(e) => setLocationFilter(e.target.value as "all" | "shop" | "home")}
              >
                <option value="all">Tous les types</option>
                <option value="shop">Salon uniquement</option>
                <option value="home">À domicile uniquement</option>
              </select>

              {/* Rating Filter */}
              <select
                className="w-full px-4 py-3 bg-moroccan-darkgrey/50 border border-moroccan-gold/30 text-moroccan-offwhite focus:border-moroccan-gold focus:ring-moroccan-gold/20 rounded-lg"
                value={ratingFilter}
                onChange={(e) => setRatingFilter(Number(e.target.value))}
              >
                <option value={0}>Toutes les notes</option>
                <option value={4.5}>4.5+ étoiles</option>
                <option value={4.0}>4.0+ étoiles</option>
                <option value={3.5}>3.5+ étoiles</option>
              </select>
            </div>
          </div>
        </div>
      </section>

      {/* Barbers Grid */}
      <section className="py-20 px-4">
        <div className="container mx-auto">
          {loading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card key={i} className="bg-moroccan-charcoal/50 border-moroccan-darkgrey animate-pulse">
                  <div className="h-48 bg-moroccan-darkgrey rounded-t-lg"></div>
                  <CardContent className="p-6">
                    <div className="w-20 h-20 bg-moroccan-darkgrey rounded-full mb-4"></div>
                    <div className="h-6 bg-moroccan-darkgrey rounded mb-2"></div>
                    <div className="h-4 bg-moroccan-darkgrey rounded w-2/3"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : filteredBarbers.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-24 h-24 bg-moroccan-darkgrey rounded-full mx-auto mb-6 flex items-center justify-center">
                <Search className="h-12 w-12 text-moroccan-sand" />
              </div>
              <h3 className="text-2xl font-bold text-moroccan-gold mb-4">
                Aucun barbier trouvé
              </h3>
              <p className="text-moroccan-sand mb-8">
                Essayez de modifier vos critères de recherche
              </p>
              <Button
                onClick={() => {
                  setSearchTerm("");
                  setLocationFilter("all");
                  setRatingFilter(0);
                }}
                className="bg-moroccan-gradient-primary text-moroccan-charcoal"
              >
                Réinitialiser les filtres
              </Button>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {filteredBarbers.map((barber) => (
                <Card key={barber.id} className="bg-moroccan-charcoal/50 border-moroccan-gold/20 hover:border-moroccan-gold/40 transition-all duration-300 hover:scale-105 group overflow-hidden">
                  {/* Image de fond du barbier */}
                  <div className="relative h-48 overflow-hidden">
                    <img 
                      src={barber.image} 
                      alt={barber.name}
                      className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-moroccan-charcoal/80 to-transparent"></div>
                    
                    {/* Badges de service */}
                    <div className="absolute top-4 right-4 flex flex-col gap-2">
                      {barber.accepts_home && (
                        <div className="bg-moroccan-gradient-primary text-moroccan-charcoal px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                          <Home className="h-3 w-3 mr-1" />
                          Domicile
                        </div>
                      )}
                      {barber.accepts_shop && (
                        <div className="bg-moroccan-gradient-primary text-moroccan-charcoal px-2 py-1 rounded-full text-xs font-semibold flex items-center">
                          <Building className="h-3 w-3 mr-1" />
                          Salon
                        </div>
                      )}
                    </div>
                  </div>

                  <CardContent className="p-6">
                    <div className="flex items-center space-x-4 mb-4">
                      <div className="w-16 h-16 bg-moroccan-gradient-primary rounded-full flex items-center justify-center -mt-8 relative z-10">
                        <Scissors className="h-8 w-8 text-moroccan-charcoal" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-moroccan-gold">
                          {barber.name}
                        </h3>
                        <p className="text-moroccan-sand">
                          {barber.salon_name}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-1">
                        <Star className="h-4 w-4 text-moroccan-gold fill-current" />
                        <span className="text-moroccan-sand font-semibold">
                          {barber.rating}
                        </span>
                      </div>
                      <div className="bg-moroccan-gradient-primary text-moroccan-charcoal border-0 px-3 py-1 rounded-full text-sm font-semibold">
                        {barber.location}
                      </div>
                    </div>

                    {/* Services */}
                    <div className="mb-6">
                      <h4 className="text-sm font-semibold text-moroccan-gold mb-2">Services populaires</h4>
                      <div className="space-y-1">
                        {barber.services.slice(0, 2).map((service: any) => (
                          <div key={service.id} className="flex justify-between text-sm text-moroccan-sand">
                            <span>{service.name}</span>
                            <span className="font-semibold text-moroccan-gold">{service.price} DH</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <Button 
                      className="w-full bg-moroccan-gradient-primary text-moroccan-charcoal hover:scale-105 transition-all duration-300"
                      onClick={() => handleBookingClick(barber)}
                    >
                      Réserver
                      <Calendar className="ml-2 h-4 w-4" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

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
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
import {
  Star,
  MapPin,
  Scissors,
  User,
  CheckCircle,
  ChevronRight,
  Calendar,
  Sparkles,
  ArrowRight,
  Zap,
  Heart,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { UserNav } from "../components/UserNav";
import { Footer } from "../components/Footer";
import { useAuth } from "../hooks/useAuth";
import BookingModal from "../components/BookingModal";
import { Input } from "../components/ui/input";
import { useState, useEffect } from "react";

// Carrousel dynamique (exemple simple)
const testimonials = [
  {
    name: "Yassine B.",
    text: "Service impeccable, réservation ultra simple !",
    avatar: "https://randomuser.me/api/portraits/men/32.jpg",
  },
  {
    name: "Fatima Z.",
    text: "J’ai trouvé le meilleur barbier de Casablanca grâce à ShopTheBarber.",
    avatar: "https://randomuser.me/api/portraits/women/44.jpg",
  },
  {
    name: "Omar K.",
    text: "Interface moderne, rappels pratiques, je recommande !",
    avatar: "https://randomuser.me/api/portraits/men/45.jpg",
  },
];

function Carousel() {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    const timer = setInterval(
      () => setIndex((i) => (i + 1) % testimonials.length),
      4000,
    );
    return () => clearInterval(timer);
  }, []);
  return (
    <div className="w-full max-w-xl mx-auto mb-12">
      <div className="bg-moroccan-darkgrey rounded-xl p-6 shadow-lg flex flex-col items-center transition-all duration-500 animate-fade-in">
        <img
          src={testimonials[index].avatar}
          alt={testimonials[index].name}
          className="w-16 h-16 rounded-full mb-3 border-4 border-moroccan-gold"
        />
        <p className="text-lg text-moroccan-offwhite italic mb-2">
          “{testimonials[index].text}”
        </p>
        <span className="text-moroccan-gold font-bold">
          {testimonials[index].name}
        </span>
      </div>
      <div className="flex justify-center mt-2 space-x-2">
        {testimonials.map((_, i) => (
          <button
            key={i}
            className={`w-3 h-3 rounded-full ${i === index ? "bg-moroccan-gold" : "bg-moroccan-sand/30"}`}
            onClick={() => setIndex(i)}
          />
        ))}
      </div>
    </div>
  );
}

export default function Index() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const [selectedBarber, setSelectedBarber] = React.useState<any>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = React.useState(false);
  const [featuredBarbers, setFeaturedBarbers] = React.useState<any[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [selectedCity, setSelectedCity] = React.useState("");
  const [searchTerm, setSearchTerm] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<any[]>([]);

  // Error handling
  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setGlobalError(event.message || "Erreur inconnue");
    };
    window.addEventListener("error", handler);
    return () => window.removeEventListener("error", handler);
  }, []);

  // Load featured barbers
  React.useEffect(() => {
    loadFeaturedBarbers();
  }, []);

  const loadFeaturedBarbers = async () => {
    try {
      setIsLoading(true);

      // Demo mode: Use mock data instead of API call
      console.log("Demo mode: Loading mock featured barbers");

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Mock featured barbers data
      const mockBarbers = [
        {
          id: 1,
          name: "Hassan Alami",
          salon_name: "Salon Elite",
          location: "Casablanca Centre",
          rating: 4.9,
          price_range: "25-45€",
          image:
            "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=400&h=400&fit=crop&crop=face",
          specialties: ["Coupe moderne", "Barbe styling"],
          distance: "1.2 km",
          available: true,
        },
        {
          id: 2,
          name: "Youssef Bennani",
          salon_name: "Style Pro",
          location: "Maarif",
          rating: 4.8,
          price_range: "20-35€",
          image:
            "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=400&fit=crop&crop=face",
          specialties: ["Coupe classique", "Rasage"],
          distance: "2.1 km",
          available: true,
        },
        {
          id: 3,
          name: "Omar Tazi",
          salon_name: "Barber House",
          location: "Ain Diab",
          rating: 4.7,
          price_range: "22-40€",
          image:
            "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=400&h=400&fit=crop&crop=face",
          specialties: ["Rasage traditionnel", "Soins"],
          distance: "3.5 km",
          available: false,
        },
        {
          id: 4,
          name: "Mehdi Benali",
          salon_name: "Modern Cut",
          location: "Gueliz",
          rating: 4.6,
          price_range: "30-50€",
          image:
            "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=400&h=400&fit=crop&crop=face",
          specialties: ["Coupe tendance", "Coloration"],
          distance: "4.2 km",
          available: true,
        },
        {
          id: 5,
          name: "Karim Alaoui",
          salon_name: "Premium Barber",
          location: "Anfa",
          rating: 4.5,
          price_range: "35-55€",
          image:
            "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=400&h=400&fit=crop&crop=face",
          specialties: ["Coupe premium", "Massage"],
          distance: "5.1 km",
          available: true,
        },
        {
          id: 6,
          name: "Ahmed Rifai",
          salon_name: "Classy Cuts",
          location: "Bourgogne",
          rating: 4.4,
          price_range: "18-28€",
          image:
            "https://images.unsplash.com/photo-1560250097-0b93528c311a?w=400&h=400&fit=crop&crop=face",
          specialties: ["Coupe simple", "Entretien"],
          distance: "6.3 km",
          available: true,
        },
      ];

      // Sort by rating and take top 6
      const sortedBarbers = mockBarbers
        .sort((a: any, b: any) => (b.rating || 0) - (a.rating || 0))
        .slice(0, 6);

      setFeaturedBarbers(sortedBarbers);
    } catch (error) {
      console.error("Erreur lors du chargement des barbiers:", error);
      setFeaturedBarbers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBookingClick = (barber: any) => {
    if (!isAuthenticated) {
      navigate("/login");
      return;
    }
    setSelectedBarber(barber);
    setIsBookingModalOpen(true);
  };

  const handleCityClick = (city: string) => {
    navigate(`/city/${city.toLowerCase()}`);
  };

  const handleSearch = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearch(e.target.value);
    if (e.target.value.length > 1) {
      const res = await fetch(
        `/api/search?q=${encodeURIComponent(e.target.value)}`,
      );
      if (res.ok) setSuggestions(await res.json());
      else setSuggestions([]);
    } else {
      setSuggestions([]);
    }
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

  // Images réelles pour les villes marocaines
  const cities = [
    {
      name: "Casablanca",
      image:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
      description: "La capitale économique du Maroc",
    },
    {
      name: "Marrakech",
      image:
        "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&h=600&fit=crop",
      description: "La ville rouge et ses souks légendaires",
    },
    {
      name: "Rabat",
      image:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
      description: "La capitale administrative du Maroc",
    },
    {
      name: "Fès",
      image:
        "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&h=600&fit=crop",
      description: "La ville spirituelle et culturelle",
    },
    {
      name: "Tanger",
      image:
        "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800&h=600&fit=crop",
      description: "La porte de l'Afrique sur l'Europe",
    },
    {
      name: "Agadir",
      image:
        "https://images.unsplash.com/photo-1518548419970-58e3b4079ab2?w=800&h=600&fit=crop",
      description: "La perle du sud et ses plages",
    },
  ];

  // Images pour les services de coiffure
  const features = [
    {
      icon: CheckCircle,
      title: "Barbers Vérifiés",
      description:
        "Tous nos barbiers sont certifiés et évalués par notre communauté",
      image:
        "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&h=300&fit=crop",
    },
    {
      icon: Calendar,
      title: "Réservation Facile",
      description: "Réservez votre créneau en quelques clics, 24h/24 et 7j/7",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    },
    {
      icon: Zap,
      title: "Qualité Premium",
      description:
        "Des services de coiffure de qualité professionnelle garantie",
      image:
        "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=400&h=300&fit=crop",
    },
    {
      icon: Heart,
      title: "Satisfaction Client",
      description: "Notre priorité est votre satisfaction et votre bien-être",
      image:
        "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop",
    },
  ];

  // Images de profil pour les barbiers (fallback)
  const barberImages = [
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=200&h=200&fit=crop&crop=face",
    "https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=200&h=200&fit=crop&crop=face",
  ];

  return (
    <div className="min-h-screen bg-moroccan-charcoal text-moroccan-offwhite">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-moroccan-gold/10 bg-moroccan-charcoal/90 backdrop-blur-md supports-[backdrop-filter]:bg-moroccan-charcoal/80 transition-all duration-300">
        <div className="container mx-auto flex h-20 items-center justify-between px-6">
          <div className="flex items-center space-x-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-moroccan-gradient-primary text-moroccan-charcoal shadow-2xl shadow-moroccan-gold/25 hover:scale-105 transition-transform duration-300">
              <Scissors className="h-6 w-6" />
            </div>
            <span className="font-heading text-2xl font-bold text-moroccan-gold tracking-tight">
              ShopTheBarber
            </span>
          </div>

          <nav className="hidden md:flex items-center space-x-2">
            <a
              href="#barbers"
              className="nav-link text-moroccan-sand hover:text-moroccan-gold transition-all duration-300 font-medium px-4 py-2 rounded-lg hover:bg-moroccan-gold/10"
            >
              Barbiers
            </a>
            <a
              href="#cities"
              className="nav-link text-moroccan-sand hover:text-moroccan-gold transition-all duration-300 font-medium px-4 py-2 rounded-lg hover:bg-moroccan-gold/10"
            >
              Villes
            </a>
            <Link
              to="/marketplace"
              className="nav-link text-moroccan-sand hover:text-moroccan-gold transition-all duration-300 font-medium px-4 py-2 rounded-lg hover:bg-moroccan-gold/10"
            >
              Marketplace
            </Link>
            <Link
              to="/blog"
              className="nav-link text-moroccan-sand hover:text-moroccan-gold transition-all duration-300 font-medium px-4 py-2 rounded-lg hover:bg-moroccan-gold/10"
            >
              Blog
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            <UserNav />
          </div>
        </div>
      </header>

      {/* Hero Section avec image de fond */}
      <section className="relative py-32 px-6 overflow-hidden min-h-screen flex items-center">
        {/* Image de fond hero */}
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1622287162716-f311baa1a2b8?w=1920&h=1080&fit=crop"
            alt="Barbershop moderne"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-br from-moroccan-charcoal/95 via-moroccan-charcoal/85 to-moroccan-darkgrey/75"></div>
          <div className="absolute inset-0 bg-moroccan-pattern opacity-5"></div>
        </div>

        <div className="container mx-auto relative z-10 text-center">
          <div className="mb-8 fade-in">
            <div className="bg-moroccan-gradient-primary text-white border-0 px-6 py-3 text-sm font-bold rounded-full inline-flex items-center shadow-xl shadow-moroccan-gold/20 hover:scale-105 transition-transform duration-300">
              <Sparkles className="h-4 w-4 mr-2" />
              Style Supérieur Premium
            </div>
          </div>

          <h1 className="text-6xl md:text-8xl font-heading font-black text-white mb-8 leading-tight slide-up tracking-tight">
            L'Art du
            <span className="block text-white drop-shadow-lg">
              Barbier Moderne
            </span>
          </h1>

          <p className="text-xl md:text-2xl text-white max-w-4xl mx-auto mb-12 leading-relaxed font-light slide-up opacity-90">
            Découvrez les meilleurs barbiers du Maroc. Réservez en ligne,
            profitez de services premium et transformez votre style avec
            l'excellence marocaine.
          </p>

          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center mb-20 slide-up">
            <Button
              size="lg"
              className="bg-moroccan-gradient-primary text-white hover:scale-110 hover:shadow-2xl hover:shadow-moroccan-gold/30 transition-all duration-500 px-10 py-5 text-lg font-bold rounded-2xl shadow-xl border-0 group"
              onClick={() =>
                document
                  .getElementById("barbers")
                  ?.scrollIntoView({ behavior: "smooth" })
              }
            >
              Découvrir les Barbiers
              <ArrowRight className="ml-3 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="border-2 border-moroccan-gold/50 text-moroccan-gold hover:bg-moroccan-gold hover:text-moroccan-charcoal hover:border-moroccan-gold hover:scale-105 hover:shadow-xl hover:shadow-moroccan-gold/20 transition-all duration-500 px-10 py-5 text-lg font-bold rounded-2xl backdrop-blur-sm bg-moroccan-charcoal/20"
              onClick={() => navigate("/marketplace")}
            >
              Explorer le Marketplace
            </Button>
          </div>

          {/* Search Bar */}
          <div className="relative max-w-2xl mx-auto mb-12 slide-up">
            <div className="relative">
              <input
                type="text"
                value={search}
                onChange={handleSearch}
                placeholder="Rechercher un barbier, un service..."
                className="w-full p-5 pl-14 rounded-2xl bg-moroccan-charcoal/40 backdrop-blur-md text-moroccan-offwhite border border-moroccan-gold/30 focus:outline-none focus:ring-2 focus:ring-moroccan-gold focus:border-moroccan-gold transition-all duration-300 text-lg placeholder:text-moroccan-sand/70 shadow-xl"
              />
              <div className="absolute left-5 top-1/2 transform -translate-y-1/2">
                <div className="w-6 h-6 text-moroccan-gold">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    strokeWidth={2}
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                    />
                  </svg>
                </div>
              </div>
            </div>
            {suggestions.length > 0 && (
              <ul className="absolute left-0 right-0 bg-moroccan-charcoal/95 backdrop-blur-md border border-moroccan-gold/30 rounded-2xl mt-2 z-10 max-h-60 overflow-y-auto shadow-2xl">
                {suggestions.map((s, i) => (
                  <li
                    key={i}
                    className="p-4 hover:bg-moroccan-gold/20 cursor-pointer text-moroccan-offwhite border-b border-moroccan-darkgrey/50 last:border-b-0 transition-colors duration-200 first:rounded-t-2xl last:rounded-b-2xl"
                  >
                    {s.name || s.title}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </section>

      {/* Features Section avec images */}
      <section className="py-32 px-6 bg-gradient-to-b from-moroccan-charcoal to-moroccan-darkgrey/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-moroccan-pattern opacity-3"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-20 fade-in">
            <h2 className="text-5xl md:text-6xl font-heading font-black text-moroccan-gold mb-8 tracking-tight">
              Pourquoi Choisir ShopTheBarber ?
            </h2>
            <p className="text-2xl text-moroccan-sand max-w-3xl mx-auto font-light leading-relaxed">
              Une expérience premium qui allie tradition marocaine et innovation
              moderne
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card
                  key={index}
                  className="group bg-moroccan-charcoal/40 backdrop-blur-md border border-moroccan-gold/20 hover:border-moroccan-gold/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-moroccan-gold/20 overflow-hidden slide-up glass-card"
                  style={{ animationDelay: `${index * 150}ms` }}
                >
                  <div className="relative h-56 overflow-hidden">
                    <img
                      src={feature.image}
                      alt={feature.title}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-moroccan-charcoal/80 via-moroccan-charcoal/40 to-transparent"></div>
                    <div className="absolute inset-0 bg-moroccan-pattern opacity-10"></div>
                  </div>
                  <CardContent className="p-8 text-center relative">
                    <div className="w-20 h-20 bg-moroccan-gradient-primary rounded-2xl flex items-center justify-center mx-auto mb-6 -mt-10 relative z-10 shadow-2xl shadow-moroccan-gold/30 group-hover:scale-110 transition-transform duration-300">
                      <Icon className="h-9 w-9 text-moroccan-charcoal" />
                    </div>
                    <h3 className="text-2xl font-bold text-moroccan-gold mb-4 group-hover:text-white transition-colors duration-300">
                      {feature.title}
                    </h3>
                    <p className="text-moroccan-sand leading-relaxed text-lg font-light">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Barbers Section avec photos de profil */}
      <section
        id="barbers"
        className="py-32 px-6 bg-gradient-to-b from-moroccan-darkgrey/20 to-moroccan-charcoal"
      >
        <div className="container mx-auto">
          <div className="text-center mb-20 fade-in">
            <h2 className="text-5xl md:text-6xl font-heading font-black text-moroccan-gold mb-8 tracking-tight">
              Nos Barbiers Vedettes
            </h2>
            <p className="text-2xl text-moroccan-sand max-w-3xl mx-auto font-light leading-relaxed">
              Découvrez les maîtres artisans sélectionn��s par notre communauté
              d'excellence
            </p>
          </div>

          {isLoading ? (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {[...Array(6)].map((_, i) => (
                <Card
                  key={i}
                  className="bg-moroccan-charcoal/40 backdrop-blur-md border border-moroccan-gold/20 animate-pulse overflow-hidden"
                >
                  <div className="h-64 bg-moroccan-darkgrey/50"></div>
                  <CardContent className="p-8">
                    <div className="w-20 h-20 bg-moroccan-darkgrey/50 rounded-2xl mb-6 -mt-10"></div>
                    <div className="h-6 bg-moroccan-darkgrey/50 rounded-lg mb-3"></div>
                    <div className="h-4 bg-moroccan-darkgrey/50 rounded-lg w-2/3 mb-4"></div>
                    <div className="h-10 bg-moroccan-darkgrey/50 rounded-xl"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
              {featuredBarbers.map((barber, index) => (
                <Card
                  key={barber.id}
                  className="group bg-moroccan-charcoal/40 backdrop-blur-md border border-moroccan-gold/20 hover:border-moroccan-gold/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-moroccan-gold/25 overflow-hidden slide-up glass-card"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="relative h-64 overflow-hidden">
                    <img
                      src={barberImages[index % barberImages.length]}
                      alt={barber.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-moroccan-charcoal/90 via-moroccan-charcoal/50 to-transparent"></div>
                    <div className="absolute top-4 right-4 bg-black/80 text-white px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                      {barber.location || "Casablanca"}
                    </div>
                  </div>
                  <CardContent className="p-8 relative">
                    <div className="flex items-center space-x-5 mb-6">
                      <div className="w-20 h-20 bg-moroccan-gradient-primary rounded-2xl flex items-center justify-center -mt-12 relative z-10 shadow-2xl shadow-moroccan-gold/30 group-hover:scale-110 transition-transform duration-300">
                        <User className="h-9 w-9 text-moroccan-charcoal" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-2xl font-bold text-moroccan-gold mb-2 group-hover:text-white transition-colors duration-300">
                          {barber.name}
                        </h3>
                        <p className="text-moroccan-sand text-lg font-medium">
                          {barber.salon_name || "Salon Premium"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center space-x-2">
                        <Star className="h-5 w-5 text-moroccan-gold fill-current" />
                        <span className="text-moroccan-sand font-bold text-lg">
                          {barber.rating || 4.8}
                        </span>
                        <span className="text-moroccan-sand/70 text-sm">
                          ({barber.review_count || 150} avis)
                        </span>
                      </div>
                    </div>

                    <Button
                      className="w-full bg-moroccan-gradient-primary text-moroccan-charcoal hover:scale-105 hover:shadow-xl hover:shadow-moroccan-gold/30 transition-all duration-300 py-4 text-lg font-bold rounded-xl group border-0"
                      onClick={() => handleBookingClick(barber)}
                    >
                      Réserver Maintenant
                      <ChevronRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform duration-300" />
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Cities Section avec images spécifiques */}
      <section
        id="cities"
        className="py-32 px-6 bg-gradient-to-b from-moroccan-charcoal to-moroccan-darkgrey/70 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-moroccan-pattern opacity-5"></div>
        <div className="container mx-auto relative z-10">
          <div className="text-center mb-20 fade-in">
            <h2 className="text-5xl md:text-6xl font-heading font-black text-moroccan-gold mb-8 tracking-tight">
              Explorez par Ville
            </h2>
            <p className="text-2xl text-moroccan-sand max-w-3xl mx-auto font-light leading-relaxed">
              Découvrez l'excellence du barbier dans les plus belles villes du
              Maroc
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-10">
            {cities.map((city, index) => (
              <Card
                key={index}
                className="group bg-moroccan-charcoal/40 backdrop-blur-md border border-moroccan-gold/20 hover:border-moroccan-gold/60 transition-all duration-500 hover:scale-105 hover:shadow-2xl hover:shadow-moroccan-gold/30 cursor-pointer overflow-hidden slide-up glass-card"
                onClick={() => handleCityClick(city.name)}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <CardContent className="p-0 overflow-hidden relative">
                  <div className="relative h-80 bg-moroccan-darkgrey">
                    <img
                      src={city.image}
                      alt={city.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-moroccan-charcoal/95 via-moroccan-charcoal/60 to-transparent"></div>
                    <div className="absolute inset-0 bg-moroccan-pattern opacity-10"></div>
                    <div className="absolute bottom-6 left-6 right-6">
                      <h3 className="text-3xl font-bold text-white mb-3 group-hover:text-white transition-colors duration-300">
                        {city.name}
                      </h3>
                      <p className="text-white/90 text-lg mb-4 font-light leading-relaxed">
                        {city.description}
                      </p>
                      <div className="flex items-center space-x-3 text-white/90 group-hover:text-white transition-colors duration-300">
                        <MapPin className="h-5 w-5" />
                        <span className="font-semibold">
                          Découvrir les barbiers
                        </span>
                        <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section avec image de fond */}
      <section className="py-32 px-6 relative overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1920&h=800&fit=crop"
            alt="Style masculin"
            className="w-full h-full object-cover scale-105"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-moroccan-charcoal/95 via-moroccan-charcoal/85 to-moroccan-darkgrey/90"></div>
          <div className="absolute inset-0 bg-moroccan-pattern opacity-10"></div>
        </div>

        <div className="container mx-auto text-center relative z-10">
          <div className="max-w-5xl mx-auto fade-in">
            <h2 className="text-5xl md:text-7xl font-heading font-black text-white mb-8 tracking-tight leading-tight">
              Prêt à Transformer Votre Style ?
            </h2>
            <p className="text-2xl text-white mb-12 max-w-3xl mx-auto font-light leading-relaxed">
              Rejoignez des milliers d'hommes qui font confiance à ShopTheBarber
              pour leur style et leur bien-être premium.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center slide-up">
              <Button
                size="lg"
                className="bg-moroccan-gradient-primary text-moroccan-charcoal hover:scale-110 hover:shadow-2xl hover:shadow-moroccan-gold/40 transition-all duration-500 px-12 py-6 text-xl font-bold shadow-xl rounded-2xl group border-0"
                onClick={() => navigate("/signup")}
              >
                Commencer Maintenant
                <ArrowRight className="ml-3 h-6 w-6 group-hover:translate-x-1 transition-transform duration-300" />
              </Button>

              <Button
                variant="outline"
                size="lg"
                className="border-2 border-moroccan-gold/50 text-moroccan-gold hover:bg-moroccan-gold hover:text-moroccan-charcoal hover:border-moroccan-gold hover:scale-105 hover:shadow-xl hover:shadow-moroccan-gold/30 transition-all duration-500 px-12 py-6 text-xl font-bold rounded-2xl backdrop-blur-sm bg-moroccan-charcoal/20"
                onClick={() => navigate("/login")}
              >
                Se Connecter
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />

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

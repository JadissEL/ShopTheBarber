import React, { useState } from "react";
import { Button } from "../components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../components/ui/card";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Scissors, Eye, EyeOff, Mail, User, Phone, MapPin } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
// import { authAPI, setAuthToken } from "../../shared/api";
// Demo mode - using mock registration

export default function Signup() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    phone: "",
    city: "",
    address: "",
    role: "client",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setError("");
  };

  const handleRoleSelect = (role: string) => {
    setFormData({ ...formData, role });
    setError("");
  };

  // Mock setAuthToken function for demo mode
  const setAuthToken = (token: string, userId: number) => {
    try {
      if (typeof window !== "undefined" && window.localStorage) {
        localStorage.setItem("token", token);
        localStorage.setItem("userId", userId.toString());
      }
    } catch (error) {
      console.error("Error setting auth token:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Prevent double submission
    if (isLoading) {
      return;
    }

    setIsLoading(true);
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Les mots de passe ne correspondent pas");
      setIsLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Le mot de passe doit contenir au moins 6 caractères");
      setIsLoading(false);
      return;
    }

    try {
      console.log("Demo mode: Mock registration with:", {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        role: formData.role,
        phone: formData.phone,
        city: formData.city,
        address: formData.address,
      });

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1500));

      // Mock successful registration response
      const mockUserId = Math.floor(Math.random() * 1000) + 100;
      const mockResponse = {
        token: `demo-${formData.role}-token-${mockUserId}`,
        userId: mockUserId,
        role: formData.role,
        user: {
          id: mockUserId,
          email: formData.email,
          firstName: formData.firstName,
          lastName: formData.lastName,
        },
      };

      console.log("Demo registration response:", mockResponse);

      const userId = mockResponse.userId || mockResponse.user?.id;
      setAuthToken(mockResponse.token, userId);
      console.log("Demo auth token set, role:", mockResponse.role);

      // Redirection selon le rôle
      let redirectPath = "/client-dashboard"; // default
      switch (mockResponse.role) {
        case "client":
          redirectPath = "/client-dashboard";
          break;
        case "barber":
          redirectPath = "/barber-dashboard";
          break;
        case "admin":
          redirectPath = "/admin-dashboard";
          break;
        default:
          redirectPath = "/client-dashboard";
      }

      console.log("Redirecting to:", redirectPath);
      navigate(redirectPath);
    } catch (error: any) {
      console.error("Registration error:", error);

      // Handle specific error cases
      if (
        error.message.includes("Email déjà utilisé") ||
        error.message.includes("409")
      ) {
        setError(
          "Cette adresse email est déjà utilisée. Veuillez en choisir une autre ou vous connecter.",
        );
      } else if (error.message.includes("Format d'email invalide")) {
        setError(
          "Format d'email invalide. Veuillez vérifier votre adresse email.",
        );
      } else if (error.message.includes("au moins 6 caractères")) {
        setError("Le mot de passe doit contenir au moins 6 caractères.");
      } else {
        setError(
          error.message || "Erreur lors de l'inscription. Veuillez réessayer.",
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-moroccan-charcoal flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-moroccan-pattern opacity-5"></div>
      <div className="absolute inset-0 bg-gradient-to-br from-moroccan-charcoal via-moroccan-darkgrey/50 to-moroccan-charcoal"></div>

      <Card className="w-full max-w-2xl bg-moroccan-charcoal/80 backdrop-blur-xl border border-moroccan-gold/20 shadow-2xl shadow-moroccan-gold/10 relative z-10 glass-card">
        <CardHeader className="text-center pb-8 pt-12">
          <div className="flex justify-center mb-6 fade-in">
            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-moroccan-gradient-primary text-moroccan-charcoal shadow-2xl shadow-moroccan-gold/30 hover:scale-105 transition-transform duration-300">
              <Scissors className="h-8 w-8" />
            </div>
          </div>
          <CardTitle className="text-3xl font-heading font-bold text-moroccan-gold mb-3 slide-up">
            Créer un compte
          </CardTitle>
          <CardDescription className="text-moroccan-sand text-lg font-light slide-up">
            Rejoignez l'excellence ShopTheBarber et découvrez votre style
            premium
          </CardDescription>
        </CardHeader>
        <CardContent className="px-12 pb-12">
          {/* Demo Mode Notice */}
          <div className="bg-blue-500/10 border border-blue-500/30 rounded-xl p-4 mb-6 backdrop-blur-sm">
            <h4 className="text-blue-400 font-semibold mb-2 text-sm">
              🎮 Mode Démo - Inscription Instantanée
            </h4>
            <p className="text-xs text-blue-300">
              Remplissez le formulaire avec n'importe quelles informations.
              Choisissez votre rôle pour accéder au tableau de bord
              correspondant.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6 slide-up">
            {error && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 text-red-400 text-sm backdrop-blur-sm">
                {error}
              </div>
            )}

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label
                  htmlFor="firstName"
                  className="text-moroccan-gold font-semibold text-sm"
                >
                  Prénom
                </Label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-moroccan-gold/60" />
                  <Input
                    id="firstName"
                    name="firstName"
                    type="text"
                    placeholder="Prénom"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className="pl-12 pr-4 py-4 bg-moroccan-darkgrey/40 backdrop-blur-sm border border-moroccan-gold/30 text-moroccan-offwhite placeholder-moroccan-sand/60 rounded-xl focus:border-moroccan-gold focus:ring-2 focus:ring-moroccan-gold/20 transition-all duration-300 text-lg"
                    required
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="lastName"
                  className="text-moroccan-gold font-semibold text-sm"
                >
                  Nom
                </Label>
                <Input
                  id="lastName"
                  name="lastName"
                  type="text"
                  placeholder="Nom"
                  value={formData.lastName}
                  onChange={handleInputChange}
                  className="px-4 py-4 bg-moroccan-darkgrey/40 backdrop-blur-sm border border-moroccan-gold/30 text-moroccan-offwhite placeholder-moroccan-sand/60 rounded-xl focus:border-moroccan-gold focus:ring-2 focus:ring-moroccan-gold/20 transition-all duration-300 text-lg"
                  required
                />
              </div>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="email"
                className="text-moroccan-gold font-semibold text-sm"
              >
                Email
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-moroccan-gold/60" />
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="votre@email.com"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="pl-12 pr-4 py-4 bg-moroccan-darkgrey/40 backdrop-blur-sm border border-moroccan-gold/30 text-moroccan-offwhite placeholder-moroccan-sand/60 rounded-xl focus:border-moroccan-gold focus:ring-2 focus:ring-moroccan-gold/20 transition-all duration-300 text-lg"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label
                  htmlFor="phone"
                  className="text-moroccan-gold font-semibold text-sm"
                >
                  Téléphone
                </Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-moroccan-gold/60" />
                  <Input
                    id="phone"
                    name="phone"
                    type="tel"
                    placeholder="+212 6 12 34 56 78"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="pl-12 pr-4 py-4 bg-moroccan-darkgrey/40 backdrop-blur-sm border border-moroccan-gold/30 text-moroccan-offwhite placeholder-moroccan-sand/60 rounded-xl focus:border-moroccan-gold focus:ring-2 focus:ring-moroccan-gold/20 transition-all duration-300 text-lg"
                  />
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="city"
                  className="text-moroccan-gold font-semibold text-sm"
                >
                  Ville
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 transform -translate-y-1/2 h-5 w-5 text-moroccan-gold/60" />
                  <Input
                    id="city"
                    name="city"
                    type="text"
                    placeholder="Casablanca"
                    value={formData.city}
                    onChange={handleInputChange}
                    className="pl-12 pr-4 py-4 bg-moroccan-darkgrey/40 backdrop-blur-sm border border-moroccan-gold/30 text-moroccan-offwhite placeholder-moroccan-sand/60 rounded-xl focus:border-moroccan-gold focus:ring-2 focus:ring-moroccan-gold/20 transition-all duration-300 text-lg"
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <Label
                htmlFor="address"
                className="text-moroccan-gold font-semibold text-sm"
              >
                Adresse (optionnel)
              </Label>
              <Input
                id="address"
                name="address"
                type="text"
                placeholder="123 Rue Hassan II"
                value={formData.address}
                onChange={handleInputChange}
                className="px-4 py-4 bg-moroccan-darkgrey/40 backdrop-blur-sm border border-moroccan-gold/30 text-moroccan-offwhite placeholder-moroccan-sand/60 rounded-xl focus:border-moroccan-gold focus:ring-2 focus:ring-moroccan-gold/20 transition-all duration-300 text-lg"
              />
            </div>

            {/* Choix du type de compte */}
            <div className="space-y-4">
              <Label className="text-moroccan-gold font-semibold text-sm">
                Type de compte
              </Label>
              <div className="grid grid-cols-3 gap-4">
                <button
                  type="button"
                  onClick={() => handleRoleSelect("client")}
                  className={`py-5 px-4 rounded-xl font-bold border-2 transition-all duration-300 text-lg group hover:scale-105 ${
                    formData.role === "client"
                      ? "bg-moroccan-gradient-primary border-moroccan-gold text-moroccan-charcoal shadow-xl shadow-moroccan-gold/30"
                      : "bg-moroccan-darkgrey/40 border-moroccan-gold/30 text-moroccan-sand hover:bg-moroccan-gold/10 hover:border-moroccan-gold/50"
                  }`}
                >
                  <User className="h-6 w-6 mx-auto mb-2" />
                  Client
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect("barber")}
                  className={`py-5 px-4 rounded-xl font-bold border-2 transition-all duration-300 text-lg group hover:scale-105 ${
                    formData.role === "barber"
                      ? "bg-moroccan-gradient-primary border-moroccan-gold text-moroccan-charcoal shadow-xl shadow-moroccan-gold/30"
                      : "bg-moroccan-darkgrey/40 border-moroccan-gold/30 text-moroccan-sand hover:bg-moroccan-gold/10 hover:border-moroccan-gold/50"
                  }`}
                >
                  <Scissors className="h-6 w-6 mx-auto mb-2" />
                  Barbier
                </button>
                <button
                  type="button"
                  onClick={() => handleRoleSelect("admin")}
                  className={`py-5 px-4 rounded-xl font-bold border-2 transition-all duration-300 text-lg group hover:scale-105 ${
                    formData.role === "admin"
                      ? "bg-moroccan-gradient-primary border-moroccan-gold text-moroccan-charcoal shadow-xl shadow-moroccan-gold/30"
                      : "bg-moroccan-darkgrey/40 border-moroccan-gold/30 text-moroccan-sand hover:bg-moroccan-gold/10 hover:border-moroccan-gold/50"
                  }`}
                >
                  <User className="h-6 w-6 mx-auto mb-2" />
                  Admin
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label
                  htmlFor="password"
                  className="text-moroccan-gold font-semibold text-sm"
                >
                  Mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleInputChange}
                    className="pr-12 pl-4 py-4 bg-moroccan-darkgrey/40 backdrop-blur-sm border border-moroccan-gold/30 text-moroccan-offwhite placeholder-moroccan-sand/60 rounded-xl focus:border-moroccan-gold focus:ring-2 focus:ring-moroccan-gold/20 transition-all duration-300 text-lg"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 hover:scale-110 transition-transform duration-200"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5 text-moroccan-gold/60 hover:text-moroccan-gold" />
                    ) : (
                      <Eye className="h-5 w-5 text-moroccan-gold/60 hover:text-moroccan-gold" />
                    )}
                  </button>
                </div>
              </div>

              <div className="space-y-3">
                <Label
                  htmlFor="confirmPassword"
                  className="text-moroccan-gold font-semibold text-sm"
                >
                  Confirmer le mot de passe
                </Label>
                <div className="relative">
                  <Input
                    id="confirmPassword"
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="•••���••••"
                    value={formData.confirmPassword}
                    onChange={handleInputChange}
                    className="pr-12 pl-4 py-4 bg-moroccan-darkgrey/40 backdrop-blur-sm border border-moroccan-gold/30 text-moroccan-offwhite placeholder-moroccan-sand/60 rounded-xl focus:border-moroccan-gold focus:ring-2 focus:ring-moroccan-gold/20 transition-all duration-300 text-lg"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-4 top-1/2 transform -translate-y-1/2 hover:scale-110 transition-transform duration-200"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-5 w-5 text-moroccan-gold/60 hover:text-moroccan-gold" />
                    ) : (
                      <Eye className="h-5 w-5 text-moroccan-gold/60 hover:text-moroccan-gold" />
                    )}
                  </button>
                </div>
              </div>
            </div>

            <Button
              type="submit"
              className="w-full bg-moroccan-gradient-primary text-moroccan-charcoal hover:scale-105 hover:shadow-xl hover:shadow-moroccan-gold/30 transition-all duration-300 font-bold py-5 rounded-xl text-lg border-0 mt-8"
              disabled={isLoading}
            >
              {isLoading ? "Création du compte..." : "Créer mon compte premium"}
            </Button>
          </form>

          <div className="mt-8 text-center">
            <p className="text-moroccan-sand text-lg">
              Déjà un compte ?{" "}
              <Link
                to="/login"
                className="text-moroccan-gold hover:text-white font-semibold underline decoration-moroccan-gold/50 hover:decoration-white transition-all duration-300"
              >
                Se connecter
              </Link>
            </p>
          </div>

          <div className="mt-6 text-center">
            <Link
              to="/"
              className="text-moroccan-sand/70 hover:text-moroccan-gold text-lg font-medium transition-colors duration-300"
            >
              ← Retour à l'accueil
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

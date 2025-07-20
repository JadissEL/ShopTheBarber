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
  Users,
  Scissors,
  Shield,
  ArrowRight,
  Calendar,
  BarChart3,
  Settings,
  Star,
  MessageSquare,
  TrendingUp,
  Eye,
  Bell,
} from "lucide-react";
import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className="border-b border-border bg-background/95 backdrop-blur shadow-sm">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <Link to="/" className="flex items-center space-x-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <Scissors className="h-4 w-4" />
            </div>
            <span className="font-display text-xl font-bold text-foreground">
              ShopTheBarber
            </span>
          </Link>

          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Bell className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground"
            >
              <Settings className="h-4 w-4" />
            </Button>
            <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
              U
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto p-6">
        {/* Welcome Section */}
        <div className="text-center space-y-6 mb-12">
          <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground">
            Bienvenue sur ShopTheBarber
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Choisissez votre espace pour accéder à toutes les fonctionnalités
            adaptées à votre profil.
          </p>
        </div>

        {/* Role Selection Cards */}
        <div className="grid lg:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {/* Client Dashboard */}
          <Card className="group bg-card border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-50/50 to-blue-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative z-10 text-center pb-4">
                <div className="h-16 w-16 bg-blue-50 border border-blue-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-100 transition-colors">
                  <Users className="h-8 w-8 text-blue-600" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">
                  Espace Client
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Réservez, gérez vos RDV et découvrez de nouveaux barbiers
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-muted p-3 rounded-lg text-center border">
                      <Calendar className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                      <p className="font-semibold text-foreground">
                        Réservations
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Gérez vos RDV facilement
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-center border">
                      <Star className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
                      <p className="font-semibold text-foreground">Favoris</p>
                      <p className="text-xs text-muted-foreground">
                        Vos barbiers préférés
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg border">
                    <h4 className="font-semibold text-foreground mb-2">
                      Fonctionnalités incluses:
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Recherche et réservation en ligne</li>
                      <li>• Historique des visites</li>
                      <li>• Gestion des barbiers favoris</li>
                      <li>• Notifications de rappel</li>
                      <li>• Système d'avis et notes</li>
                    </ul>
                  </div>
                </div>
                <Link to="/client-dashboard" className="block">
                  <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white group-hover:bg-blue-500">
                    <Users className="mr-2 h-4 w-4" />
                    Accéder à mon espace
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </div>
          </Card>

          {/* Barber Dashboard */}
          <Card className="group bg-card border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-amber-50/50 to-orange-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative z-10 text-center pb-4">
                <div className="h-16 w-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-amber-100 transition-colors">
                  <Scissors className="h-8 w-8 text-amber-600" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">
                  CRM Barbier
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Gérez votre salon, clients et rendez-vous professionnellement
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-muted p-3 rounded-lg text-center border">
                      <BarChart3 className="h-5 w-5 mx-auto mb-1 text-green-600" />
                      <p className="font-semibold text-foreground">Analytics</p>
                      <p className="text-xs text-muted-foreground">
                        Suivi des performances
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-center border">
                      <MessageSquare className="h-5 w-5 mx-auto mb-1 text-purple-600" />
                      <p className="font-semibold text-foreground">Avis</p>
                      <p className="text-xs text-muted-foreground">
                        Gestion de réputation
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg border">
                    <h4 className="font-semibold text-foreground mb-2">
                      CRM Complet inclus:
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Planning et gestion des RDV</li>
                      <li>• Base de données clients</li>
                      <li>• Statistiques et revenus</li>
                      <li>• Galerie photos de travaux</li>
                      <li>• Gestion des avis clients</li>
                    </ul>
                  </div>
                </div>
                <Link to="/barber-dashboard" className="block">
                  <Button className="w-full bg-amber-600 hover:bg-amber-700 text-white group-hover:bg-amber-500 font-medium">
                    <Scissors className="mr-2 h-4 w-4" />
                    Accéder à mon CRM
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </div>
          </Card>

          {/* Admin Dashboard */}
          <Card className="group bg-card border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 cursor-pointer overflow-hidden">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-red-50/50 to-red-100/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              <CardHeader className="relative z-10 text-center pb-4">
                <div className="h-16 w-16 bg-red-50 border border-red-200 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-red-100 transition-colors">
                  <Shield className="h-8 w-8 text-red-600" />
                </div>
                <CardTitle className="text-2xl text-card-foreground">
                  Administration
                </CardTitle>
                <CardDescription className="text-muted-foreground">
                  Contrôlez et modérez la plateforme ShopTheBarber
                </CardDescription>
              </CardHeader>
              <CardContent className="relative z-10 space-y-6">
                <div className="space-y-4">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-muted p-3 rounded-lg text-center border">
                      <TrendingUp className="h-5 w-5 mx-auto mb-1 text-green-600" />
                      <p className="font-semibold text-foreground">Stats</p>
                      <p className="text-xs text-muted-foreground">
                        Métriques plateforme
                      </p>
                    </div>
                    <div className="bg-muted p-3 rounded-lg text-center border">
                      <Eye className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                      <p className="font-semibold text-foreground">
                        Modération
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Contrôle qualité
                      </p>
                    </div>
                  </div>
                  <div className="bg-muted p-4 rounded-lg border">
                    <h4 className="font-semibold text-foreground mb-2">
                      Outils d'administration:
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• Approbation des barbiers</li>
                      <li>• Modération du contenu</li>
                      <li>• Gestion des utilisateurs</li>
                      <li>• Analyses de la plateforme</li>
                      <li>• Traitement des signalements</li>
                    </ul>
                  </div>
                  <div className="flex items-center justify-center space-x-2 p-3 bg-red-50 rounded-lg border border-red-200">
                    <Badge className="bg-red-600 text-white">
                      15 actions en attente
                    </Badge>
                  </div>
                </div>
                <Link to="/admin-dashboard" className="block">
                  <Button className="w-full bg-red-600 hover:bg-red-700 text-white group-hover:bg-red-500">
                    <Shield className="mr-2 h-4 w-4" />
                    Panel d'administration
                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </Link>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* Info Section */}
        <div className="mt-16 text-center">
          <Card className="bg-card border-border max-w-4xl mx-auto shadow-sm">
            <CardContent className="p-8">
              <h3 className="text-xl font-semibold text-foreground mb-4">
                Première Connexion ?
              </h3>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Chaque espace est conçu spécifiquement pour votre rôle sur la
                plateforme. Les clients peuvent réserver et gérer leurs
                rendez-vous, les barbiers disposent d'un CRM complet pour leur
                activité, et les administrateurs contrôlent la qualité de la
                plateforme.
              </p>
              <div className="grid md:grid-cols-3 gap-6 text-sm">
                <div className="text-center">
                  <Users className="h-8 w-8 text-blue-600 mx-auto mb-2" />
                  <p className="font-semibold text-foreground">
                    Pour les Clients
                  </p>
                  <p className="text-muted-foreground">
                    Interface simple et intuitive pour réserver facilement
                  </p>
                </div>
                <div className="text-center">
                  <Scissors className="h-8 w-8 text-amber-600 mx-auto mb-2" />
                  <p className="font-semibold text-foreground">
                    Pour les Barbiers
                  </p>
                  <p className="text-muted-foreground">
                    Outils professionnels de gestion d'entreprise
                  </p>
                </div>
                <div className="text-center">
                  <Shield className="h-8 w-8 text-red-600 mx-auto mb-2" />
                  <p className="font-semibold text-foreground">
                    Pour les Administrateurs
                  </p>
                  <p className="text-muted-foreground">
                    Contrôle total et modération de la plateforme
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

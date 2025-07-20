import React, { useState, useEffect } from "react";
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
import { Switch } from "../components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { Textarea } from "../components/ui/textarea";
import {
  Settings,
  User,
  Bell,
  Shield,
  Eye,
  EyeOff,
  Save,
  ArrowLeft,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Lock,
  Palette,
  Globe,
  Moon,
  Sun,
  Volume2,
  VolumeX,
  Smartphone,
  CreditCard,
  Calendar,
  Clock,
  Scissors,
  Building,
  Home,
  DollarSign,
  Clock3,
  Users,
  Star,
  FileText,
  Image,
  Upload,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { profileAPI, settingsAPI, logout } from "../../shared/api";

export default function BarberSettings() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Profile settings
  const [profileSettings, setProfileSettings] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    city: "",
    address: "",
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  // Barber profile settings
  const [barberProfile, setBarberProfile] = useState({
    salonName: "",
    description: "",
    experience: "",
    specialties: "",
    location: "",
    acceptsHome: true,
    acceptsShop: true,
    workingHours: {
      monday: { start: "09:00", end: "18:00", closed: false },
      tuesday: { start: "09:00", end: "18:00", closed: false },
      wednesday: { start: "09:00", end: "18:00", closed: false },
      thursday: { start: "09:00", end: "18:00", closed: false },
      friday: { start: "09:00", end: "18:00", closed: false },
      saturday: { start: "09:00", end: "18:00", closed: false },
      sunday: { start: "09:00", end: "18:00", closed: true },
    },
  });

  // Notification settings
  const [notificationSettings, setNotificationSettings] = useState({
    emailNotifications: true,
    smsNotifications: true,
    pushNotifications: true,
    bookingRequests: true,
    bookingReminders: true,
    reviewNotifications: true,
    promotionalEmails: false,
    newClientAlerts: true,
  });

  // Business settings
  const [businessSettings, setBusinessSettings] = useState({
    autoAcceptBookings: false,
    requireDeposit: false,
    depositPercentage: 20,
    cancellationPolicy: "24h",
    maxAdvanceBooking: "30d",
    minAdvanceBooking: "2h",
    allowWalkIns: true,
    showAvailability: true,
  });

  // Privacy settings
  const [privacySettings, setPrivacySettings] = useState({
    profileVisibility: "public",
    showPhoneNumber: true,
    showEmail: false,
    showAddress: true,
    allowReviews: true,
    allowContact: true,
    showEarnings: false,
  });

  // App settings
  const [appSettings, setAppSettings] = useState({
    theme: "dark",
    language: "fr",
    timezone: "Africa/Casablanca",
    currency: "MAD",
    dateFormat: "DD/MM/YYYY",
    timeFormat: "24h",
  });

  useEffect(() => {
    loadUserProfile();
    loadBarberSettings();
  }, []);

  const loadUserProfile = async () => {
    try {
      const profile = await profileAPI.get();
      setProfileSettings({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        phone: profile.phone || "",
        city: profile.city || "",
        address: profile.address || "",
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch (error) {
      console.error("Erreur lors du chargement du profil:", error);
    }
  };

  const loadBarberSettings = async () => {
    try {
      const data = await settingsAPI.getBarberSettings();
      if (data.barber) {
        setBarberProfile({
          salonName: data.barber.salon_name || "",
          description: data.barber.description || "",
          experience: "",
          specialties: "",
          location: data.barber.location || "",
          acceptsHome: data.barber.accepts_home || false,
          acceptsShop: data.barber.accepts_shop || true,
          workingHours: barberProfile.workingHours,
        });
      }
      if (data.settings) {
        setBusinessSettings(data.settings.business || businessSettings);
        setNotificationSettings(data.settings.notifications || notificationSettings);
      }
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres barbier:", error);
    }
  };

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      await profileAPI.update({
        firstName: profileSettings.firstName,
        lastName: profileSettings.lastName,
        phone: profileSettings.phone,
        city: profileSettings.city,
        address: profileSettings.address,
      });
      // Show success message
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleBarberProfileUpdate = async () => {
    setIsLoading(true);
    try {
      await settingsAPI.updateBarberSettings({
        barberProfile: {
          salonName: barberProfile.salonName,
          description: barberProfile.description,
          location: barberProfile.location,
          acceptsHome: barberProfile.acceptsHome,
          acceptsShop: barberProfile.acceptsShop,
        },
        business: businessSettings,
        notifications: notificationSettings,
      });
      
      alert("Paramètres barbier mis à jour avec succès");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil barbier:", error);
      alert("Erreur lors de la mise à jour des paramètres");
    } finally {
      setIsLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (profileSettings.newPassword !== profileSettings.confirmPassword) {
      alert("Les mots de passe ne correspondent pas");
      return;
    }
    // TODO: Implement password change API
    console.log("Changement de mot de passe");
  };

  const handleDeleteAccount = () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer votre compte ? Cette action est irréversible.")) {
      // TODO: Implement account deletion
      logout();
      navigate("/");
    }
  };

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
              <Settings className="h-6 w-6 text-amber-500" />
              <span className="font-display text-xl font-bold text-white">
                Paramètres Barbier
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Navigation */}
          <div className="lg:col-span-1">
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Sections</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {[
                  { id: "profile", label: "Profil Personnel", icon: User },
                  { id: "barberProfile", label: "Profil Barbier", icon: Scissors },
                  { id: "business", label: "Business", icon: Building },
                  { id: "notifications", label: "Notifications", icon: Bell },
                  { id: "privacy", label: "Confidentialité", icon: Shield },
                  { id: "app", label: "Application", icon: Settings },
                ].map((section) => (
                  <button
                    key={section.id}
                    className="w-full flex items-center space-x-3 p-3 rounded-lg text-left text-gray-300 hover:text-white hover:bg-gray-700 transition-colors"
                  >
                    <section.icon className="h-4 w-4" />
                    <span>{section.label}</span>
                  </button>
                ))}
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Profile Settings */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Informations Personnelles</span>
                </CardTitle>
                <CardDescription>
                  Gérez vos informations personnelles
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">Prénom</Label>
                    <Input
                      id="firstName"
                      value={profileSettings.firstName}
                      onChange={(e) => setProfileSettings({...profileSettings, firstName: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Nom</Label>
                    <Input
                      id="lastName"
                      value={profileSettings.lastName}
                      onChange={(e) => setProfileSettings({...profileSettings, lastName: e.target.value})}
                      className="bg-gray-700 border-gray-600 text-white"
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={profileSettings.email}
                    disabled
                    className="bg-gray-700 border-gray-600 text-gray-400"
                  />
                </div>
                <div>
                  <Label htmlFor="phone">Téléphone</Label>
                  <Input
                    id="phone"
                    value={profileSettings.phone}
                    onChange={(e) => setProfileSettings({...profileSettings, phone: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <Button onClick={handleProfileUpdate} disabled={isLoading} className="bg-amber-500 hover:bg-amber-600 text-black">
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Sauvegarde..." : "Sauvegarder"}
                </Button>
              </CardContent>
            </Card>

            {/* Barber Profile Settings */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Scissors className="h-5 w-5" />
                  <span>Profil Barbier</span>
                </CardTitle>
                <CardDescription>
                  Gérez votre profil professionnel visible par les clients
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="salonName">Nom du Salon</Label>
                  <Input
                    id="salonName"
                    value={barberProfile.salonName}
                    onChange={(e) => setBarberProfile({...barberProfile, salonName: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={barberProfile.description}
                    onChange={(e) => setBarberProfile({...barberProfile, description: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="Décrivez votre style, votre expérience, vos spécialités..."
                    rows={4}
                  />
                </div>
                <div>
                  <Label htmlFor="experience">Années d'expérience</Label>
                  <Input
                    id="experience"
                    value={barberProfile.experience}
                    onChange={(e) => setBarberProfile({...barberProfile, experience: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="ex: 5 ans"
                  />
                </div>
                <div>
                  <Label htmlFor="specialties">Spécialités</Label>
                  <Input
                    id="specialties"
                    value={barberProfile.specialties}
                    onChange={(e) => setBarberProfile({...barberProfile, specialties: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                    placeholder="ex: Coupes modernes, Barbes, Coupes classiques"
                  />
                </div>
                <div>
                  <Label htmlFor="location">Adresse du salon</Label>
                  <Input
                    id="location"
                    value={barberProfile.location}
                    onChange={(e) => setBarberProfile({...barberProfile, location: e.target.value})}
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Accepte les RDV à domicile</Label>
                      <p className="text-sm text-gray-400">Se déplacer chez le client</p>
                    </div>
                    <Switch
                      checked={barberProfile.acceptsHome}
                      onCheckedChange={(checked) => setBarberProfile({...barberProfile, acceptsHome: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Accepte les RDV au salon</Label>
                      <p className="text-sm text-gray-400">Client vient au salon</p>
                    </div>
                    <Switch
                      checked={barberProfile.acceptsShop}
                      onCheckedChange={(checked) => setBarberProfile({...barberProfile, acceptsShop: checked})}
                    />
                  </div>
                </div>
                <Button onClick={handleBarberProfileUpdate} disabled={isLoading} className="bg-blue-500 hover:bg-blue-600 text-white">
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? "Sauvegarde..." : "Sauvegarder le profil"}
                </Button>
              </CardContent>
            </Card>

            {/* Business Settings */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building className="h-5 w-5" />
                  <span>Paramètres Business</span>
                </CardTitle>
                <CardDescription>
                  Configurez vos préférences commerciales
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Acceptation automatique des réservations</Label>
                    <p className="text-sm text-gray-400">Accepter automatiquement les nouvelles réservations</p>
                  </div>
                  <Switch
                    checked={businessSettings.autoAcceptBookings}
                    onCheckedChange={(checked) => setBusinessSettings({...businessSettings, autoAcceptBookings: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Exiger un acompte</Label>
                    <p className="text-sm text-gray-400">Demander un acompte pour confirmer la réservation</p>
                  </div>
                  <Switch
                    checked={businessSettings.requireDeposit}
                    onCheckedChange={(checked) => setBusinessSettings({...businessSettings, requireDeposit: checked})}
                  />
                </div>
                {businessSettings.requireDeposit && (
                  <div>
                    <Label>Pourcentage d'acompte</Label>
                    <Select value={businessSettings.depositPercentage.toString()} onValueChange={(value) => setBusinessSettings({...businessSettings, depositPercentage: parseInt(value)})}>
                      <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="10">10%</SelectItem>
                        <SelectItem value="20">20%</SelectItem>
                        <SelectItem value="30">30%</SelectItem>
                        <SelectItem value="50">50%</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                )}
                <div>
                  <Label>Politique d'annulation</Label>
                  <Select value={businessSettings.cancellationPolicy} onValueChange={(value) => setBusinessSettings({...businessSettings, cancellationPolicy: value})}>
                    <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1h">1 heure avant</SelectItem>
                      <SelectItem value="2h">2 heures avant</SelectItem>
                      <SelectItem value="24h">24 heures avant</SelectItem>
                      <SelectItem value="48h">48 heures avant</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Accepter les clients sans RDV</Label>
                    <p className="text-sm text-gray-400">Permettre les réservations de dernière minute</p>
                  </div>
                  <Switch
                    checked={businessSettings.allowWalkIns}
                    onCheckedChange={(checked) => setBusinessSettings({...businessSettings, allowWalkIns: checked})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Notification Settings */}
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>Notifications</span>
                </CardTitle>
                <CardDescription>
                  Configurez vos préférences de notifications
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Nouvelles réservations</Label>
                    <p className="text-sm text-gray-400">Notifications pour les nouvelles demandes</p>
                  </div>
                  <Switch
                    checked={notificationSettings.bookingRequests}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, bookingRequests: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Rappels de réservation</Label>
                    <p className="text-sm text-gray-400">Rappels avant vos rendez-vous</p>
                  </div>
                  <Switch
                    checked={notificationSettings.bookingReminders}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, bookingReminders: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Nouveaux avis</Label>
                    <p className="text-sm text-gray-400">Notifications pour les nouveaux avis clients</p>
                  </div>
                  <Switch
                    checked={notificationSettings.reviewNotifications}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, reviewNotifications: checked})}
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <Label>Nouveaux clients</Label>
                    <p className="text-sm text-gray-400">Alertes pour les nouveaux clients</p>
                  </div>
                  <Switch
                    checked={notificationSettings.newClientAlerts}
                    onCheckedChange={(checked) => setNotificationSettings({...notificationSettings, newClientAlerts: checked})}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Danger Zone */}
            <Card className="bg-gray-800 border-red-500">
              <CardHeader>
                <CardTitle className="text-red-400">Zone Dangereuse</CardTitle>
                <CardDescription>
                  Actions irréversibles sur votre compte
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button 
                  variant="destructive" 
                  onClick={handleDeleteAccount}
                  className="bg-red-600 hover:bg-red-700"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Supprimer mon compte
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
} 
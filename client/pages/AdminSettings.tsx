import React from "react";
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
  ArrowLeft,
  Trash2,
  Mail,
  Phone,
  MapPin,
  Clock,
  CheckCircle,
  Zap,
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

// Simple API functions to avoid dependency on shared/api.ts
const API_BASE_URL = 'http://localhost:3001/api';

async function apiCall(endpoint: string, options: RequestInit = {}) {
  const token = localStorage.getItem('token');
  
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...(token && { Authorization: `Bearer ${token}` }),
      ...options.headers,
    },
    ...options,
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, config);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Erreur de requête');
    }
    
    return await response.json();
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
}

const profileAPI = {
  get: () => apiCall('/profile'),
  update: (profileData: any) => apiCall('/profile', {
    method: 'PUT',
    body: JSON.stringify(profileData),
  }),
};

const settingsAPI = {
  getAdminSettings: () => apiCall('/admin-settings'),
  updateAdminSettings: (settings: any) => apiCall('/admin-settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  }),
};

const logout = () => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
  window.location.href = '/login';
};

export default function AdminSettings() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = React.useState(false);
  const [isPageLoading, setIsPageLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  // Profile settings
  const [profileSettings, setProfileSettings] = React.useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
  });

  // System settings
  const [systemSettings, setSystemSettings] = React.useState({
    maintenanceMode: false,
    registrationEnabled: true,
    emailVerification: true,
  });

  // System status
  const [systemStatus, setSystemStatus] = React.useState({
    cpu: 45,
    memory: 62,
    disk: 78,
    uptime: "15 jours, 8 heures",
    activeUsers: 1247,
    totalUsers: 15420,
  });

  React.useEffect(() => {
    const initializePage = async () => {
      try {
        setIsPageLoading(true);
        setError(null);
        
        // Check authentication
        const token = localStorage.getItem('token');
        if (!token) {
          navigate('/login');
          return;
        }

        // Load data in parallel
        await Promise.all([
          loadUserProfile(),
          loadAdminSettings()
        ]);
      } catch (error) {
        console.error('Error initializing admin settings:', error);
        setError('Erreur lors du chargement des paramètres. Veuillez réessayer.');
      } finally {
        setIsPageLoading(false);
      }
    };

    initializePage();
  }, [navigate]);

  const loadUserProfile = async () => {
    try {
      const profile = await profileAPI.get();
      setProfileSettings({
        firstName: profile.firstName || "",
        lastName: profile.lastName || "",
        email: profile.email || "",
        phone: profile.phone || "",
      });
    } catch (error) {
      console.error("Erreur lors du chargement du profil:", error);
    }
  };

  const loadAdminSettings = async () => {
    try {
      const settings = await settingsAPI.getAdminSettings();
      if (settings.system) setSystemSettings(settings.system);
    } catch (error) {
      console.error("Erreur lors du chargement des paramètres admin:", error);
    }
  };

  const handleProfileUpdate = async () => {
    setIsLoading(true);
    try {
      await profileAPI.update({
        firstName: profileSettings.firstName,
        lastName: profileSettings.lastName,
        phone: profileSettings.phone,
      });
      alert("Profil mis à jour avec succès");
    } catch (error) {
      console.error("Erreur lors de la mise à jour du profil:", error);
      alert("Erreur lors de la mise à jour du profil");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAdminSettingsUpdate = async () => {
    try {
      await settingsAPI.updateAdminSettings({
        system: systemSettings,
      });
      alert("Paramètres admin mis à jour avec succès");
    } catch (error) {
      console.error("Erreur lors de la mise à jour des paramètres admin:", error);
      alert("Erreur lors de la mise à jour des paramètres");
    }
  };

  const handleDeleteAccount = () => {
    if (confirm("Êtes-vous sûr de vouloir supprimer votre compte administrateur ? Cette action est irréversible.")) {
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
            <Link to="/admin-dashboard">
              <Button variant="ghost" size="sm" className="text-gray-300 hover:text-white">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
            </Link>
            <div className="flex items-center space-x-2">
              <Settings className="h-6 w-6 text-red-500" />
              <span className="font-display text-xl font-bold text-white">
                Paramètres Administrateur
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Loading State */}
      {isPageLoading && (
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-amber-500 mx-auto"></div>
            <p className="mt-4 text-gray-300">Chargement des paramètres...</p>
          </div>
        </div>
      )}

      {/* Error State */}
      {error && !isPageLoading && (
        <div className="container mx-auto px-4 py-8">
          <Card className="bg-red-900/20 border-red-700">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-red-400" />
                <div>
                  <h3 className="text-lg font-semibold text-red-400">Erreur</h3>
                  <p className="text-red-300">{error}</p>
                </div>
              </div>
              <Button 
                onClick={() => window.location.reload()} 
                className="mt-4 bg-red-600 hover:bg-red-700"
              >
                <Zap className="h-4 w-4 mr-2" />
                Réessayer
              </Button>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Main Content */}
      {!isPageLoading && !error && (
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
                    { id: "profile", label: "Profil", icon: User },
                    { id: "system", label: "Système", icon: Settings },
                    { id: "security", label: "Sécurité", icon: Settings },
                    { id: "notifications", label: "Notifications", icon: Bell },
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

              {/* System Status */}
              <Card className="bg-gray-800 border-gray-700 mt-6">
                <CardHeader>
                  <CardTitle className="text-white">État du Système</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">CPU</span>
                      <span className="text-sm font-medium">{systemStatus.cpu}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-blue-500 h-2 rounded-full" style={{width: `${systemStatus.cpu}%`}}></div>
                    </div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-400">Mémoire</span>
                      <span className="text-sm font-medium">{systemStatus.memory}%</span>
                    </div>
                    <div className="w-full bg-gray-700 rounded-full h-2">
                      <div className="bg-green-500 h-2 rounded-full" style={{width: `${systemStatus.memory}%`}}></div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-gray-700">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Utilisateurs actifs</span>
                      <span className="text-white">{systemStatus.activeUsers}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-400">Uptime</span>
                      <span className="text-white">{systemStatus.uptime}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Settings Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Profile Settings */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <User className="h-5 w-5" />
                    <span>Profil Administrateur</span>
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
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {isLoading ? "Sauvegarde..." : "Sauvegarder"}
                  </Button>
                </CardContent>
              </Card>

              {/* System Settings */}
              <Card className="bg-gray-800 border-gray-700">
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Settings className="h-5 w-5" />
                    <span>Paramètres Système</span>
                  </CardTitle>
                  <CardDescription>
                    Configuration générale du système
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Mode maintenance</Label>
                      <p className="text-sm text-gray-400">Mettre le site en maintenance</p>
                    </div>
                    <Switch
                      checked={systemSettings.maintenanceMode}
                      onCheckedChange={(checked) => setSystemSettings({...systemSettings, maintenanceMode: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Inscriptions autorisées</Label>
                      <p className="text-sm text-gray-400">Permettre aux nouveaux utilisateurs de s'inscrire</p>
                    </div>
                    <Switch
                      checked={systemSettings.registrationEnabled}
                      onCheckedChange={(checked) => setSystemSettings({...systemSettings, registrationEnabled: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Vérification email</Label>
                      <p className="text-sm text-gray-400">Exiger la vérification email</p>
                    </div>
                    <Switch
                      checked={systemSettings.emailVerification}
                      onCheckedChange={(checked) => setSystemSettings({...systemSettings, emailVerification: checked})}
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Admin Settings Save Button */}
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="font-semibold text-white">Sauvegarder les paramètres admin</h3>
                      <p className="text-sm text-gray-400">Appliquez tous les changements de paramètres système</p>
                    </div>
                    <Button onClick={handleAdminSettingsUpdate} disabled={isLoading} className="bg-red-500 hover:bg-red-600 text-white">
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Sauvegarder les paramètres
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Danger Zone */}
              <Card className="bg-gray-800 border-red-500">
                <CardHeader>
                  <CardTitle className="text-red-400">Zone Dangereuse</CardTitle>
                  <CardDescription>
                    Actions irréversibles sur le système
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    variant="destructive" 
                    onClick={handleDeleteAccount}
                    className="bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Supprimer le compte admin
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 
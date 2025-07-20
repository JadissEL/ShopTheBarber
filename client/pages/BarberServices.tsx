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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../components/ui/dialog";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Textarea } from "../components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../components/ui/select";
import {
  Scissors,
  Plus,
  Edit,
  Trash2,
  ArrowLeft,
  X,
  Clock,
  AlertCircle,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useAuth } from "../hooks/useAuth";

interface Service {
  id?: number;
  name: string;
  category: string;
  description: string;
  duration: number;
  price: number;
  isActive: boolean;
}

export default function BarberServices() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [globalError, setGlobalError] = React.useState<string | null>(null);
  const [services, setServices] = React.useState<Service[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [isDialogOpen, setIsDialogOpen] = React.useState(false);
  const [editingService, setEditingService] = React.useState<Service | null>(null);
  const [formData, setFormData] = React.useState<Service>({
    name: "",
    category: "",
    description: "",
    duration: 30,
    price: 0,
    isActive: true,
  });

  const categories = [
    "Coupe Homme",
    "Coupe Femme",
    "Coloration",
    "Mèches",
    "Lissage",
    "Permanente",
    "Extensions",
    "Soins",
    "Barbe",
    "Shampoing",
    "Autre"
  ];

  const durationOptions = [
    { value: 15, label: "15 minutes" },
    { value: 30, label: "30 minutes" },
    { value: 45, label: "45 minutes" },
    { value: 60, label: "1 heure" },
    { value: 90, label: "1h30" },
    { value: 120, label: "2 heures" },
    { value: 150, label: "2h30" },
    { value: 180, label: "3 heures" },
  ];

  React.useEffect(() => {
    loadServices();
  }, []);

  // Ajout d'un effet pour capturer les erreurs non catchées
  React.useEffect(() => {
    const handler = (event: ErrorEvent) => {
      setGlobalError(event.message || 'Erreur inconnue');
    };
    window.addEventListener('error', handler);
    return () => window.removeEventListener('error', handler);
  }, []);

  // Ajout d'un log pour vérifier le render
  console.log('Rendering BarberServices page...');

  const loadServices = async () => {
    setLoading(true);
    try {
      // Simuler le chargement des services depuis l'API
      // TODO: Remplacer par un vrai appel API
      const mockServices: Service[] = [
        {
          id: 1,
          name: "Coupe Homme Classique",
          category: "Coupe Homme",
          description: "Coupe traditionnelle pour hommes avec finition soignée",
          duration: 30,
          price: 80,
          isActive: true,
        },
        {
          id: 2,
          name: "Coupe Femme Moderne",
          category: "Coupe Femme",
          description: "Coupe tendance avec conseils de style personnalisés",
          duration: 60,
          price: 120,
          isActive: true,
        },
        {
          id: 3,
          name: "Coloration Complète",
          category: "Coloration",
          description: "Coloration professionnelle avec produits de qualité",
          duration: 120,
          price: 200,
          isActive: true,
        },
      ];
      
      setTimeout(() => {
        setServices(mockServices);
        setLoading(false);
      }, 1000);
    } catch (error) {
      console.error("Erreur lors du chargement des services:", error);
      setLoading(false);
    }
  };

  const handleAddService = () => {
    setEditingService(null);
    setFormData({
      name: "",
      category: "",
      description: "",
      duration: 30,
      price: 0,
      isActive: true,
    });
    setIsDialogOpen(true);
  };

  const handleEditService = (service: Service) => {
    setEditingService(service);
    setFormData(service);
    setIsDialogOpen(true);
  };

  const handleDeleteService = async (serviceId: number) => {
    if (window.confirm("Êtes-vous sûr de vouloir supprimer ce service ?")) {
      try {
        // TODO: Appel API pour supprimer le service
        setServices(services.filter(s => s.id !== serviceId));
      } catch (error) {
        console.error("Erreur lors de la suppression:", error);
      }
    }
  };

  const handleSubmit = async () => {
    try {
      if (editingService) {
        // Mise à jour du service
        const updatedServices = services.map(s =>
          s.id === editingService.id ? { ...formData, id: s.id } : s
        );
        setServices(updatedServices);
      } else {
        // Ajout d'un nouveau service
        const newService: Service = {
          ...formData,
          id: Date.now(), // ID temporaire
        };
        setServices([...services, newService]);
      }
      
      setIsDialogOpen(false);
      setFormData({
        name: "",
        category: "",
        description: "",
        duration: 30,
        price: 0,
        isActive: true,
      });
    } catch (error) {
      console.error("Erreur lors de la sauvegarde:", error);
    }
  };

  const toggleServiceStatus = async (serviceId: number) => {
    try {
      const updatedServices = services.map(s =>
        s.id === serviceId ? { ...s, isActive: !s.isActive } : s
      );
      setServices(updatedServices);
    } catch (error) {
      console.error("Erreur lors de la mise à jour:", error);
    }
  };

  try {
    if (globalError) {
      return (
        <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
          <b>Erreur dans la page services barbier :</b>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{globalError}</pre>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="min-h-screen bg-gray-900 text-white">
          <div className="container mx-auto px-4 py-8">
            <div className="flex items-center justify-center h-64">
              <div className="text-center">
                <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
                <p className="text-gray-300">Chargement des services...</p>
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gray-900 text-white">
        {/* Header */}
        <header className="sticky top-0 z-50 w-full border-b border-gray-800 bg-gray-900/95 backdrop-blur supports-[backdrop-filter]:bg-gray-900/60">
          <div className="container mx-auto flex h-16 items-center justify-between px-4">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/barber-dashboard')}
                className="text-gray-300 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Retour
              </Button>
              <div className="flex items-center space-x-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-amber-500 text-black">
                  <Scissors className="h-4 w-4" />
                </div>
                <span className="font-display text-xl font-bold text-white">
                  Gestion des Services
                </span>
              </div>
            </div>

            <div className="flex items-center space-x-3">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button className="bg-amber-500 hover:bg-amber-600 text-black">
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter un Service
                  </Button>
                </DialogTrigger>
                <DialogContent className="bg-gray-800 border-gray-700 text-white">
                  <DialogHeader>
                    <DialogTitle>
                      {editingService ? "Modifier le Service" : "Ajouter un Service"}
                    </DialogTitle>
                    <DialogDescription>
                      {editingService 
                        ? "Modifiez les détails de votre service"
                        : "Ajoutez un nouveau service à votre catalogue"
                      }
                    </DialogDescription>
                  </DialogHeader>

                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="name">Nom du service</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Ex: Coupe Homme Classique"
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>

                    <div>
                      <Label htmlFor="category">Catégorie</Label>
                      <Select
                        value={formData.category}
                        onValueChange={(value) => setFormData({ ...formData, category: value })}
                      >
                        <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                          <SelectValue placeholder="Sélectionnez une catégorie" />
                        </SelectTrigger>
                        <SelectContent className="bg-gray-700 border-gray-600">
                          {categories.map((category) => (
                            <SelectItem key={category} value={category}>
                              {category}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Décrivez votre service..."
                        rows={3}
                        className="bg-gray-700 border-gray-600 text-white"
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="duration">Durée</Label>
                        <Select
                          value={formData.duration.toString()}
                          onValueChange={(value) => setFormData({ ...formData, duration: parseInt(value) })}
                        >
                          <SelectTrigger className="bg-gray-700 border-gray-600 text-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent className="bg-gray-700 border-gray-600">
                            {durationOptions.map((option) => (
                              <SelectItem key={option.value} value={option.value.toString()}>
                                {option.label}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      <div>
                        <Label htmlFor="price">Prix (MAD)</Label>
                        <Input
                          id="price"
                          type="number"
                          value={formData.price}
                          onChange={(e) => setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })}
                          placeholder="0"
                          className="bg-gray-700 border-gray-600 text-white"
                        />
                      </div>
                    </div>
                  </div>

                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsDialogOpen(false)}
                      className="border-gray-600 text-gray-300 hover:bg-gray-700"
                    >
                      Annuler
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      className="bg-amber-500 hover:bg-amber-600 text-black"
                      disabled={!formData.name || !formData.category || formData.price <= 0}
                    >
                      <Save className="h-4 w-4 mr-2" />
                      {editingService ? "Modifier" : "Ajouter"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <div className="container mx-auto px-4 py-8">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Total Services</p>
                    <p className="text-2xl font-bold text-white">{services.length}</p>
                  </div>
                  <Scissors className="h-8 w-8 text-amber-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Services Actifs</p>
                    <p className="text-2xl font-bold text-white">
                      {services.filter(s => s.isActive).length}
                    </p>
                  </div>
                  <CheckCircle className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gray-800 border-gray-700">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-400">Prix Moyen</p>
                    <p className="text-2xl font-bold text-white">
                      {services.length > 0 
                        ? `${(services.reduce((sum, s) => sum + s.price, 0) / services.length).toFixed(0)} MAD`
                        : "0 MAD"
                      }
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-green-500" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Services List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold">Mes Services</h2>
              <div className="flex items-center space-x-2 text-sm text-gray-400">
                <span>{services.length} service{services.length > 1 ? 's' : ''}</span>
              </div>
            </div>

            {services.length === 0 ? (
              <Card className="bg-gray-800 border-gray-700">
                <CardContent className="p-12 text-center">
                  <Scissors className="h-16 w-16 text-gray-600 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-300 mb-2">
                    Aucun service ajouté
                  </h3>
                  <p className="text-gray-500 mb-6">
                    Commencez par ajouter vos premiers services pour attirer des clients.
                  </p>
                  <Button
                    onClick={handleAddService}
                    className="bg-amber-500 hover:bg-amber-600 text-black"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Ajouter mon premier service
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {services.map((service) => (
                  <Card key={service.id} className="bg-gray-800 border-gray-700 hover:border-amber-500/50 transition-colors">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <CardTitle className="text-lg flex items-center">
                            {service.name}
                            {!service.isActive && (
                              <span className="ml-2 text-xs bg-gray-600 text-gray-300 px-2 py-1 rounded">
                                Inactif
                              </span>
                            )}
                          </CardTitle>
                          <CardDescription className="text-gray-400">
                            {service.category}
                          </CardDescription>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => toggleServiceStatus(service.id!)}
                            className={service.isActive ? "text-green-500" : "text-gray-500"}
                          >
                            {service.isActive ? <CheckCircle className="h-4 w-4" /> : <X className="h-4 w-4" />}
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleEditService(service)}
                            className="text-blue-500 hover:text-blue-400"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteService(service.id!)}
                            className="text-red-500 hover:text-red-400"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <p className="text-gray-300 text-sm line-clamp-2">
                        {service.description}
                      </p>
                      
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center text-gray-400">
                          <Clock className="h-4 w-4 mr-1" />
                          {durationOptions.find(d => d.value === service.duration)?.label}
                        </div>
                        <div className="flex items-center font-semibold text-amber-500">
                          <DollarSign className="h-4 w-4 mr-1" />
                          {service.price} MAD
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  } catch (err: any) {
    setGlobalError(err?.message || String(err));
    return (
      <div style={{ color: 'red', background: '#222', padding: 32, fontSize: 18 }}>
        <b>Erreur dans la page services barbier (render) :</b>
        <pre style={{ whiteSpace: 'pre-wrap' }}>{err?.message || String(err)}</pre>
      </div>
    );
  }
} 
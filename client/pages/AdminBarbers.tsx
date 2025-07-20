import React from "react";
import { Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "../components/ui/card";
import { Button } from "../components/ui/button";
import { Badge } from "../components/ui/badge";
import { Input } from "../components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";
import { 
  Search, 
  CheckCircle, 
  X, 
  Eye, 
  Edit, 
  Trash2, 
  Scissors,
  MapPin,
  Star,
  Phone,
  Mail,
  Calendar,
  Clock
} from "lucide-react";

interface Barber {
  id: number;
  name: string;
  email: string;
  salon_name: string;
  location: string;
  phone: string;
  rating: number;
  is_verified: boolean;
  is_active: boolean;
  created_at: string;
  services_count: number;
  appointments_count: number;
  profile_image?: string;
}

export default function AdminBarbers() {
  const [barbers, setBarbers] = React.useState<Barber[]>([]);
  const [filteredBarbers, setFilteredBarbers] = React.useState<Barber[]>([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");
  const [verificationFilter, setVerificationFilter] = React.useState<string>("all");

  // Charger les barbiers depuis l'API
  React.useEffect(() => {
    loadBarbers();
  }, []);

  const loadBarbers = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:3001/api/admin/barbers', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setBarbers(data);
        setFilteredBarbers(data);
      } else {
        console.error('Erreur lors du chargement des barbiers');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Filtrer les barbiers
  React.useEffect(() => {
    let filtered = barbers;

    // Filtre par recherche
    if (searchTerm) {
      filtered = filtered.filter(barber => 
        barber.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barber.salon_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barber.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
        barber.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filtre par statut
    if (statusFilter !== "all") {
      const isActive = statusFilter === "active";
      filtered = filtered.filter(barber => barber.is_active === isActive);
    }

    // Filtre par vérification
    if (verificationFilter !== "all") {
      const isVerified = verificationFilter === "verified";
      filtered = filtered.filter(barber => barber.is_verified === isVerified);
    }

    setFilteredBarbers(filtered);
  }, [barbers, searchTerm, statusFilter, verificationFilter]);

  const getStatusBadge = (isActive: boolean) => {
    return isActive ? 
      <Badge variant="default" className="bg-green-100 text-green-800">Actif</Badge> :
      <Badge variant="secondary">Inactif</Badge>;
  };

  const getVerificationBadge = (isVerified: boolean) => {
    return isVerified ? 
      <Badge variant="default" className="bg-blue-100 text-blue-800">Vérifié</Badge> :
      <Badge variant="destructive">En attente</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  const handleToggleVerification = async (barberId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/barbers/${barberId}/verify`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ is_verified: !currentStatus })
      });

      if (response.ok) {
        // Mettre à jour la liste locale
        setBarbers(barbers.map(barber => 
          barber.id === barberId ? { ...barber, is_verified: !currentStatus } : barber
        ));
      } else {
        console.error('Erreur lors de la mise à jour de la vérification');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
    }
  };

  const handleToggleStatus = async (barberId: number, currentStatus: boolean) => {
    try {
      const response = await fetch(`http://localhost:3001/api/admin/barbers/${barberId}/toggle-status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify({ is_active: !currentStatus })
      });

      if (response.ok) {
        // Mettre à jour la liste locale
        setBarbers(barbers.map(barber => 
          barber.id === barberId ? { ...barber, is_active: !currentStatus } : barber
        ));
      } else {
        console.error('Erreur lors de la mise à jour du statut');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
    }
  };

  const handleDeleteBarber = async (barberId: number) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce barbier ?')) {
      return;
    }

    try {
      const response = await fetch(`http://localhost:3001/api/admin/barbers/${barberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });

      if (response.ok) {
        setBarbers(barbers.filter(barber => barber.id !== barberId));
      } else {
        console.error('Erreur lors de la suppression');
      }
    } catch (error) {
      console.error('Erreur réseau:', error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <nav className="mb-4 text-sm text-gray-500">
        <Link to="/admin-dashboard" className="hover:underline">Dashboard</Link> / Vérifier Barbiers
      </nav>
      
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Vérification des Barbiers</h1>
        <div className="text-sm text-gray-500">
          {filteredBarbers.length} barbier{filteredBarbers.length > 1 ? 's' : ''} trouvé{filteredBarbers.length > 1 ? 's' : ''}
        </div>
      </div>

      {/* Filtres et recherche */}
      <Card className="mb-6">
        <CardContent className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Rechercher par nom, salon ou ville..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="active">Actifs</SelectItem>
                <SelectItem value="inactive">Inactifs</SelectItem>
              </SelectContent>
            </Select>

            <Select value={verificationFilter} onValueChange={setVerificationFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Tous les états" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les états</SelectItem>
                <SelectItem value="verified">Vérifiés</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
              </SelectContent>
            </Select>

            <Button onClick={loadBarbers} variant="outline">
              Actualiser
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Tableau des barbiers */}
      <Card>
        <CardHeader>
          <CardTitle>Liste des Barbiers</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-4 text-gray-500">Chargement des barbiers...</p>
            </div>
          ) : filteredBarbers.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left p-4 font-medium">Barbier</th>
                    <th className="text-left p-4 font-medium">Salon</th>
                    <th className="text-left p-4 font-medium">Statut</th>
                    <th className="text-left p-4 font-medium">Vérification</th>
                    <th className="text-left p-4 font-medium">Services</th>
                    <th className="text-left p-4 font-medium">Note</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBarbers.map((barber) => (
                    <tr key={barber.id} className="border-b hover:bg-gray-50">
                      <td className="p-4">
                        <div className="flex items-center space-x-3">
                          <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                            {barber.profile_image ? (
                              <img 
                                src={barber.profile_image} 
                                alt={barber.name}
                                className="h-full w-full object-cover"
                              />
                            ) : (
                              <Scissors className="h-6 w-6 text-gray-500" />
                            )}
                          </div>
                          <div>
                            <div className="font-medium">{barber.name}</div>
                            <div className="text-sm text-gray-500">{barber.email}</div>
                            {barber.phone && (
                              <div className="text-sm text-gray-400 flex items-center">
                                <Phone className="h-3 w-3 mr-1" />
                                {barber.phone}
                              </div>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="font-medium">{barber.salon_name}</div>
                          <div className="text-sm text-gray-500 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {barber.location}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        {getStatusBadge(barber.is_active)}
                      </td>
                      <td className="p-4">
                        {getVerificationBadge(barber.is_verified)}
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          <div>{barber.services_count} services</div>
                          <div className="text-gray-500">{barber.appointments_count} RDV</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-sm">{barber.rating || 0}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleVerification(barber.id, barber.is_verified)}
                            className={barber.is_verified ? "text-red-600" : "text-green-600"}
                          >
                            {barber.is_verified ? <X className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleToggleStatus(barber.id, barber.is_active)}
                          >
                            {barber.is_active ? 'Désactiver' : 'Activer'}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteBarber(barber.id)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-12">
              <Scissors className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500">Aucun barbier trouvé</p>
              <p className="text-sm text-gray-400 mt-2">
                Essayez de modifier vos critères de recherche
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
} 
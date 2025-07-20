import React from "react";
import { Button } from "./button";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Input } from "./input";
import { Textarea } from "./textarea";
import { 
  Scissors, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Star, 
  Clock,
  User,
  Sparkles
} from "lucide-react";

interface Service {
  id: number;
  name: string;
  description: string;
  price: number;
  duration: number;
  category: string;
  is_popular?: boolean;
  bookings_count?: number;
  rating?: number;
}

interface MoroccanServiceCardProps {
  service: Service;
  isEditing?: boolean;
  onEdit?: (service: Service) => void;
  onSave?: (service: Service) => void;
  onDelete?: (serviceId: number) => void;
  onCancel?: () => void;
  isOwner?: boolean;
}

export function MoroccanServiceCard({
  service,
  isEditing = false,
  onEdit,
  onSave,
  onDelete,
  onCancel,
  isOwner = false
}: MoroccanServiceCardProps) {
  const [editData, setEditData] = React.useState<Service>(service);

  const handleSave = () => {
    if (onSave) {
      onSave(editData);
    }
  };

  const handleCancel = () => {
    setEditData(service);
    if (onCancel) {
      onCancel();
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'coupe':
        return 'from-moroccan-gold to-moroccan-copper';
      case 'barbier':
        return 'from-moroccan-green to-moroccan-gold';
      case 'soins':
        return 'from-moroccan-royal-blue to-moroccan-green';
      case 'coloration':
        return 'from-moroccan-terracotta to-moroccan-copper';
      default:
        return 'from-moroccan-gold to-moroccan-copper';
    }
  };

  if (isEditing) {
    return (
      <Card className="relative overflow-hidden bg-gradient-to-br from-moroccan-darkgrey/90 to-moroccan-charcoal/90 border-2 border-moroccan-gold/30 moroccan-pattern">
        <div className="absolute inset-0 bg-gradient-to-br from-moroccan-gold/5 to-transparent"></div>
        <CardHeader className="relative z-10 pb-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-moroccan-gold to-moroccan-copper rounded-lg">
                <Scissors className="h-5 w-5 text-moroccan-charcoal" />
              </div>
              <CardTitle className="text-moroccan-offwhite font-display">
                Modifier le service
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="relative z-10 space-y-4">
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-moroccan-offwhite">
              Nom du service
            </label>
            <Input
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="bg-moroccan-darkgrey/80 border-2 border-moroccan-darkgrey text-moroccan-offwhite focus:border-moroccan-gold"
              placeholder="Nom du service"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-moroccan-offwhite">
              Description
            </label>
            <Textarea
              value={editData.description}
              onChange={(e) => setEditData({ ...editData, description: e.target.value })}
              className="bg-moroccan-darkgrey/80 border-2 border-moroccan-darkgrey text-moroccan-offwhite focus:border-moroccan-gold"
              placeholder="Description du service"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-moroccan-offwhite">
                Prix (MAD)
              </label>
              <Input
                type="number"
                value={editData.price}
                onChange={(e) => setEditData({ ...editData, price: Number(e.target.value) })}
                className="bg-moroccan-darkgrey/80 border-2 border-moroccan-darkgrey text-moroccan-offwhite focus:border-moroccan-gold"
                placeholder="0"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-moroccan-offwhite">
                Durée (min)
              </label>
              <Input
                type="number"
                value={editData.duration}
                onChange={(e) => setEditData({ ...editData, duration: Number(e.target.value) })}
                className="bg-moroccan-darkgrey/80 border-2 border-moroccan-darkgrey text-moroccan-offwhite focus:border-moroccan-gold"
                placeholder="30"
              />
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-semibold text-moroccan-offwhite">
              Catégorie
            </label>
            <select
              value={editData.category}
              onChange={(e) => setEditData({ ...editData, category: e.target.value })}
              className="w-full bg-moroccan-darkgrey/80 border-2 border-moroccan-darkgrey rounded-lg px-4 py-2 text-moroccan-offwhite focus:outline-none focus:ring-2 focus:ring-moroccan-gold focus:border-moroccan-gold"
            >
              <option value="coupe">Coupe</option>
              <option value="barbier">Barbier</option>
              <option value="soins">Soins</option>
              <option value="coloration">Coloration</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <Button
              onClick={handleCancel}
              variant="outline"
              className="flex-1 border-2 border-moroccan-darkgrey text-moroccan-offwhite hover:bg-moroccan-darkgrey hover:border-moroccan-gold"
            >
              <X className="h-4 w-4 mr-2" />
              Annuler
            </Button>
            <Button
              onClick={handleSave}
              className="flex-1 bg-gradient-to-r from-moroccan-gold to-moroccan-copper hover:from-moroccan-copper hover:to-moroccan-gold text-moroccan-charcoal font-bold"
            >
              <Check className="h-4 w-4 mr-2" />
              Sauvegarder
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="relative overflow-hidden bg-gradient-to-br from-moroccan-darkgrey/90 to-moroccan-charcoal/90 border-2 border-moroccan-darkgrey hover:border-moroccan-gold/50 transition-all duration-300 transform hover:scale-105 moroccan-pattern group">
      <div className="absolute inset-0 bg-gradient-to-br from-moroccan-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
      
      {/* Popular Badge */}
      {service.is_popular && (
        <div className="absolute top-4 right-4 z-20">
          <div className="bg-gradient-to-r from-moroccan-gold to-moroccan-copper text-moroccan-charcoal px-3 py-1 rounded-full text-xs font-bold flex items-center">
            <Sparkles className="h-3 w-3 mr-1" />
            Populaire
          </div>
        </div>
      )}

      <CardHeader className="relative z-10 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-gradient-to-r from-moroccan-gold to-moroccan-copper rounded-lg">
              <Scissors className="h-5 w-5 text-moroccan-charcoal" />
            </div>
            <div>
              <CardTitle className="text-moroccan-offwhite font-display text-xl">
                {service.name}
              </CardTitle>
              <div className="flex items-center space-x-2 mt-1">
                <div 
                  className={`bg-gradient-to-r ${getCategoryColor(service.category)} text-moroccan-charcoal border-0 text-xs font-semibold px-2 py-1 rounded-full`}
                >
                  {service.category}
                </div>
                {service.rating && (
                  <div className="flex items-center space-x-1">
                    <Star className="h-3 w-3 fill-moroccan-gold text-moroccan-gold" />
                    <span className="text-xs text-moroccan-gold font-semibold">{service.rating}</span>
                  </div>
                )}
              </div>
            </div>
          </div>
          
          {isOwner && (
            <div className="flex space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onEdit?.(service)}
                className="text-moroccan-gold hover:bg-moroccan-gold/20"
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onDelete?.(service.id)}
                className="text-red-400 hover:bg-red-400/20"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative z-10 space-y-4">
        <p className="text-moroccan-cream text-sm leading-relaxed">
          {service.description}
        </p>

        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4 text-sm text-moroccan-cream">
            <div className="flex items-center space-x-1">
              <Clock className="h-4 w-4 text-moroccan-gold" />
              <span>{service.duration} min</span>
            </div>
                         {service.bookings_count && (
               <div className="flex items-center space-x-1">
                 <User className="h-4 w-4 text-moroccan-gold" />
                 <span>{service.bookings_count} réservations</span>
               </div>
             )}
          </div>
          
          <div className="text-right">
            <div className="text-2xl font-display font-bold text-moroccan-gold">
              {service.price} MAD
            </div>
            {service.is_popular && (
                             <div className="text-xs text-moroccan-cream flex items-center justify-end mt-1">
                 <Sparkles className="h-3 w-3 mr-1 text-moroccan-gold" />
                 Service premium
               </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
} 
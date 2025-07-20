import React from "react";
import { Button } from "./ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog";
import { Badge } from "./ui/badge";
import {
  Calendar,
  Clock,
  MapPin,
  Home,
  Building,
  Star,
  X,
  Scissors,
  Upload,
  Image,
  Trash2,
  Sparkles,
  CheckCircle,
} from "lucide-react";

interface Barber {
  id: number;
  name: string;
  salon_name: string;
  description: string;
  location: string;
  accepts_home: boolean;
  accepts_shop: boolean;
  rating: number;
  services: Array<{
    id: number;
    name: string;
    price: number;
  }>;
}

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  barber: Barber | null;
}

export default function BookingModal({ isOpen, onClose, barber }: BookingModalProps) {
  const [selectedServices, setSelectedServices] = React.useState<number[]>([]);
  const [selectedDate, setSelectedDate] = React.useState("");
  const [selectedTime, setSelectedTime] = React.useState("");
  const [locationType, setLocationType] = React.useState<'shop' | 'home'>('shop');
  const [address, setAddress] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [referenceImage, setReferenceImage] = React.useState<File | null>(null);
  const [imagePreview, setImagePreview] = React.useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState('card');
  const [cardNumber, setCardNumber] = React.useState('');
  const [expiryDate, setExpiryDate] = React.useState('');
  const [cvv, setCvv] = React.useState('');

  const timeSlots = [
    "09:00", "09:30", "10:00", "10:30", "11:00", "11:30",
    "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
  ];

  const handleServiceToggle = (serviceId: number) => {
    setSelectedServices(prev =>
      prev.includes(serviceId)
        ? prev.filter(id => id !== serviceId)
        : [...prev, serviceId]
    );
  };

  const calculateTotal = () => {
    if (!barber) return 0;
    return barber.services
      .filter(service => selectedServices.includes(service.id))
      .reduce((total, service) => total + service.price, 0);
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Vérifier le type de fichier
      if (!file.type.startsWith('image/')) {
        alert("Veuillez sélectionner une image valide");
        return;
      }
      
      // Vérifier la taille (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        alert("L'image doit faire moins de 5MB");
        return;
      }
      
      setReferenceImage(file);
      
      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setReferenceImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async () => {
    if (!barber || selectedServices.length === 0 || !selectedDate || !selectedTime) {
      alert("Veuillez remplir tous les champs obligatoires");
      return;
    }

    try {
      let imageUrl = null;
      
      // Upload image if provided
      if (referenceImage) {
        const formData = new FormData();
        formData.append('image', referenceImage);
        
        const token = localStorage.getItem('token');
        const uploadResponse = await fetch('http://localhost:3001/api/upload-image', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`
          },
          body: formData
        });
        
        if (uploadResponse.ok) {
          const uploadResult = await uploadResponse.json();
          imageUrl = uploadResult.imageUrl;
        } else {
          console.error('Erreur lors de l\'upload de l\'image');
        }
      }

      // Create appointment
      const token = localStorage.getItem('token');
      const appointmentResponse = await fetch('http://localhost:3001/api/appointments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          barberId: barber.id,
          services: selectedServices,
          date: selectedDate,
          time: selectedTime,
          locationType,
          address: locationType === 'home' ? address : undefined,
          notes,
          referenceImage: imageUrl
        })
      });

      if (appointmentResponse.ok) {
        const result = await appointmentResponse.json();
        console.log("Réservation créée:", result);
        
        // Fermer le modal et réinitialiser
        onClose();
        setSelectedServices([]);
        setSelectedDate("");
        setSelectedTime("");
        setLocationType('shop');
        setAddress("");
        setNotes("");
        setReferenceImage(null);
        setImagePreview(null);
        
        alert("Réservation créée avec succès !");
      } else {
        const error = await appointmentResponse.json();
        alert(`Erreur lors de la réservation: ${error.error}`);
      }
    } catch (error) {
      console.error("Erreur lors de la réservation:", error);
      alert("Erreur lors de la réservation");
    }
  };

  const handlePayment = async () => {
    // Simulation de paiement Stripe
    try {
      const response = await fetch('/api/payment/process', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: selectedServices.reduce((sum, service) => sum + service.price, 0),
          currency: 'mad',
          paymentMethod,
          cardNumber,
          expiryDate,
          cvv
        })
      });
      if (response.ok) {
        // Paiement réussi, continuer avec la réservation
        handleSubmit();
      }
    } catch (error) {
      console.error('Erreur de paiement:', error);
    }
  };

  if (!barber) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-gradient-to-br from-moroccan-charcoal via-moroccan-darkgrey to-moroccan-charcoal border-moroccan-gold/20 text-moroccan-offwhite max-w-4xl max-h-[90vh] overflow-y-auto moroccan-pattern">
        <DialogHeader className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-moroccan-gold/10 to-moroccan-green/10 rounded-t-lg"></div>
          <DialogTitle className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-gradient-to-r from-moroccan-gold to-moroccan-copper rounded-lg">
                <Star className="h-5 w-5 text-moroccan-charcoal" />
              </div>
              <span className="text-xl font-display">Réserver {barber.name}</span>
            </div>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="hover:bg-moroccan-gold/20 text-moroccan-gold hover:text-moroccan-offwhite"
            >
              <X className="h-5 w-5" />
            </Button>
          </DialogTitle>
          <DialogDescription className="text-moroccan-cream relative z-10 flex items-center space-x-2">
            <Sparkles className="h-4 w-4 text-moroccan-gold" />
            <span>{barber.salon_name} - {barber.location}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-8 relative z-10">
          {/* Barber Info - Premium Card */}
          <div className="relative overflow-hidden bg-gradient-to-r from-moroccan-darkgrey/80 to-moroccan-charcoal/80 border border-moroccan-gold/30 rounded-xl p-6 moroccan-pattern">
            <div className="absolute inset-0 bg-gradient-to-br from-moroccan-gold/5 to-transparent"></div>
            <div className="relative flex items-center space-x-6">
              <div className="flex-1">
                <h3 className="font-display text-2xl font-bold text-moroccan-offwhite mb-2">
                  {barber.name}
                </h3>
                <p className="text-moroccan-cream text-lg mb-3">{barber.salon_name}</p>
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-1">
                    <Star className="h-5 w-5 fill-moroccan-gold text-moroccan-gold" />
                    <span className="text-moroccan-gold font-semibold">{barber.rating}</span>
                  </div>
                  <span className="text-moroccan-cream">•</span>
                  <span className="text-moroccan-cream">{barber.description}</span>
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                {barber.accepts_home && (
                  <div className="bg-gradient-to-r from-moroccan-green to-moroccan-gold text-moroccan-charcoal border-0 px-4 py-2 rounded-full flex items-center text-sm font-semibold">
                    <Home className="h-4 w-4 mr-2" />
                    À domicile
                  </div>
                )}
                {barber.accepts_shop && (
                  <div className="bg-gradient-to-r from-moroccan-gold to-moroccan-copper text-moroccan-charcoal border-0 px-4 py-2 rounded-full flex items-center text-sm font-semibold">
                    <Building className="h-4 w-4 mr-2" />
                    En salon
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Services - Enhanced Grid */}
          <div>
            <h4 className="font-display text-xl font-bold mb-6 flex items-center text-moroccan-offwhite">
              <div className="p-2 bg-gradient-to-r from-moroccan-gold to-moroccan-copper rounded-lg mr-3">
                <Scissors className="h-5 w-5 text-moroccan-charcoal" />
              </div>
              Services Premium
            </h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {barber.services.map((service) => (
                <div
                  key={service.id}
                  className={`relative overflow-hidden p-6 border-2 rounded-xl cursor-pointer transition-all duration-300 transform hover:scale-105 ${
                    selectedServices.includes(service.id)
                      ? 'border-moroccan-gold bg-gradient-to-r from-moroccan-gold/20 to-moroccan-copper/20 shadow-moroccan-xl'
                      : 'border-moroccan-darkgrey hover:border-moroccan-gold/50 bg-gradient-to-r from-moroccan-darkgrey/50 to-moroccan-charcoal/50'
                  }`}
                  onClick={() => handleServiceToggle(service.id)}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-moroccan-gold/5 to-transparent opacity-0 hover:opacity-100 transition-opacity"></div>
                  <div className="relative flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-display text-lg font-semibold text-moroccan-offwhite mb-1">
                        {service.name}
                      </p>
                      <p className="text-moroccan-gold font-bold text-xl">{service.price} MAD</p>
                    </div>
                    {selectedServices.includes(service.id) && (
                      <div className="w-8 h-8 bg-gradient-to-r from-moroccan-gold to-moroccan-copper rounded-full flex items-center justify-center shadow-moroccan">
                        <CheckCircle className="w-5 h-5 text-moroccan-charcoal" />
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Date and Time - Premium Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-moroccan-offwhite flex items-center">
                <Calendar className="h-4 w-4 mr-2 text-moroccan-gold" />
                Date *
              </label>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                min={new Date().toISOString().split('T')[0]}
                className="w-full bg-moroccan-darkgrey/80 border-2 border-moroccan-darkgrey rounded-xl px-4 py-3 text-moroccan-offwhite focus:outline-none focus:ring-2 focus:ring-moroccan-gold focus:border-moroccan-gold transition-all duration-300"
              />
            </div>
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-moroccan-offwhite flex items-center">
                <Clock className="h-4 w-4 mr-2 text-moroccan-gold" />
                Heure *
              </label>
              <select
                value={selectedTime}
                onChange={(e) => setSelectedTime(e.target.value)}
                className="w-full bg-moroccan-darkgrey/80 border-2 border-moroccan-darkgrey rounded-xl px-4 py-3 text-moroccan-offwhite focus:outline-none focus:ring-2 focus:ring-moroccan-gold focus:border-moroccan-gold transition-all duration-300"
              >
                <option value="">Sélectionner une heure</option>
                {timeSlots.map((time) => (
                  <option key={time} value={time}>{time}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Location Type - Enhanced Toggle */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-moroccan-offwhite">
              Type de rendez-vous
            </label>
            <div className="flex space-x-4">
              {barber.accepts_shop && (
                <label className={`flex items-center space-x-3 cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${
                  locationType === 'shop' 
                    ? 'border-moroccan-gold bg-gradient-to-r from-moroccan-gold/20 to-moroccan-copper/20' 
                    : 'border-moroccan-darkgrey hover:border-moroccan-gold/50'
                }`}>
                  <input
                    type="radio"
                    value="shop"
                    checked={locationType === 'shop'}
                    onChange={(e) => setLocationType(e.target.value as 'shop')}
                    className="text-moroccan-gold"
                  />
                  <Building className="h-5 w-5 text-moroccan-gold" />
                  <span className="font-medium">En salon</span>
                </label>
              )}
              {barber.accepts_home && (
                <label className={`flex items-center space-x-3 cursor-pointer p-4 rounded-xl border-2 transition-all duration-300 ${
                  locationType === 'home' 
                    ? 'border-moroccan-gold bg-gradient-to-r from-moroccan-gold/20 to-moroccan-copper/20' 
                    : 'border-moroccan-darkgrey hover:border-moroccan-gold/50'
                }`}>
                  <input
                    type="radio"
                    value="home"
                    checked={locationType === 'home'}
                    onChange={(e) => setLocationType(e.target.value as 'home')}
                    className="text-moroccan-gold"
                  />
                  <Home className="h-5 w-5 text-moroccan-gold" />
                  <span className="font-medium">À domicile</span>
                </label>
              )}
            </div>
          </div>

          {/* Address for home service */}
          {locationType === 'home' && (
            <div className="space-y-3">
              <label className="block text-sm font-semibold text-moroccan-offwhite flex items-center">
                <MapPin className="h-4 w-4 mr-2 text-moroccan-gold" />
                Adresse *
              </label>
              <textarea
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Entrez votre adresse complète"
                rows={3}
                className="w-full bg-moroccan-darkgrey/80 border-2 border-moroccan-darkgrey rounded-xl px-4 py-3 text-moroccan-offwhite focus:outline-none focus:ring-2 focus:ring-moroccan-gold focus:border-moroccan-gold transition-all duration-300 placeholder-moroccan-cream/50"
              />
            </div>
          )}

          {/* Reference Image - Enhanced Upload */}
          <div className="space-y-4">
            <label className="block text-sm font-semibold text-moroccan-offwhite flex items-center">
              <Image className="h-4 w-4 mr-2 text-moroccan-gold" />
              Photo de référence (optionnel)
            </label>
            <div className="space-y-4">
              {!imagePreview ? (
                <div className="border-2 border-dashed border-moroccan-darkgrey rounded-xl p-8 text-center hover:border-moroccan-gold transition-all duration-300 bg-gradient-to-br from-moroccan-darkgrey/30 to-moroccan-charcoal/30">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    className="hidden"
                    id="image-upload"
                  />
                  <label htmlFor="image-upload" className="cursor-pointer">
                    <div className="p-4 bg-gradient-to-r from-moroccan-gold to-moroccan-copper rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                      <Upload className="h-8 w-8 text-moroccan-charcoal" />
                    </div>
                    <p className="text-moroccan-offwhite font-medium mb-2">Cliquez pour ajouter une photo</p>
                    <p className="text-sm text-moroccan-cream">
                      JPG, PNG - Max 5MB
                    </p>
                  </label>
                </div>
              ) : (
                <div className="relative overflow-hidden rounded-xl border-2 border-moroccan-gold/30">
                  <img
                    src={imagePreview}
                    alt="Aperçu de la photo de référence"
                    className="w-full h-64 object-cover"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={removeImage}
                    className="absolute top-4 right-4 bg-red-600 hover:bg-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
              <p className="text-sm text-moroccan-cream">
                Ajoutez une photo de la coupe que vous souhaitez pour aider le barbier à mieux comprendre vos attentes.
              </p>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-3">
            <label className="block text-sm font-semibold text-moroccan-offwhite">
              Notes (optionnel)
            </label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Informations supplémentaires..."
              rows={3}
              className="w-full bg-moroccan-darkgrey/80 border-2 border-moroccan-darkgrey rounded-xl px-4 py-3 text-moroccan-offwhite focus:outline-none focus:ring-2 focus:ring-moroccan-gold focus:border-moroccan-gold transition-all duration-300 placeholder-moroccan-cream/50"
            />
          </div>

          {/* Total - Premium Display */}
          <div className="border-t-2 border-moroccan-gold/30 pt-6">
            <div className="flex items-center justify-between text-2xl font-display font-bold">
              <span className="text-moroccan-offwhite">Total:</span>
              <span className="text-moroccan-gold bg-gradient-to-r from-moroccan-gold to-moroccan-copper bg-clip-text text-transparent">
                {calculateTotal()} MAD
              </span>
            </div>
          </div>

          {/* Paiement */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Paiement</h3>
            <div className="space-y-2">
              <label className="flex items-center">
                <input type="radio" value="card" checked={paymentMethod === 'card'} onChange={(e) => setPaymentMethod(e.target.value)} />
                <span className="ml-2">Carte bancaire</span>
              </label>
              <label className="flex items-center">
                <input type="radio" value="paypal" checked={paymentMethod === 'paypal'} onChange={(e) => setPaymentMethod(e.target.value)} />
                <span className="ml-2">PayPal</span>
              </label>
            </div>
            {paymentMethod === 'card' && (
              <div className="space-y-2">
                <input type="text" placeholder="Numéro de carte" value={cardNumber} onChange={(e) => setCardNumber(e.target.value)} className="w-full p-2 border rounded" />
                <div className="flex space-x-2">
                  <input type="text" placeholder="MM/YY" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="w-1/2 p-2 border rounded" />
                  <input type="text" placeholder="CVV" value={cvv} onChange={(e) => setCvv(e.target.value)} className="w-1/2 p-2 border rounded" />
                </div>
              </div>
            )}
            <Button
              onClick={handlePayment}
              className="flex-1 bg-gradient-to-r from-moroccan-gold to-moroccan-copper hover:from-moroccan-copper hover:to-moroccan-gold text-moroccan-charcoal font-bold py-3 shadow-moroccan-lg transition-all duration-300 transform hover:scale-105"
              disabled={selectedServices.length === 0 || !selectedDate || !selectedTime}
            >
              <Calendar className="h-5 w-5 mr-2" />
              Confirmer la réservation
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
} 
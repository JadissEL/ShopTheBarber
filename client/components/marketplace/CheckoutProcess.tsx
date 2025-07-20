import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { Label } from "../ui/label";
import { Textarea } from "../ui/textarea";
import { RadioGroup, RadioGroupItem } from "../ui/radio-group";
import { Checkbox } from "../ui/checkbox";
import { Badge } from "../ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import {
  CreditCard,
  Truck,
  MapPin,
  Shield,
  Clock,
  Gift,
  User,
  Mail,
  Phone,
  Home,
  CheckCircle,
  AlertCircle,
  Lock,
  Zap,
  Package,
  Calendar,
  ArrowLeft,
  ArrowRight,
} from "lucide-react";

interface CartItem {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  quickShip?: boolean;
}

interface CheckoutProcessProps {
  items: CartItem[];
  onBack: () => void;
  onOrderComplete: (orderId: string) => void;
}

interface ShippingAddress {
  firstName: string;
  lastName: string;
  company?: string;
  address: string;
  address2?: string;
  city: string;
  postalCode: string;
  country: string;
  phone: string;
  email: string;
}

interface PaymentMethod {
  type: "card" | "paypal" | "bank_transfer";
  cardNumber?: string;
  expiryDate?: string;
  cvv?: string;
  cardholderName?: string;
}

export function CheckoutProcess({
  items,
  onBack,
  onOrderComplete,
}: CheckoutProcessProps) {
  const [currentStep, setCurrentStep] = React.useState(1);
  const [shippingAddress, setShippingAddress] = React.useState<ShippingAddress>(
    {
      firstName: "",
      lastName: "",
      company: "",
      address: "",
      address2: "",
      city: "",
      postalCode: "",
      country: "FR",
      phone: "",
      email: "",
    },
  );
  const [billingAddress, setBillingAddress] =
    React.useState<ShippingAddress | null>(null);
  const [sameAsShipping, setSameAsShipping] = React.useState(true);
  const [shippingMethod, setShippingMethod] = React.useState("standard");
  const [paymentMethod, setPaymentMethod] = React.useState<PaymentMethod>({
    type: "card",
  });
  const [giftWrap, setGiftWrap] = React.useState(false);
  const [giftMessage, setGiftMessage] = React.useState("");
  const [newsletter, setNewsletter] = React.useState(false);
  const [terms, setTerms] = React.useState(false);
  const [promoCode, setPromoCode] = React.useState("");
  const [appliedPromo, setAppliedPromo] = React.useState<{
    code: string;
    discount: number;
  } | null>(null);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );

  const shippingCosts = {
    standard: subtotal > 50 ? 0 : 9.99,
    express: 14.99,
    premium: 24.99,
  };

  const shippingCost =
    shippingCosts[shippingMethod as keyof typeof shippingCosts];
  const giftWrapCost = giftWrap ? 4.99 : 0;
  const discount = appliedPromo ? appliedPromo.discount : 0;
  const total = subtotal + shippingCost + giftWrapCost - discount;

  const steps = [
    { id: 1, title: "Livraison", icon: Truck },
    { id: 2, title: "Paiement", icon: CreditCard },
    { id: 3, title: "Confirmation", icon: CheckCircle },
  ];

  const shippingOptions = [
    {
      id: "standard",
      name: "Livraison Standard",
      description: "5-7 jours ouvrés",
      price: subtotal > 50 ? 0 : 9.99,
      icon: Package,
      free: subtotal > 50,
    },
    {
      id: "express",
      name: "Livraison Express",
      description: "2-3 jours ouvrés",
      price: 14.99,
      icon: Zap,
    },
    {
      id: "premium",
      name: "Livraison Premium",
      description: "24h chrono",
      price: 24.99,
      icon: Clock,
    },
  ];

  const applyPromoCode = () => {
    const promoCodes = {
      WELCOME10: 10,
      SAVE5: 5,
      PREMIUM20: 20,
    };

    if (promoCodes[promoCode as keyof typeof promoCodes]) {
      setAppliedPromo({
        code: promoCode,
        discount: promoCodes[promoCode as keyof typeof promoCodes],
      });
    }
  };

  const handleNextStep = () => {
    if (currentStep < 3) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handlePrevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleOrderSubmit = () => {
    // Simulate order processing
    const orderId = `ORD-${Date.now()}`;
    setTimeout(() => {
      onOrderComplete(orderId);
    }, 2000);
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return (
          shippingAddress.firstName &&
          shippingAddress.lastName &&
          shippingAddress.address &&
          shippingAddress.city &&
          shippingAddress.postalCode &&
          shippingAddress.email &&
          shippingAddress.phone
        );
      case 2:
        return (
          paymentMethod.type &&
          terms &&
          (paymentMethod.type !== "card" ||
            (paymentMethod.cardNumber &&
              paymentMethod.expiryDate &&
              paymentMethod.cvv &&
              paymentMethod.cardholderName))
        );
      case 3:
        return true;
      default:
        return false;
    }
  };

  return (
    <div className="min-h-screen bg-moroccan-charcoal py-8">
      <div className="container mx-auto px-6 max-w-6xl">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Button
            variant="ghost"
            onClick={onBack}
            className="text-moroccan-gold hover:bg-moroccan-gold/10"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Retour au panier
          </Button>
          <div className="text-center">
            <h1 className="text-2xl font-bold text-moroccan-gold">
              Finaliser votre commande
            </h1>
            <p className="text-moroccan-cream">Commande sécurisée et cryptée</p>
          </div>
          <div className="w-24"></div>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-center mb-8">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-lg ${
                  currentStep >= step.id
                    ? "bg-moroccan-gold text-moroccan-charcoal"
                    : "bg-moroccan-darkgrey/60 text-moroccan-cream"
                }`}
              >
                <step.icon className="w-4 h-4" />
                <span className="font-medium">{step.title}</span>
              </div>
              {index < steps.length - 1 && (
                <div
                  className={`w-8 h-px mx-2 ${
                    currentStep > step.id
                      ? "bg-moroccan-gold"
                      : "bg-moroccan-darkgrey"
                  }`}
                />
              )}
            </React.Fragment>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Step 1: Shipping Information */}
            {currentStep === 1 && (
              <Card className="bg-moroccan-darkgrey/60 border-moroccan-gold/20">
                <CardHeader>
                  <CardTitle className="text-moroccan-gold flex items-center gap-2">
                    <Truck className="w-5 h-5" />
                    Informations de livraison
                  </CardTitle>
                  <CardDescription className="text-moroccan-cream">
                    Où souhaitez-vous recevoir votre commande ?
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Personal Information */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-moroccan-sand">Prénom *</Label>
                      <Input
                        value={shippingAddress.firstName}
                        onChange={(e) =>
                          setShippingAddress((prev) => ({
                            ...prev,
                            firstName: e.target.value,
                          }))
                        }
                        className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-moroccan-sand">Nom *</Label>
                      <Input
                        value={shippingAddress.lastName}
                        onChange={(e) =>
                          setShippingAddress((prev) => ({
                            ...prev,
                            lastName: e.target.value,
                          }))
                        }
                        className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label className="text-moroccan-sand">
                      Entreprise (optionnel)
                    </Label>
                    <Input
                      value={shippingAddress.company}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          company: e.target.value,
                        }))
                      }
                      className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-moroccan-sand">Adresse *</Label>
                    <Input
                      value={shippingAddress.address}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          address: e.target.value,
                        }))
                      }
                      className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand"
                      placeholder="Numéro et nom de rue"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label className="text-moroccan-sand">
                      Complément d'adresse
                    </Label>
                    <Input
                      value={shippingAddress.address2}
                      onChange={(e) =>
                        setShippingAddress((prev) => ({
                          ...prev,
                          address2: e.target.value,
                        }))
                      }
                      className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand"
                      placeholder="Appartement, étage, etc."
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label className="text-moroccan-sand">Ville *</Label>
                      <Input
                        value={shippingAddress.city}
                        onChange={(e) =>
                          setShippingAddress((prev) => ({
                            ...prev,
                            city: e.target.value,
                          }))
                        }
                        className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-moroccan-sand">
                        Code postal *
                      </Label>
                      <Input
                        value={shippingAddress.postalCode}
                        onChange={(e) =>
                          setShippingAddress((prev) => ({
                            ...prev,
                            postalCode: e.target.value,
                          }))
                        }
                        className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-moroccan-sand">Pays *</Label>
                      <Select
                        value={shippingAddress.country}
                        onValueChange={(value) =>
                          setShippingAddress((prev) => ({
                            ...prev,
                            country: value,
                          }))
                        }
                      >
                        <SelectTrigger className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-moroccan-darkgrey border-moroccan-gold/30">
                          <SelectItem value="FR">France</SelectItem>
                          <SelectItem value="MA">Maroc</SelectItem>
                          <SelectItem value="BE">Belgique</SelectItem>
                          <SelectItem value="CH">Suisse</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-moroccan-sand">Email *</Label>
                      <Input
                        type="email"
                        value={shippingAddress.email}
                        onChange={(e) =>
                          setShippingAddress((prev) => ({
                            ...prev,
                            email: e.target.value,
                          }))
                        }
                        className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-moroccan-sand">Téléphone *</Label>
                      <Input
                        value={shippingAddress.phone}
                        onChange={(e) =>
                          setShippingAddress((prev) => ({
                            ...prev,
                            phone: e.target.value,
                          }))
                        }
                        className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand"
                      />
                    </div>
                  </div>

                  {/* Shipping Method */}
                  <div className="space-y-4">
                    <Label className="text-moroccan-sand text-lg font-semibold">
                      Mode de livraison
                    </Label>
                    <RadioGroup
                      value={shippingMethod}
                      onValueChange={setShippingMethod}
                      className="space-y-3"
                    >
                      {shippingOptions.map((option) => (
                        <div
                          key={option.id}
                          className="flex items-center space-x-3 p-4 border border-moroccan-gold/20 rounded-lg hover:border-moroccan-gold/50 transition-colors"
                        >
                          <RadioGroupItem
                            value={option.id}
                            id={option.id}
                            className="text-moroccan-gold"
                          />
                          <div className="flex-1 flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              <option.icon className="w-5 h-5 text-moroccan-gold" />
                              <div>
                                <div className="font-semibold text-moroccan-sand">
                                  {option.name}
                                </div>
                                <div className="text-sm text-moroccan-cream">
                                  {option.description}
                                </div>
                              </div>
                            </div>
                            <div className="text-right">
                              {option.free ? (
                                <Badge className="bg-green-500/20 text-green-400">
                                  Gratuit
                                </Badge>
                              ) : (
                                <span className="font-semibold text-moroccan-gold">
                                  {option.price}€
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>

                  {/* Gift Wrap Option */}
                  <div className="space-y-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="gift-wrap"
                        checked={giftWrap}
                        onCheckedChange={setGiftWrap}
                        className="border-moroccan-gold text-moroccan-gold"
                      />
                      <Label
                        htmlFor="gift-wrap"
                        className="text-moroccan-sand cursor-pointer"
                      >
                        <div className="flex items-center gap-2">
                          <Gift className="w-4 h-4 text-moroccan-gold" />
                          Emballage cadeau (+4,99€)
                        </div>
                      </Label>
                    </div>
                    {giftWrap && (
                      <Textarea
                        placeholder="Message personnalisé pour le cadeau..."
                        value={giftMessage}
                        onChange={(e) => setGiftMessage(e.target.value)}
                        className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand"
                      />
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 2: Payment */}
            {currentStep === 2 && (
              <Card className="bg-moroccan-darkgrey/60 border-moroccan-gold/20">
                <CardHeader>
                  <CardTitle className="text-moroccan-gold flex items-center gap-2">
                    <CreditCard className="w-5 h-5" />
                    Informations de paiement
                  </CardTitle>
                  <CardDescription className="text-moroccan-cream">
                    Choisissez votre mode de paiement sécurisé
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Payment Method Selection */}
                  <RadioGroup
                    value={paymentMethod.type}
                    onValueChange={(value) =>
                      setPaymentMethod((prev) => ({
                        ...prev,
                        type: value as "card" | "paypal" | "bank_transfer",
                      }))
                    }
                    className="space-y-3"
                  >
                    <div className="flex items-center space-x-3 p-4 border border-moroccan-gold/20 rounded-lg">
                      <RadioGroupItem
                        value="card"
                        id="card"
                        className="text-moroccan-gold"
                      />
                      <Label
                        htmlFor="card"
                        className="flex-1 cursor-pointer flex items-center gap-3"
                      >
                        <CreditCard className="w-5 h-5 text-moroccan-gold" />
                        <div>
                          <div className="font-semibold text-moroccan-sand">
                            Carte bancaire
                          </div>
                          <div className="text-sm text-moroccan-cream">
                            Visa, Mastercard, American Express
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border border-moroccan-gold/20 rounded-lg">
                      <RadioGroupItem
                        value="paypal"
                        id="paypal"
                        className="text-moroccan-gold"
                      />
                      <Label
                        htmlFor="paypal"
                        className="flex-1 cursor-pointer flex items-center gap-3"
                      >
                        <div className="w-5 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center font-bold">
                          P
                        </div>
                        <div>
                          <div className="font-semibold text-moroccan-sand">
                            PayPal
                          </div>
                          <div className="text-sm text-moroccan-cream">
                            Paiement rapide et sécurisé
                          </div>
                        </div>
                      </Label>
                    </div>

                    <div className="flex items-center space-x-3 p-4 border border-moroccan-gold/20 rounded-lg">
                      <RadioGroupItem
                        value="bank_transfer"
                        id="bank_transfer"
                        className="text-moroccan-gold"
                      />
                      <Label
                        htmlFor="bank_transfer"
                        className="flex-1 cursor-pointer flex items-center gap-3"
                      >
                        <Home className="w-5 h-5 text-moroccan-gold" />
                        <div>
                          <div className="font-semibold text-moroccan-sand">
                            Virement bancaire
                          </div>
                          <div className="text-sm text-moroccan-cream">
                            Délai de traitement 2-3 jours
                          </div>
                        </div>
                      </Label>
                    </div>
                  </RadioGroup>

                  {/* Card Details */}
                  {paymentMethod.type === "card" && (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label className="text-moroccan-sand">
                          Nom du titulaire *
                        </Label>
                        <Input
                          value={paymentMethod.cardholderName || ""}
                          onChange={(e) =>
                            setPaymentMethod((prev) => ({
                              ...prev,
                              cardholderName: e.target.value,
                            }))
                          }
                          className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand"
                        />
                      </div>

                      <div className="space-y-2">
                        <Label className="text-moroccan-sand">
                          Numéro de carte *
                        </Label>
                        <Input
                          value={paymentMethod.cardNumber || ""}
                          onChange={(e) =>
                            setPaymentMethod((prev) => ({
                              ...prev,
                              cardNumber: e.target.value,
                            }))
                          }
                          placeholder="1234 5678 9012 3456"
                          className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand"
                        />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label className="text-moroccan-sand">
                            Date d'expiration *
                          </Label>
                          <Input
                            value={paymentMethod.expiryDate || ""}
                            onChange={(e) =>
                              setPaymentMethod((prev) => ({
                                ...prev,
                                expiryDate: e.target.value,
                              }))
                            }
                            placeholder="MM/AA"
                            className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label className="text-moroccan-sand">CVV *</Label>
                          <Input
                            value={paymentMethod.cvv || ""}
                            onChange={(e) =>
                              setPaymentMethod((prev) => ({
                                ...prev,
                                cvv: e.target.value,
                              }))
                            }
                            placeholder="123"
                            className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand"
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Security Notice */}
                  <div className="bg-moroccan-gold/10 rounded-lg p-4 flex items-start gap-3">
                    <Lock className="w-5 h-5 text-moroccan-gold flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-semibold text-moroccan-sand mb-1">
                        Paiement 100% sécurisé
                      </div>
                      <div className="text-moroccan-cream">
                        Vos informations de paiement sont cryptées et protégées
                        par SSL. Nous ne stockons jamais vos données bancaires.
                      </div>
                    </div>
                  </div>

                  {/* Terms and Conditions */}
                  <div className="space-y-4">
                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="terms"
                        checked={terms}
                        onCheckedChange={setTerms}
                        className="border-moroccan-gold text-moroccan-gold mt-1"
                      />
                      <Label
                        htmlFor="terms"
                        className="text-sm text-moroccan-sand cursor-pointer leading-relaxed"
                      >
                        J'accepte les{" "}
                        <a
                          href="/terms"
                          className="text-moroccan-gold hover:underline"
                        >
                          conditions générales de vente
                        </a>{" "}
                        et la{" "}
                        <a
                          href="/privacy"
                          className="text-moroccan-gold hover:underline"
                        >
                          politique de confidentialité
                        </a>{" "}
                        *
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="newsletter"
                        checked={newsletter}
                        onCheckedChange={setNewsletter}
                        className="border-moroccan-gold text-moroccan-gold"
                      />
                      <Label
                        htmlFor="newsletter"
                        className="text-sm text-moroccan-sand cursor-pointer"
                      >
                        Je souhaite recevoir les offres exclusives et actualités
                        par email
                      </Label>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Step 3: Confirmation */}
            {currentStep === 3 && (
              <Card className="bg-moroccan-darkgrey/60 border-moroccan-gold/20">
                <CardHeader>
                  <CardTitle className="text-moroccan-gold flex items-center gap-2">
                    <CheckCircle className="w-5 h-5" />
                    Confirmation de commande
                  </CardTitle>
                  <CardDescription className="text-moroccan-cream">
                    Vérifiez vos informations avant de finaliser
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {/* Order Summary */}
                  <div className="space-y-4">
                    <h3 className="font-semibold text-moroccan-sand">
                      Récapitulatif de la commande
                    </h3>
                    {items.map((item) => (
                      <div
                        key={item.id}
                        className="flex items-center gap-4 p-4 bg-moroccan-darkgrey/40 rounded-lg"
                      >
                        <img
                          src={item.image}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg"
                        />
                        <div className="flex-1">
                          <h4 className="font-semibold text-moroccan-sand">
                            {item.name}
                          </h4>
                          <p className="text-sm text-moroccan-cream">
                            {item.brand} • Quantité: {item.quantity}
                          </p>
                        </div>
                        <div className="text-moroccan-gold font-semibold">
                          {(item.price * item.quantity).toFixed(2)}€
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Shipping Address */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-moroccan-sand">
                      Adresse de livraison
                    </h3>
                    <div className="p-4 bg-moroccan-darkgrey/40 rounded-lg text-moroccan-cream">
                      <div>
                        {shippingAddress.firstName} {shippingAddress.lastName}
                      </div>
                      {shippingAddress.company && (
                        <div>{shippingAddress.company}</div>
                      )}
                      <div>{shippingAddress.address}</div>
                      {shippingAddress.address2 && (
                        <div>{shippingAddress.address2}</div>
                      )}
                      <div>
                        {shippingAddress.postalCode} {shippingAddress.city}
                      </div>
                      <div>{shippingAddress.phone}</div>
                      <div>{shippingAddress.email}</div>
                    </div>
                  </div>

                  {/* Payment Method */}
                  <div className="space-y-2">
                    <h3 className="font-semibold text-moroccan-sand">
                      Mode de paiement
                    </h3>
                    <div className="p-4 bg-moroccan-darkgrey/40 rounded-lg text-moroccan-cream">
                      {paymentMethod.type === "card" && "Carte bancaire"}
                      {paymentMethod.type === "paypal" && "PayPal"}
                      {paymentMethod.type === "bank_transfer" &&
                        "Virement bancaire"}
                      {paymentMethod.cardNumber && (
                        <div className="text-sm">
                          •••• •••• •••• {paymentMethod.cardNumber.slice(-4)}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Final Notice */}
                  <div className="bg-moroccan-gold/10 rounded-lg p-4 flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-moroccan-gold flex-shrink-0 mt-0.5" />
                    <div className="text-sm">
                      <div className="font-semibold text-moroccan-sand mb-1">
                        Dernière étape
                      </div>
                      <div className="text-moroccan-cream">
                        En cliquant sur "Confirmer la commande", vous acceptez
                        nos conditions de vente et validez votre achat.
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Navigation Buttons */}
            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={handlePrevStep}
                disabled={currentStep === 1}
                className="border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold/10"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Précédent
              </Button>

              {currentStep < 3 ? (
                <Button
                  onClick={handleNextStep}
                  disabled={!isStepValid(currentStep)}
                  className="bg-moroccan-gold text-moroccan-charcoal hover:bg-moroccan-copper"
                >
                  Suivant
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              ) : (
                <Button
                  onClick={handleOrderSubmit}
                  className="bg-moroccan-gradient-primary text-moroccan-charcoal hover:scale-105 transition-all font-bold"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Confirmer la commande
                </Button>
              )}
            </div>
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <Card className="bg-moroccan-darkgrey/60 border-moroccan-gold/20 sticky top-8">
              <CardHeader>
                <CardTitle className="text-moroccan-gold">
                  Résumé de commande
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Items */}
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-moroccan-cream">
                        {item.name} × {item.quantity}
                      </span>
                      <span className="text-moroccan-sand">
                        {(item.price * item.quantity).toFixed(2)}€
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-moroccan-gold/20 pt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-moroccan-cream">Sous-total</span>
                    <span className="text-moroccan-sand">
                      {subtotal.toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-moroccan-cream">Livraison</span>
                    <span className="text-moroccan-sand">
                      {shippingCost === 0 ? "Gratuite" : `${shippingCost}€`}
                    </span>
                  </div>
                  {giftWrap && (
                    <div className="flex justify-between text-sm">
                      <span className="text-moroccan-cream">
                        Emballage cadeau
                      </span>
                      <span className="text-moroccan-sand">
                        {giftWrapCost}€
                      </span>
                    </div>
                  )}
                  {appliedPromo && (
                    <div className="flex justify-between text-sm text-green-400">
                      <span>Réduction ({appliedPromo.code})</span>
                      <span>-{appliedPromo.discount}€</span>
                    </div>
                  )}
                </div>

                <div className="border-t border-moroccan-gold/20 pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-moroccan-sand">Total</span>
                    <span className="text-moroccan-gold">
                      {total.toFixed(2)}€
                    </span>
                  </div>
                </div>

                {/* Promo Code */}
                {!appliedPromo && currentStep < 3 && (
                  <div className="border-t border-moroccan-gold/20 pt-4 space-y-2">
                    <div className="flex gap-2">
                      <Input
                        placeholder="Code promo"
                        value={promoCode}
                        onChange={(e) => setPromoCode(e.target.value)}
                        className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand text-sm"
                      />
                      <Button
                        size="sm"
                        onClick={applyPromoCode}
                        disabled={!promoCode}
                        className="bg-moroccan-gold text-moroccan-charcoal hover:bg-moroccan-copper"
                      >
                        OK
                      </Button>
                    </div>
                  </div>
                )}

                {/* Security Badges */}
                <div className="border-t border-moroccan-gold/20 pt-4 space-y-2">
                  <div className="flex items-center gap-2 text-xs text-moroccan-cream">
                    <Shield className="w-4 h-4 text-green-400" />
                    Paiement sécurisé SSL
                  </div>
                  <div className="flex items-center gap-2 text-xs text-moroccan-cream">
                    <Truck className="w-4 h-4 text-blue-400" />
                    Livraison assurée
                  </div>
                  <div className="flex items-center gap-2 text-xs text-moroccan-cream">
                    <CheckCircle className="w-4 h-4 text-moroccan-gold" />
                    Satisfait ou remboursé
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

import React from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { Badge } from "../ui/badge";
import {
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Tag,
  Truck,
  Shield,
  Clock,
  Gift,
  CreditCard,
  ArrowRight,
  Percent,
} from "lucide-react";

interface CartItem {
  id: number;
  name: string;
  brand: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  inStock: boolean;
  quickShip?: boolean;
  maxQuantity?: number;
}

interface ShoppingCartProps {
  items: CartItem[];
  onUpdateQuantity: (id: number, quantity: number) => void;
  onRemoveItem: (id: number) => void;
  onClearCart: () => void;
  onCheckout: () => void;
}

export function ShoppingCartDrawer({
  items,
  onUpdateQuantity,
  onRemoveItem,
  onClearCart,
  onCheckout,
}: ShoppingCartProps) {
  const [promoCode, setPromoCode] = React.useState("");
  const [appliedPromo, setAppliedPromo] = React.useState<{
    code: string;
    discount: number;
    type: "percentage" | "fixed";
  } | null>(null);

  const subtotal = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0,
  );
  const shipping = subtotal > 50 ? 0 : 9.99;
  const discount = appliedPromo
    ? appliedPromo.type === "percentage"
      ? (subtotal * appliedPromo.discount) / 100
      : appliedPromo.discount
    : 0;
  const total = subtotal + shipping - discount;

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  const applyPromoCode = () => {
    // Mock promo codes
    const promoCodes = {
      WELCOME10: { discount: 10, type: "percentage" as const },
      SAVE5: { discount: 5, type: "fixed" as const },
      PREMIUM20: { discount: 20, type: "percentage" as const },
    };

    if (promoCodes[promoCode as keyof typeof promoCodes]) {
      setAppliedPromo({
        code: promoCode,
        ...promoCodes[promoCode as keyof typeof promoCodes],
      });
    }
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="sm"
          className="relative text-moroccan-gold hover:bg-moroccan-gold/10 hover:text-moroccan-copper transition-all"
        >
          <ShoppingCart className="w-5 h-5" />
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-2 bg-moroccan-gold text-moroccan-charcoal text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center animate-pulse">
              {totalItems}
            </span>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="w-full sm:max-w-lg bg-moroccan-charcoal border-moroccan-gold/20 text-moroccan-sand overflow-y-auto">
        <SheetHeader className="border-b border-moroccan-gold/20 pb-4">
          <SheetTitle className="text-moroccan-gold flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Panier ({totalItems} article{totalItems !== 1 ? "s" : ""})
          </SheetTitle>
          <SheetDescription className="text-moroccan-cream">
            Finalisez votre commande premium
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 py-6">
          {items.length === 0 ? (
            <div className="text-center py-12 space-y-4">
              <div className="w-16 h-16 bg-moroccan-gold/20 rounded-full flex items-center justify-center mx-auto">
                <ShoppingCart className="w-8 h-8 text-moroccan-gold" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-moroccan-sand mb-2">
                  Votre panier est vide
                </h3>
                <p className="text-moroccan-cream text-sm">
                  Découvrez nos produits premium et ajoutez-les à votre panier
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Cart Items */}
              <div className="space-y-4">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex gap-4 p-4 bg-moroccan-darkgrey/60 rounded-xl border border-moroccan-gold/20"
                  >
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-16 h-16 object-cover rounded-lg"
                    />
                    <div className="flex-1 space-y-2">
                      <div>
                        <h4 className="font-semibold text-moroccan-sand text-sm">
                          {item.name}
                        </h4>
                        <p className="text-xs text-moroccan-cream/60">
                          {item.brand}
                        </p>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              onUpdateQuantity(item.id, item.quantity - 1)
                            }
                            disabled={item.quantity <= 1}
                            className="w-6 h-6 p-0 border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold hover:text-moroccan-charcoal"
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="text-sm font-medium text-moroccan-sand px-2">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              onUpdateQuantity(item.id, item.quantity + 1)
                            }
                            disabled={
                              item.maxQuantity
                                ? item.quantity >= item.maxQuantity
                                : false
                            }
                            className="w-6 h-6 p-0 border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold hover:text-moroccan-charcoal"
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>

                        <div className="text-right">
                          <div className="text-sm font-bold text-moroccan-gold">
                            {(item.price * item.quantity).toFixed(2)}€
                          </div>
                          {item.originalPrice && (
                            <div className="text-xs text-moroccan-cream/60 line-through">
                              {(item.originalPrice * item.quantity).toFixed(2)}€
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center justify-between">
                        <div className="flex gap-1">
                          {item.quickShip && (
                            <Badge className="bg-green-500/20 text-green-400 text-xs">
                              <Truck className="w-3 h-3 mr-1" />
                              24h
                            </Badge>
                          )}
                          {!item.inStock && (
                            <Badge className="bg-red-500/20 text-red-400 text-xs">
                              Stock limité
                            </Badge>
                          )}
                        </div>

                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => onRemoveItem(item.id)}
                          className="text-red-400 hover:text-red-300 hover:bg-red-500/20 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Promo Code */}
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-moroccan-sand flex items-center gap-2">
                  <Tag className="w-4 h-4" />
                  Code Promo
                </h3>
                <div className="flex gap-2">
                  <Input
                    placeholder="Entrez votre code"
                    value={promoCode}
                    onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                    className="bg-moroccan-darkgrey/60 border-moroccan-gold/30 text-moroccan-sand placeholder:text-moroccan-cream/50"
                  />
                  <Button
                    size="sm"
                    onClick={applyPromoCode}
                    disabled={!promoCode || !!appliedPromo}
                    className="bg-moroccan-gold text-moroccan-charcoal hover:bg-moroccan-copper"
                  >
                    Appliquer
                  </Button>
                </div>
                {appliedPromo && (
                  <div className="flex items-center gap-2 text-sm text-green-400">
                    <Percent className="w-4 h-4" />
                    Code "{appliedPromo.code}" appliqué (-
                    {appliedPromo.type === "percentage"
                      ? `${appliedPromo.discount}%`
                      : `${appliedPromo.discount}€`}
                    )
                  </div>
                )}
              </div>

              {/* Order Summary */}
              <div className="space-y-3 pt-4 border-t border-moroccan-gold/20">
                <h3 className="text-sm font-semibold text-moroccan-sand">
                  Résumé de la commande
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-moroccan-cream">Sous-total</span>
                    <span className="text-moroccan-sand">
                      {subtotal.toFixed(2)}€
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-moroccan-cream flex items-center gap-1">
                      <Truck className="w-3 h-3" />
                      Livraison
                    </span>
                    <span className="text-moroccan-sand">
                      {shipping === 0 ? "Gratuite" : `${shipping.toFixed(2)}€`}
                    </span>
                  </div>
                  {discount > 0 && (
                    <div className="flex justify-between text-green-400">
                      <span>Réduction</span>
                      <span>-{discount.toFixed(2)}€</span>
                    </div>
                  )}
                  <div className="flex justify-between text-lg font-bold text-moroccan-gold border-t border-moroccan-gold/20 pt-2">
                    <span>Total</span>
                    <span>{total.toFixed(2)}€</span>
                  </div>
                </div>
              </div>

              {/* Shipping Info */}
              <div className="bg-moroccan-gold/10 rounded-xl p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-moroccan-gold">
                  <Shield className="w-4 h-4" />
                  <span className="font-semibold">Livraison Sécurisée</span>
                </div>
                <ul className="text-xs text-moroccan-cream space-y-1">
                  <li className="flex items-center gap-2">
                    <Clock className="w-3 h-3" />
                    Livraison gratuite dès 50€
                  </li>
                  <li className="flex items-center gap-2">
                    <Truck className="w-3 h-3" />
                    Livraison express 24h disponible
                  </li>
                  <li className="flex items-center gap-2">
                    <Gift className="w-3 h-3" />
                    Emballage cadeau gratuit
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={onCheckout}
                  className="w-full bg-moroccan-gradient-primary text-moroccan-charcoal hover:scale-105 transition-all font-bold py-3"
                >
                  <CreditCard className="w-4 h-4 mr-2" />
                  Finaliser la commande
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
                <Button
                  variant="outline"
                  onClick={onClearCart}
                  className="w-full border-moroccan-gold/30 text-moroccan-gold hover:bg-moroccan-gold/10"
                >
                  Vider le panier
                </Button>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

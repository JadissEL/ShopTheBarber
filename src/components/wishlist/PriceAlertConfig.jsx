import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Bell, Check, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

export default function PriceAlertConfig({ product, trigger }) {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [alertType, setAlertType] = useState('any_drop');
  const [targetPrice, setTargetPrice] = useState('');
  const [percentageThreshold, setPercentageThreshold] = useState(10);

  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: () => sovereign.auth.me()
  });

  const { data: existingAlert } = useQuery({
    queryKey: ['price-alert', product.id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const alerts = await sovereign.entities.PriceAlert.filter({
        user_id: user.id,
        product_id: product.id,
        is_active: true
      });
      return alerts[0] || null;
    },
    enabled: !!user && open
  });

  const createAlertMutation = useMutation({
    mutationFn: async (alertData) => {
      if (!user) {
        sovereign.auth.redirectToLogin(window.location.href);
        throw new Error('User not authenticated');
      }

      return await sovereign.entities.PriceAlert.create({
        user_id: user.id,
        product_id: product.id,
        original_price: product.price,
        current_price: product.price,
        ...alertData
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alert'] });
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
      setOpen(false);
    }
  });

  const deleteAlertMutation = useMutation({
    mutationFn: (alertId) => sovereign.entities.PriceAlert.delete(alertId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['price-alert'] });
      queryClient.invalidateQueries({ queryKey: ['price-alerts'] });
    }
  });

  const handleSave = () => {
    const alertData = {
      alert_type: alertType,
      is_active: true
    };

    if (alertType === 'target_price') {
      alertData.target_price = parseFloat(targetPrice);
    } else if (alertType === 'percentage_drop') {
      alertData.percentage_threshold = percentageThreshold;
    }

    createAlertMutation.mutate(alertData);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger}
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <Bell className="w-6 h-6 text-primary" />
            Alerte de Prix
          </DialogTitle>
          <DialogDescription>
            Soyez notifié lorsque le prix baisse
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Product Info */}
          <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-16 h-16 rounded-lg object-cover"
              />
            )}
            <div className="flex-1">
              <p className="font-semibold text-foreground">{product.name}</p>
              <p className="text-2xl font-bold text-primary">{product.price}€</p>
            </div>
          </div>

          {existingAlert ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="p-6 bg-success/10 border-2 border-success rounded-lg"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-success rounded-full flex items-center justify-center">
                    <Check className="w-6 h-6 text-success-foreground" />
                  </div>
                  <div>
                    <p className="font-bold text-success">Alerte Active</p>
                    <p className="text-sm text-success">
                      {existingAlert.alert_type === 'any_drop' && 'Toute baisse de prix'}
                      {existingAlert.alert_type === 'target_price' && `Prix cible: ${existingAlert.target_price}€`}
                      {existingAlert.alert_type === 'percentage_drop' && `Baisse de ${existingAlert.percentage_threshold}%`}
                    </p>
                  </div>
                </div>
                <Button
                  size="icon"
                  variant="ghost"
                  className="text-destructive hover:bg-destructive/10 min-h-[44px] min-w-[44px]"
                  onClick={() => deleteAlertMutation.mutate(existingAlert.id)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
              <p className="text-sm text-success">
                Vous recevrez un email dès que les conditions sont remplies
              </p>
            </motion.div>
          ) : (
            <div className="space-y-6">
              <RadioGroup value={alertType} onValueChange={setAlertType}>
                <div className="space-y-3">
                  <div className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setAlertType('any_drop')}>
                    <RadioGroupItem value="any_drop" id="any_drop" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="any_drop" className="font-semibold cursor-pointer">
                        Toute baisse de prix
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1">
                        Soyez notifié dès que le prix baisse, même d'1 centime
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setAlertType('percentage_drop')}>
                    <RadioGroupItem value="percentage_drop" id="percentage_drop" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="percentage_drop" className="font-semibold cursor-pointer">
                        Baisse de pourcentage
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Notification si le prix baisse d'un certain pourcentage
                      </p>
                      {alertType === 'percentage_drop' && (
                        <div className="space-y-2">
                          <Label>Pourcentage minimum: {percentageThreshold}%</Label>
                          <input
                            type="range"
                            min="5"
                            max="50"
                            step="5"
                            value={percentageThreshold}
                            onChange={(e) => setPercentageThreshold(parseInt(e.target.value))}
                            className="w-full"
                          />
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:border-primary transition-colors"
                    onClick={() => setAlertType('target_price')}>
                    <RadioGroupItem value="target_price" id="target_price" className="mt-1" />
                    <div className="flex-1">
                      <Label htmlFor="target_price" className="font-semibold cursor-pointer">
                        Prix cible
                      </Label>
                      <p className="text-sm text-muted-foreground mt-1 mb-3">
                        Notification quand le prix atteint ou passe sous votre prix cible
                      </p>
                      {alertType === 'target_price' && (
                        <div className="space-y-2">
                          <Label>Prix cible (€)</Label>
                          <Input
                            type="number"
                            step="0.01"
                            placeholder="Ex: 29.99"
                            value={targetPrice}
                            onChange={(e) => setTargetPrice(e.target.value)}
                          />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </RadioGroup>

              <Button
                onClick={handleSave}
                disabled={
                  createAlertMutation.isPending ||
                  (alertType === 'target_price' && !targetPrice)
                }
                className="w-full h-12 rounded-lg"
              >
                <Bell className="w-4 h-4 mr-2" />
                Activer l'Alerte
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
import { useState } from 'react';
import { sovereign } from '@/api/apiClient';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Share2,
  Copy,
  Check,
  Mail,
  MessageSquare,
  Facebook,
  Twitter
} from 'lucide-react';

export default function ShareWishlistDialog({ open, onOpenChange, products }) {
  const [copied, setCopied] = useState(false);
  const [email, setEmail] = useState('');
  const [sending, setSending] = useState(false);

  // Generate share link (in a real app, this would be a proper shareable link)
  const shareUrl = `${window.location.origin}${window.location.pathname}?shared=true`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const sendByEmail = async () => {
    if (!email) return;

    setSending(true);
    try {
      const productList = products
        .slice(0, 5)
        .map((p, i) => `${i + 1}. ${p.name} - ${p.price}€`)
        .join('\n');

      await sovereign.integrations.Core.SendEmail({
        to: email,
        subject: 'Ma liste de souhaits ShopTheBarber',
        body: `
          Bonjour,
          
          Je partage avec vous ma liste de souhaits sur ShopTheBarber !
          
          Mes produits favoris :
          ${productList}
          ${products.length > 5 ? `\n... et ${products.length - 5} autres produits` : ''}
          
          Voir la liste complète : ${shareUrl}
          
          Cordialement
        `
      });

      alert('Email envoyé avec succès !');
      setEmail('');
    } catch (error) {
      alert('Erreur lors de l\'envoi de l\'email');
    } finally {
      setSending(false);
    }
  };

  const shareOnSocial = (platform) => {
    const text = `Découvrez ma wishlist sur ShopTheBarber - ${products.length} produits sélectionnés !`;
    const encodedUrl = encodeURIComponent(shareUrl);
    const encodedText = encodeURIComponent(text);

    const urls = {
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      twitter: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedText}`,
      whatsapp: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
    };

    if (urls[platform]) {
      window.open(urls[platform], '_blank', 'width=600,height=400');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <Share2 className="w-6 h-6 text-[#D08B3D]" />
            Partager ma Wishlist
          </DialogTitle>
          <DialogDescription>
            Partagez votre sélection de {products.length} produit(s) avec vos proches
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-6">
          {/* Quick Share Buttons */}
          <div>
            <h4 className="font-semibold mb-4">Partager sur les réseaux sociaux</h4>
            <div className="grid grid-cols-3 gap-3">
              <Button
                variant="outline"
                className="border-2 border-blue-600 text-blue-600 hover:bg-blue-50"
                onClick={() => shareOnSocial('facebook')}
              >
                <Facebook className="w-5 h-5 mr-2" />
                Facebook
              </Button>

              <Button
                variant="outline"
                className="border-2 border-sky-500 text-sky-500 hover:bg-sky-50"
                onClick={() => shareOnSocial('twitter')}
              >
                <Twitter className="w-5 h-5 mr-2" />
                Twitter
              </Button>

              <Button
                variant="outline"
                className="border-2 border-green-600 text-green-600 hover:bg-green-50"
                onClick={() => shareOnSocial('whatsapp')}
              >
                <MessageSquare className="w-5 h-5 mr-2" />
                WhatsApp
              </Button>
            </div>
          </div>

          {/* Copy Link */}
          <div>
            <h4 className="font-semibold mb-4">Copier le lien</h4>
            <div className="flex gap-3">
              <Input
                value={shareUrl}
                readOnly
                className="flex-1 font-mono text-sm"
              />
              <Button
                onClick={copyToClipboard}
                className="bg-[#D08B3D] hover:bg-[#D08B3D]/90 text-white rounded-[10px] min-h-[44px]"
              >
                {copied ? (
                  <>
                    <Check className="w-4 h-4 mr-2" />
                    Copié !
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 mr-2" />
                    Copier
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Send by Email */}
          <div>
            <h4 className="font-semibold mb-4">Envoyer par email</h4>
            <div className="flex gap-3">
              <Input
                type="email"
                placeholder="email@exemple.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="flex-1"
              />
              <Button
                onClick={sendByEmail}
                disabled={!email || sending}
                variant="outline"
                className="border-slate-300"
              >
                <Mail className="w-4 h-4 mr-2" />
                {sending ? 'Envoi...' : 'Envoyer'}
              </Button>
            </div>
          </div>

          {/* Preview */}
          <div>
            <h4 className="font-semibold mb-4">Aperçu du partage</h4>
            <Card className="rounded-[12px] border-2 border-slate-200 p-6">
              <div className="flex items-start gap-4">
                <div className="w-20 h-20 bg-[#0B2545] rounded-[10px] flex items-center justify-center flex-shrink-0">
                  <Share2 className="w-10 h-10 text-[#D08B3D]" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-lg mb-2">Ma Wishlist ShopTheBarber</h3>
                  <p className="text-muted-foreground mb-3">
                    {products.length} produit(s) sélectionnés avec soin
                  </p>
                  <div className="flex gap-2 flex-wrap">
                    {products.slice(0, 3).map((product, idx) => (
                      <Badge key={idx} variant="outline">
                        {product.name}
                      </Badge>
                    ))}
                    {products.length > 3 && (
                      <Badge variant="outline">+{products.length - 3} autres</Badge>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
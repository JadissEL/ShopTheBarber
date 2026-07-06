import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Scissors,
  Store,
  ShoppingBag,
  Building2,
  PenLine,
  User,
  Check,
  Sparkles,
} from 'lucide-react';
import { MetaTags } from '@/components/seo/MetaTags';
import AuthSplitLayout from '@/components/auth/AuthSplitLayout';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { ACCOUNT_TYPE_CARDS, isAccountType } from '@/lib/accountType';
import { createServerSignupIntent } from '@/lib/signupIntent';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';
import { toast } from 'sonner';

const ICONS = {
  client: User,
  solo_barber: Scissors,
  shop: Store,
  seller: ShoppingBag,
  company: Building2,
  blogger: PenLine,
};

export default function ChooseAccountType() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const preselect = params.get('accountType');
    if (isAccountType(preselect)) setSelected(preselect);
  }, []);

  const handleContinue = async () => {
    if (!selected) return;
    setLoading(true);
    try {
      await createServerSignupIntent(selected);
      const params = new URLSearchParams(window.location.search);
      const redirect = params.get('redirect') || params.get('return');
      const qs = new URLSearchParams({ accountType: selected });
      if (redirect) qs.set('redirect', redirect);
      navigate(`${createPageUrl('SignUp')}?${qs.toString()}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Could not continue');
      setLoading(false);
    }
  };

  return (
    <>
      <MetaTags
        title="Choose your account type"
        description="Select how you want to use ShopTheBarber before creating your account."
      />
      <AuthSplitLayout
        eyebrow="Create account"
        heroTitle={
          <>
            Choose your
            <br />
            workspace.
          </>
        }
        heroDescription="Each account type unlocks a tailored dashboard, permissions, and workflows. This choice is permanent for your email."
      >
        <div className="space-y-6 max-w-3xl mx-auto">
          <div className="space-y-2 text-center lg:text-left">
            <p className={cn(stb.overline, 'text-primary')}>Step 1 of 2</p>
            <h1 className={cn(stb.uiHeading, 'text-2xl md:text-3xl')}>
              What would you like to do on ShopTheBarber?
            </h1>
            <p className={stb.body}>
              Pick the workspace that matches how you&apos;ll use the platform. You&apos;ll create your login next.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            {ACCOUNT_TYPE_CARDS.map((card, index) => {
              const Icon = ICONS[card.id] || Sparkles;
              const active = selected === card.id;
              return (
                <motion.button
                  key={card.id}
                  type="button"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.04 }}
                  onClick={() => setSelected(card.id)}
                  aria-pressed={active}
                  className={cn(
                    stb.surfaceHover,
                    'text-left p-5 relative border-2 transition-all',
                    active ? 'border-primary ring-2 ring-primary/20' : 'border-transparent',
                  )}
                >
                  {active && (
                    <span className="absolute top-3 right-3 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                      <Check className="w-3.5 h-3.5" />
                    </span>
                  )}
                  <div className="flex items-start gap-3">
                    <div className={cn(stb.iconBox, 'w-11 h-11 shrink-0')}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className={cn(stb.overline, 'mb-0.5')}>{card.subtitle}</p>
                      <h2 className={cn(stb.uiHeading, 'text-lg')}>{card.title}</h2>
                      <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{card.description}</p>
                      <ul className="mt-3 flex flex-wrap gap-1.5">
                        {card.features.slice(0, 3).map((f) => (
                          <li
                            key={f}
                            className="text-[10px] uppercase tracking-wide font-semibold px-2 py-0.5 rounded-full bg-muted text-muted-foreground"
                          >
                            {f}
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button
              className="flex-1"
              size="lg"
              disabled={!selected || loading}
              onClick={() => void handleContinue()}
            >
              {loading ? 'Preparing…' : selected ? ACCOUNT_TYPE_CARDS.find((c) => c.id === selected)?.cta : 'Select an account type'}
            </Button>
            <Button variant="outline" size="lg" onClick={() => navigate(createPageUrl('SignIn'))}>
              Sign in instead
            </Button>
          </div>
        </div>
      </AuthSplitLayout>
    </>
  );
}

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { MetaTags } from '@/components/seo/MetaTags';
import AuthSplitLayout from '@/components/auth/AuthSplitLayout';
import { AccountTypeOptionCard } from '@/components/auth/AccountTypeOptionCard';
import { Button } from '@/components/ui/button';
import { createPageUrl } from '@/utils';
import { ACCOUNT_TYPE_CARDS, isAccountType } from '@/lib/accountType';
import { ACCOUNT_TYPE_SECTIONS } from '@/lib/accountTypeVisuals';
import { createServerSignupIntent } from '@/lib/signupIntent';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';
import { toast } from 'sonner';

const CARD_BY_ID = Object.fromEntries(ACCOUNT_TYPE_CARDS.map((c) => [c.id, c]));

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

  let cardIndex = 0;

  return (
    <>
      <MetaTags
        title="Choose your account type"
        description="Select how you want to use ShopTheBarber before creating your account."
      />
      <AuthSplitLayout
        contentClassName="max-w-3xl xl:max-w-4xl"
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
        <div className="space-y-10 sm:space-y-12">
          <header className="space-y-3 text-center lg:text-left">
            <p className={cn(stb.overline, 'text-primary')}>Step 1 of 2</p>
            <h1 className={cn(stb.uiHeading, 'text-2xl sm:text-3xl tracking-tight')}>
              What would you like to do on ShopTheBarber?
            </h1>
            <p className={cn(stb.body, 'max-w-2xl text-muted-foreground')}>
              Pick the workspace that matches how you&apos;ll use the platform. You&apos;ll create your login next.
            </p>
          </header>

          <div className="space-y-10">
            {ACCOUNT_TYPE_SECTIONS.map((section) => (
              <section key={section.id} className="space-y-4">
                <div className="space-y-1 border-b border-border/60 pb-3">
                  <h2 className="text-sm font-semibold tracking-tight text-foreground">
                    {section.label}
                  </h2>
                  <p className="text-xs text-muted-foreground">{section.description}</p>
                </div>

                <div
                  className={cn(
                    'grid gap-4 sm:gap-5',
                    section.types.length === 1
                      ? 'grid-cols-1 sm:max-w-md'
                      : section.types.length === 2
                        ? 'sm:grid-cols-2'
                        : 'sm:grid-cols-2 lg:grid-cols-3',
                  )}
                >
                  {section.types.map((typeId) => {
                    const card = CARD_BY_ID[typeId];
                    if (!card) return null;
                    const idx = cardIndex++;
                    return (
                      <AccountTypeOptionCard
                        key={card.id}
                        card={card}
                        selected={selected === card.id}
                        onSelect={() => setSelected(card.id)}
                        index={idx}
                        className={section.types.length === 1 ? undefined : 'min-h-[17.5rem]'}
                      />
                    );
                  })}
                </div>
              </section>
            ))}
          </div>

          <div
            className={cn(
              'sticky bottom-0 z-10 -mx-1 flex flex-col gap-3 border-t border-border/60 bg-background/95 px-1 py-5 backdrop-blur-sm sm:static sm:border-0 sm:bg-transparent sm:p-0 sm:backdrop-blur-none',
            )}
          >
            {selected && CARD_BY_ID[selected] && (
              <p className="text-center sm:text-left text-sm text-muted-foreground sm:order-first">
                Selected workspace:{' '}
                <span className="font-semibold text-foreground">{CARD_BY_ID[selected].title}</span>
                <span className="hidden sm:inline text-muted-foreground/80">
                  {' '}
                  — {CARD_BY_ID[selected].subtitle}
                </span>
              </p>
            )}
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <Button
              className="flex-1 h-12 text-base"
              size="lg"
              disabled={!selected || loading}
              onClick={() => void handleContinue()}
            >
              {loading
                ? 'Preparing…'
                : selected
                  ? CARD_BY_ID[selected]?.cta
                  : 'Select an account type'}
            </Button>
            <Button
              variant="outline"
              size="lg"
              className="h-12 sm:flex-none sm:min-w-[10rem]"
              onClick={() => navigate(createPageUrl('SignIn'))}
            >
              Sign in instead
            </Button>
            </div>
          </div>
        </div>
      </AuthSplitLayout>
    </>
  );
}

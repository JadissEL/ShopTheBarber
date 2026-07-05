import { MapPin, Store, Scissors, Baby, Globe, Truck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { cn } from '@/lib/utils';
import { stb } from '@/lib/stbUi';
import ProviderShowcasePublic from '@/components/providerShowcase/ProviderShowcasePublic';
import ShowcaseEmptyState from '@/components/providerShowcase/ShowcaseEmptyState';
import SpokenLanguagesBadges from '@/components/languages/SpokenLanguagesBadges';
import ChildrenFriendlyBadge from '@/components/childrenFriendly/ChildrenFriendlyBadge';
import ServiceLocationBadges from '@/components/serviceLocation/ServiceLocationBadges';
import { parseSpokenLanguages } from '@/lib/languages';
import { parseChildrenFriendly } from '@/lib/childrenFriendly';
import { offersMobileService, offersShopService } from '@/lib/serviceLocation';

function parseSkills(raw) {
  if (!raw) return [];
  if (Array.isArray(raw)) return raw.filter(Boolean);
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw);
      if (Array.isArray(parsed)) return parsed.filter(Boolean);
    } catch {
      // comma-separated fallback
    }
    return raw.split(',').map((s) => s.trim()).filter(Boolean);
  }
  return [];
}

function ProfileFact({ icon: Icon, label, value }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-3 p-4 rounded-lg border border-border bg-card">
      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
        <Icon className="w-4 h-4 text-primary" />
      </div>
      <div>
        <p className={cn(stb.caption, 'uppercase tracking-wider mb-0.5')}>{label}</p>
        <p className="text-sm font-medium text-foreground">{value}</p>
      </div>
    </div>
  );
}

export default function BarberProfileAboutPanel({
  barber,
  showcase,
  memberships = [],
  onBook,
}) {
  if (!barber) return null;

  const skills = parseSkills(barber.skills);
  const languages = parseSpokenLanguages(barber.spoken_languages);
  const kidsWelcome = parseChildrenFriendly(barber.children_friendly);
  const hasMobile = offersMobileService(barber);
  const hasShop = offersShopService(barber) || memberships.length > 0;
  const hasShowcaseContent = !!showcase;
  const hasBio = !!(barber.bio?.trim());
  const hasSkills = skills.length > 0;

  const serviceModes = [
    hasShop && 'In-shop appointments',
    hasMobile && 'At-home / mobile visits',
    barber.is_independent && 'Independent booking',
  ].filter(Boolean);

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {(hasShowcaseContent || hasBio || hasSkills) ? (
        <ProviderShowcasePublic
          showcase={showcase}
          bio={barber.bio}
          skills={skills}
          hidePortfolio
        />
      ) : (
        <ShowcaseEmptyState
          variant="about"
          name={barber.name}
          onAction={onBook}
        />
      )}

      <div className="stb-panel p-6 space-y-6">
        <h3 className={cn(stb.uiHeading, 'text-lg text-foreground')}>At a glance</h3>

        <div className="flex flex-wrap gap-2">
          <ServiceLocationBadges barber={barber} />
          {kidsWelcome ? <ChildrenFriendlyBadge /> : null}
          {languages.length > 0 ? (
            <SpokenLanguagesBadges codes={languages} />
          ) : null}
        </div>

        {serviceModes.length > 0 && (
          <div className="grid sm:grid-cols-2 gap-3">
            {hasShop && (
              <ProfileFact icon={Store} label="Shop service" value="Available at partner locations" />
            )}
            {hasMobile && (
              <ProfileFact
                icon={Truck}
                label="Mobile service"
                value={barber.independent_location || barber.location || 'Travels to your address'}
              />
            )}
            {barber.is_independent && (
              <ProfileFact icon={Scissors} label="Independent" value="Book directly with this barber" />
            )}
            {kidsWelcome && (
              <ProfileFact icon={Baby} label="Family friendly" value="Kids welcome" />
            )}
          </div>
        )}

        {memberships.length > 0 && (
          <div>
            <p className={cn(stb.caption, 'uppercase tracking-wider mb-3')}>Works at</p>
            <div className="space-y-2">
              {memberships.map((m) => (
                <Link
                  key={m.id}
                  to={createPageUrl(`ShopProfile?id=${m.shop.id}`)}
                  className="flex items-center gap-3 p-3 rounded-lg border border-border hover:border-primary/40 hover:bg-primary/5 transition-colors"
                >
                  <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                    <Store className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-sm truncate">{m.shop.name}</p>
                    <p className="text-xs text-muted-foreground flex items-center gap-1 truncate">
                      <MapPin className="w-3 h-3 shrink-0" />
                      {m.shop.location || m.shop.address || 'View shop profile'}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}

        {(barber.location || barber.independent_location) && (
          <ProfileFact
            icon={Globe}
            label="Base location"
            value={barber.independent_location || barber.location}
          />
        )}

        {barber.title && (
          <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-4">
            <span className="font-semibold text-foreground">{barber.name}</span>
            {' '}
            specializes in {barber.title.toLowerCase()}.
            {barber.review_count > 0
              ? ` Rated ${barber.rating} stars from ${barber.review_count} client reviews on ShopTheBarber.`
              : ' Book now and be the first to leave a review after your visit.'}
          </p>
        )}
      </div>
    </div>
  );
}

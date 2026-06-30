import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  User,
  Store,
  Languages,
  Baby,
  Home,
  Users,
  Scissors,
  Tag,
  Sparkles,
  Droplets,
  Palette,
  Smile,
  Smartphone,
  Star,
  TrendingUp,
  SlidersHorizontal,
  ChevronDown,
} from 'lucide-react';
import { createPageUrl } from '@/utils';
import { DISCOVERY_ROUTES } from '@/lib/discoveryRoutes';
import { CHILDREN_FRIENDLY_LABEL } from '@/lib/childrenFriendly';
import { MOBILE_SERVICE_LABEL, SHOP_SERVICE_LABEL } from '@/lib/mobileService';
import { cn } from '@/lib/utils';
import FilterChip from '@/components/explore/FilterChip';
import FilterGroup from '@/components/explore/FilterGroup';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Button } from '@/components/ui/button';

export const SERVICE_FILTERS = [
  { id: 'All', label: 'All', icon: Sparkles },
  { id: 'Deals', label: 'Deals', icon: Tag },
  { id: 'Haircut', label: 'Haircut', icon: Scissors },
  { id: 'Beard Trim', label: 'Beard', icon: Smile },
  { id: 'Shave', label: 'Shave', icon: Droplets },
  { id: 'Styling', label: 'Styling', icon: Palette },
  { id: 'Facial', label: 'Facial', icon: Sparkles },
];

const HIGHLIGHT_FILTERS = [
  { id: 'topRated', label: 'Top rated', icon: Star },
  { id: 'new', label: 'New', icon: Sparkles },
  { id: 'trending', label: 'Trending', icon: TrendingUp },
];

const MODE_BANNERS = {
  mobile: {
    icon: Smartphone,
    message: 'At-home barbers only — they come to you',
  },
  mobileGroup: {
    icon: Users,
    message: 'Mobile barbers for groups & events',
  },
  shop: {
    icon: Store,
    message: 'In-shop barbers and studio professionals',
  },
  group: {
    icon: Users,
    message: 'Group & event booking specialists',
  },
  deals: {
    icon: Tag,
    message: 'Live deals and limited-time offers',
  },
};

export default function StickyFilterBar({
  exploreMode,
  pageConfig,
  viewType,
  onViewTypeChange,
  activeFilter,
  onActiveFilterChange,
  highlightFilter,
  onHighlightFilterChange,
  languageFilter,
  onLanguageFilterChange,
  languageOptions,
  kidsWelcomeOnly,
  onKidsWelcomeToggle,
  mobileOnly,
  shopOnly,
  groupOnly,
  onDiscoveryFlag,
}) {
  const [moreOpen, setMoreOpen] = useState(false);
  const banner = MODE_BANNERS[exploreMode];
  const lockProfessionals = pageConfig?.lockProfessionals;
  const showLocationChips = !lockProfessionals && !mobileOnly && !shopOnly;

  const handleHighlightClick = (id) => {
    if (activeFilter === 'Deals') onActiveFilterChange('All');
    onHighlightFilterChange(highlightFilter === id ? null : id);
  };

  const languageOnlyCount = languageFilter ? 1 : 0;

  return (
    <div
      className="sticky top-[var(--navbar-height)] lg:top-[var(--navbar-height-lg)] z-30 bg-card/95 backdrop-blur-md border-b border-border shadow-[0_1px_0_0_hsl(var(--border)/0.5)]"
      aria-label="Explore filters"
    >
      <div className="max-w-6xl lg:max-w-7xl mx-auto px-4 md:px-8 py-3 md:py-4 space-y-3 md:space-y-4">
        {banner ? (
          <div
            className="flex items-center gap-2.5 px-4 py-2 rounded-lg border border-primary/15 bg-primary/5 text-sm font-medium text-foreground"
            role="status"
          >
            <banner.icon className="w-4 h-4 shrink-0 text-primary" aria-hidden />
            {banner.message}
          </div>
        ) : null}

        <div className="flex flex-col gap-3 md:gap-4">
          {!lockProfessionals ? (
            <div className="flex gap-2 p-1 rounded-lg bg-muted/50 border border-border/60 w-fit">
              <FilterChip
                label="Barbers"
                icon={User}
                active={viewType === 'professionals'}
                onClick={() => onViewTypeChange('professionals')}
                className="rounded-lg min-h-[36px] px-4"
                activeClassName="bg-foreground text-background border-foreground shadow-sm"
              />
              <FilterChip
                label="Barbershops"
                icon={Store}
                active={viewType === 'shops'}
                onClick={() => onViewTypeChange('shops')}
                className="rounded-lg min-h-[36px] px-4 border-0 bg-transparent"
                activeClassName="bg-foreground text-background border-foreground shadow-sm"
              />
            </div>
          ) : null}

          {viewType === 'professionals' ? (
            <div className="space-y-3">
              <FilterGroup title="Services" icon={Scissors} scrollable>
                {SERVICE_FILTERS.map(({ id, label, icon }) => (
                  <FilterChip
                    key={id}
                    label={label}
                    icon={icon}
                    size="md"
                    active={activeFilter === id}
                    onClick={() => {
                      onHighlightFilterChange(null);
                      onActiveFilterChange(id);
                    }}
                    className="rounded-full px-4"
                    activeClassName="bg-foreground text-background border-foreground shadow-sm ring-0"
                  />
                ))}
              </FilterGroup>

              <div className="flex flex-col sm:flex-row sm:items-start gap-3">
                <FilterGroup title="Highlights" icon={Star} scrollable className="flex-1 min-w-0">
                  {HIGHLIGHT_FILTERS.map(({ id, label, icon }) => (
                    <FilterChip
                      key={id}
                      label={label}
                      icon={icon}
                      size="sm"
                      active={highlightFilter === id}
                      onClick={() => handleHighlightClick(id)}
                      className="rounded-full"
                      activeClassName="bg-primary text-primary-foreground border-primary shadow-sm ring-0"
                    />
                  ))}

                  {showLocationChips ? (
                    <>
                      <FilterChip
                        label={MOBILE_SERVICE_LABEL}
                        icon={Home}
                        size="sm"
                        active={mobileOnly}
                        onClick={() => {
                          const next = !mobileOnly;
                          onDiscoveryFlag('mobile', next, { clear: next ? ['shop'] : [] });
                        }}
                        className="rounded-full"
                        activeClassName="bg-primary text-primary-foreground border-primary shadow-sm ring-0"
                      />
                      <FilterChip
                        label={SHOP_SERVICE_LABEL}
                        icon={Store}
                        size="sm"
                        active={shopOnly}
                        onClick={() => {
                          const next = !shopOnly;
                          onDiscoveryFlag('shop', next, { clear: next ? ['mobile'] : [] });
                        }}
                        className="rounded-full"
                        activeClassName="bg-primary text-primary-foreground border-primary shadow-sm ring-0"
                      />
                    </>
                  ) : null}
                </FilterGroup>

                <Popover open={moreOpen} onOpenChange={setMoreOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className={cn(
                        'rounded-full h-[34px] gap-1.5 shrink-0 border-border font-medium self-start',
                        languageOnlyCount > 0 && 'border-primary/40 bg-primary/5 text-primary'
                      )}
                    >
                      <SlidersHorizontal className="w-3.5 h-3.5" />
                      More
                      {languageOnlyCount > 0 ? (
                        <span className="ml-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground px-1">
                          {languageOnlyCount}
                        </span>
                      ) : null}
                      <ChevronDown className="w-3.5 h-3.5 opacity-60" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent align="start" className="w-[min(100vw-2rem,360px)] p-4 space-y-4">
                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                        Preferences
                      </p>
                      <div className="flex flex-wrap gap-2">
                        <FilterChip
                          label={CHILDREN_FRIENDLY_LABEL}
                          icon={Baby}
                          active={kidsWelcomeOnly}
                          onClick={onKidsWelcomeToggle}
                          activeClassName="bg-primary text-primary-foreground border-primary"
                        />
                        {!showLocationChips ? (
                          <>
                            <FilterChip
                              label={MOBILE_SERVICE_LABEL}
                              icon={Home}
                              active={mobileOnly}
                              onClick={() => {
                                const next = !mobileOnly;
                                onDiscoveryFlag('mobile', next, { clear: next ? ['shop'] : [] });
                              }}
                              activeClassName="bg-primary text-primary-foreground border-primary"
                            />
                            <FilterChip
                              label={SHOP_SERVICE_LABEL}
                              icon={Store}
                              active={shopOnly}
                              onClick={() => {
                                const next = !shopOnly;
                                onDiscoveryFlag('shop', next, { clear: next ? ['mobile'] : [] });
                              }}
                              activeClassName="bg-primary text-primary-foreground border-primary"
                            />
                          </>
                        ) : null}
                        <FilterChip
                          label="Groups"
                          icon={Users}
                          active={groupOnly}
                          onClick={() => onDiscoveryFlag('group', !groupOnly)}
                          activeClassName="bg-primary text-primary-foreground border-primary"
                        />
                      </div>
                      {groupOnly ? (
                        <Link
                          to={createPageUrl(DISCOVERY_ROUTES.group)}
                          className="inline-flex text-xs font-semibold text-primary hover:underline"
                        >
                          Book for friends &amp; family
                        </Link>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                        <Languages className="w-3.5 h-3.5" />
                        Language
                      </p>
                      <div className="flex flex-wrap gap-2 max-h-40 overflow-y-auto">
                        <FilterChip
                          label="Any"
                          active={!languageFilter}
                          onClick={() => onLanguageFilterChange('')}
                          activeClassName="bg-primary text-primary-foreground border-primary"
                        />
                        {languageOptions.slice(0, 16).map((lang) => (
                          <FilterChip
                            key={lang.code}
                            label={lang.label}
                            active={languageFilter === lang.code}
                            onClick={() =>
                              onLanguageFilterChange(lang.code === languageFilter ? '' : lang.code)
                            }
                            activeClassName="bg-primary text-primary-foreground border-primary"
                          />
                        ))}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              </div>
            </div>
          ) : (
            <FilterGroup title="Shop filters" icon={Store} scrollable>
              <FilterChip
                label={CHILDREN_FRIENDLY_LABEL}
                icon={Baby}
                size="md"
                active={kidsWelcomeOnly}
                onClick={onKidsWelcomeToggle}
                className="rounded-full"
                activeClassName="bg-primary text-primary-foreground border-primary shadow-sm ring-0"
              />
              {languageOptions.slice(0, 8).map((lang) => (
                <FilterChip
                  key={lang.code}
                  label={lang.label}
                  size="md"
                  active={languageFilter === lang.code}
                  onClick={() =>
                    onLanguageFilterChange(lang.code === languageFilter ? '' : lang.code)
                  }
                  className="rounded-full"
                  activeClassName="bg-primary text-primary-foreground border-primary shadow-sm ring-0"
                />
              ))}
            </FilterGroup>
          )}
        </div>
      </div>
    </div>
  );
}

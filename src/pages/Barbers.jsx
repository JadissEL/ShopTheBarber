import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { sovereign } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { MapPin, Star, SlidersHorizontal, Scissors, Baby, Home as HomeIcon, Car, Map, LayoutGrid, List as ListIcon } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import SearchField from '@/components/ui/search-field';
import PageHeader from "@/components/layout/PageHeader";
import PageContent from "@/components/layout/PageContent";
import BarberMap from "@/components/barbers/BarberMap";
import AddressAutocomplete from "@/components/maps/AddressAutocomplete";
import { toast } from "sonner";
import { barberDistanceKm, formatDistanceKm } from "@/lib/geo";
import { usePreferredLocation } from "@/hooks/usePreferredLocation";
import { cn } from "@/lib/utils";
import { stb } from "@/lib/stbUi";

export default function Barbers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [viewMode, setViewMode] = useState("list");
  const { preferredLocation, setPreferredLocation, clearPreferredLocation } = usePreferredLocation();
  const [addressInput, setAddressInput] = useState(() => preferredLocation?.address ?? "");
  const userCoords = preferredLocation
    ? { latitude: preferredLocation.latitude, longitude: preferredLocation.longitude }
    : null;
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [filters, setFilters] = useState({
    providerType: 'all',
    mode: 'all',
    minRating: 0,
    maxDistance: 50,
    kidFriendly: false
  });

  const { data: barbers = [], isLoading } = useQuery({
    queryKey: ['barbers'],
    queryFn: async () => sovereign.entities.Barber.list('-rating'),
  });

  const handleUseMyLocation = useCallback(async () => {
    setIsLoadingLocation(true);
    try {
      if (!navigator.geolocation) {
        toast.error('Geolocation is not supported by your browser');
        return;
      }
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          let label = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          try {
            const data = await sovereign.atHomeService.reverseGeocode(latitude, longitude);
            label = data.formatted_address || label;
          } catch {
            // keep coordinate label
          }
          setPreferredLocation({ address: label, latitude, longitude });
          setAddressInput(label);
          setIsLoadingLocation(false);
        },
        () => {
          toast.error('Unable to retrieve your location');
          setIsLoadingLocation(false);
        }
      );
    } catch {
      toast.error('Error accessing location');
      setIsLoadingLocation(false);
    }
  }, [setPreferredLocation]);

  const enrichedBarbers = useMemo(() => {
    return barbers.map((barber) => ({
      ...barber,
      distance_km: barberDistanceKm(userCoords, barber),
    }));
  }, [barbers, userCoords]);

  const filteredBarbers = useMemo(() => {
    let list = enrichedBarbers.filter((barber) => {
      const displayName = (barber.name || barber.shop_name || '').toLowerCase();
      const matchesSearch = displayName.includes(searchQuery.toLowerCase()) ||
        (barber.location || '').toLowerCase().includes(searchQuery.toLowerCase());
      const matchesRating = (barber.rating || 5) >= filters.minRating;
      const matchesKidFriendly = !filters.kidFriendly || barber.children_friendly || barber.kid_friendly;
      const matchesDistance =
        !userCoords ||
        barber.distance_km == null ||
        barber.distance_km <= filters.maxDistance;
      return matchesSearch && matchesRating && matchesKidFriendly && matchesDistance;
    });

    if (sortBy === 'distance' && userCoords) {
      list = [...list].sort((a, b) => (a.distance_km ?? 999) - (b.distance_km ?? 999));
    } else if (sortBy === 'rating') {
      list = [...list].sort((a, b) => (b.rating || 0) - (a.rating || 0));
    } else if (sortBy === 'newest') {
      list = [...list].sort((a, b) => String(b.created_at || '').localeCompare(String(a.created_at || '')));
    }

    return list;
  }, [enrichedBarbers, searchQuery, filters, sortBy, userCoords]);

  const FilterContent = () => (
    <div className="space-y-8">
      <div>
        <h3 className={cn(stb.uiHeading, 'text-lg mb-4')}>Provider Type</h3>
        <div className="space-y-3">
          {[
            { id: 'all', label: 'All' },
            { id: 'freelance', label: 'Freelance' },
            { id: 'salon', label: 'Salon' }
          ].map((type) => (
            <label key={type.id} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox
                checked={filters.providerType === type.id}
                onCheckedChange={() => setFilters({ ...filters, providerType: type.id })}
                className="border-foreground/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-muted-foreground group-hover:text-primary transition-colors">
                {type.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className={cn(stb.uiHeading, 'text-lg mb-4')}>Mode</h3>
        <div className="space-y-3">
          {[
            { id: 'all', label: 'All', icon: null },
            { id: 'on_site', label: 'In-shop', icon: HomeIcon },
            { id: 'mobile', label: 'Mobile', icon: Car }
          ].map((mode) => (
            <label key={mode.id} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox
                checked={filters.mode === mode.id}
                onCheckedChange={() => setFilters({ ...filters, mode: mode.id })}
                className="border-foreground/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              {mode.icon && <mode.icon className="w-4 h-4 text-muted-foreground" />}
              <span className="text-muted-foreground group-hover:text-primary transition-colors">
                {mode.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className={cn(stb.uiHeading, 'text-lg mb-4')}>Minimum Rating</h3>
        <div className="space-y-4">
          <Input
            type="range"
            min={0}
            max={5}
            step={0.5}
            value={filters.minRating}
            onChange={(e) => setFilters({ ...filters, minRating: Number(e.target.value) })}
            className="w-full accent-primary"
            aria-label="Minimum rating"
          />
          <div className="flex items-center gap-2 text-muted-foreground">
            <Star className="w-4 h-4 text-primary fill-current" />
            <span>{filters.minRating}+ stars</span>
          </div>
        </div>
      </div>

      {userCoords && (
        <div>
          <h3 className={cn(stb.uiHeading, 'text-lg mb-4')}>Maximum Distance</h3>
          <div className="space-y-4">
            <Input
              type="range"
              min={1}
              max={100}
              step={1}
              value={filters.maxDistance}
              onChange={(e) => setFilters({ ...filters, maxDistance: Number(e.target.value) })}
              className="w-full accent-primary"
              aria-label="Maximum distance in km"
            />
            <p className="text-sm text-muted-foreground">
              Within <span className="font-bold text-foreground">{filters.maxDistance} km</span>
            </p>
          </div>
        </div>
      )}

      <div>
        <label className="flex items-center gap-3 cursor-pointer group">
          <Checkbox
            checked={filters.kidFriendly}
            onCheckedChange={(checked) => setFilters({ ...filters, kidFriendly: checked })}
            className="border-foreground/20 data-[state=checked]:bg-primary data-[state=checked]:border-primary"
          />
          <Baby className="w-5 h-5 text-primary" />
          <span className="text-muted-foreground group-hover:text-primary transition-colors font-medium">
            Kid-friendly
          </span>
        </label>
      </div>

      <Button
        variant="outline"
        className="w-full border-foreground/15 text-muted-foreground hover:bg-muted hover:text-foreground rounded-button"
        onClick={() => {
          setSearchQuery("");
          clearPreferredLocation();
          setAddressInput("");
          setFilters({
          providerType: 'all',
          mode: 'all',
          minRating: 0,
          maxDistance: 50,
          kidFriendly: false
        });
        }}
      >
        Reset Filters
      </Button>
    </div>
  );

  return (
    <div className="stb-page pb-16 font-sans">
      <PageHeader
        label="Discover"
        title="Find your ideal barber"
        subtitle="Qualified professionals near you"
      />

      <PageContent>
        <div className={cn(stb.surface, 'rounded-lg p-6 mb-8')}>
          <div className="flex flex-col md:flex-row gap-4">
            <SearchField
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onClear={() => setSearchQuery('')}
              placeholder="Search by shop name..."
              size="lg"
              className="flex-1"
              inputClassName="text-lg"
              aria-label="Search barbers"
            />

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-64 h-12 rounded-lg border-none bg-muted">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Highest Rated</SelectItem>
                <SelectItem value="distance">Nearest</SelectItem>
                <SelectItem value="price_low">Price: Low to High</SelectItem>
                <SelectItem value="newest">Newest</SelectItem>
              </SelectContent>
            </Select>

            <div className="flex gap-2 bg-muted p-1 rounded-lg">
              <Button
                variant="ghost"
                className={cn('h-10 w-10 p-0 rounded-lg', viewMode === 'list' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground')}
                onClick={() => setViewMode('list')}
              >
                <ListIcon className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                className={cn('h-10 w-10 p-0 rounded-lg', viewMode === 'grid' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground')}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                className={cn('h-10 w-10 p-0 rounded-lg', viewMode === 'map' ? 'bg-card shadow-sm text-primary' : 'text-muted-foreground')}
                onClick={() => setViewMode('map')}
              >
                <Map className="w-5 h-5" />
              </Button>
            </div>

            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden h-12 rounded-lg border-none bg-muted">
                  <SlidersHorizontal className="w-5 h-5 mr-2" />
                  Filters
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="filter-sheet h-[80vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className={stb.uiHeading}>Filters</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          <div className="flex flex-col md:flex-row gap-3 mt-4">
            <AddressAutocomplete
              placeholder="Votre adresse pour trouver les barbiers proches…"
              value={addressInput}
              onChange={(value) => {
                setAddressInput(value);
                if (!value.trim()) clearPreferredLocation();
              }}
              onSelect={(item) => {
                setAddressInput(item.formatted_address);
                setPreferredLocation({
                  address: item.formatted_address,
                  latitude: item.latitude,
                  longitude: item.longitude,
                });
              }}
              inputClassName="h-12 border-none bg-muted"
            />
            <Button
              type="button"
              variant="outline"
              onClick={handleUseMyLocation}
              disabled={isLoadingLocation}
              className="h-12 shrink-0 rounded-lg border-none bg-muted"
            >
              {isLoadingLocation ? '…' : (
                <>
                  <MapPin className="w-4 h-4 mr-2" />
                  Ma position
                </>
              )}
            </Button>
          </div>

          <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {['Coupe Homme', 'Taille de Barbe', 'Rasage à l\'ancienne', 'Coloration'].map((service) => (
              <Badge
                key={service}
                variant="secondary"
                className="px-4 py-2 rounded-lg bg-muted hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors text-sm font-medium text-foreground whitespace-nowrap"
              >
                {service}
              </Badge>
            ))}
          </div>
        </div>

        {viewMode === 'map' && (
          <div className="mb-8 rounded-lg overflow-hidden border border-foreground/10">
            <BarberMap barbers={filteredBarbers} userPosition={userCoords} />
          </div>
        )}

        <div className="flex gap-8">
          <aside className="hidden lg:block w-80 shrink-0">
            <div className={cn(stb.surface, 'rounded-lg p-6 sticky top-24')}>
              <h2 className={cn(stb.uiHeading, 'text-xl mb-6 flex items-center gap-2')}>
                <SlidersHorizontal className="w-5 h-5" />
                Filters
              </h2>
              <FilterContent />
            </div>
          </aside>

          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-muted-foreground">
                <span className="font-bold text-foreground text-xl">{filteredBarbers.length}</span> barbier(s) trouvé(s)
              </p>
            </div>

            {isLoading ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="border-none">
                    <Skeleton className={`w-full ${viewMode === 'grid' ? 'h-56' : 'h-48'}`} />
                    <CardContent className="p-6 space-y-3">
                      <Skeleton className="h-6 w-3/4" />
                      <Skeleton className="h-4 w-1/2" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredBarbers.length === 0 ? (
              <div className={cn(stb.surface, 'rounded-lg p-16 text-center')}>
                <Scissors className="w-20 h-20 text-muted-foreground/40 mx-auto mb-6" />
                <h3 className={cn(stb.uiHeading, 'text-2xl mb-3')}>
                  Aucun barbier trouvé
                </h3>
                <p className="text-muted-foreground mb-6">
                  Essayez de modifier vos critères de recherche ou d'élargir la zone
                </p>
                <Button
                  className="rounded-button"
                  onClick={() => {
                    setSearchQuery("");
                    setFilters({
                      providerType: 'all',
                      mode: 'all',
                      minRating: 0,
                      maxDistance: 50,
                      kidFriendly: false
                    });
                  }}
                >
                  Reset Filters
                </Button>
              </div>
            ) : (
              <motion.div layout className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                <AnimatePresence>
                  {filteredBarbers.map((barber, index) => (
                    <motion.div
                      key={barber.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.05 }}
                    >
                      {viewMode === 'list' ? (
                        <Card className={cn(stb.surfaceHover, 'border-none overflow-hidden group h-full')}>
                          <div className="flex flex-col md:flex-row h-full">
                            <div className="flex-1 p-6 flex flex-col justify-between order-2 md:order-1">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex items-center gap-1 text-primary font-bold text-sm">
                                    <Star className="w-4 h-4 fill-current" />
                                    {barber.rating?.toFixed(1) || "5.0"}
                                    <span className="text-muted-foreground font-normal text-xs">({barber.total_reviews || 0})</span>
                                  </div>
                                  {barber.kid_friendly && (
                                    <Badge className="bg-primary/10 text-primary hover:bg-primary/15 border-none text-xs">
                                      <Baby className="w-3 h-3 mr-1" />
                                      Kids
                                    </Badge>
                                  )}
                                </div>
                                <h3 className={cn(stb.uiHeading, 'text-2xl mb-2 group-hover:text-primary transition-colors')}>
                                  {barber.name || barber.shop_name}
                                </h3>
                                <div className="flex items-center gap-2 text-muted-foreground mb-4 text-sm">
                                  <MapPin className="w-4 h-4 text-primary" />
                                  <span>{barber.location || barber.city || '-'}</span>
                                  {barber.distance_km != null && (
                                    <>
                                      <span className="w-1 h-1 bg-muted-foreground/40 rounded-full mx-1" />
                                      <span>{formatDistanceKm(barber.distance_km)}</span>
                                    </>
                                  )}
                                </div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {barber.specialties?.slice(0, 3).map((specialty, i) => (
                                    <span key={i} className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-lg">
                                      {specialty}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 mt-auto pt-4 border-t border-foreground/10">
                                <Link to={createPageUrl(`BarberProfile?id=${barber.id}`)} className="w-full">
                                  <Button className="w-full rounded-button">
                                    View availability
                                  </Button>
                                </Link>
                              </div>
                            </div>
                            <div className="w-full md:w-1/3 h-48 md:h-auto relative order-1 md:order-2">
                              {barber.portfolio_images?.[0] ? (
                                <img
                                  src={barber.portfolio_images[0]}
                                  alt={barber.shop_name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center bg-primary">
                                  <Scissors className="w-12 h-12 text-primary-foreground/50" />
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ) : (
                        <Card className={cn(stb.surfaceHover, 'border-none overflow-hidden group h-full')}>
                          <div className="h-56 relative overflow-hidden">
                            {barber.portfolio_images?.[0] ? (
                              <img
                                src={barber.portfolio_images[0]}
                                alt={barber.shop_name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-primary">
                                <Scissors className="w-20 h-20 text-primary-foreground/50" />
                              </div>
                            )}
                            <div className="absolute top-4 right-4">
                              <div className="bg-card/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-sm font-bold text-foreground shadow-sm">
                                <Star className="w-3.5 h-3.5 fill-primary text-primary" />
                                {barber.rating?.toFixed(1) || "5.0"}
                              </div>
                            </div>
                            {barber.kid_friendly && (
                              <Badge className="absolute top-4 left-4 bg-primary text-primary-foreground border-none shadow-sm">
                                <Baby className="w-3 h-3 mr-1" />
                                Kids
                              </Badge>
                            )}
                          </div>

                          <CardContent className="p-6">
                            <h3 className={cn(stb.uiHeading, 'text-xl mb-2 group-hover:text-primary transition-colors')}>
                              {barber.name || barber.shop_name}
                            </h3>

                            <div className="flex items-center gap-2 text-muted-foreground mb-4 text-sm">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span>{barber.location || barber.city || '-'}</span>
                              {barber.distance_km != null && (
                                <>
                                  <span className="w-1 h-1 bg-muted-foreground/40 rounded-full mx-1" />
                                  <span>{formatDistanceKm(barber.distance_km)}</span>
                                </>
                              )}
                            </div>

                            <div className="mb-6">
                              {barber.specialties && (
                                <div className="flex flex-wrap gap-2">
                                  {barber.specialties.slice(0, 3).map((specialty, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs bg-muted text-muted-foreground hover:bg-primary/10 hover:text-primary transition-colors">
                                      {specialty}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            <Link to={createPageUrl(`BarberProfile?id=${barber.id}`)}>
                              <Button className="w-full rounded-button">
                                View Profile
                              </Button>
                            </Link>
                          </CardContent>
                        </Card>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
              </motion.div>
            )}
          </div>
        </div>
      </PageContent>
    </div>
  );
}

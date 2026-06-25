import { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { useQuery } from "@tanstack/react-query";
import { sovereign } from "@/api/apiClient";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
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
import { Search, MapPin, Star, SlidersHorizontal, Scissors, Baby, Home as HomeIcon, Car, Map, LayoutGrid, List as ListIcon, X } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";

import BarberMap from "@/components/barbers/BarberMap";

export default function Barbers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortBy, setSortBy] = useState("rating");
  const [viewMode, setViewMode] = useState("list"); // 'list', 'grid', 'map'
  const [filters, setFilters] = useState({
    providerType: 'all',
    mode: 'all',
    minRating: 0,
    maxDistance: 50,
    kidFriendly: false
  });

  const { data: barbers = [], isLoading } = useQuery({
    queryKey: ['barbers', sortBy],
    queryFn: async () => {
      const sortField = sortBy === 'rating' ? '-rating' :
        sortBy === 'distance' ? 'distance' :
          sortBy === 'price_low' ? 'min_price' : '-created_date';
      return await sovereign.entities.Barber.list(sortField === '-created_date' ? '-created_at' : sortField);
    }
  });

  const filteredBarbers = barbers.filter(barber => {
    const matchesSearch = (barber.name || barber.shop_name || '').toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRating = (barber.rating || 5) >= filters.minRating;
    const matchesKidFriendly = !filters.kidFriendly || barber.kid_friendly;
    return matchesSearch && matchesRating && matchesKidFriendly;
  });

  const FilterContent = () => (
    <div className="space-y-8">
      {/* Provider Type */}
      <div>
        <h3 className="text-lg font-bold text-charcoal dark:text-white mb-4">Type de Prestataire</h3>
        <div className="space-y-3">
          {[
            { id: 'all', label: 'Tous' },
            { id: 'freelance', label: 'Freelance' },
            { id: 'salon', label: 'Salon' }
          ].map((type) => (
            <label key={type.id} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox
                checked={filters.providerType === type.id}
                onCheckedChange={() => setFilters({ ...filters, providerType: type.id })}
                className="border-slate data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              <span className="text-slate dark:text-matte-silver group-hover:text-primary transition-colors">
                {type.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Mode */}
      <div>
        <h3 className="text-lg font-bold text-charcoal dark:text-white mb-4">Mode</h3>
        <div className="space-y-3">
          {[
            { id: 'all', label: 'Tous', icon: null },
            { id: 'on_site', label: 'Sur place', icon: HomeIcon },
            { id: 'mobile', label: 'À domicile', icon: Car }
          ].map((mode) => (
            <label key={mode.id} className="flex items-center gap-3 cursor-pointer group">
              <Checkbox
                checked={filters.mode === mode.id}
                onCheckedChange={() => setFilters({ ...filters, mode: mode.id })}
                className="border-slate data-[state=checked]:bg-primary data-[state=checked]:border-primary"
              />
              {mode.icon && <mode.icon className="w-4 h-4 text-slate" />}
              <span className="text-slate dark:text-matte-silver group-hover:text-primary transition-colors">
                {mode.label}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Min Rating */}
      <div>
        <h3 className="text-lg font-bold text-charcoal dark:text-white mb-4">Évaluation Minimale</h3>
        <div className="space-y-4">
          <Slider
            value={[filters.minRating]}
            onValueChange={([val]) => setFilters({ ...filters, minRating: val })}
            max={5}
            step={0.5}
            className="w-full"
          />
          <div className="flex items-center gap-2 text-slate dark:text-matte-silver">
            <Star className="w-4 h-4 text-amber-500 fill-current" />
            <span>{filters.minRating}+ étoiles</span>
          </div>
        </div>
      </div>

      {/* Kid Friendly */}
      <div>
        <label className="flex items-center gap-3 cursor-pointer group">
          <Checkbox
            checked={filters.kidFriendly}
            onCheckedChange={(checked) => setFilters({ ...filters, kidFriendly: checked })}
            className="border-slate data-[state=checked]:bg-emerald-600 data-[state=checked]:border-emerald-600"
          />
          <Baby className="w-5 h-5 text-emerald-600" />
          <span className="text-slate dark:text-matte-silver group-hover:text-primary transition-colors font-medium">
            Amical avec les enfants
          </span>
        </label>
      </div>

      {/* Reset */}
      <Button
        variant="outline"
        className="w-full border-slate text-slate hover:bg-background-light rounded-button"
        onClick={() => setFilters({
          providerType: 'all',
          mode: 'all',
          minRating: 0,
          maxDistance: 50,
          kidFriendly: false
        })}
      >
        Réinitialiser les Filtres
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen py-12 bg-background-light dark:bg-background-dark font-sans">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-bold text-charcoal dark:text-white mb-4">
            Trouvez Votre Barbier Idéal
          </h1>
          <p className="text-xl text-slate dark:text-matte-silver">
            Des professionnels qualifiés près de chez vous
          </p>
        </div>

        {/* Search & Filters Bar */}
        <div className="bg-surface-light dark:bg-surface-dark rounded-2xl shadow-soft p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1 relative group">
              <div className="absolute left-0 top-0 bottom-0 w-12 bg-background-light dark:bg-background-dark rounded-l-xl flex items-center justify-center border-r border-soft-gray dark:border-slate/20">
                <Search className="text-slate w-5 h-5 group-focus-within:text-primary transition-colors" />
              </div>
              <Input
                placeholder="Rechercher par nom de salon..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-16 h-12 text-lg border-none bg-background-light dark:bg-background-dark rounded-xl focus:ring-0 placeholder:text-slate/50"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 transform -translate-y-1/2 text-slate hover:text-charcoal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full md:w-64 h-12 rounded-xl border-none bg-background-light dark:bg-background-dark">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="rating">Mieux Notés</SelectItem>
                <SelectItem value="distance">Le Plus Proche</SelectItem>
                <SelectItem value="price_low">Prix Croissant</SelectItem>
                <SelectItem value="newest">Plus Récents</SelectItem>
              </SelectContent>
            </Select>

            {/* View Mode Toggle */}
            <div className="flex gap-2 bg-background-light dark:bg-background-dark p-1 rounded-xl">
              <Button
                variant="ghost"
                className={`h-10 w-10 p-0 rounded-lg ${viewMode === 'list' ? 'bg-white dark:bg-surface-dark shadow-sm text-primary' : 'text-slate'}`}
                onClick={() => setViewMode('list')}
              >
                <ListIcon className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                className={`h-10 w-10 p-0 rounded-lg ${viewMode === 'grid' ? 'bg-white dark:bg-surface-dark shadow-sm text-primary' : 'text-slate'}`}
                onClick={() => setViewMode('grid')}
              >
                <LayoutGrid className="w-5 h-5" />
              </Button>
              <Button
                variant="ghost"
                className={`h-10 w-10 p-0 rounded-lg ${viewMode === 'map' ? 'bg-white dark:bg-surface-dark shadow-sm text-primary' : 'text-slate'}`}
                onClick={() => setViewMode('map')}
              >
                <Map className="w-5 h-5" />
              </Button>
            </div>

            {/* Mobile Filter Button */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="lg:hidden h-12 rounded-xl border-none bg-background-light dark:bg-background-dark">
                  <SlidersHorizontal className="w-5 h-5 mr-2" />
                  Filtres
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="filter-sheet h-[80vh] overflow-y-auto">
                <SheetHeader>
                  <SheetTitle className="text-charcoal dark:text-white">Filtres</SheetTitle>
                </SheetHeader>
                <div className="mt-6">
                  <FilterContent />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Quick Filters */}
          <div className="flex gap-3 mt-4 overflow-x-auto pb-2 scrollbar-hide">
            {['Coupe Homme', 'Taille de Barbe', 'Rasage à l\'ancienne', 'Coloration'].map((service) => (
              <Badge
                key={service}
                variant="secondary"
                className="px-4 py-2 rounded-xl bg-background-light dark:bg-background-dark hover:bg-primary/10 hover:text-primary cursor-pointer transition-colors text-sm font-medium text-charcoal dark:text-white whitespace-nowrap"
              >
                {service}
              </Badge>
            ))}
          </div>
        </div>

        {/* Map View */}
        {viewMode === 'map' && (
          <div className="mb-8 rounded-2xl overflow-hidden shadow-soft border border-soft-gray dark:border-slate/20">
            <BarberMap barbers={filteredBarbers} />
          </div>
        )}

        <div className="flex gap-8">
          {/* Desktop Filters Sidebar */}
          <aside className="hidden lg:block w-80 shrink-0">
            <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-6 sticky top-24 shadow-soft">
              <h2 className="text-xl font-bold text-charcoal dark:text-white mb-6 flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5" />
                Filtres
              </h2>
              <FilterContent />
            </div>
          </aside>

          {/* Results */}
          <div className="flex-1">
            <div className="mb-6 flex items-center justify-between">
              <p className="text-slate dark:text-matte-silver">
                <span className="font-bold text-charcoal dark:text-white text-xl">{filteredBarbers.length}</span> barbier(s) trouvé(s)
              </p>
            </div>

            {/* Barbers List/Grid */}
            {isLoading ? (
              <div className={`grid gap-6 ${viewMode === 'grid' ? 'md:grid-cols-2 xl:grid-cols-3' : 'grid-cols-1'}`}>
                {[1, 2, 3, 4, 5, 6].map(i => (
                  <Card key={i} className="rounded-2xl border-none shadow-soft">
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
              <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-16 text-center shadow-soft">
                <Scissors className="w-20 h-20 text-slate/30 mx-auto mb-6" />
                <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-3">
                  Aucun barbier trouvé
                </h3>
                <p className="text-slate dark:text-matte-silver mb-6">
                  Essayez de modifier vos critères de recherche ou d'élargir la zone
                </p>
                <Button
                  className="bg-primary text-white hover:bg-primary/90 rounded-button"
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
                  Réinitialiser les Filtres
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
                        // List View Card (Horizontal)
                        <Card className="rounded-2xl border-none shadow-soft hover:shadow-soft-md transition-all bg-surface-light dark:bg-surface-dark overflow-hidden group h-full">
                          <div className="flex flex-col md:flex-row h-full">
                            <div className="flex-1 p-6 flex flex-col justify-between order-2 md:order-1">
                              <div>
                                <div className="flex items-center gap-2 mb-2">
                                  <div className="flex items-center gap-1 text-amber-500 font-bold text-sm">
                                    <Star className="w-4 h-4 fill-current" />
                                    {barber.rating?.toFixed(1) || "5.0"}
                                    <span className="text-slate font-normal text-xs">({barber.total_reviews || 0})</span>
                                  </div>
                                  {barber.kid_friendly && (
                                    <Badge className="bg-emerald-100 text-emerald-700 hover:bg-emerald-200 border-none text-xs">
                                      <Baby className="w-3 h-3 mr-1" />
                                      Enfants
                                    </Badge>
                                  )}
                                </div>
                                <h3 className="text-2xl font-bold text-charcoal dark:text-white mb-2 group-hover:text-primary transition-colors">
                                  {barber.shop_name}
                                </h3>
                                <div className="flex items-center gap-2 text-slate dark:text-matte-silver mb-4 text-sm">
                                  <MapPin className="w-4 h-4 text-primary" />
                                  <span>Paris, France</span>
                                  <span className="w-1 h-1 bg-slate/30 rounded-full mx-1"></span>
                                  <span>{barber.distance || "2.5"} km</span>
                                </div>
                                <div className="flex flex-wrap gap-2 mb-4">
                                  {barber.specialties?.slice(0, 3).map((specialty, i) => (
                                    <span key={i} className="text-xs font-medium text-slate dark:text-matte-silver bg-background-light dark:bg-background-dark px-2 py-1 rounded-lg">
                                      {specialty}
                                    </span>
                                  ))}
                                </div>
                              </div>
                              <div className="flex items-center gap-4 mt-auto pt-4 border-t border-soft-gray dark:border-slate/10">
                                <Link to={createPageUrl(`BarberProfile?id=${barber.id}`)} className="w-full">
                                  <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-button">
                                    Voir les disponibilités
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
                                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-charcoal">
                                  <Scissors className="w-12 h-12 text-white/50" />
                                </div>
                              )}
                            </div>
                          </div>
                        </Card>
                      ) : (
                        // Grid View Card (Vertical)
                        <Card className="rounded-2xl border-none shadow-soft hover:shadow-soft-md transition-all bg-surface-light dark:bg-surface-dark overflow-hidden group h-full">
                          <div className="h-56 relative overflow-hidden">
                            {barber.portfolio_images?.[0] ? (
                              <img
                                src={barber.portfolio_images[0]}
                                alt={barber.shop_name}
                                className="w-full h-full object-cover hover:scale-105 transition-transform duration-500"
                              />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary to-charcoal">
                                <Scissors className="w-20 h-20 text-white/50" />
                              </div>
                            )}
                            <div className="absolute top-4 right-4">
                              <div className="bg-white/90 backdrop-blur-sm px-2 py-1 rounded-lg flex items-center gap-1 text-sm font-bold text-charcoal shadow-sm">
                                <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />
                                {barber.rating?.toFixed(1) || "5.0"}
                              </div>
                            </div>
                            {barber.kid_friendly && (
                              <Badge className="absolute top-4 left-4 bg-emerald-500 text-white border-none shadow-sm">
                                <Baby className="w-3 h-3 mr-1" />
                                Enfants
                              </Badge>
                            )}
                          </div>

                          <CardContent className="p-6">
                            <h3 className="text-xl font-bold mb-2 text-charcoal dark:text-white group-hover:text-primary transition-colors">
                              {barber.shop_name}
                            </h3>

                            <div className="flex items-center gap-2 text-slate dark:text-matte-silver mb-4 text-sm">
                              <MapPin className="w-4 h-4 text-primary" />
                              <span>Paris, France</span>
                            </div>

                            <div className="mb-6">
                              {barber.specialties && (
                                <div className="flex flex-wrap gap-2">
                                  {barber.specialties.slice(0, 3).map((specialty, i) => (
                                    <Badge key={i} variant="secondary" className="text-xs bg-background-light dark:bg-background-dark text-slate dark:text-matte-silver hover:bg-primary/10 hover:text-primary transition-colors">
                                      {specialty}
                                    </Badge>
                                  ))}
                                </div>
                              )}
                            </div>

                            <Link to={createPageUrl(`BarberProfile?id=${barber.id}`)}>
                              <Button className="w-full bg-primary hover:bg-primary/90 text-white rounded-button">
                                Voir le Profil
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
      </div>
    </div>
  );
}
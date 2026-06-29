import { motion } from 'framer-motion';

import { Link } from 'react-router-dom';

import { useQuery } from '@tanstack/react-query';

import { sovereign } from '@/api/apiClient';

import { createPageUrl } from '@/utils';

import { OptimizedImage } from '@/components/ui/optimized-image';

import { ChevronRight } from 'lucide-react';

import { EmptyState } from '@/components/ui/empty-state';



export default function FeaturedServices() {

  const { data: services = [], isLoading } = useQuery({

    queryKey: ['featured-services'],

    queryFn: () => sovereign.entities.Service.list(),

    staleTime: 60 * 1000,

  });



  const featured = services.slice(0, 3);



  if (isLoading) {

    return (

      <div>

        <h2 className="text-lg font-bold text-foreground mb-4 px-1 tracking-tight">Featured Services</h2>

        <p className="text-sm text-muted-foreground px-1">Loading services…</p>

      </div>

    );

  }



  if (featured.length === 0) {

    return (

      <div>

        <h2 className="text-lg font-bold text-foreground mb-4 px-1 tracking-tight">Featured Services</h2>

        <EmptyState

          title="No services yet"

          description="Browse professionals to discover services near you."

          actionLabel="Explore"

          actionHref={createPageUrl('Explore')}

        />

      </div>

    );

  }



  return (

    <div>

      <div className="flex justify-between items-center mb-4 px-1">

        <h2 className="text-lg font-bold text-foreground tracking-tight">Featured Services</h2>

        <Link to={createPageUrl('Explore')} className="text-sm font-semibold text-primary hover:underline flex items-center gap-0.5">

          View All <ChevronRight className="w-4 h-4" />

        </Link>

      </div>

      <div className="flex gap-4 overflow-x-auto pb-2 -mx-1 scrollbar-hide">

        {featured.map((service) => {

          const name = service.name || 'Service';

          const category = service.category || 'Grooming';

          const imageUrl = service.image_url || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=400&auto=format&fit=crop';

          return (

            <Link key={service.id} to={createPageUrl(`Explore?q=${encodeURIComponent(name)}`)} className="shrink-0 w-[180px]">

              <motion.div

                whileHover={{ y: -2 }}

                className="rounded-2xl overflow-hidden border border-border bg-card shadow-sm hover:shadow-md transition-all h-full"

              >

                <div className="relative aspect-[4/5] bg-primary/90">

                  <OptimizedImage

                    src={imageUrl}

                    alt={name}

                    fill

                    imgClassName="object-cover opacity-80"

                    width={360}

                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent" />

                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">

                    <h3 className="font-bold text-sm mb-0.5">{name}</h3>

                    <p className="text-xs text-white/80">{category}</p>

                  </div>

                </div>

              </motion.div>

            </Link>

          );

        })}

      </div>

    </div>

  );

}


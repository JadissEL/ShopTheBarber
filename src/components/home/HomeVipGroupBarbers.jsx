import { useQuery } from '@tanstack/react-query';

import { sovereign } from '@/api/apiClient';

import { Link } from 'react-router-dom';

import { motion } from 'framer-motion';

import { Users, ArrowRight } from 'lucide-react';

import { Button } from '@/components/ui/button';

import { OptimizedImage } from '@/components/ui/optimized-image';

import { createPageUrl } from '@/utils';

import ServiceLocationBadges from '@/components/serviceLocation/ServiceLocationBadges';
import { GroupBookingBadge, VipBarberBadge } from '@/components/groupBooking/GroupBookingBadges';

function groupBookUrlForBarber(barber) {
    const mobileOnly =
        barber.mobile_only === true ||
        (barber.offers_shop_service === false && barber.offers_mobile_service === true);
    let url = `BookingFlow?group=1&barberId=${barber.id}&context=independent&step=services`;
    if (mobileOnly) url += '&location=mobile';
    return createPageUrl(url);
}

export default function HomeVipGroupBarbers() {

    const { data } = useQuery({

        queryKey: ['homepage'],

        queryFn: () => sovereign.public.getHomepage(),

        staleTime: 1000 * 60 * 5,

    });



    const barbers = data?.vip_group_barbers ?? [];

    const groupBooking = data?.group_booking ?? {};



    if (!barbers?.length) return null;



    return (

        <section className="py-24 bg-gradient-to-b from-violet-950 to-slate-900 text-white relative overflow-hidden">

            <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_30%_20%,#8b5cf6,transparent_50%)]" />

            <div className="container mx-auto px-4 md:px-6 relative z-10">

                <div className="max-w-2xl mb-12">

                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-violet-200 text-sm font-medium mb-4">

                        <Users className="w-4 h-4" />

                        Group booking

                    </div>

                    <h2 className="text-3xl md:text-4xl font-bold mb-4 tracking-tight">

                        {groupBooking.headline || 'Group grooming'}

                    </h2>

                    <p className="text-violet-100/80 text-lg font-light">

                        {groupBooking.description ||

                            'Book weddings, groomsmen, and group events with top-rated professionals, in-shop or at home.'}

                    </p>

                </div>



                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">

                    {barbers.map((barber, index) => (

                        <motion.div

                            key={barber.id}

                            initial={{ opacity: 0, y: 16 }}

                            whileInView={{ opacity: 1, y: 0 }}

                            viewport={{ once: true }}

                            transition={{ delay: index * 0.06 }}

                        >

                            <Link

                                to={createPageUrl(`BarberProfile?id=${barber.id}`)}

                                className="group block"

                            >

                                <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-3 ring-1 ring-white/20 group-hover:ring-violet-400/50 transition-all">

                                    <OptimizedImage

                                        src={

                                            barber.image_url ||

                                            'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=600&auto=format&fit=crop'

                                        }

                                        alt={barber.name}

                                        fill

                                        className="object-cover group-hover:scale-105 transition-transform duration-500"

                                    />

                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />

                                    <div className="absolute top-3 left-3 flex flex-wrap gap-1">
                                        {barber.is_vip && <VipBarberBadge />}
                                        <GroupBookingBadge discountPercent={barber.group_discount_percent} />
                                        <ServiceLocationBadges barber={barber} size="xs" />
                                    </div>

                                    <div className="absolute bottom-0 p-4 w-full">

                                        <h3 className="font-bold text-lg">{barber.name}</h3>

                                        <p className="text-sm text-white/70">{barber.title}</p>

                                        <p className="text-xs text-violet-200 mt-1">

                                            {barber.min_party}-{barber.max_party} guests

                                        </p>

                                    </div>

                                </div>

                            </Link>

                            <Button
                                asChild
                                size="sm"
                                variant="secondary"
                                className="w-full rounded-full mt-2 bg-white/10 text-white hover:bg-white/20 border-0"
                            >
                                <Link to={groupBookUrlForBarber(barber)}>
                                    Book group
                                    <ArrowRight className="w-3.5 h-3.5 ml-1" />
                                </Link>
                            </Button>

                        </motion.div>

                    ))}

                </div>



                <div className="flex flex-wrap gap-3">
                <Button

                    asChild

                    variant="secondary"

                    className="rounded-full gap-2 bg-card text-violet-950 hover:bg-violet-100"

                >

                    <Link to={createPageUrl(groupBooking.cta_path || 'Explore?group=1')}>

                        <Users className="w-4 h-4" />

                        Book a group session

                        <ArrowRight className="w-4 h-4" />

                    </Link>

                </Button>

                <Button

                    asChild

                    variant="outline"

                    className="rounded-full gap-2 border-white/30 text-white hover:bg-white/10"

                >

                    <Link to={createPageUrl(groupBooking.explore_path || 'Explore?group=1')}>

                        Browse group barbers

                    </Link>

                </Button>
                </div>

            </div>

        </section>

    );

}


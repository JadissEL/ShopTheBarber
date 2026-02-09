import { motion } from 'framer-motion';
import { StatusBadge } from '@/components/ui/status-badge';
import { UserAvatar } from '@/components/ui/user-avatar';
import { Button } from '@/components/ui/button';
import { MoreHorizontal, MapPin, Calendar, Clock, Scissors } from 'lucide-react';
import { cn } from '@/components/utils';

export default function BookingCard({ booking, actions, variant: _variant = 'default', className }) {
    if (!booking) return null;

    const bookingData = booking.data || booking;
    const isUpcoming = ['pending', 'confirmed'].includes(bookingData.status);

    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.98 }}
            animate={{ opacity: 1, scale: 1 }}
            whileHover={{ y: -2 }}
            className={cn(
                "relative overflow-hidden rounded-2xl p-5 border transition-all duration-300",
                "bg-card border-border text-foreground hover:shadow-lg hover:border-primary/30",
                className
            )}
        >
            {/* Progress bar accent for upcoming bookings */}
            {isUpcoming && (
                <div className="absolute top-0 left-0 w-1 h-full bg-primary" />
            )}

            <div className="flex flex-col lg:flex-row items-center gap-6">
                {/* Time & Date Block */}
                <div className="flex flex-col items-center lg:items-start min-w-[120px] lg:border-r lg:border-border lg:pr-6">
                    <div className="flex items-center gap-2 text-primary font-bold text-lg mb-1 lg:mb-0">
                        <Clock className="w-4 h-4" />
                        <span>{bookingData.time_text || 'Time TBD'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{bookingData.date_text || 'Date TBD'}</span>
                    </div>
                </div>

                {/* Core Info Info */}
                <div className="flex items-center gap-4 flex-1 w-full">
                    <div className="relative">
                        <UserAvatar
                            src={bookingData.image_url}
                            name={bookingData.barber_name || bookingData.client_name || "Guest"}
                            className="w-14 h-14 border-2 border-primary/20"
                        />
                        <div className="absolute -bottom-1 -right-1 bg-primary text-white p-1 rounded-full shadow-lg border border-white">
                            <Scissors className="w-3 h-3" />
                        </div>
                    </div>

                    <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate group-hover:text-primary transition-colors">
                            {bookingData.service_name || 'Barber Service'}
                        </h3>
                        <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-sm text-muted-foreground mt-1">
                            <span className="flex items-center gap-1.5 font-medium text-foreground text-foreground">
                                {bookingData.client_name || bookingData.barber_name || "Anonymous"}
                            </span>
                            <span className="hidden sm:inline opacity-30">•</span>
                            <span className="flex items-center gap-1.5 truncate">
                                <MapPin className="w-3.5 h-3.5 text-primary" />
                                {bookingData.location || 'At Shop'}
                            </span>
                        </div>
                    </div>
                </div>

                {/* Status & Actions Section */}
                <div className="flex items-center gap-4 w-full lg:w-auto justify-between lg:justify-end mt-4 lg:mt-0 pt-4 lg:pt-0 border-t lg:border-t-0 border-border">
                    <StatusBadge
                        status={bookingData.status || 'pending'}
                        className="px-4 py-1.5 uppercase text-[10px] tracking-widest font-black rounded-lg"
                    />

                    <div className="flex items-center gap-2">
                        {actions || (
                            <Button
                                variant="ghost"
                                size="icon"
                                className="text-muted-foreground hover:text-foreground hover:bg-gray-100 dark:hover:bg-white/5 rounded-xl transition-all"
                            >
                                <MoreHorizontal className="w-5 h-5" />
                            </Button>
                        )}
                    </div>
                </div>
            </div>
        </motion.div>
    );
}
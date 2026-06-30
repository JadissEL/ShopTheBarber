import { motion } from 'framer-motion';
import { MapPin, Navigation, CalendarPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { OptimizedImage } from '@/components/ui/optimized-image';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

export default function NextAppointmentCard({ booking }) {
  if (!booking) {
    return (
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
        <Card className={cn(stb.panel, 'p-8 text-center flex flex-col items-center justify-center min-h-[200px]')}>
          <div className="stb-icon-box mb-4 w-12 h-12">
            <CalendarPlus className="w-6 h-6" />
          </div>
          <h3 className="stb-title text-lg mb-1">No booking yet?</h3>
          <p className="stb-body mb-6 max-w-xs">Let's find your perfect cut in 2 minutes.</p>
          <Link to={createPageUrl('Explore')}>
            <Button className="px-8">Book Now</Button>
          </Link>
        </Card>
      </motion.div>
    );
  }

  const timeLabel = booking.time_label || `Tomorrow at ${booking.time || '10:30 AM'}, ${booking.duration_minutes || 45} mins`;
  const location = booking.shop_name || booking.location || 'Mayfair, London';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className={cn(stb.surface, stb.surfaceInteractive, 'overflow-hidden')}>
        <div className="p-5">
          <span className="stb-chip stb-chip-active mb-4">
            Next Appointment
          </span>
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-foreground mb-1">{booking.service_name || 'Signature Fade & Beard Sculpt'}</h3>
              <p className="text-muted-foreground text-sm mb-4">{timeLabel}</p>
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-border">
                <span className="text-muted-foreground text-sm flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-muted-foreground" />
                  {location}
                </span>
                <Button size="sm" className="text-xs h-9 px-4 shrink-0">
                  asChild
                >
                  <a
                    href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <Navigation className="w-3.5 h-3.5 mr-1.5" />
                    Get Directions
                  </a>
                </Button>
              </div>
            </div>
            <div className="shrink-0">
              <OptimizedImage
                src={booking.barber_image || 'https://images.unsplash.com/photo-1585747860715-2ba37e788b70?w=100&auto=format&fit=crop'}
                alt={booking.barber_name || 'Barber'}
                className="w-14 h-14 rounded-full object-cover border-2 border-border"
                width={56}
                height={56}
              />
            </div>
          </div>
        </div>
      </Card>
    </motion.div>
  );
}

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
        <Card className="bg-white border border-slate-200 shadow-sm rounded-2xl p-8 text-center flex flex-col items-center justify-center min-h-[200px]">
          <div className="bg-primary/10 p-3 rounded-full mb-4">
            <CalendarPlus className="w-6 h-6 text-primary" />
          </div>
          <h3 className="text-lg font-bold text-foreground mb-1">No booking yet?</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-xs">Let's find your perfect cut in 2 minutes.</p>
          <Link to={createPageUrl('Explore')}>
            <Button className="bg-primary text-primary-foreground hover:bg-primary/90 font-bold px-8 rounded-xl shadow-md">
              Book Now
            </Button>
          </Link>
        </Card>
      </motion.div>
    );
  }

  const timeLabel = booking.time_label || `Tomorrow at ${booking.time || '10:30 AM'} · ${booking.duration_minutes || 45} mins`;
  const location = booking.shop_name || booking.location || 'Mayfair, London';

  return (
    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
      <Card className="bg-white border border-slate-200 shadow-sm overflow-hidden rounded-2xl hover:shadow-md transition-all">
        <div className="p-5">
          <span className="inline-block px-3 py-1 rounded-full bg-violet-100 text-violet-700 text-xs font-semibold uppercase tracking-wider mb-4">
            Next Appointment
          </span>
          <div className="flex gap-4 items-start">
            <div className="flex-1 min-w-0">
              <h3 className="text-xl font-bold text-foreground mb-1">{booking.service_name || 'Signature Fade & Beard Sculpt'}</h3>
              <p className="text-slate-500 text-sm mb-4">{timeLabel}</p>
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <span className="text-slate-600 text-sm flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />
                  {location}
                </span>
                <Button
                  size="sm"
                  className="bg-primary text-primary-foreground hover:opacity-95 rounded-xl font-semibold text-xs h-9 px-4 shrink-0"
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
                src={booking.barber_image || 'https://images.unsplash.com/photo-1503951914290-93d32b06769c?w=100&auto=format&fit=crop'}
                alt={booking.barber_name || 'Barber'}
                className="w-14 h-14 rounded-full object-cover border-2 border-slate-200"
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

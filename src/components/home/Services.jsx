import { Scissors, Sparkles, User, Palette, Smile, Crown, ArrowRight, ShoppingBag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

const services = [
  { icon: Scissors, label: "Haircut", desc: "Precision cuts" },
  { icon: Scissors, label: "Beard Trim", desc: "Sculpt & shape" },
  { icon: Sparkles, label: "Hot Shave", desc: "Classic towel" },
  { icon: Smile, label: "Kid's Cut", desc: "Fun & gentle" },
  { icon: User, label: "Facial", desc: "Rejuvenate" },
  { icon: Palette, label: "Color", desc: "Professional dye" },
  { icon: Crown, label: "VIP", desc: "Full service" },
  { icon: ShoppingBag, label: "Products", desc: "Shop essentials" },
];

export default function Services() {
  return (
    <div className="py-24 bg-slate-50 relative">
      <div className="container mx-auto px-4 md:px-6 relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-16">
           <h2 className="text-3xl font-bold mb-4 text-foreground tracking-tight">Curated Services</h2>
           <p className="text-slate-500 text-lg font-light">From classic cuts to essential products, we have it all.</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
          {services.map((service, index) => (
            <motion.div 
               key={index}
               initial={{ opacity: 0, scale: 0.9 }}
               whileInView={{ opacity: 1, scale: 1 }}
               viewport={{ once: true }}
               transition={{ delay: index * 0.05 }}
            >
                <Link to={createPageUrl('Explore') + '?filter=' + encodeURIComponent(service.label)}>
                    <div className="group bg-card p-6 rounded-2xl transition-all duration-300 hover:shadow-lg border border-border hover:border-primary/30 flex flex-col items-center text-center h-full relative overflow-hidden">
                        <div className="relative z-10 w-14 h-14 rounded-xl bg-muted group-hover:bg-primary/10 flex items-center justify-center mb-4 text-slate-600 group-hover:text-primary transition-colors duration-300">
                            <service.icon className="w-7 h-7" />
                        </div>
                        <h3 className="relative z-10 font-semibold text-foreground mb-1">{service.label}</h3>
                        <p className="relative z-10 text-sm text-muted-foreground mb-4">{service.desc}</p>
                        <div className="relative z-10 mt-auto opacity-0 group-hover:opacity-100 transition-opacity flex items-center gap-1 text-xs font-semibold text-primary">
                            Book now <ArrowRight className="w-3 h-3" />
                        </div>
                    </div>
                </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

export default function CTA() {
  return (
    <div className="py-24 bg-white">
      <div className="container mx-auto px-4 md:px-6">
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="relative rounded-[3rem] overflow-hidden bg-slate-50 border border-slate-100 px-8 py-24 text-center shadow-2xl"
        >
          {/* Subtle Gradients */}
          <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-primary/10 rounded-full blur-[80px] pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[80px] pointer-events-none" />

          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight leading-[1.1]">
              Ready to upgrade your style?
            </h2>
            <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">
              Join thousands who found their perfect barber. Seamless booking, secure payments, premium results.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to={createPageUrl('Explore')} className="block">
                <Button size="lg" className="bg-primary text-primary-foreground hover:opacity-95 font-semibold px-10 h-14 text-base rounded-xl w-full transition-opacity">
                  Book your cut
                </Button>
              </Link>
              <Link to={createPageUrl('SelectProviderType')} className="block">
                <Button size="lg" variant="outline" className="bg-card border-2 border-border text-foreground hover:bg-muted font-semibold px-10 h-14 text-base rounded-xl w-full">
                  For professionals
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
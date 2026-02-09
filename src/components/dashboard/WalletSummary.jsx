import { Wallet, Ticket, Gift, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

export default function WalletSummary({ hideHeader }) {
  return (
    <div>
      {!hideHeader && (
        <div className="flex items-center justify-between mb-6 px-1">
          <h2 className="text-xl font-bold text-foreground tracking-tight">Wallet & Loyalty</h2>
          <Link to={createPageUrl('Loyalty')} className="text-sm text-primary hover:text-primary/80 font-medium">View Loyalty</Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Credits Card */}
        <div className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Credits</p>
                    <Wallet className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-3xl font-bold text-foreground mb-1">$45.00</h3>
                <p className="text-xs text-muted-foreground">Available to spend</p>
                <p className="text-[10px] text-red-400 mt-1 font-medium">Expires in 30 days</p>
            </div>
            <Button size="sm" className="w-full bg-primary text-white hover:bg-primary/90 mt-4 h-9 text-xs font-bold">
                Top Up
            </Button>
        </div>

        {/* Loyalty Points */}
        <div className="bg-white rounded-2xl p-5 border border-border shadow-sm flex flex-col justify-between h-full hover:shadow-md transition-shadow">
            <div>
                <div className="flex justify-between items-start mb-2">
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Loyalty Points</p>
                    <Gift className="w-4 h-4 text-primary" />
                </div>
                <div className="flex items-end gap-2 mb-2">
                    <h3 className="text-2xl font-bold text-foreground">2,450</h3>
                    <span className="text-xs text-muted-foreground mb-1.5">/ 3,000 pts</span>
                </div>
                
                <div className="w-full bg-gray-100 h-2 rounded-full mt-1 mb-2 overflow-hidden">
                    <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: "81%" }}
                        transition={{ duration: 1, ease: "easeOut" }}
                        className="bg-primary h-full rounded-full relative"
                    >
                        <div className="absolute top-0 right-0 bottom-0 w-2 bg-white/30 rounded-full"></div>
                    </motion.div>
                </div>
                <p className="text-[10px] text-primary font-medium">You're 550 points away from a free cut</p>
                <div className="mt-3 inline-flex items-center gap-1.5 bg-orange-50 text-orange-600 px-2 py-0.5 rounded-full border border-orange-100">
                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full animate-pulse"></span>
                    <span className="text-[10px] font-bold">3 visits streak!</span>
                </div>
            </div>
            <Button size="sm" variant="ghost" className="w-full mt-2 text-primary hover:text-primary/80 hover:bg-primary/5 h-9 text-xs justify-between px-0 font-medium">
                Redeem Rewards <ChevronRight className="w-3 h-3" />
            </Button>
        </div>

        {/* Active Pass/Coupon */}
        <div className="bg-white rounded-2xl p-5 border border-dashed border-border shadow-sm flex flex-col justify-between relative h-full hover:shadow-md transition-shadow">
             <div className="absolute -left-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-background rounded-full border-r border-border"></div>
             <div className="absolute -right-1.5 top-1/2 -translate-y-1/2 w-3 h-3 bg-background rounded-full border-l border-border"></div>
            
            <div>
                <div className="flex justify-between items-start mb-2">
                    <p className="text-muted-foreground text-xs font-bold uppercase tracking-wider">Active Coupon</p>
                    <Ticket className="w-4 h-4 text-primary" />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-1">20% OFF</h3>
                <p className="text-xs text-muted-foreground">Summer Grooming Special</p>
                <p className="text-[10px] text-orange-500 mt-1 font-medium">Expires in 3 days</p>
            </div>
            <Button size="sm" variant="outline" className="w-full mt-3 border-primary/20 text-primary hover:bg-primary/5 hover:text-primary h-9 text-xs font-bold">
                Apply on Next Booking
            </Button>
        </div>
      </div>
    </div>
  );
}
import { Clock, Scissors, DollarSign, MicOff, Home, ShoppingBag, Users, Star, Sparkles, Award } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { motion } from 'framer-motion';

const BentoCard = ({ title, subtitle, icon: Icon, className, colorClass, children }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true }}
    whileHover={{ y: -5 }}
    className={`relative overflow-hidden p-8 rounded-[2.5rem] ${className} transition-all duration-300 group`}
  >
    <div className={`absolute inset-0 opacity-10 ${colorClass}`}></div>
    <div className="relative z-10 h-full flex flex-col">
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center mb-6 ${colorClass.replace('bg-', 'text-').replace('text-', 'bg-').split(' ')[0] + '/10'} ${colorClass.split(' ')[0].replace('bg-', 'text-')}`}>
        <Icon className="w-6 h-6" />
      </div>
      <h3 className="text-2xl font-bold text-foreground mb-2 leading-tight">{title}</h3>
      <p className="text-slate-500 font-medium mb-6">{subtitle}</p>
      <div className="mt-auto">
         {children}
      </div>
    </div>
  </motion.div>
);

export default function Features() {
  return (
    <div className="py-32 bg-slate-50">
      <div className="container mx-auto px-4 md:px-6">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h2 
             initial={{ opacity: 0, y: 20 }}
             whileInView={{ opacity: 1, y: 0 }}
             viewport={{ once: true }}
             className="text-4xl md:text-6xl font-bold text-foreground mb-6 tracking-tight"
          >
            More Than Just a <br/>
            <span className="text-primary">Haircut Platform.</span>
          </motion.h2>
          <p className="text-xl text-slate-500 font-light">
            We've reimagined the entire experience to save you time, money, and hassle.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6 auto-rows-[minmax(300px,auto)]">
            
            {/* Card 1: Time Saving - Large */}
            <BentoCard 
                title="Zero Waiting Time"
                subtitle="Why waste time? Walk in, sit down, get styled. Our precision scheduling ensures you never wait."
                icon={Clock}
                className="md:col-span-2 bg-white shadow-sm hover:shadow-xl"
                colorClass="bg-primary"
            >
                <div className="flex items-center gap-4 mt-4">
                    <div className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">Avg. Wait: 0 mins</div>
                    <div className="px-4 py-2 bg-primary/10 text-primary rounded-full text-sm font-semibold">Time Saved: 100%</div>
                </div>
            </BentoCard>

            {/* Card 2: Pricing */}
            <BentoCard 
                title="Upfront Pricing"
                subtitle="Know the cost before you book. No surprises, just transparency."
                icon={DollarSign}
                className="bg-white shadow-sm hover:shadow-xl"
                colorClass="bg-primary"
            >
                 <div className="w-full bg-slate-100 rounded-xl p-3 flex justify-between items-center">
                    <span className="text-sm font-bold text-slate-700">Fade Cut</span>
                    <span className="text-sm font-bold text-primary">$45.00</span>
                 </div>
            </BentoCard>

            {/* Card 3: Silent Mode */}
            <BentoCard 
                title="The Silent Cut"
                subtitle="Not in the mood to chat? Select 'Silent Mode' and enjoy a peaceful grooming session."
                icon={MicOff}
                className="bg-white shadow-sm hover:shadow-xl"
                colorClass="bg-primary"
            >
                <div className="flex -space-x-2 mt-2">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">🤫</div>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-xs">✨</div>
                </div>
            </BentoCard>

            {/* Card 4: At Home */}
            <BentoCard 
                title="Barber at Home"
                subtitle="Luxury comes to you. Book certified stylists for home visits."
                icon={Home}
                className="bg-white shadow-sm hover:shadow-xl"
                colorClass="bg-primary"
            >
                <div className="w-full h-24 rounded-xl bg-primary/10 mt-4 overflow-hidden relative">
                    <div className="absolute inset-0 flex items-center justify-center text-primary/40">
                        <Home className="w-12 h-12 opacity-50" />
                    </div>
                </div>
            </BentoCard>

            {/* Card 5: Large Center */}
            <BentoCard 
                title="Discover Your Style"
                subtitle="Browse thousands of cuts, find inspiration, and get tailored advice from creative artists."
                icon={Sparkles}
                className="md:col-span-2 lg:col-span-2 bg-white shadow-sm hover:shadow-xl"
                colorClass="bg-primary"
            >
                <div className="grid grid-cols-3 gap-3 mt-4">
                    {[1,2,3].map(i => (
                        <div key={i} className="aspect-square rounded-xl bg-slate-100 overflow-hidden">
                             <img src={`https://i.pravatar.cc/150?img=${i+50}`} className="w-full h-full object-cover hover:scale-105 transition-transform" alt="Style" />
                        </div>
                    ))}
                </div>
            </BentoCard>

            {/* Card 6: Rewards */}
            <BentoCard 
                title="Earn Rewards"
                subtitle="Get credit back on every cut and referral. Style pays."
                icon={Award}
                className="bg-white shadow-sm hover:shadow-xl"
                colorClass="bg-primary"
            >
                <div className="text-3xl font-bold text-primary mt-2">$250+</div>
                <div className="text-xs text-slate-400">Avg. yearly savings</div>
            </BentoCard>

            {/* Card 7: Events */}
            <BentoCard 
                title="Exclusive Events"
                subtitle="Get invited to grooming workshops, launch parties, and VIP nights."
                icon={Star}
                className="md:col-span-2 bg-primary/5 shadow-sm hover:shadow-xl"
                colorClass="bg-primary"
            >
                <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
                    <div className="flex-shrink-0 px-4 py-2 bg-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2"><Scissors className="w-4 h-4" /> Workshops</div>
                    <div className="flex-shrink-0 px-4 py-2 bg-white rounded-lg text-sm font-bold shadow-sm flex items-center gap-2"><Star className="w-4 h-4" /> VIP Night</div>
                </div>
            </BentoCard>

            {/* Card 8: Products → Marketplace */}
            <Link to={createPageUrl('Marketplace')}>
            <BentoCard 
                title="Shop Products"
                subtitle="Buy the best men's grooming products directly from the app."
                icon={ShoppingBag}
                className="bg-white shadow-sm hover:shadow-xl cursor-pointer"
                colorClass="bg-primary"
            />
            </Link>
             
            {/* Card 9: Kids */}
            <BentoCard 
                title="Men & Kids"
                subtitle="Specialized styling for the little ones too."
                icon={Users}
                className="bg-white shadow-sm hover:shadow-xl"
                colorClass="bg-primary"
            />
        </div>
      </div>
    </div>
  );
}
import { motion } from 'framer-motion';
import { RefreshCcw, Wallet, HelpCircle, Package, Archive } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';

const actions = [
  { label: 'Repeat', icon: RefreshCcw, link: 'UserBookings', color: 'text-rose-500 bg-rose-50 border-rose-100' },
  { label: 'Vault', icon: Archive, link: 'GroomingVault', color: 'text-slate-700 bg-slate-100 border-slate-200' },
  { label: 'Orders', icon: Package, link: 'MyOrders', color: 'text-sky-500 bg-sky-50 border-sky-100' },
  { label: 'Wallet', icon: Wallet, link: 'Loyalty', color: 'text-primary bg-primary/10 border-primary/20' },
  { label: 'Help', icon: HelpCircle, link: 'HelpCenter', color: 'text-violet-500 bg-violet-50 border-violet-100' },
];

export default function QuickActions() {
  return (
    <div>
      <h2 className="text-lg font-bold text-foreground mb-4 px-1 tracking-tight">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action, idx) => (
          <Link key={idx} to={createPageUrl(action.link)}>
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className="flex flex-col items-center justify-center p-4 rounded-2xl border bg-white shadow-sm hover:shadow-md cursor-pointer transition-all aspect-square max-w-[90px] mx-auto"
            >
              <div className={`p-2.5 rounded-xl border mb-2 ${action.color}`}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-600">{action.label}</span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

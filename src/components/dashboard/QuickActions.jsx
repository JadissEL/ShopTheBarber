import { motion } from 'framer-motion';
import { RefreshCcw, Wallet, HelpCircle, Package, Archive, Gift, Trophy, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { stb } from '@/lib/stbUi';
import { cn } from '@/lib/utils';

const actions = [
  { label: 'Repeat', icon: RefreshCcw, link: 'UserBookings' },
  { label: 'Vault', icon: Archive, link: 'GroomingVault' },
  { label: 'Orders', icon: Package, link: 'MyOrders' },
  { label: 'Wallet', icon: Wallet, link: 'ClientWallet' },
  { label: 'Gifts', icon: Gift, link: 'GiftCards' },
  { label: 'Refer', icon: Users, link: 'Referral' },
  { label: 'Rankings', icon: Trophy, link: 'ChampionshipLeaderboard' },
  { label: 'Help', icon: HelpCircle, link: 'HelpCenter' },
];

export default function QuickActions() {
  return (
    <div>
      <h2 className={cn(stb.title, 'text-lg mb-4 px-1')}>Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {actions.map((action, idx) => (
          <Link key={idx} to={createPageUrl(action.link)}>
            <motion.div
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                'flex flex-col items-center justify-center p-4 cursor-pointer transition-all aspect-square max-w-[90px] mx-auto',
                stb.surface,
                stb.surfaceInteractive
              )}
            >
              <div className={cn(stb.iconBox, 'w-11 h-11 p-0 mb-2')}>
                <action.icon className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                {action.label}
              </span>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
}

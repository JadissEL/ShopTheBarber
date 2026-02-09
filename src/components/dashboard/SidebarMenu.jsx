import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import {
  X, User, Wallet, Calendar, Heart, Bell,
  HelpCircle, LogOut, ChevronRight, Store
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { UserAvatar } from '@/components/ui/user-avatar';
import { sovereign } from '@/api/apiClient';

export default function SidebarMenu({ isOpen, onClose, user }) {
  const menuItems = [
    { icon: User, label: 'My Profile', link: 'AccountSettings' },
    { icon: Store, label: 'Marketplace', link: 'Marketplace' },
    { icon: Calendar, label: 'My Bookings', link: 'UserBookings' },
    { icon: Wallet, label: 'Wallet & Loyalty', link: 'Loyalty' },
    { icon: Heart, label: 'Favorites', link: 'Favorites' },
    { icon: Bell, label: 'Notification preferences', link: 'NotificationSettings' },
    { icon: HelpCircle, label: 'Help & Support', link: 'HelpCenter' },
  ];

  const handleLogout = async () => {
    await sovereign.auth.logout();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
          />

          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed right-0 top-0 bottom-0 w-[85%] max-w-sm bg-white border-l border-slate-200 z-50 flex flex-col shadow-2xl"
          >
            <div className="p-6 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">Menu</h2>
              <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground hover:bg-muted rounded-full">
                <X className="w-5 h-5" />
              </Button>
            </div>

            <div className="p-6 border-b border-slate-200 bg-slate-50/50">
              <div className="flex items-center gap-4 mb-4">
                <UserAvatar src={user?.image_url} name={user?.full_name || 'Guest'} className="w-14 h-14 border-2 border-primary/30" />
                <div>
                  <h3 className="font-bold text-foreground text-lg leading-tight">{user?.full_name || 'Guest User'}</h3>
                  <p className="text-sm text-slate-500">{user?.email}</p>
                </div>
              </div>
              <Link to={createPageUrl('AccountSettings')} onClick={onClose}>
                <Button variant="outline" size="sm" className="w-full border-border bg-card text-foreground hover:bg-muted hover:border-primary/30">
                  View Profile
                </Button>
              </Link>
            </div>

            <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1 bg-white">
              {menuItems.map((item, idx) => (
                <Link key={idx} to={createPageUrl(item.link)} onClick={onClose}>
                  <div className="flex items-center justify-between p-3 rounded-xl hover:bg-slate-50 text-slate-600 hover:text-foreground transition-all group cursor-pointer">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-slate-100 border border-slate-200 group-hover:bg-primary/10 group-hover:border-primary/20 transition-colors">
                        <item.icon className="w-5 h-5 text-slate-600 group-hover:text-primary transition-colors" />
                      </div>
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600" />
                  </div>
                </Link>
              ))}
            </div>

            <div className="p-6 border-t border-slate-200 bg-white">
              <Button
                variant="ghost"
                className="w-full justify-start text-rose-600 hover:text-rose-700 hover:bg-rose-50 gap-3 px-4"
                onClick={handleLogout}
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </Button>
              <div className="mt-4 text-center">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest">Version 2.4.0</p>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

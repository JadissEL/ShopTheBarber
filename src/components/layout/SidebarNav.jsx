import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { ChevronRight } from 'lucide-react';

import { motion, AnimatePresence } from 'framer-motion';

export default function SidebarNav({ menuItems, onItemClick }) {
  const location = useLocation();

  return (
    <div className="flex-1 overflow-y-auto py-6 px-3 space-y-1">
      <AnimatePresence>
        {menuItems.map((item) => {
          const isActive = location.pathname.includes(item.path);
          return (
            <Link 
              key={item.path} 
              to={createPageUrl(item.path)}
              onClick={onItemClick}
              className="relative flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group text-sm font-medium z-10"
            >
              {isActive && (
                <motion.div
                  layoutId="activeTab"
                  className="absolute inset-0 bg-primary/10 border border-primary/20 rounded-xl"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              
              <div className={`relative z-10 flex items-center gap-3 ${isActive ? 'text-primary' : 'text-muted-foreground group-hover:text-foreground'}`}>
                {item.icon && (
                  <item.icon 
                    className={`w-5 h-5 transition-colors duration-300 ${
                      isActive 
                        ? 'text-primary' 
                        : 'text-muted-foreground group-hover:text-foreground'
                    }`} 
                  />
                )}
                <span>{item.label}</span>
              </div>
              
              {isActive && (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="ml-auto relative z-10"
                >
                  <ChevronRight className="w-4 h-4 text-primary" />
                </motion.div>
              )}
            </Link>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
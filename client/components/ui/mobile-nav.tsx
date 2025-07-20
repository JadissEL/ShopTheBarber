import * as React from "react";
import { Menu, X, Home, User, Calendar, ShoppingBag, FileText, Settings, LogOut } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useResponsive } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";

interface MobileNavProps {
  className?: string;
}

export function MobileNav({ className }: MobileNavProps) {
  const { isMobile } = useResponsive();
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isOpen, setIsOpen] = React.useState(false);

  const navItems = [
    { icon: Home, label: "Accueil", path: "/", color: "text-moroccan-gold" },
    { icon: User, label: "Profil", path: "/dashboard", color: "text-moroccan-green" },
    { icon: Calendar, label: "Réservations", path: "/bookings", color: "text-moroccan-sand" },
    { icon: ShoppingBag, label: "Marketplace", path: "/marketplace", color: "text-moroccan-gold" },
    { icon: FileText, label: "Blog", path: "/blog", color: "text-moroccan-green" },
    { icon: Settings, label: "Paramètres", path: "/settings", color: "text-moroccan-sand" },
  ];

  const handleNavClick = (path: string) => {
    navigate(path);
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    setIsOpen(false);
    navigate("/");
  };

  if (!isMobile) return null;

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden relative group"
          aria-label="Menu"
        >
          <Menu className="h-6 w-6 transition-all duration-300 group-hover:scale-110" />
          <div className="absolute inset-0 bg-moroccan-gradient-primary opacity-0 group-hover:opacity-20 rounded-lg transition-opacity duration-300" />
        </Button>
      </SheetTrigger>
      <SheetContent 
        side="left" 
        className="w-[280px] bg-moroccan-charcoal border-r border-moroccan-darkgrey p-0"
      >
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b border-moroccan-darkgrey bg-gradient-to-r from-moroccan-green/20 to-moroccan-gold/20">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-moroccan-gradient-primary rounded-full flex items-center justify-center">
                  <span className="text-moroccan-charcoal font-bold text-lg">S</span>
                </div>
                <div>
                  <h3 className="font-heading text-moroccan-offwhite font-semibold">
                    ShopTheBarber
                  </h3>
                  <p className="text-sm text-moroccan-sand">
                    {user?.role || "Invité"}
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsOpen(false)}
                className="text-moroccan-sand hover:text-moroccan-offwhite"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
          </div>

          {/* Navigation Items */}
          <nav className="flex-1 p-4 space-y-2">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              
              return (
                <button
                  key={item.path}
                  onClick={() => handleNavClick(item.path)}
                  className={cn(
                    "w-full flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-300 group relative overflow-hidden",
                    isActive
                      ? "bg-moroccan-gradient-primary text-moroccan-charcoal shadow-lg"
                      : "text-moroccan-sand hover:text-moroccan-offwhite hover:bg-moroccan-darkgrey/50"
                  )}
                >
                  <div className={cn(
                    "relative z-10 transition-transform duration-300 group-hover:scale-110",
                    isActive ? "text-moroccan-charcoal" : item.color
                  )}>
                    <Icon className="h-5 w-5" />
                  </div>
                  <span className="font-medium relative z-10">{item.label}</span>
                  
                  {/* Moroccan Pattern Overlay */}
                  {isActive && (
                    <div className="absolute inset-0 opacity-10">
                      <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                        <pattern id="mobile-nav-pattern" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
                          <path d="M0 10h20M10 0v20" stroke="currentColor" strokeWidth="1" fill="none" />
                        </pattern>
                        <rect width="100%" height="100%" fill="url(#mobile-nav-pattern)" />
                      </svg>
                    </div>
                  )}
                </button>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-4 border-t border-moroccan-darkgrey">
            <Button
              onClick={handleLogout}
              variant="ghost"
              className="w-full justify-start text-moroccan-sand hover:text-red-400 hover:bg-red-400/10"
            >
              <LogOut className="h-5 w-5 mr-3" />
              Déconnexion
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
} 
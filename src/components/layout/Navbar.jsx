import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, X, Scissors } from 'lucide-react';
import { Button } from '@/components/ui/button';

/**
 * NAVBAR COMPONENT
 * 
 * Light/white theme for public landing pages.
 * Used on Home page and other public marketing pages.
 */
export default function Navbar({ navLinks }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();

  // Use passed links or default to client-focused links
  const navItems = navLinks || [
    { label: 'Home', path: 'Home' },
    { label: 'Find a Barber', path: 'Explore' },
    { label: 'Marketplace', path: 'Marketplace' },
    { label: 'About', path: 'About' },
  ];

  return (
    <header className="sticky top-0 z-50 w-full bg-background/80 backdrop-blur-xl border-b border-border shadow-sm transition-all duration-300">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">

          {/* Logo */}
          <Link to={createPageUrl('Home')} className="flex items-center gap-3 group">
            <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-md group-hover:opacity-95 transition-opacity">
              <Scissors className="w-5 h-5 transform -rotate-45" />
            </div>
            <span className="text-xl font-bold text-foreground tracking-tight group-hover:text-primary transition-colors">ShopTheBarber</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={createPageUrl(item.path)}
                className={`relative px-5 py-2 text-[15px] font-bold transition-all duration-200 rounded-lg group ${location.pathname === createPageUrl(item.path)
                  ? 'text-foreground'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
              >
                {item.label}
                <span className={`absolute bottom-1 left-5 right-5 h-0.5 bg-primary transition-all duration-300 ${location.pathname === createPageUrl(item.path)
                  ? 'opacity-100 scale-x-100'
                  : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'
                  }`} />
              </Link>
            ))}
          </nav>

          {/* Desktop Actions */}
          <div className="hidden lg:flex items-center gap-6 ml-4 pl-4 border-l border-border">
            <Link to={createPageUrl('SignIn')} className="text-[15px] font-bold text-muted-foreground hover:text-foreground transition-all">
              Sign In
            </Link>

            <Link to={createPageUrl('SelectProviderType')}>
              <Button className="bg-primary text-primary-foreground hover:opacity-95 font-semibold rounded-xl px-8 h-12 shadow-lg transition-opacity">
                Get Listed
              </Button>
            </Link>
          </div>

          {/* Mobile Menu Toggle */}
          <button
            className="lg:hidden p-2 text-foreground hover:bg-muted rounded-xl transition-all"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 border-b border-border bg-background/95 backdrop-blur-2xl shadow-2xl animate-in slide-in-from-top-4 duration-300">
          <div className="px-6 py-8 space-y-2">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={createPageUrl(item.path)}
                className={`block px-6 py-4 text-lg font-bold rounded-2xl transition-all ${location.pathname === createPageUrl(item.path)
                  ? 'text-foreground bg-muted'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}

            <div className="pt-8 space-y-4 border-t border-border mt-8">
              <Link to={createPageUrl('SelectProviderType')} onClick={() => setIsMobileMenuOpen(false)} className="block">
                <Button className="w-full h-14 text-lg font-black bg-foreground text-background rounded-2xl shadow-xl">
                  Become a Provider
                </Button>
              </Link>

              <Link to={createPageUrl('SignIn')} onClick={() => setIsMobileMenuOpen(false)} className="block">
                <Button variant="outline" className="w-full h-14 text-lg font-bold border-border text-foreground hover:bg-muted rounded-2xl">
                  Client Sign In
                </Button>
              </Link>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, X, Scissors, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';

function navHref(path) {
  return path.startsWith('/') ? path : createPageUrl(path);
}

function isNavActive(pathname, path) {
  if (!path) return false;
  const href = navHref(path);
  return pathname === href || (href !== '/' && pathname.startsWith(href));
}

function isNavGroupActive(pathname, item) {
  if (item.path && isNavActive(pathname, item.path)) return true;
  if (item.children?.some((child) => isNavActive(pathname, child.path))) return true;
  return false;
}

function NavDropdown({ label, items, pathname: _pathname, isActive, align = 'left' }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDocClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex items-center gap-1 px-3.5 py-2 text-sm font-semibold rounded-lg transition-all ${
          isActive || open
            ? 'text-foreground bg-muted/50'
            : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
        }`}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className={`absolute top-full mt-2 w-52 rounded-xl border border-border bg-background shadow-xl py-2 z-50 ${
            align === 'right' ? 'right-0' : 'left-0'
          }`}
        >
          {items.map((item) => (
            <Link
              key={item.path}
              to={navHref(item.path)}
              className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60"
              onClick={() => setOpen(false)}
            >
              {item.label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Navbar({ navLinks, businessLinks = [] }) {
  const { isAuthenticated } = useAuth();
  const showBusinessNav = businessLinks.length > 0;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState(null);
  const location = useLocation();

  const navItems = navLinks || [
    { label: 'Find Barbers', children: [{ label: 'Explore', path: 'Explore' }] },
    { label: 'Shop Products', path: 'Marketplace' },
    { label: 'Help Center', path: 'HelpCenter' },
  ];

  useEffect(() => {
    if (!isMobileMenuOpen) return undefined;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isMobileMenuOpen]);

  useEffect(() => {
    setIsMobileMenuOpen(false);
    setMobileExpanded(null);
  }, [location.pathname]);

  const businessActive = businessLinks.some((item) => isNavActive(location.pathname, item.path));

  return (
    <>
      <div className="hidden sm:block bg-[hsl(var(--navy))] text-white/90 text-center text-xs font-semibold py-2 px-4 safe-area-pt border-b border-white/10">
        <span className="inline-flex items-center gap-2 flex-wrap justify-center">
          <span className="text-primary font-bold">NEW</span>
          WELCOME5 — €5 off your first booking
          <Link to={createPageUrl('Explore')} className="underline underline-offset-2 hover:text-primary transition-colors">
            Book now →
          </Link>
        </span>
      </div>
    <header className="sticky top-0 z-50 w-full stb-glass border-b border-border/80 safe-area-pt">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-[4.5rem]">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2.5 group shrink-0">
            <div className="w-9 h-9 bg-primary text-primary-foreground rounded-[13px] flex items-center justify-center group-hover:scale-105 transition-transform shadow-sm shadow-primary/15">
              <Scissors className="w-4 h-4 transform -rotate-45" />
            </div>
            <span className="text-lg font-bold text-foreground tracking-tight hidden sm:inline">ShopTheBarber</span>
          </Link>

          <nav className="hidden lg:flex items-center gap-1">
            {navItems.map((item) =>
              item.children?.length ? (
                <NavDropdown
                  key={item.label}
                  label={item.label}
                  items={item.children}
                  pathname={location.pathname}
                  isActive={isNavGroupActive(location.pathname, item)}
                />
              ) : (
                <Link
                  key={item.path}
                  to={navHref(item.path)}
                  className={`px-3.5 py-2 text-sm font-semibold rounded-lg transition-colors whitespace-nowrap ${
                    isNavActive(location.pathname, item.path)
                      ? 'text-foreground bg-muted/50'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                  }`}
                >
                  {item.label}
                </Link>
              ),
            )}

            {showBusinessNav && (
              <NavDropdown
                label="For Barbers"
                items={businessLinks}
                pathname={location.pathname}
                isActive={businessActive}
                align="right"
              />
            )}
          </nav>

          <div className="hidden lg:flex items-center gap-3 ml-4 pl-4 border-l border-border shrink-0">
            {isAuthenticated ? (
              <>
                <Link
                  to={createPageUrl('Dashboard')}
                  className="text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  Dashboard
                </Link>
                <Button asChild className="rounded-xl px-5 h-10 font-semibold stb-btn-primary">
                  <Link to={createPageUrl('Explore')}>Book a barber</Link>
                </Button>
              </>
            ) : (
              <>
                <Link
                  to={createPageUrl('SignIn')}
                  className="text-sm font-semibold text-muted-foreground hover:text-foreground"
                >
                  Sign In
                </Link>
                <Button asChild className="rounded-xl px-5 h-10 font-semibold stb-btn-primary">
                  <Link to={createPageUrl('Explore')}>Book a barber</Link>
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="lg:hidden p-2.5 text-foreground hover:bg-muted rounded-xl transition-all"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 border-b border-border bg-background/98 backdrop-blur-xl shadow-lg max-h-[85vh] overflow-y-auto">
          <div className="px-4 py-6 space-y-1">
            {navItems.map((item) =>
              item.children?.length ? (
                <div key={item.label}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-base font-semibold text-foreground rounded-xl hover:bg-muted/50"
                    onClick={() => setMobileExpanded(mobileExpanded === item.label ? null : item.label)}
                  >
                    {item.label}
                    <ChevronDown className={`w-5 h-5 transition-transform ${mobileExpanded === item.label ? 'rotate-180' : ''}`} />
                  </button>
                  {mobileExpanded === item.label && (
                    <div className="pl-4 pb-2 space-y-0.5">
                      {item.children.map((child) => (
                        <Link
                          key={child.path}
                          to={navHref(child.path)}
                          className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg"
                          onClick={() => setIsMobileMenuOpen(false)}
                        >
                          {child.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  key={item.path}
                  to={navHref(item.path)}
                  className="block px-4 py-3 text-base font-semibold text-foreground rounded-xl hover:bg-muted/50"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ),
            )}

            {showBusinessNav && (
              <div className="pt-2 mt-2 border-t border-border">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-base font-semibold text-foreground rounded-xl hover:bg-muted/50"
                  onClick={() => setMobileExpanded(mobileExpanded === 'business' ? null : 'business')}
                >
                  For Barbers
                  <ChevronDown className={`w-5 h-5 transition-transform ${mobileExpanded === 'business' ? 'rotate-180' : ''}`} />
                </button>
                {mobileExpanded === 'business' && (
                  <div className="pl-4 pb-2 space-y-0.5">
                    {businessLinks.map((item) => (
                      <Link
                        key={item.path}
                        to={navHref(item.path)}
                        className="block px-4 py-2.5 text-sm font-medium text-muted-foreground hover:text-foreground rounded-lg"
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-border space-y-2">
              {isAuthenticated ? (
                <>
                  <Button asChild className="w-full h-12 rounded-xl font-semibold">
                    <Link to={createPageUrl('Explore')} onClick={() => setIsMobileMenuOpen(false)}>
                      Book a barber
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full h-12 rounded-xl font-semibold">
                    <Link to={createPageUrl('Dashboard')} onClick={() => setIsMobileMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild className="w-full h-12 rounded-xl font-semibold">
                    <Link to={createPageUrl('Explore')} onClick={() => setIsMobileMenuOpen(false)}>
                      Book a barber
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full h-12 rounded-xl font-semibold">
                    <Link to={createPageUrl('SignIn')} onClick={() => setIsMobileMenuOpen(false)}>
                      Sign In
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
    </>
  );
}

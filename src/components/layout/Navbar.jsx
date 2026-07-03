import { useState, useEffect, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Menu, X, Scissors, ChevronDown } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/lib/AuthContext';
import { stb } from '@/lib/stbUi';
import { cn } from '@/lib/utils';

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
        className={cn(
          'flex items-center gap-1 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider font-sans transition-colors rounded-lg',
          isActive || open
            ? 'text-primary border-l-2 border-primary pl-3'
            : 'text-white/70 hover:text-white hover:bg-white/10',
        )}
        aria-expanded={open}
        aria-haspopup="true"
      >
        {label}
        <ChevronDown className={`w-4 h-4 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div
          className={cn(
            'absolute top-full mt-2 w-52 rounded-lg border border-white/10 bg-[hsl(var(--navy))] shadow-elevation-md py-1.5 z-50 font-sans',
            align === 'right' ? 'right-0' : 'left-0',
          )}
        >
          {items.map((item) => (
            <Link
              key={item.path}
              to={navHref(item.path)}
              className="block px-4 py-2 text-sm font-medium font-sans text-white/75 hover:text-primary hover:bg-white/5 transition-colors rounded-md mx-1"
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
      <div className="hidden sm:block bg-[hsl(var(--navy))] text-white/90 text-center text-xs font-semibold font-sans py-2 px-4 safe-area-pt border-b border-white/10">
        <span className="inline-flex items-center gap-2 flex-wrap justify-center">
          <span className="text-primary font-bold">NEW</span>
          WELCOME5 — €5 off your first booking
          <Link to={createPageUrl('Explore')} className="underline underline-offset-2 hover:text-primary transition-colors">
            Book now →
          </Link>
        </span>
      </div>
    <header className={cn('sticky top-0 z-50 w-full safe-area-pt font-sans', stb.glass)}>
      <div className={cn(stb.container, 'max-w-7xl')}>
        <div className="flex items-center justify-between h-16 lg:h-[4.5rem]">
          <Link to={createPageUrl('Home')} className="flex items-center gap-2.5 group shrink-0" aria-label="ShopTheBarber home">
            <div className="w-9 h-9 bg-primary text-primary-foreground rounded-lg border border-white/20 flex items-center justify-center group-hover:scale-105 transition-transform">
              <Scissors className="w-4 h-4 transform -rotate-45" aria-hidden />
            </div>
            <span className="text-lg font-display uppercase tracking-wider text-white hidden sm:inline">ShopTheBarber</span>
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
                  className={cn(
                    'px-3.5 py-2 text-xs font-semibold uppercase tracking-wider font-sans transition-colors whitespace-nowrap rounded-lg',
                    isNavActive(location.pathname, item.path)
                      ? 'text-primary border-l-2 border-primary pl-3'
                      : 'text-white/70 hover:text-white hover:bg-white/10',
                  )}
                >
                  {isNavActive(location.pathname, item.path) ? `[${item.label}]` : item.label}
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

          <div className="hidden lg:flex items-center gap-3 ml-4 pl-4 border-l border-white/15 shrink-0">
            {isAuthenticated ? (
              <>
                <Link
                  to={createPageUrl('Dashboard')}
                  className="text-xs font-semibold uppercase tracking-wider font-sans text-white/70 hover:text-white rounded-lg px-2 py-1"
                >
                  Dashboard
                </Link>
                <Button asChild className={cn('px-5 h-10', stb.btn)}>
                  <Link to={createPageUrl('Explore')}>Book now</Link>
                </Button>
              </>
            ) : (
              <>
                <Link
                  to={createPageUrl('SignIn')}
                  className="text-xs font-semibold uppercase tracking-wider font-sans text-white/70 hover:text-white rounded-lg px-2 py-1"
                >
                  Sign In
                </Link>
                <Button asChild className={cn('px-5 h-10', stb.btn)}>
                  <Link to={createPageUrl('Explore')}>Book now</Link>
                </Button>
              </>
            )}
          </div>

          <button
            type="button"
            className="lg:hidden p-2.5 text-white hover:bg-white/10 rounded-lg transition-colors font-sans"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
            aria-expanded={isMobileMenuOpen}
          >
            {isMobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="lg:hidden absolute top-full left-0 right-0 border-b border-white/10 bg-[hsl(var(--navy))] shadow-lg max-h-[85vh] overflow-y-auto font-sans">
          <div className="px-4 py-6 space-y-1">
            {navItems.map((item) =>
              item.children?.length ? (
                <div key={item.label}>
                  <button
                    type="button"
                    className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold uppercase tracking-wider text-white rounded-lg hover:bg-white/10"
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
                          className={cn(
                            'block px-4 py-2.5 text-xs font-semibold uppercase tracking-wider rounded-lg',
                            isNavActive(location.pathname, child.path)
                              ? 'text-primary border-l-2 border-primary pl-3'
                              : 'text-white/70 hover:text-primary hover:bg-white/5',
                          )}
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
                  className={cn(
                    'block px-4 py-3 text-sm font-semibold uppercase tracking-wider rounded-lg hover:bg-white/10',
                    isNavActive(location.pathname, item.path)
                      ? 'text-primary border-l-2 border-primary pl-3'
                      : 'text-white',
                  )}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ),
            )}

            {showBusinessNav && (
              <div className="pt-2 mt-2 border-t border-white/10">
                <button
                  type="button"
                  className="flex w-full items-center justify-between px-4 py-3 text-base font-semibold text-white rounded-lg hover:bg-white/10"
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
                        className={cn(
                          'block px-4 py-2.5 text-sm font-medium rounded-lg',
                          isNavActive(location.pathname, item.path)
                            ? 'text-primary border-l-2 border-primary pl-3'
                            : 'text-white/70 hover:text-primary hover:bg-white/5',
                        )}
                        onClick={() => setIsMobileMenuOpen(false)}
                      >
                        {item.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}

            <div className="pt-4 mt-4 border-t border-white/10 space-y-2">
              {isAuthenticated ? (
                <>
                  <Button asChild className="w-full h-12">
                    <Link to={createPageUrl('Explore')} onClick={() => setIsMobileMenuOpen(false)}>
                      Book now
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full h-12 border-white/30 text-white hover:bg-white/10">
                    <Link to={createPageUrl('Dashboard')} onClick={() => setIsMobileMenuOpen(false)}>
                      Dashboard
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button asChild className="w-full h-12">
                    <Link to={createPageUrl('Explore')} onClick={() => setIsMobileMenuOpen(false)}>
                      Book now
                    </Link>
                  </Button>
                  <Button asChild variant="outline" className="w-full h-12 border-white/30 text-white hover:bg-white/10">
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

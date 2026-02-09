import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export default function PublicLayout({ children }) {
  const navLinks = [
    { label: 'Home', path: 'Home' },
    { label: 'Find a Barber', path: 'Explore' },
    { label: 'Marketplace', path: 'Marketplace' },
    { label: 'Careers', path: 'CareerHub' },
    { label: 'About', path: 'About' },
    { label: 'Help', path: 'HelpCenter' },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-background text-foreground transition-colors duration-300">
      <Navbar navLinks={navLinks} />

      {/* Main Content */}
      <main id="main-content" className="flex-1 focus:outline-none" tabIndex="-1">
        {children}
      </main>

      <Footer />
    </div>
  );
}
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Scissors, Twitter, Instagram, Linkedin, Facebook, Mail, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-muted border-t border-border pt-16 pb-8 text-gray-900">
      <div className="container mx-auto px-6 md:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
          {/* Brand Column */}
          <div className="space-y-6">
            <Link to={createPageUrl('Home')} className="flex items-center gap-2 font-bold text-2xl tracking-tighter text-gray-900 hover:opacity-90">
              <div className="w-10 h-10 bg-primary text-primary-foreground rounded-xl flex items-center justify-center shadow-md">
                <Scissors className="w-6 h-6 transform -rotate-45" />
              </div>
              <span>ShopTheBarber</span>
            </Link>
            <p className="text-sm leading-relaxed max-w-xs text-gray-700">
              The premium booking platform for modern grooming. Connect with top barbers, discover new styles, and elevate your daily routine.
            </p>
            <div className="flex gap-3">
              {[Twitter, Instagram, Linkedin, Facebook].map((Icon, i) => (
                <a key={i} href="#" className="w-10 h-10 rounded-full bg-white border border-gray-300 text-gray-700 flex items-center justify-center hover:bg-primary hover:text-primary-foreground hover:border-primary transition-colors shadow-sm" aria-label="Social link">
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-gray-900 font-bold mb-6">Platform</h4>
            <ul className="space-y-4 text-sm text-gray-700">
              <li><Link to={createPageUrl('Explore')} className="hover:text-primary transition-colors">Browse Barbers</Link></li>
              <li><Link to={createPageUrl('Marketplace')} className="hover:text-primary transition-colors">Marketplace</Link></li>
              <li><Link to={createPageUrl('CareerHub')} className="hover:text-primary transition-colors">Careers</Link></li>
              <li><Link to={createPageUrl('SelectProviderType')} className="hover:text-primary transition-colors">For Business</Link></li>
              <li><Link to={createPageUrl('ServicesPricing')} className="hover:text-primary transition-colors">Pricing</Link></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="text-gray-900 font-bold mb-6">Support</h4>
            <ul className="space-y-4 text-sm text-gray-700">
              <li><Link to={createPageUrl('HelpCenter')} className="hover:text-primary transition-colors">Help Center</Link></li>
              <li><Link to={createPageUrl('HelpCenter')} className="hover:text-primary transition-colors">Contact Us</Link></li>
              <li><Link to={createPageUrl('Privacy')} className="hover:text-primary transition-colors">Privacy Policy</Link></li>
              <li><Link to={createPageUrl('TermsOfService')} className="hover:text-primary transition-colors">Terms of Service</Link></li>
              <li><Link to={createPageUrl('ProviderTermsOfService')} className="hover:text-primary transition-colors text-gray-600 text-xs">Provider Terms</Link></li>
            </ul>
          </div>

          {/* Contact / CTA */}
          <div>
            <h4 className="text-gray-900 font-bold mb-6">Stay Connected</h4>
            <div className="space-y-4 text-sm text-gray-700 mb-6">
              <div className="flex items-start gap-3">
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span>123 Grooming Blvd, Suite 100<br/>San Francisco, CA 94103</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail className="w-5 h-5 text-primary shrink-0" />
                <span>hello@shopthebarber.com</span>
              </div>
            </div>
            <Button className="w-full bg-primary text-primary-foreground hover:opacity-95 font-semibold">
              Get the App
            </Button>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 border-t border-border flex flex-col md:flex-row justify-between items-center gap-4 text-xs text-gray-600">
          <p>&copy; {currentYear} ShopTheBarber Inc. All rights reserved.</p>
          <div className="flex gap-6">
             <Link to={createPageUrl('Privacy')} className="hover:text-primary transition-colors">Privacy</Link>
             <Link to={createPageUrl('TermsOfService')} className="hover:text-primary transition-colors">Terms</Link>
             <Link to={createPageUrl('Privacy')} className="hover:text-primary transition-colors">Cookies & Privacy</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
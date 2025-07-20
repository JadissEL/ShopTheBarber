import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Scissors, 
  Phone, 
  Mail, 
  MapPin, 
  Heart,
  Sparkles,
  Clock,
  Star,
  User
} from 'lucide-react';
import MoroccanPattern from "@/components/ui/MoroccanPattern";
import { MoroccanLantern, MoroccanArch, MoroccanScissors, MoroccanStar } from "@/components/ui/MoroccanIcons";

export const Footer: React.FC = () => (
  <footer className="w-full bg-white dark:bg-moroccan-darkgrey border-t border-gray-200 dark:border-moroccan-gold/10 py-8 px-4 mt-12">
    <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-center space-y-6 md:space-y-0">
      <div className="flex flex-col items-center md:items-start">
        <span className="font-heading text-xl font-bold text-moroccan-gold mb-2">ShopTheBarber</span>
        <span className="text-gray-500 dark:text-moroccan-sand text-sm">© {new Date().getFullYear()} Tous droits réservés.</span>
      </div>
      <div className="flex space-x-6">
        <a href="/about" className="text-gray-600 dark:text-moroccan-sand hover:text-moroccan-gold transition">À propos</a>
        <a href="/support" className="text-gray-600 dark:text-moroccan-sand hover:text-moroccan-gold transition">Support</a>
        <a href="/blog" className="text-gray-600 dark:text-moroccan-sand hover:text-moroccan-gold transition">Blog</a>
        <a href="/legal" className="text-gray-600 dark:text-moroccan-sand hover:text-moroccan-gold transition">Mentions légales</a>
      </div>
      <div className="flex space-x-4">
        <a href="https://facebook.com" aria-label="Facebook" className="text-gray-400 hover:text-moroccan-gold transition"><svg width="20" height="20" fill="currentColor"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v7h4v-7h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg></a>
        <a href="https://twitter.com" aria-label="Twitter" className="text-gray-400 hover:text-moroccan-gold transition"><svg width="20" height="20" fill="currentColor"><path d="M20 3.9a8.1 8.1 0 0 1-2.3.6A4.1 4.1 0 0 0 19.4 2a8.2 8.2 0 0 1-2.6 1A4.1 4.1 0 0 0 9.8 7.1a11.7 11.7 0 0 1-8.5-4.3s-2 4.5 2.5 6.5A4.1 4.1 0 0 1 2 8.1v.1a4.1 4.1 0 0 0 3.3 4 4.1 4.1 0 0 1-1.8.1 4.1 4.1 0 0 0 3.8 2.8A8.2 8.2 0 0 1 0 18.1a11.6 11.6 0 0 0 6.3 1.9c7.5 0 11.6-6.2 11.6-11.6 0-.2 0-.4 0-.6A8.3 8.3 0 0 0 20 3.9z"/></svg></a>
        <a href="https://instagram.com" aria-label="Instagram" className="text-gray-400 hover:text-moroccan-gold transition"><svg width="20" height="20" fill="currentColor"><circle cx="10" cy="10" r="6"/><circle cx="15.5" cy="4.5" r="1.5"/></svg></a>
      </div>
    </div>
  </footer>
); 
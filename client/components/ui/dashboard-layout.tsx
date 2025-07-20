import React from "react";
import { Link, useLocation } from "react-router-dom";
import { Button } from "./button";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import { Home, Calendar, Users, Star, Settings, LogOut } from 'lucide-react';

interface DashboardLayoutProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  actions?: React.ReactNode;
  sidebarItems?: SidebarItem[];
  userRole?: 'admin' | 'barber' | 'client';
  notifications?: number;
}

interface SidebarItem {
  title: string;
  href: string;
  icon?: React.ReactNode;
  badge?: string | number;
  children?: SidebarItem[];
}

export const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  return (
    <div className="flex min-h-screen bg-gray-50 dark:bg-moroccan-charcoal">
      {/* Sidebar */}
      <aside className="w-64 bg-white dark:bg-moroccan-darkgrey shadow-lg flex flex-col py-6 px-4 space-y-6 rounded-r-3xl border-r border-gray-200 dark:border-moroccan-gold/20 sticky top-0 h-screen">
        <a href="/" className="flex items-center mb-8">
          <span className="font-heading text-2xl font-bold text-moroccan-gold tracking-tight">ShopTheBarber</span>
        </a>
        <nav className="flex-1 flex flex-col space-y-2">
          <a href="/dashboard" className="flex items-center px-4 py-2 rounded-lg hover:bg-moroccan-gold/10 text-gray-700 dark:text-moroccan-offwhite transition">
            <Home className="h-5 w-5 mr-3" /> Dashboard
          </a>
          <a href="/calendar" className="flex items-center px-4 py-2 rounded-lg hover:bg-moroccan-gold/10 text-gray-700 dark:text-moroccan-offwhite transition">
            <Calendar className="h-5 w-5 mr-3" /> Calendrier
          </a>
          <a href="/users" className="flex items-center px-4 py-2 rounded-lg hover:bg-moroccan-gold/10 text-gray-700 dark:text-moroccan-offwhite transition">
            <Users className="h-5 w-5 mr-3" /> Utilisateurs
          </a>
          <a href="/reviews" className="flex items-center px-4 py-2 rounded-lg hover:bg-moroccan-gold/10 text-gray-700 dark:text-moroccan-offwhite transition">
            <Star className="h-5 w-5 mr-3" /> Avis
          </a>
          <a href="/settings" className="flex items-center px-4 py-2 rounded-lg hover:bg-moroccan-gold/10 text-gray-700 dark:text-moroccan-offwhite transition">
            <Settings className="h-5 w-5 mr-3" /> Paramètres
          </a>
        </nav>
        <button className="flex items-center px-4 py-2 rounded-lg bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-300 hover:bg-red-100 dark:hover:bg-red-900/40 transition">
          <LogOut className="h-5 w-5 mr-3" /> Déconnexion
        </button>
      </aside>
      {/* Main content */}
      <main className="flex-1 p-8">{children}</main>
    </div>
  );
}; 
import "./global.css";
import React, { Suspense } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { FormShowcase } from "@/components/ui/form-showcase";
import { DashboardShowcase } from "@/components/ui/dashboard-showcase";
import { AuthProvider } from "./hooks/useFirebaseAuth";

// Lazy loaded components
const Index = React.lazy(() => import("./pages/Index"));
const Login = React.lazy(() => import("./pages/Login"));
const Signup = React.lazy(() => import("./pages/Signup"));
const Dashboard = React.lazy(() => import("./pages/Dashboard"));
const ClientDashboard = React.lazy(() => import("./pages/ClientDashboard"));
const BarberDashboard = React.lazy(() => import("./pages/BarberDashboard"));
const AdminDashboard = React.lazy(() => import("./pages/AdminDashboard"));
const ClientSettings = React.lazy(() => import("./pages/ClientSettings"));
const BarberSettings = React.lazy(() => import("./pages/BarberSettings"));
const AdminSettings = React.lazy(() => import("./pages/AdminSettings"));
const ClientReports = React.lazy(() => import("./pages/ClientReports"));
const BarberReports = React.lazy(() => import("./pages/BarberReports"));
const AdminReports = React.lazy(() => import("./pages/AdminReports"));
const CityBarbers = React.lazy(() => import("./pages/CityBarbers"));
const BarberServices = React.lazy(() => import("./pages/BarberServices"));
const BarberEarnings = React.lazy(() => import("./pages/BarberEarnings"));
const Reservations = React.lazy(() => import("./pages/Reservations"));
const Blog = React.lazy(() => import("./pages/Blog"));
const Marketplace = React.lazy(() => import("./pages/Marketplace"));
const NotFound = React.lazy(() => import("./pages/NotFound"));
const AdminUsers = React.lazy(() => import("./pages/AdminUsers"));
const AdminBarbers = React.lazy(() => import("./pages/AdminBarbers"));
const AdminModeration = React.lazy(() => import("./pages/AdminModeration"));
const AdminAnalytics = React.lazy(() => import("./pages/AdminAnalytics"));

const queryClient = new QueryClient();

export const App = () => {
  React.useEffect(() => {
    // Global fetch interceptor for demo mode
    const originalFetch = window.fetch;
    window.fetch = (...args) => {
      const url = args[0];
      if (typeof url === "string" && url.includes("/api/")) {
        console.log("Demo mode: Blocked API call to", url);
        return Promise.reject(new Error("API calls disabled in demo mode"));
      }
      return originalFetch.apply(window, args);
    };

    if ("Notification" in window && Notification.permission !== "granted") {
      Notification.requestPermission().then((permission) => {
        if (permission === "granted") {
          new Notification("Bienvenue sur ShopTheBarber !", {
            body: "Vous recevrez désormais des rappels et offres exclusives.",
            icon: "/public/favicon.ico",
          });
        }
      });
    }
  }, []);

  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router>
            <Suspense
              fallback={
                <div className="min-h-screen bg-moroccan-charcoal flex items-center justify-center">
                  <div className="text-center space-y-6 fade-in">
                    <div className="w-20 h-20 mx-auto bg-moroccan-gradient-primary rounded-2xl flex items-center justify-center shadow-xl shadow-moroccan-gold/20">
                      <div className="w-8 h-8 border-3 border-moroccan-charcoal border-t-transparent rounded-full animate-spin"></div>
                    </div>
                    <div className="space-y-2">
                      <h2 className="text-2xl font-bold text-white font-heading">
                        ShopTheBarber
                      </h2>
                      <p className="text-white animate-pulse">
                        Chargement de votre expérience premium...
                      </p>
                      <div className="w-32 h-1 bg-moroccan-darkgrey rounded-full mx-auto overflow-hidden">
                        <div className="h-full bg-moroccan-gradient-primary rounded-full animate-pulse"></div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            >
              <Routes>
                <Route path="/" element={<Index />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route
                  path="/client-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["client"]}>
                      <ClientDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/barber-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["barber"]}>
                      <BarberDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin-dashboard"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/client-settings"
                  element={
                    <ProtectedRoute allowedRoles={["client"]}>
                      <ClientSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/barber-settings"
                  element={
                    <ProtectedRoute allowedRoles={["barber"]}>
                      <BarberSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin-settings"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminSettings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/client-reports"
                  element={
                    <ProtectedRoute allowedRoles={["client"]}>
                      <ClientReports />
                    </ProtectedRoute>
                  }
                />
                <Route path="/barber-reports" element={<BarberReports />} />
                <Route
                  path="/barber-services"
                  element={
                    <ProtectedRoute allowedRoles={["barber"]}>
                      <BarberServices />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/barber-earnings"
                  element={
                    <ProtectedRoute allowedRoles={["barber"]}>
                      <BarberEarnings />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/reservations"
                  element={
                    <ProtectedRoute allowedRoles={["client"]}>
                      <Reservations />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/admin-reports"
                  element={
                    <ProtectedRoute allowedRoles={["admin"]}>
                      <AdminReports />
                    </ProtectedRoute>
                  }
                />
                <Route path="/blog" element={<Blog />} />
                <Route path="/marketplace" element={<Marketplace />} />
                <Route path="/form-showcase" element={<FormShowcase />} />
                <Route
                  path="/dashboard-showcase"
                  element={<DashboardShowcase />}
                />
                <Route path="/city/:city" element={<CityBarbers />} />
                <Route path="/admin/users" element={<AdminUsers />} />
                <Route path="/admin/barbers" element={<AdminBarbers />} />
                <Route path="/admin/moderation" element={<AdminModeration />} />
                <Route path="/admin/analytics" element={<AdminAnalytics />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </Suspense>
          </Router>
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
};

// Only render to DOM if we're in a browser environment
if (typeof document !== 'undefined') {
  createRoot(document.getElementById("root")!).render(<App />);
}

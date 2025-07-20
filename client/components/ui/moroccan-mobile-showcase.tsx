import * as React from "react";
import { Zap } from "lucide-react";
import { useResponsive } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { MobileNav } from "@/components/ui/mobile-nav";
import { MobileCarousel } from "@/components/ui/mobile-carousel";

export function MoroccanMobileShowcase() {
  const { breakpoint, isMobile, isTablet, isDesktop, isTouch, isLandscape } = useResponsive();
  const [activeTab, setActiveTab] = React.useState("features");

  const carouselItems = [
    <div key="1" className="h-64 bg-moroccan-gradient-primary rounded-lg flex items-center justify-center">
      <div className="text-center text-moroccan-charcoal">
        <h3 className="text-xl font-bold mb-2">Slide 1</h3>
        <p>Touch to swipe</p>
      </div>
    </div>,
    <div key="2" className="h-64 bg-moroccan-gradient-secondary rounded-lg flex items-center justify-center">
      <div className="text-center text-moroccan-charcoal">
        <h3 className="text-xl font-bold mb-2">Slide 2</h3>
        <p>Premium styling</p>
      </div>
    </div>,
    <div key="3" className="h-64 bg-gradient-to-br from-moroccan-green to-moroccan-gold rounded-lg flex items-center justify-center">
      <div className="text-center text-moroccan-charcoal">
        <h3 className="text-xl font-bold mb-2">Slide 3</h3>
        <p>Moroccan design</p>
      </div>
    </div>,
  ];

  const tabs = [
    { id: "features", label: "Fonctionnalités", icon: Zap },
    { id: "responsive", label: "Responsive", icon: Zap },
    { id: "touch", label: "Touch", icon: Touch },
  ];

  return (
    <div className="w-full bg-moroccan-charcoal text-moroccan-offwhite">
      {/* Header */}
      <div className="container mx-auto px-4 py-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4 bg-moroccan-gradient-primary bg-clip-text text-transparent">
            Expérience Mobile Premium
          </h2>
          <p className="text-moroccan-sand text-lg max-w-2xl mx-auto">
            Découvrez notre interface mobile optimisée avec des interactions tactiles fluides et un design responsive élégant
          </p>
        </div>

        {/* Device Status */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <div className="bg-moroccan-darkgrey rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">📱</div>
            <p className="text-sm font-medium">Breakpoint</p>
            <p className="text-lg font-bold text-moroccan-gold">{breakpoint}</p>
          </div>
          <div className="bg-moroccan-darkgrey rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">🖥️</div>
            <p className="text-sm font-medium">Device</p>
            <p className="text-lg font-bold text-moroccan-green">
              {isMobile ? "Mobile" : isTablet ? "Tablet" : "Desktop"}
            </p>
          </div>
          <div className="bg-moroccan-darkgrey rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">👆</div>
            <p className="text-sm font-medium">Touch</p>
            <p className="text-lg font-bold text-moroccan-sand">
              {isTouch ? "Oui" : "Non"}
            </p>
          </div>
          <div className="bg-moroccan-darkgrey rounded-lg p-4 text-center">
            <div className="text-3xl mb-2">📱</div>
            <p className="text-sm font-medium">Orientation</p>
            <p className="text-lg font-bold text-moroccan-gold">
              {isLandscape ? "Paysage" : "Portrait"}
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-moroccan-darkgrey rounded-lg p-1">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={cn(
                    "flex items-center space-x-2 px-4 py-2 rounded-md transition-all duration-300",
                    activeTab === tab.id
                      ? "bg-moroccan-gradient-primary text-moroccan-charcoal shadow-lg"
                      : "text-moroccan-sand hover:text-moroccan-offwhite"
                  )}
                >
                  <Icon className="h-4 w-4" />
                  <span className="font-medium">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Content */}
        <div className="space-y-8">
          {activeTab === "features" && (
            <div className="grid md:grid-cols-2 gap-8">
              {/* Mobile Navigation */}
              <div className="bg-moroccan-darkgrey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-moroccan-gold">Navigation Mobile</h3>
                <div className="flex justify-center mb-4">
                  <MobileNav />
                </div>
                <p className="text-moroccan-sand text-sm">
                  Menu latéral avec animations fluides et design premium
                </p>
              </div>

              {/* Touch Carousel */}
              <div className="bg-moroccan-darkgrey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-moroccan-gold">Carousel Tactile</h3>
                <div className="mb-4">
                  <MobileCarousel items={carouselItems} />
                </div>
                <p className="text-moroccan-sand text-sm">
                  Swipez pour naviguer avec des gestes tactiles naturels
                </p>
              </div>
            </div>
          )}

          {activeTab === "responsive" && (
            <div className="grid md:grid-cols-3 gap-6">
              <div className="bg-moroccan-darkgrey rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-moroccan-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-2xl">📱</div>
                </div>
                <h3 className="text-lg font-bold mb-2 text-moroccan-gold">Mobile First</h3>
                <p className="text-moroccan-sand text-sm">
                  Design optimisé pour les écrans tactiles avec une navigation intuitive
                </p>
              </div>
              <div className="bg-moroccan-darkgrey rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-moroccan-gradient-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-2xl">📱</div>
                </div>
                <h3 className="text-lg font-bold mb-2 text-moroccan-gold">Tablet Ready</h3>
                <p className="text-moroccan-sand text-sm">
                  Interface adaptative qui s'ajuste parfaitement aux tablettes
                </p>
              </div>
              <div className="bg-moroccan-darkgrey rounded-lg p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-moroccan-green to-moroccan-gold rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-2xl">🖥️</div>
                </div>
                <h3 className="text-lg font-bold mb-2 text-moroccan-gold">Desktop Enhanced</h3>
                <p className="text-moroccan-sand text-sm">
                  Expérience complète sur desktop avec toutes les fonctionnalités
                </p>
              </div>
            </div>
          )}

          {activeTab === "touch" && (
            <div className="grid md:grid-cols-2 gap-8">
              <div className="bg-moroccan-darkgrey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-moroccan-gold">Gestes Tactiles</h3>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-moroccan-green/20 rounded-full flex items-center justify-center">
                      <div className="text-lg">👆</div>
                    </div>
                    <div>
                      <p className="font-medium text-moroccan-offwhite">Swipe</p>
                      <p className="text-sm text-moroccan-sand">Navigation fluide</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-moroccan-gold/20 rounded-full flex items-center justify-center">
                      <div className="text-lg">👆</div>
                    </div>
                    <div>
                      <p className="font-medium text-moroccan-offwhite">Tap</p>
                      <p className="text-sm text-moroccan-sand">Sélection rapide</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-moroccan-sand/20 rounded-full flex items-center justify-center">
                      <Zap className="h-5 w-5 text-moroccan-sand" />
                    </div>
                    <div>
                      <p className="font-medium text-moroccan-offwhite">Long Press</p>
                      <p className="text-sm text-moroccan-sand">Actions contextuelles</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-moroccan-darkgrey rounded-lg p-6">
                <h3 className="text-xl font-bold mb-4 text-moroccan-gold">Optimisations</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-moroccan-sand">Performance</span>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-2 h-2 bg-moroccan-gold rounded-full" />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-moroccan-sand">Accessibilité</span>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-2 h-2 bg-moroccan-green rounded-full" />
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-moroccan-sand">UX Mobile</span>
                    <div className="flex space-x-1">
                      {[1, 2, 3, 4, 5].map((i) => (
                        <div key={i} className="w-2 h-2 bg-moroccan-sand rounded-full" />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Call to Action */}
        <div className="text-center mt-12">
          <Button 
            size="lg"
            className="bg-moroccan-gradient-primary text-moroccan-charcoal hover:scale-105 transition-transform duration-300"
          >
            Tester l'Expérience Mobile
          </Button>
        </div>
      </div>
    </div>
  );
} 
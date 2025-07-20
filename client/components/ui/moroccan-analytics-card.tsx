import React from "react";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";
import MoroccanPattern from "@/components/ui/MoroccanPattern";
import { MoroccanLantern, MoroccanArch, MoroccanScissors, MoroccanStar } from "@/components/ui/MoroccanIcons";

interface MoroccanAnalyticsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  moroccanIcon?: 'lantern' | 'arch' | 'scissors' | 'star';
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info' | 'premium';
  className?: string;
  loading?: boolean;
  showPattern?: boolean;
  gradient?: boolean;
}

export const MoroccanAnalyticsCard: React.FC<MoroccanAnalyticsCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  moroccanIcon,
  trend = 'neutral',
  variant = 'default',
  className,
  loading = false,
  showPattern = false,
  gradient = false,
}) => {
  const getVariantColors = (variant: string) => {
    switch (variant) {
      case 'success':
        return {
          bg: 'bg-gradient-to-br from-moroccan-green/10 to-moroccan-green/5',
          border: 'border-moroccan-green/30',
          icon: 'text-moroccan-green',
          value: 'text-moroccan-green',
          change: 'text-moroccan-green',
          pattern: '#2D5A27',
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-br from-moroccan-gold/10 to-moroccan-gold/5',
          border: 'border-moroccan-gold/30',
          icon: 'text-moroccan-gold',
          value: 'text-moroccan-gold',
          change: 'text-moroccan-gold',
          pattern: '#C7A253',
        };
      case 'danger':
        return {
          bg: 'bg-gradient-to-br from-red-500/10 to-red-500/5',
          border: 'border-red-500/30',
          icon: 'text-red-500',
          value: 'text-red-500',
          change: 'text-red-500',
          pattern: '#DC2626',
        };
      case 'info':
        return {
          bg: 'bg-gradient-to-br from-moroccan-royal-blue/10 to-moroccan-royal-blue/5',
          border: 'border-moroccan-royal-blue/30',
          icon: 'text-moroccan-royal-blue',
          value: 'text-moroccan-royal-blue',
          change: 'text-moroccan-royal-blue',
          pattern: '#1E40AF',
        };
      case 'premium':
        return {
          bg: 'bg-gradient-to-br from-moroccan-gold/20 via-moroccan-copper/10 to-moroccan-gold/5',
          border: 'border-moroccan-gold/40',
          icon: 'text-moroccan-gold',
          value: 'text-moroccan-gold',
          change: 'text-moroccan-gold',
          pattern: '#C7A253',
        };
      default:
        return {
          bg: 'bg-gradient-to-br from-moroccan-charcoal/5 to-moroccan-charcoal/2',
          border: 'border-moroccan-gold/20',
          icon: 'text-moroccan-gold',
          value: 'text-moroccan-charcoal',
          change: 'text-moroccan-gold',
          pattern: '#C7A253',
        };
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return (
          <svg className="h-4 w-4 text-moroccan-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'down':
        return (
          <svg className="h-4 w-4 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4 text-moroccan-darkgrey" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  const getMoroccanIcon = (iconType?: string) => {
    switch (iconType) {
      case 'lantern':
        return <MoroccanLantern size={24} color="currentColor" />;
      case 'arch':
        return <MoroccanArch size={24} color="currentColor" />;
      case 'scissors':
        return <MoroccanScissors size={24} color="currentColor" />;
      case 'star':
        return <MoroccanStar size={24} color="currentColor" />;
      default:
        return icon;
    }
  };

  const colors = getVariantColors(variant);

  if (loading) {
    return (
      <Card className={cn("bg-white shadow-moroccan animate-pulse", className)}>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="h-4 bg-moroccan-charcoal/20 rounded w-24"></div>
            <div className="h-10 w-10 bg-moroccan-gold/20 rounded-lg"></div>
          </div>
          <div className="h-8 bg-moroccan-charcoal/20 rounded w-20 mb-2"></div>
          <div className="h-3 bg-moroccan-charcoal/20 rounded w-16"></div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-moroccan-xl",
      gradient ? "bg-gradient-to-br from-white to-moroccan-cream/30" : "bg-white",
      colors.border,
      "shadow-moroccan hover:shadow-moroccan-lg",
      className
    )}>
      {/* Moroccan Pattern Background */}
      {showPattern && (
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <MoroccanPattern 
            color={colors.pattern} 
            opacity={0.08} 
            size={64} 
            className="w-full h-full" 
          />
        </div>
      )}

      {/* Gradient Overlay for Premium */}
      {variant === 'premium' && (
        <div className="absolute inset-0 bg-gradient-to-br from-moroccan-gold/5 via-transparent to-moroccan-copper/5 pointer-events-none" />
      )}

      <CardContent className="p-6 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-moroccan-darkgrey">
            {title}
          </h3>
          <div className={cn(
            "h-10 w-10 rounded-lg flex items-center justify-center transition-all duration-300",
            colors.bg,
            "hover:scale-110"
          )}>
            <span className={cn(colors.icon, "transition-colors duration-300")}>
              {getMoroccanIcon(moroccanIcon)}
            </span>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline space-x-2">
            <p className={cn(
              "text-2xl font-bold transition-colors duration-300",
              colors.value
            )}>
              {value}
            </p>
            {change !== undefined && (
              <div className="flex items-center space-x-1">
                {getTrendIcon(trend)}
                <span className={cn(
                  "text-sm font-medium transition-colors duration-300",
                  colors.change
                )}>
                  {change > 0 ? '+' : ''}{change}%
                </span>
              </div>
            )}
          </div>

          {changeLabel && (
            <p className="text-xs text-moroccan-darkgrey">
              {changeLabel}
            </p>
          )}
        </div>

        {/* Decorative Moroccan Border */}
        {variant === 'premium' && (
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-moroccan-gold via-moroccan-copper to-moroccan-gold" />
        )}
      </CardContent>
    </Card>
  );
}; 
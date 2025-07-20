import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { cn } from "@/lib/utils";
import MoroccanPattern from "@/components/ui/MoroccanPattern";

interface MoroccanChartContainerProps {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  actions?: React.ReactNode;
  periodOptions?: { value: string; label: string }[];
  selectedPeriod?: string;
  onPeriodChange?: (period: string) => void;
  loading?: boolean;
  error?: string;
  emptyMessage?: string;
  showLegend?: boolean;
  legendItems?: Array<{
    label: string;
    color: string;
    value?: string | number;
  }>;
  variant?: 'default' | 'premium' | 'success' | 'warning';
  showPattern?: boolean;
  gradient?: boolean;
}

export const MoroccanChartContainer: React.FC<MoroccanChartContainerProps> = ({
  title,
  subtitle,
  children,
  className,
  actions,
  periodOptions = [],
  selectedPeriod,
  onPeriodChange,
  loading = false,
  error,
  emptyMessage = "Aucune donnée disponible",
  showLegend = false,
  legendItems = [],
  variant = 'default',
  showPattern = false,
  gradient = false,
}) => {
  const getVariantStyles = (variant: string) => {
    switch (variant) {
      case 'premium':
        return {
          bg: 'bg-gradient-to-br from-white via-moroccan-cream/20 to-white',
          border: 'border-moroccan-gold/30',
          title: 'text-moroccan-gold',
          subtitle: 'text-moroccan-darkgrey',
          pattern: '#C7A253',
        };
      case 'success':
        return {
          bg: 'bg-gradient-to-br from-white via-moroccan-green/10 to-white',
          border: 'border-moroccan-green/30',
          title: 'text-moroccan-green',
          subtitle: 'text-moroccan-darkgrey',
          pattern: '#2D5A27',
        };
      case 'warning':
        return {
          bg: 'bg-gradient-to-br from-white via-moroccan-copper/10 to-white',
          border: 'border-moroccan-copper/30',
          title: 'text-moroccan-copper',
          subtitle: 'text-moroccan-darkgrey',
          pattern: '#B45309',
        };
      default:
        return {
          bg: gradient ? 'bg-gradient-to-br from-white to-moroccan-cream/20' : 'bg-white',
          border: 'border-moroccan-charcoal/20',
          title: 'text-moroccan-charcoal',
          subtitle: 'text-moroccan-darkgrey',
          pattern: '#C7A253',
        };
    }
  };

  const styles = getVariantStyles(variant);

  return (
    <Card className={cn(
      "relative overflow-hidden transition-all duration-300 hover:shadow-moroccan-lg",
      styles.bg,
      styles.border,
      "shadow-moroccan",
      className
    )}>
      {/* Moroccan Pattern Background */}
      {showPattern && (
        <div className="absolute inset-0 opacity-3 pointer-events-none">
          <MoroccanPattern 
            color={styles.pattern} 
            opacity={0.05} 
            size={96} 
            className="w-full h-full" 
          />
        </div>
      )}

      <CardHeader className="pb-4 relative z-10">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className={cn(
              "text-lg font-semibold transition-colors duration-300",
              styles.title
            )}>
              {title}
            </CardTitle>
            {subtitle && (
              <p className={cn(
                "text-sm transition-colors duration-300",
                styles.subtitle
              )}>
                {subtitle}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {periodOptions.length > 0 && onPeriodChange && (
              <Select value={selectedPeriod} onValueChange={onPeriodChange}>
                <SelectTrigger className="w-32 border-moroccan-gold/30 bg-white/80 backdrop-blur-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {periodOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
            {actions}
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-0 relative z-10">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-moroccan-gold/20 border-t-moroccan-gold mx-auto"></div>
                <div className="absolute inset-0 rounded-full border-2 border-moroccan-copper/30 animate-ping"></div>
              </div>
              <p className="text-sm text-moroccan-darkgrey font-medium">Chargement des données...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="h-16 w-16 bg-red-100 rounded-full flex items-center justify-center mx-auto border-4 border-red-200">
                <svg className="h-8 w-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-moroccan-charcoal">Erreur de chargement</p>
                <p className="text-xs text-moroccan-darkgrey mt-1">{error}</p>
              </div>
              <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
                Réessayer
              </Button>
            </div>
          </div>
        )}

        {!loading && !error && (
          <>
            <div className="relative">
              {children}
            </div>

            {showLegend && legendItems.length > 0 && (
              <div className="mt-6 pt-4 border-t border-moroccan-charcoal/10">
                <div className="flex flex-wrap items-center gap-4">
                  {legendItems.map((item, index) => (
                    <div key={index} className="flex items-center space-x-2 group">
                      <div 
                        className="h-3 w-3 rounded-full transition-all duration-300 group-hover:scale-125"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-moroccan-darkgrey group-hover:text-moroccan-charcoal transition-colors duration-300">
                        {item.label}
                      </span>
                      {item.value && (
                        <span className="text-sm font-medium text-moroccan-charcoal">
                          ({item.value})
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </CardContent>

      {/* Decorative Moroccan Border for Premium */}
      {variant === 'premium' && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-moroccan-gold via-moroccan-copper to-moroccan-gold" />
      )}
    </Card>
  );
};

// Enhanced Moroccan Line Chart Component
interface MoroccanLineChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
  showGrid?: boolean;
  showPoints?: boolean;
  className?: string;
  variant?: 'default' | 'premium' | 'success' | 'warning';
  animated?: boolean;
}

export const MoroccanLineChart: React.FC<MoroccanLineChartProps> = ({
  data,
  height = 200,
  showGrid = true,
  showPoints = true,
  className,
  variant = 'default',
  animated = true,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center text-moroccan-darkgrey", className)} style={{ height }}>
        Aucune donnée disponible
      </div>
    );
  }

  const getVariantColors = (variant: string) => {
    switch (variant) {
      case 'premium':
        return {
          line: 'url(#moroccanGoldGradient)',
          point: 'hsl(var(--moroccan-gold))',
          grid: 'hsl(var(--moroccan-gold))',
        };
      case 'success':
        return {
          line: 'url(#moroccanGreenGradient)',
          point: 'hsl(var(--moroccan-green))',
          grid: 'hsl(var(--moroccan-green))',
        };
      case 'warning':
        return {
          line: 'url(#moroccanCopperGradient)',
          point: 'hsl(var(--moroccan-copper))',
          grid: 'hsl(var(--moroccan-copper))',
        };
      default:
        return {
          line: 'url(#moroccanDefaultGradient)',
          point: 'hsl(var(--moroccan-gold))',
          grid: 'hsl(var(--moroccan-gold))',
        };
    }
  };

  const colors = getVariantColors(variant);
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((point, index) => ({
    x: (index / (data.length - 1)) * 100,
    y: 100 - ((point.value - minValue) / range) * 100,
    ...point,
  }));

  const pathData = points
    .map((point, index) => `${index === 0 ? 'M' : 'L'} ${point.x}% ${point.y}%`)
    .join(' ');

  return (
    <div className={cn("relative", className)} style={{ height }}>
      <svg
        width="100%"
        height="100%"
        className="absolute inset-0"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        {/* Gradient Definitions */}
        <defs>
          <linearGradient id="moroccanDefaultGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--moroccan-gold))" />
            <stop offset="100%" stopColor="hsl(var(--moroccan-green))" />
          </linearGradient>
          <linearGradient id="moroccanGoldGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--moroccan-gold))" />
            <stop offset="50%" stopColor="hsl(var(--moroccan-copper))" />
            <stop offset="100%" stopColor="hsl(var(--moroccan-gold))" />
          </linearGradient>
          <linearGradient id="moroccanGreenGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--moroccan-green))" />
            <stop offset="100%" stopColor="hsl(var(--moroccan-green))" />
          </linearGradient>
          <linearGradient id="moroccanCopperGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--moroccan-copper))" />
            <stop offset="100%" stopColor="hsl(var(--moroccan-copper))" />
          </linearGradient>
        </defs>

        {/* Grid Lines */}
        {showGrid && (
          <g className="text-moroccan-charcoal/10">
            {[0, 25, 50, 75, 100].map((y) => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="currentColor"
                strokeWidth="0.5"
              />
            ))}
          </g>
        )}

        {/* Line Path */}
        <path
          d={pathData}
          fill="none"
          stroke={colors.line}
          strokeWidth="3"
          strokeLinecap="round"
          strokeLinejoin="round"
          className={animated ? "animate-dash" : ""}
          style={animated ? { strokeDasharray: "1000", strokeDashoffset: "1000", animation: "dash 2s ease-in-out forwards" } : {}}
        />

        {/* Data Points */}
        {showPoints && points.map((point, index) => (
          <circle
            key={index}
            cx={`${point.x}%`}
            cy={`${point.y}%`}
            r="3"
            fill={colors.point}
            stroke="white"
            strokeWidth="2"
            className={cn(
              "transition-all duration-300 hover:r-4",
              animated && "animate-pulse"
            )}
          />
        ))}
      </svg>

      {/* Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-moroccan-darkgrey">
        {data.map((point, index) => (
          <span key={index} className="text-center font-medium">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}; 
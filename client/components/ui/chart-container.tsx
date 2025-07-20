import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "./card";
import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { cn } from "@/lib/utils";

interface ChartContainerProps {
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
}

export const ChartContainer: React.FC<ChartContainerProps> = ({
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
}) => {
  return (
    <Card className={cn("bg-white shadow-moroccan", className)}>
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <CardTitle className="text-lg font-semibold text-moroccan-charcoal">
              {title}
            </CardTitle>
            {subtitle && (
              <p className="text-sm text-moroccan-darkgrey">
                {subtitle}
              </p>
            )}
          </div>
          
          <div className="flex items-center space-x-3">
            {periodOptions.length > 0 && onPeriodChange && (
              <Select value={selectedPeriod} onValueChange={onPeriodChange}>
                <SelectTrigger className="w-32">
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

      <CardContent className="pt-0">
        {loading && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-moroccan-gold mx-auto"></div>
              <p className="text-sm text-moroccan-darkgrey">Chargement des données...</p>
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-center justify-center h-64">
            <div className="text-center space-y-4">
              <div className="h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mx-auto">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
                    <div key={index} className="flex items-center space-x-2">
                      <div 
                        className="h-3 w-3 rounded-full"
                        style={{ backgroundColor: item.color }}
                      />
                      <span className="text-sm text-moroccan-darkgrey">
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
    </Card>
  );
};

// Simple Line Chart Component
interface SimpleLineChartProps {
  data: Array<{ label: string; value: number; color?: string }>;
  height?: number;
  showGrid?: boolean;
  showPoints?: boolean;
  className?: string;
}

export const SimpleLineChart: React.FC<SimpleLineChartProps> = ({
  data,
  height = 200,
  showGrid = true,
  showPoints = true,
  className,
}) => {
  if (!data || data.length === 0) {
    return (
      <div className={cn("flex items-center justify-center text-moroccan-darkgrey", className)} style={{ height }}>
        Aucune donnée disponible
      </div>
    );
  }

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
          stroke="url(#lineGradient)"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Gradient Definition */}
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="hsl(var(--moroccan-gold))" />
            <stop offset="100%" stopColor="hsl(var(--moroccan-green))" />
          </linearGradient>
        </defs>

        {/* Data Points */}
        {showPoints && points.map((point, index) => (
          <circle
            key={index}
            cx={`${point.x}%`}
            cy={`${point.y}%`}
            r="2"
            fill="hsl(var(--moroccan-gold))"
            stroke="white"
            strokeWidth="1"
            className="transition-all duration-200 hover:r-3"
          />
        ))}
      </svg>

      {/* Labels */}
      <div className="absolute bottom-0 left-0 right-0 flex justify-between text-xs text-moroccan-darkgrey">
        {data.map((point, index) => (
          <span key={index} className="text-center">
            {point.label}
          </span>
        ))}
      </div>
    </div>
  );
}; 
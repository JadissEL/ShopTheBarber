import React from "react";
import { Card, CardContent } from "./card";
import { Badge } from "./badge";
import { cn } from "@/lib/utils";

interface AnalyticsCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon?: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
  loading?: boolean;
}

export const AnalyticsCard: React.FC<AnalyticsCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  trend = 'neutral',
  variant = 'default',
  className,
  loading = false,
}) => {
  const getVariantColors = (variant: string) => {
    switch (variant) {
      case 'success':
        return {
          bg: 'bg-green-50',
          border: 'border-green-200',
          icon: 'text-green-600',
          value: 'text-green-900',
          change: 'text-green-600',
        };
      case 'warning':
        return {
          bg: 'bg-amber-50',
          border: 'border-amber-200',
          icon: 'text-amber-600',
          value: 'text-amber-900',
          change: 'text-amber-600',
        };
      case 'danger':
        return {
          bg: 'bg-red-50',
          border: 'border-red-200',
          icon: 'text-red-600',
          value: 'text-red-900',
          change: 'text-red-600',
        };
      case 'info':
        return {
          bg: 'bg-blue-50',
          border: 'border-blue-200',
          icon: 'text-blue-600',
          value: 'text-blue-900',
          change: 'text-blue-600',
        };
      default:
        return {
          bg: 'bg-moroccan-cream/30',
          border: 'border-moroccan-gold/20',
          icon: 'text-moroccan-gold',
          value: 'text-moroccan-charcoal',
          change: 'text-moroccan-gold',
        };
    }
  };

  const getTrendIcon = (trend: string) => {
    switch (trend) {
      case 'up':
        return (
          <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        );
      case 'down':
        return (
          <svg className="h-4 w-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0v-8m0 8l-8-8-4 4-6-6" />
          </svg>
        );
      default:
        return (
          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 12h14" />
          </svg>
        );
    }
  };

  const colors = getVariantColors(variant);

  if (loading) {
    return (
      <Card className={cn("bg-white shadow-moroccan", className)}>
        <CardContent className="p-6">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-4">
              <div className="h-4 bg-gray-200 rounded w-24"></div>
              <div className="h-8 w-8 bg-gray-200 rounded"></div>
            </div>
            <div className="h-8 bg-gray-200 rounded w-20 mb-2"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={cn(
      "bg-white shadow-moroccan hover:shadow-moroccan-lg transition-all duration-300 border",
      colors.border,
      className
    )}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-moroccan-darkgrey">
            {title}
          </h3>
          {icon && (
            <div className={cn(
              "h-8 w-8 rounded-lg flex items-center justify-center",
              colors.bg
            )}>
              <span className={colors.icon}>
                {icon}
              </span>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <div className="flex items-baseline space-x-2">
            <p className={cn(
              "text-2xl font-bold",
              colors.value
            )}>
              {value}
            </p>
            {change !== undefined && (
              <div className="flex items-center space-x-1">
                {getTrendIcon(trend)}
                <span className={cn(
                  "text-sm font-medium",
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
      </CardContent>
    </Card>
  );
}; 
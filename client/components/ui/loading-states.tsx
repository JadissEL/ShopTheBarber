import * as React from "react";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";

// 🎨 Moroccan Loading Spinner
interface LoadingSpinnerProps {
  size?: "sm" | "md" | "lg" | "xl";
  className?: string;
  text?: string;
}

export function LoadingSpinner({ 
  size = "md", 
  className,
  text = "Chargement..."
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "h-4 w-4",
    md: "h-6 w-6", 
    lg: "h-8 w-8",
    xl: "h-12 w-12"
  };

  return (
    <div className={cn("flex flex-col items-center justify-center space-y-3", className)}>
      <div className="relative">
        <Loader2 className={cn(
          "animate-spin text-moroccan-gold",
          sizeClasses[size]
        )} />
        <div className="absolute inset-0 animate-ping">
          <div className={cn(
            "rounded-full bg-moroccan-gold/20",
            size === "sm" ? "h-4 w-4" : 
            size === "md" ? "h-6 w-6" :
            size === "lg" ? "h-8 w-8" : "h-12 w-12"
          )} />
        </div>
      </div>
      {text && (
        <p className="text-sm text-moroccan-sand font-medium animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
}

// 🎨 Moroccan Skeleton Loader
interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string;
  height?: string;
}

export function Skeleton({ 
  className, 
  variant = "rectangular",
  width,
  height 
}: SkeletonProps) {
  const baseClasses = "animate-pulse bg-moroccan-darkgrey/50";
  
  const variantClasses = {
    text: "h-4 rounded",
    circular: "rounded-full",
    rectangular: "rounded-lg"
  };

  return (
    <div
      className={cn(
        baseClasses,
        variantClasses[variant],
        className
      )}
      style={{
        width: width || (variant === "circular" ? "40px" : "100%"),
        height: height || (variant === "circular" ? "40px" : "20px")
      }}
    />
  );
}

// 🎨 Moroccan Content Skeleton
interface ContentSkeletonProps {
  lines?: number;
  className?: string;
}

export function ContentSkeleton({ lines = 3, className }: ContentSkeletonProps) {
  return (
    <div className={cn("space-y-3", className)}>
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton
          key={i}
          variant="text"
          height={i === 0 ? "24px" : "16px"}
          width={i === lines - 1 ? "60%" : "100%"}
        />
      ))}
    </div>
  );
}

// 🎨 Moroccan Card Skeleton
interface CardSkeletonProps {
  showImage?: boolean;
  showActions?: boolean;
  className?: string;
}

export function CardSkeleton({ 
  showImage = true, 
  showActions = true,
  className 
}: CardSkeletonProps) {
  return (
    <div className={cn(
      "bg-moroccan-charcoal/50 border border-moroccan-darkgrey rounded-lg p-4",
      className
    )}>
      <div className="flex space-x-4">
        {showImage && (
          <Skeleton variant="circular" width="60px" height="60px" />
        )}
        <div className="flex-1 space-y-3">
          <Skeleton variant="text" height="20px" width="70%" />
          <Skeleton variant="text" height="16px" width="50%" />
          <Skeleton variant="text" height="16px" width="80%" />
        </div>
      </div>
      {showActions && (
        <div className="flex space-x-2 mt-4">
          <Skeleton variant="rectangular" width="80px" height="32px" />
          <Skeleton variant="rectangular" width="80px" height="32px" />
        </div>
      )}
    </div>
  );
}

// 🎨 Moroccan Progress Bar
interface ProgressBarProps {
  progress: number;
  className?: string;
  showLabel?: boolean;
  variant?: "default" | "success" | "warning" | "error";
}

export function ProgressBar({ 
  progress, 
  className,
  showLabel = true,
  variant = "default"
}: ProgressBarProps) {
  const variantClasses = {
    default: "bg-moroccan-gradient-primary",
    success: "bg-green-500",
    warning: "bg-yellow-500", 
    error: "bg-red-500"
  };

  return (
    <div className={cn("w-full", className)}>
      {showLabel && (
        <div className="flex justify-between text-sm text-moroccan-sand mb-2">
          <span>Progression</span>
          <span>{Math.round(progress)}%</span>
        </div>
      )}
      <div className="w-full bg-moroccan-darkgrey rounded-full h-2 overflow-hidden">
        <div
          className={cn(
            "h-full transition-all duration-500 ease-out",
            variantClasses[variant]
          )}
          style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
        />
      </div>
    </div>
  );
}

// 🎨 Moroccan Status Indicator
interface StatusIndicatorProps {
  status: "loading" | "success" | "error" | "warning" | "idle";
  text?: string;
  className?: string;
}

export function StatusIndicator({ 
  status, 
  text,
  className 
}: StatusIndicatorProps) {
  const statusConfig = {
    loading: {
      icon: "🔄",
      color: "text-moroccan-gold",
      bgColor: "bg-moroccan-gold/10",
      text: text || "Chargement..."
    },
    success: {
      icon: CheckCircle,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      text: text || "Terminé"
    },
    error: {
      icon: AlertCircle,
      color: "text-red-500",
      bgColor: "bg-red-500/10",
      text: text || "Erreur"
    },
    warning: {
      icon: AlertCircle,
      color: "text-yellow-500",
      bgColor: "bg-yellow-500/10",
      text: text || "Attention"
    },
    idle: {
      icon: "⏰",
      color: "text-moroccan-sand",
      bgColor: "bg-moroccan-sand/10",
      text: text || "En attente"
    }
  };

  const config = statusConfig[status];

  return (
    <div className={cn(
      "flex items-center space-x-2 px-3 py-2 rounded-lg",
      config.bgColor,
      className
    )}>
      {typeof config.icon === 'string' ? (
        <span className="text-lg">{config.icon}</span>
      ) : (
        <config.icon className={cn("h-4 w-4", config.color)} />
      )}
      <span className={cn("text-sm font-medium", config.color)}>
        {config.text}
      </span>
    </div>
  );
}

// 🎨 Moroccan Loading Overlay
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  className?: string;
  backdrop?: boolean;
}

export function LoadingOverlay({ 
  isLoading, 
  children, 
  className,
  backdrop = true
}: LoadingOverlayProps) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className={cn("relative", className)}>
      {children}
      <div className={cn(
        "absolute inset-0 flex items-center justify-center z-50",
        backdrop ? "bg-moroccan-charcoal/80 backdrop-blur-sm" : "bg-transparent"
      )}>
        <LoadingSpinner size="lg" text="Chargement..." />
      </div>
    </div>
  );
}

// 🎨 Moroccan Lazy Load Wrapper
interface LazyLoadWrapperProps {
  children: React.ReactNode;
  threshold?: number;
  className?: string;
  fallback?: React.ReactNode;
}

export function LazyLoadWrapper({ 
  children, 
  threshold = 0.1,
  className,
  fallback = <LoadingSpinner />
}: LazyLoadWrapperProps) {
  const [isVisible, setIsVisible] = React.useState(false);
  const [isLoaded, setIsLoaded] = React.useState(false);
  const ref = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  React.useEffect(() => {
    if (isVisible) {
      const timer = setTimeout(() => setIsLoaded(true), 100);
      return () => clearTimeout(timer);
    }
  }, [isVisible]);

  return (
    <div ref={ref} className={className}>
      {isLoaded ? children : fallback}
    </div>
  );
} 
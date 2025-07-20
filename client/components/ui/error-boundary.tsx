import React from 'react';
import { Button } from './button';
import { AlertCircle, RotateCw, Home } from 'lucide-react';

// Loading component with skeleton
export const LoadingSkeleton: React.FC<{ className?: string }> = ({ className = "" }) => {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      <div className="h-4 bg-muted rounded w-3/4"></div>
      <div className="h-4 bg-muted rounded w-1/2"></div>
      <div className="h-4 bg-muted rounded w-5/6"></div>
    </div>
  );
};

// Loading spinner component
export const LoadingSpinner: React.FC<{ size?: 'sm' | 'md' | 'lg'; className?: string }> = ({ 
  size = 'md', 
  className = "" 
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`flex items-center justify-center ${className}`}>
      <div className={`${sizeClasses[size]} border-2 border-muted border-t-primary rounded-full animate-spin`}></div>
    </div>
  );
};

// Loading overlay component
export const LoadingOverlay: React.FC<{ 
  isLoading: boolean; 
  message?: string;
  children: React.ReactNode;
}> = ({ isLoading, message = "Chargement...", children }) => {
  if (!isLoading) return <>{children}</>;

  return (
    <div className="relative">
      {children}
      <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50">
        <div className="text-center space-y-4">
          <LoadingSpinner size="lg" />
          <p className="text-muted-foreground">{message}</p>
        </div>
      </div>
    </div>
  );
};

// Error display component
export const ErrorDisplay: React.FC<{ 
  error: string; 
  onRetry?: () => void;
  onGoHome?: () => void;
}> = ({ error, onRetry, onGoHome }) => {
  const handleGoHome = () => {
    if (onGoHome) {
      onGoHome();
    } else {
      window.location.href = '/';
    }
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-4">
          <div className="mx-auto w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center">
            <AlertCircle className="w-8 h-8 text-destructive" />
          </div>
          
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-foreground">
              Oops! Quelque chose s'est mal passé
            </h1>
            <p className="text-muted-foreground">
              Une erreur inattendue s'est produite. Nous nous excusons pour ce désagrément.
            </p>
          </div>
        </div>

        <div className="bg-muted/50 rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-sm text-foreground">Détails de l'erreur:</h3>
          <div className="text-xs text-muted-foreground font-mono bg-background rounded p-2 overflow-auto max-h-32">
            {error}
          </div>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          {onRetry && (
            <Button
              onClick={onRetry}
              className="flex-1"
              variant="outline"
            >
              <RotateCw className="w-4 h-4 mr-2" />
              Réessayer
            </Button>
          )}
          
          <Button
            onClick={handleGoHome}
            className="flex-1"
          >
            <Home className="w-4 h-4 mr-2" />
            Accueil
          </Button>
        </div>

        <div className="text-center">
          <p className="text-xs text-muted-foreground">
            Si le problème persiste, contactez notre support technique.
          </p>
        </div>
      </div>
    </div>
  );
};

// Hook for functional components to handle errors
export const useErrorHandler = () => {
  const [error, setError] = React.useState<string | null>(null);

  const handleError = React.useCallback((error: Error | string) => {
    console.error('Error handled by hook:', error);
    setError(typeof error === 'string' ? error : error.message);
  }, []);

  const clearError = React.useCallback(() => {
    setError(null);
  }, []);

  return { error, handleError, clearError };
};

// Hook for loading states
export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = React.useState(initialState);

  const startLoading = React.useCallback(() => setIsLoading(true), []);
  const stopLoading = React.useCallback(() => setIsLoading(false), []);

  return { isLoading, startLoading, stopLoading };
}; 
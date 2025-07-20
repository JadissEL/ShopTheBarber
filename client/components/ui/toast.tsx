import React from 'react';

export interface ToastProps {
  message: string;
  type?: 'success' | 'error' | 'info' | 'warning';
  onClose?: () => void;
}

const toastColors = {
  success: 'bg-green-500 text-white',
  error: 'bg-red-500 text-white',
  info: 'bg-blue-500 text-white',
  warning: 'bg-yellow-400 text-gray-900',
};

export const Toast: React.FC<ToastProps> = ({ message, type = 'info', onClose }) => (
  <div
    className={`fixed bottom-6 right-6 z-50 px-6 py-4 rounded-xl shadow-xl flex items-center space-x-3 ${toastColors[type]} animate-fade-in transition-all duration-300`}
    role="alert"
    aria-live="assertive"
  >
    <span className="font-semibold">{message}</span>
    {onClose && (
      <button
        onClick={onClose}
        className="ml-4 text-lg font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
        aria-label="Fermer la notification"
      >
        ×
      </button>
    )}
  </div>
);

// Fournit un contexte pour les toasts (version minimaliste)
export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => <>{children}</>;

// Titre du toast
export const ToastTitle: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="font-bold text-lg mb-1">{children}</div>
);

// Description du toast
export const ToastDescription: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <div className="text-sm text-gray-200 mb-2">{children}</div>
);

// Bouton de fermeture du toast
export const ToastClose: React.FC<{ onClick?: () => void }> = ({ onClick }) => (
  <button
    onClick={onClick}
    className="ml-2 text-lg font-bold focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded"
    aria-label="Fermer la notification"
    type="button"
  >
    ×
  </button>
);

// Zone d'affichage des toasts (viewport)
export const ToastViewport: React.FC = () => null;

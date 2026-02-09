import { AlertCircle } from 'lucide-react';

/**
 * FormError Component
 * Displays validation errors consistently across all forms
 */
export function FormError({ message, className = '' }) {
  if (!message) return null;

  return (
    <div className={`flex items-center gap-2 p-2 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm ${className}`}>
      <AlertCircle className="w-4 h-4 flex-shrink-0" />
      <span>{message}</span>
    </div>
  );
}

/**
 * FieldError Component
 * Displays inline field-level validation errors
 */
export function FieldError({ message }) {
  if (!message) return null;

  return (
    <p className="text-red-600 text-xs mt-1 flex items-center gap-1">
      <AlertCircle className="w-3 h-3" />
      {message}
    </p>
  );
}

/**
 * FormSuccess Component
 * Displays success messages
 */
export function FormSuccess({ message, className = '' }) {
  if (!message) return null;

  return (
    <div className={`flex items-center gap-2 p-2 bg-green-50 border border-green-200 rounded-lg text-green-700 text-sm ${className}`}>
      <span>{message}</span>
    </div>
  );
}
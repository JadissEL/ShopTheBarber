export const formatCurrency = (value: number): string => {
  return `${value.toFixed(2)} MAD`;
};

export const formatDate = (date: string | Date): string => {
  const d = new Date(date);
  return d.toLocaleDateString('fr-FR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

export const formatTime = (time: string): string => {
  const d = new Date(`1970-01-01T${time}Z`);
  return d.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

export const formatPercentage = (value: number): string => {
  return `${value.toFixed(1)}%`;
}; 
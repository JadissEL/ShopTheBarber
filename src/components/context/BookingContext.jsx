import { createContext, useContext, useState, useEffect } from 'react';

const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [bookingState, setBookingState] = useState(() => {
    // Load from session storage on init
    if (typeof window !== 'undefined') {
      const saved = sessionStorage.getItem('sovereign_booking_state');
      return saved ? JSON.parse(saved) : {};
    }
    return {};
  });

  useEffect(() => {
    // Persist to session storage on change
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('sovereign_booking_state', JSON.stringify(bookingState));
    }
  }, [bookingState]);

  const updateBooking = (data) => {
    setBookingState(prev => ({ ...prev, ...data }));
  };

  const clearBooking = () => {
    setBookingState({});
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('sovereign_booking_state');
    }
  };

  return (
    <BookingContext.Provider value={{ bookingState, updateBooking, clearBooking }}>
      {children}
    </BookingContext.Provider>
  );
}

export function useBooking() {
  const context = useContext(BookingContext);
  if (!context) {
    throw new Error('useBooking must be used within a BookingProvider');
  }
  return context;
}

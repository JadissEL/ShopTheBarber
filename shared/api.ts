// API Service Layer for ShopTheBarber
// Provides centralized API communication with proper error handling and authentication

export interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

export interface User {
  id: number;
  email: string;
  firstName: string;
  lastName: string;
  role: 'client' | 'barber' | 'admin';
  phone?: string;
  city?: string;
  avatarUrl?: string;
}

export interface Barber {
  id: number;
  name: string;
  salonName: string;
  description?: string;
  rating: number;
  reviewCount: number;
  location: string;
  acceptsHome: boolean;
  acceptsShop: boolean;
  imageUrl?: string;
  services?: BarberService[];
}

export interface BarberService {
  id: number;
  serviceId: number;
  serviceName: string;
  price: number;
  duration: number;
}

export interface Service {
  id: number;
  name: string;
  category: string;
  durationMinutes: number;
  priceRange: string;
  description?: string;
}

export interface Appointment {
  id: number;
  barberId: number;
  barberName: string;
  appointmentDate: string;
  appointmentTime: string;
  locationType: 'shop' | 'home';
  address?: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  totalPrice: number;
  notes?: string;
  services: AppointmentService[];
}

export interface AppointmentService {
  serviceId: number;
  serviceName: string;
  price: number;
}

export interface Review {
  id: number;
  rating: number;
  comment?: string;
  createdAt: string;
  barberName: string;
}

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
const DEMO_MODE = import.meta.env.VITE_DEMO_MODE === 'true';

// Authentication utilities
export const getAuthToken = (): string | null => {
  return localStorage.getItem('token');
};

export const setAuthToken = (token: string): void => {
  localStorage.setItem('token', token);
};

export const removeAuthToken = (): void => {
  localStorage.removeItem('token');
  localStorage.removeItem('userId');
};

// API request wrapper with error handling
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  try {
    const token = getAuthToken();
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    // Demo mode handling
    if (DEMO_MODE && endpoint !== '/auth/login' && endpoint !== '/auth/register') {
      console.log('Demo mode: Blocked API call to', url);
      throw new Error('API calls disabled in demo mode');
    }

    const response = await fetch(url, config);
    const data = await response.json();

    if (!response.ok) {
      return {
        error: data.error || `HTTP ${response.status}: ${response.statusText}`,
      };
    }

    return { data };
  } catch (error: any) {
    console.error('API request failed:', error);
    return {
      error: error.message || 'Network error occurred',
    };
  }
}

// Authentication API
export const authAPI = {
  async login(email: string, password: string): Promise<ApiResponse<{ token: string; user: User }>> {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  async register(userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    city?: string;
    role?: 'client' | 'barber';
  }): Promise<ApiResponse<{ token: string; user: User }>> {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  async getProfile(): Promise<ApiResponse<User>> {
    return apiRequest('/profile');
  },

  async updateProfile(profileData: Partial<User>): Promise<ApiResponse<User>> {
    return apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};

// Barbers API
export const barbersAPI = {
  async getAll(filters?: {
    services?: number[];
    location?: string;
    locationType?: 'home' | 'shop';
  }): Promise<ApiResponse<Barber[]>> {
    const params = new URLSearchParams();
    if (filters?.services) params.append('services', filters.services.join(','));
    if (filters?.location) params.append('location', filters.location);
    if (filters?.locationType) params.append('locationType', filters.locationType);

    const query = params.toString();
    return apiRequest(`/barbers${query ? `?${query}` : ''}`);
  },

  async getById(id: number): Promise<ApiResponse<Barber>> {
    return apiRequest(`/barbers/${id}`);
  },

  async getByCity(city: string): Promise<ApiResponse<Barber[]>> {
    return apiRequest(`/barbers?location=${encodeURIComponent(city)}`);
  },
};

// Services API
export const servicesAPI = {
  async getAll(): Promise<ApiResponse<Service[]>> {
    return apiRequest('/services');
  },

  async getById(id: number): Promise<ApiResponse<Service>> {
    return apiRequest(`/services/${id}`);
  },
};

// Appointments API
export const appointmentsAPI = {
  async getAll(): Promise<ApiResponse<Appointment[]>> {
    return apiRequest('/appointments');
  },

  async create(appointmentData: {
    barberId: number;
    services: number[];
    date: string;
    time: string;
    locationType: 'shop' | 'home';
    address?: string;
    notes?: string;
  }): Promise<ApiResponse<{ appointmentId: number }>> {
    return apiRequest('/appointments', {
      method: 'POST',
      body: JSON.stringify(appointmentData),
    });
  },

  async cancel(id: number): Promise<ApiResponse<{ message: string }>> {
    return apiRequest(`/appointments/${id}/cancel`, {
      method: 'PUT',
    });
  },
};

// Favorites API
export const favoritesAPI = {
  async getAll(): Promise<ApiResponse<Barber[]>> {
    return apiRequest('/favorites');
  },

  async add(barberId: number): Promise<ApiResponse<{ message: string }>> {
    return apiRequest('/favorites', {
      method: 'POST',
      body: JSON.stringify({ barberId }),
    });
  },

  async remove(barberId: number): Promise<ApiResponse<{ message: string }>> {
    return apiRequest(`/favorites/${barberId}`, {
      method: 'DELETE',
    });
  },
};

// Reviews API
export const reviewsAPI = {
  async getByBarber(barberId: number): Promise<ApiResponse<Review[]>> {
    return apiRequest(`/reviews?barberId=${barberId}`);
  },

  async create(reviewData: {
    appointmentId: number;
    rating: number;
    comment?: string;
  }): Promise<ApiResponse<{ message: string }>> {
    return apiRequest('/reviews', {
      method: 'POST',
      body: JSON.stringify(reviewData),
    });
  },
};

// Search API
export const searchAPI = {
  async search(query: string): Promise<ApiResponse<{ barbers: Barber[]; services: Service[] }>> {
    return apiRequest(`/search?q=${encodeURIComponent(query)}`);
  },
};

// Notifications API
export const notificationsAPI = {
  async getAll(): Promise<ApiResponse<any[]>> {
    return apiRequest('/notifications');
  },

  async markAsRead(id: number): Promise<ApiResponse<{ message: string }>> {
    return apiRequest(`/notifications/${id}/read`, {
      method: 'PUT',
    });
  },

  async markAllAsRead(): Promise<ApiResponse<{ message: string }>> {
    return apiRequest('/notifications/read-all', {
      method: 'PUT',
    });
  },
};

// Analytics API (for admin/barber dashboards)
export const analyticsAPI = {
  async getOverview(): Promise<ApiResponse<any>> {
    return apiRequest('/analytics/overview');
  },

  async getClientAnalytics(): Promise<ApiResponse<any>> {
    return apiRequest('/analytics/client');
  },

  async getBarberAnalytics(): Promise<ApiResponse<any>> {
    return apiRequest('/analytics/barber');
  },
};

// Profile API
export const profileAPI = {
  async get(): Promise<ApiResponse<User>> {
    return apiRequest('/profile');
  },

  async update(profileData: Partial<User>): Promise<ApiResponse<User>> {
    return apiRequest('/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
  },
};

// Settings API
export const settingsAPI = {
  async getClientSettings(): Promise<ApiResponse<any>> {
    return apiRequest('/settings/client');
  },

  async updateClientSettings(settings: any): Promise<ApiResponse<any>> {
    return apiRequest('/settings/client', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async getBarberSettings(): Promise<ApiResponse<any>> {
    return apiRequest('/settings/barber');
  },

  async updateBarberSettings(settings: any): Promise<ApiResponse<any>> {
    return apiRequest('/settings/barber', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async getAdminSettings(): Promise<ApiResponse<any>> {
    return apiRequest('/settings/admin');
  },

  async updateAdminSettings(settings: any): Promise<ApiResponse<any>> {
    return apiRequest('/settings/admin', {
      method: 'PUT',
      body: JSON.stringify(settings),
    });
  },

  async changePassword(passwordData: { currentPassword: string; newPassword: string }): Promise<ApiResponse<any>> {
    return apiRequest('/settings/change-password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  },
};

// Logout function
export const logout = () => {
  removeAuthToken();
  window.location.href = '/login';
};

// Export all APIs
export const api = {
  auth: authAPI,
  barbers: barbersAPI,
  services: servicesAPI,
  appointments: appointmentsAPI,
  favorites: favoritesAPI,
  reviews: reviewsAPI,
  search: searchAPI,
  notifications: notificationsAPI,
  analytics: analyticsAPI,
  profile: profileAPI,
  settings: settingsAPI,
};

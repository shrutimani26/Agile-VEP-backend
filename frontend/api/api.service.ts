// src/services/api.service.ts

import axios, { AxiosInstance, AxiosError } from 'axios';

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api/v1';

// Create axios instance with default config
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true, // For cookies (refresh token)
});

// ⚠️ Token will be set by UserContext after login
// Don't use localStorage - token is managed in memory by Context

// Response interceptor - Handle token refresh
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as any;

    // If error is 401 and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        // Try to refresh token using cookie
        const response = await apiClient.post(`${API_BASE_URL}/auth/refresh-token`, {}, {
          withCredentials: true,
        });

        const newToken = response.data.token;

        // Update axios default header with new token
        axios.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
        apiClient.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;

        // Retry original request with new token
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return apiClient(originalRequest);
      } catch (refreshError) {
        // Refresh failed - user needs to login again
        // Let the UserContext handle the redirect
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// ============================================================================
// VEHICLE API
// ============================================================================

export const VehicleAPI = {
  create: async (data: {
    plate_no: string;
    make: string;
    model: string;
    year: number;
    vin: string;
    insurance_expiry: string; // YYYY-MM-DD
  }) => {
    const response = await apiClient.post('/vehicles', data);
    return response.data.vehicle;
  },

  getAll: async () => {
    const response = await apiClient.get('/vehicles');
    return response.data.vehicles;
  },

  getById: async (vehicleId: number) => {
    const response = await apiClient.get(`/vehicles/${vehicleId}`);
    return response.data.vehicle;
  },

  update: async (vehicleId: number, data: {
    make?: string;
    model?: string;
    year?: number;
    insurance_expiry?: string;
  }) => {
    const response = await apiClient.put(`/vehicles/${vehicleId}`, data);
    return response.data.vehicle;
  },

  delete: async (vehicleId: number) => {
    const response = await apiClient.delete(`/vehicles/${vehicleId}`);
    return response.data;
  },

  search: async (query: string) => {
    const response = await apiClient.get(`/vehicles/search?q=${query}`);
    return response.data.vehicles;
  },
};

// ============================================================================
// APPLICATION API
// ============================================================================

export const ApplicationAPI = {
  create: async (vehicleData: {
    plate_no: string;
    make: string;
    model: string;
    year: number;
    vin: string;
    insurance_expiry: string;
  }) => {
    const response = await apiClient.post('/applications', vehicleData);
    return response.data;
  },

  getAll: async (status?: string) => {
    const url = status ? `/applications/all?status=${status}` : '/applications';
    const response = await apiClient.get(url);
    return response.data.applications;
  },

  getById: async (applicationId: number) => {
    const response = await apiClient.get(`/applications/${applicationId}`);
    return response.data.application;
  },

  submit: async (applicationId: number) => {
    const response = await apiClient.post(`/applications/${applicationId}/submit`);
    return response.data;
  },

  review: async (applicationId: number, approved: boolean, reason?: string) => {
    const response = await apiClient.post(`/applications/${applicationId}/review`, {
      approved,
      decision_reason: reason,
    });
    return response.data;
  },

  delete: async (applicationId: number) => {
    const response = await apiClient.delete(`/applications/${applicationId}`);
    return response.data;
  },

  // Officer only
  getAllApplications: async (status?: string, page = 1, perPage = 20) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    params.append('page', page.toString());
    params.append('per_page', perPage.toString());
    
    const response = await apiClient.get(`/applications/all?${params.toString()}`);
    return response.data;
  },
};

// ============================================================================
// DOCUMENT API
// ============================================================================

export const DocumentAPI = {
  upload: async (applicationId: number, data: {
    name: string;
    size: number;
    type: 'LOG_CARD' | 'INSURANCE' | 'ID';
    file_path: string;
  }) => {
    const response = await apiClient.post(`/documents/application/${applicationId}`, data);
    return response.data;
  },

  getByApplication: async (applicationId: number) => {
    const response = await apiClient.get(`/documents/application/${applicationId}`);
    return response.data.documents;
  },

  delete: async (documentId: number) => {
    const response = await apiClient.delete(`/documents/${documentId}`);
    return response.data;
  },

  getRequiredTypes: async () => {
    const response = await apiClient.get('/documents/types');
    return response.data.types;
  },
};

// ============================================================================
// PAYMENT API
// ============================================================================

export const PaymentAPI = {
  create: async (applicationId: number, amount: number, currency = 'SGD') => {
    const response = await apiClient.post(`/payments/application/${applicationId}`, {
      amount,
      currency,
    });
    return response.data;
  },

  process: async (paymentId: number, paymentMethod: string, transactionId?: string) => {
    const response = await apiClient.post(`/payments/${paymentId}/process`, {
      payment_method: paymentMethod,
      transaction_id: transactionId,
    });
    return response.data;
  },

  getUserPayments: async () => {
    const response = await apiClient.get('/payments/user');
    return response.data.payments;
  },
};

// ============================================================================
// CROSSING API
// ============================================================================

export const CrossingAPI = {
  // Officer only
  record: async (data: {
    application_id: number;
    vehicle_id: number;
    user_id: number;
    direction: 'ENTRY' | 'EXIT';
    checkpoint: string;
  }) => {
    const response = await apiClient.post('/crossings', data);
    return response.data;
  },

  getUserCrossings: async (days = 30) => {
    const response = await apiClient.get(`/crossings/user?days=${days}`);
    return response.data.crossings;
  },

  getVehicleCrossings: async (vehicleId: number, days = 30) => {
    const response = await apiClient.get(`/crossings/vehicle/${vehicleId}?days=${days}`);
    return response.data.crossings;
  },

  // Officer only
  getStats: async (checkpoint?: string) => {
    const url = checkpoint ? `/crossings/stats?checkpoint=${checkpoint}` : '/crossings/stats';
    const response = await apiClient.get(url);
    return response.data;
  },
};

// ============================================================================
// NOTIFICATION API
// ============================================================================

export const NotificationAPI = {
  getAll: async (unreadOnly = false, limit = 50) => {
    const response = await apiClient.get(`/notifications?unread_only=${unreadOnly}&limit=${limit}`);
    return response.data.notifications;
  },

  markAsRead: async (notificationId: number) => {
    const response = await apiClient.post(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.post('/notifications/read-all');
    return response.data;
  },

  delete: async (notificationId: number) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await apiClient.get('/notifications/unread-count');
    return response.data.unread_count;
  },
};

// ============================================================================
// ERROR HANDLER UTILITY
// ============================================================================

export const handleAPIError = (error: any): string => {
  if (axios.isAxiosError(error)) {
    if (error.response) {
      // Server responded with error
      return error.response.data?.error || 'An error occurred';
    } else if (error.request) {
      // Request made but no response
      return 'Unable to connect to server';
    }
  }
  return error.message || 'An unexpected error occurred';
};


export const setAuthToken = (token: string | null) => {
  if (token) {
    apiClient.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  } else {
    delete apiClient.defaults.headers.common['Authorization'];
  }
};

// Export default object with all APIs
export default {
  Vehicle: VehicleAPI,
  Application: ApplicationAPI,
  Document: DocumentAPI,
  Payment: PaymentAPI,
  Crossing: CrossingAPI,
  Notification: NotificationAPI,
  handleError: handleAPIError,
  setAuthToken: setAuthToken
};
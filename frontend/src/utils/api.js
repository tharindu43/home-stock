import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: 'http://localhost:5001/api',
});

// Add request interceptor to add auth token to requests
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Add response interceptor to handle authentication errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    // If the error is due to authentication (401) and we haven't tried to refresh yet
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      
      // Check if we have a token at all
      const token = localStorage.getItem('token');
      if (!token) {
        // No token, redirect to login
        window.location.href = '/login';
        return Promise.reject(error);
      }
      
      try {
        // Try to get a fresh user profile to see if token is still valid
        await api.get('/users/profile');
        // If successful, retry the original request
        return api(originalRequest);
      } catch (refreshError) {
        // If that fails too, token is invalid, redirect to login
        localStorage.removeItem('token');
        window.location.href = '/login?expired=true';
        return Promise.reject(error);
      }
    }
    
    return Promise.reject(error);
  }
);

// User API calls
export const userAPI = {
  login: async (credentials) => {
    const response = await api.post('/users/login', credentials);
    return response.data;
  },
  register: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  getProfile: async () => {
    const response = await api.get('/users/profile');
    return response.data;
  },
  updateProfile: async (userData) => {
    const response = await api.put('/users/profile', userData);
    return response.data;
  },
  getUsers: async () => {
    const response = await api.get('/users');
    return response.data;
  },
  getUser: async (id) => {
    const response = await api.get(`/users/${id}`);
    return response.data;
  },
  createUser: async (userData) => {
    const response = await api.post('/users', userData);
    return response.data;
  },
  updateUser: async (id, userData) => {
    const response = await api.put(`/users/${id}`, userData);
    return response.data;
  },
  deleteUser: async (id) => {
    const response = await api.delete(`/users/${id}`);
    return response.data;
  }
};

// Grocery API calls
export const groceryAPI = {
  getGroceries: async () => {
    const response = await api.get('/groceries');
    return response.data;
  },
  getGrocery: async (id) => {
    const response = await api.get(`/groceries/${id}`);
    return response.data;
  },
  createGrocery: async (groceryData) => {
    const response = await api.post('/groceries', groceryData);
    return response.data;
  },
  updateGrocery: async (id, groceryData) => {
    const response = await api.put(`/groceries/${id}`, groceryData);
    return response.data;
  },
  deleteGrocery: async (id) => {
    const response = await api.delete(`/groceries/${id}`);
    return response.data;
  },
  searchGroceries: async (params) => {
    const response = await api.get('/groceries/search', { params });
    return response.data;
  },
  getExpiringGroceries: async () => {
    const response = await api.get('/groceries/expiring');
    return response.data;
  },
  getGroceryStats: async () => {
    const response = await api.get('/groceries/stats');
    return response.data;
  },
};

// Inventory API calls
export const inventoryAPI = {
  getInventoryItems: async () => {
    const response = await api.get('/inventory');
    return response.data;
  },
  getInventoryItem: async (id) => {
    const response = await api.get(`/inventory/${id}`);
    return response.data;
  },
  createInventoryItem: async (inventoryData) => {
    const response = await api.post('/inventory', inventoryData);
    return response.data;
  },
  updateInventoryItem: async (id, inventoryData) => {
    const response = await api.put(`/inventory/${id}`, inventoryData);
    return response.data;
  },
  deleteInventoryItem: async (id) => {
    const response = await api.delete(`/inventory/${id}`);
    return response.data;
  },
  searchInventoryItems: async (params) => {
    const response = await api.get('/inventory/search', { params });
    return response.data;
  },
  getInventoryStats: async () => {
    const response = await api.get('/inventory/stats');
    return response.data;
  }
};

// Budget API calls
export const budgetAPI = {
  getBudgetEntries: async () => {
    const response = await api.get('/budget');
    return response.data;
  },
  getBudgetEntry: async (id) => {
    const response = await api.get(`/budget/${id}`);
    return response.data;
  },
  createBudgetEntry: async (budgetData) => {
    const response = await api.post('/budget', budgetData);
    return response.data;
  },
  updateBudgetEntry: async (id, budgetData) => {
    const response = await api.put(`/budget/${id}`, budgetData);
    return response.data;
  },
  deleteBudgetEntry: async (id) => {
    const response = await api.delete(`/budget/${id}`);
    return response.data;
  },
  searchBudgetEntries: async (params) => {
    const response = await api.get('/budget/search', { params });
    return response.data;
  },
  getBudgetStats: async () => {
    const response = await api.get('/budget/stats');
    return response.data;
  },
};

// Report API calls
export const reportAPI = {
  generateGroceryReport: async (format = 'json') => {
    const response = await api.get(`/reports/groceries?format=${format}`);
    return response.data;
  },
  generateInventoryReport: async (format = 'json') => {
    const response = await api.get(`/reports/inventory?format=${format}`);
    return response.data;
  },
  generateBudgetReport: async (format = 'json') => {
    const response = await api.get(`/reports/budget?format=${format}`);
    return response.data;
  },
  generateExpiringGroceriesReport: async (days = 7, format = 'json') => {
    const response = await api.get(`/reports/expiring-groceries?days=${days}&format=${format}`);
    return response.data;
  },
  generateInventoryValueReport: async (format = 'json') => {
    const response = await api.get(`/reports/inventory-value?format=${format}`);
    return response.data;
  },
  generateMonthlyBudgetReport: async (month, year, format = 'json') => {
    let url = `/reports/monthly-budget?format=${format}`;
    if (month) url += `&month=${month}`;
    if (year) url += `&year=${year}`;
    const response = await api.get(url);
    return response.data;
  },
  generateAnnualBudgetReport: async (year, format = 'json') => {
    let url = `/reports/annual-budget?format=${format}`;
    if (year) url += `&year=${year}`;
    const response = await api.get(url);
    return response.data;
  },
  generateUserReport: async (format = 'json') => {
    const response = await api.get(`/reports/users?format=${format}`);
    return response.data;
  },
  downloadReport: (filename) => {
    return `${api.defaults.baseURL}/reports/download/${filename}`;
  },
};

// Export individual functions for direct import
export const { login, register, getProfile, updateProfile } = userAPI;
export const { getGroceries, getGrocery, createGrocery, updateGrocery, deleteGrocery } = groceryAPI;
export const { getInventoryItems, getInventoryItem, createInventoryItem, updateInventoryItem, deleteInventoryItem } = inventoryAPI;
export const { getBudgetEntries, getBudgetEntry, createBudgetEntry, updateBudgetEntry, deleteBudgetEntry } = budgetAPI;
export const { generateGroceryReport, generateInventoryReport, generateBudgetReport, generateExpiringGroceriesReport, generateInventoryValueReport, generateMonthlyBudgetReport, generateAnnualBudgetReport, generateUserReport, downloadReport } = reportAPI;
export const { getUsers, getUser, createUser, updateUser, deleteUser } = userAPI;

export default api;

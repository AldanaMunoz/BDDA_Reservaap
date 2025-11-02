import axios, { type AxiosInstance } from 'axios';

const API_URL = 'http://localhost:3001/api';

export interface User {
  id: number;
  email: string;
  nombre: string;
  apellido: string;
  turno: 'manana' | 'tarde' | 'noche';
  tipo: 'interno' | 'externo';
  roles: string[];
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterData {
  email: string;
  password: string;
  nombre: string;
  apellido: string;
  turno: 'manana' | 'tarde' | 'noche';
  tipo: 'interno' | 'externo';
}

export interface LoginResponse {
  token: string;
  user: User;
}

const api: AxiosInstance = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para agregar token a todas las peticiones
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

export const authService = {
  async register(userData: RegisterData): Promise<{ message: string; userId: number }> {
    const response = await api.post('/auth/register', userData);
    return response.data;
  },

  async login(credentials: LoginCredentials): Promise<LoginResponse> {
    const response = await api.post<LoginResponse>('/auth/login', credentials);
    if (response.data.token) {
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
    }
    return response.data;
  },

  async verifyToken(): Promise<{ valid: boolean; user: User }> {
    const response = await api.get('/auth/verify');
    return response.data;
  },

  logout(): void {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  },

  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;
  }
};

export default api;
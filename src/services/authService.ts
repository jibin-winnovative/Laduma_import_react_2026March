import { api, setTokens, clearTokens, getRefreshToken } from './apiClient';
import { LoginRequest, LoginResponse, User } from '../types/api';

const USER_CACHE_KEY = 'app_user_cache';

const mapApiDataToUser = (data: any, fallbackEmail?: string): User => ({
  id: data.employeeId?.toString() || data.id?.toString() || '',
  email: data.email || fallbackEmail || '',
  username: data.name || data.username || data.email || fallbackEmail || '',
  firstName: data.firstName || data.name?.split(' ')[0] || '',
  lastName: data.lastName || data.name?.split(' ').slice(1).join(' ') || '',
  role: data.role || 'User',
  roles: data.roles || [data.role || 'User'],
  isActive: data.isActive !== undefined ? data.isActive : true,
  createdAt: data.createdAt || new Date().toISOString(),
});

export const getCachedUser = (): User | null => {
  try {
    const cached = localStorage.getItem(USER_CACHE_KEY);
    return cached ? JSON.parse(cached) : null;
  } catch {
    return null;
  }
};

const cacheUser = (user: User) => {
  localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
};

export const clearCachedUser = () => {
  localStorage.removeItem(USER_CACHE_KEY);
};

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      console.log('🔐 Login attempt:', credentials.email);
      const rawResponse: any = await api.post('/api/Auth/login', credentials);
      console.log('✅ Raw API response:', rawResponse);

      let loginData = rawResponse;

      if (rawResponse.data && typeof rawResponse.data === 'object') {
        console.log('📦 Unwrapping data property...');
        loginData = rawResponse.data;
      }

      console.log('📦 Login data:', loginData);

      if (!loginData.accessToken || !loginData.refreshToken) {
        console.error('❌ Missing tokens in response:', loginData);
        throw new Error('Invalid login response: missing tokens');
      }

      setTokens(loginData.accessToken, loginData.refreshToken);
      console.log('🎫 Tokens stored successfully');

      const user = mapApiDataToUser(loginData, credentials.email);

      console.log('👤 Mapped user:', user);
      cacheUser(user);

      return {
        accessToken: loginData.accessToken,
        refreshToken: loginData.refreshToken,
        user,
      };
    } catch (error: any) {
      console.error('❌ Login error:', error);

      if (error.message) {
        throw new Error(error.message);
      } else if (error.errors && Array.isArray(error.errors) && error.errors.length > 0) {
        throw new Error(error.errors[0]);
      }

      throw new Error('Failed to login. Please check your credentials.');
    }
  },

  logout: async (): Promise<void> => {
    try {
      await api.post('/api/Auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      clearTokens();
      clearCachedUser();
    }
  },

  getCurrentUser: async (): Promise<User> => {
    const rawResponse: any = await api.get('/api/Auth/me');

    let data = rawResponse;
    if (rawResponse?.data && typeof rawResponse.data === 'object') {
      data = rawResponse.data;
    }

    const user = mapApiDataToUser(data);
    cacheUser(user);
    return user;
  },

  refreshToken: async (): Promise<LoginResponse> => {
    const refresh = getRefreshToken();
    if (!refresh) {
      throw new Error('No refresh token available');
    }
    const response = await api.post<LoginResponse>('/api/Auth/refresh-token', {
      refreshToken: refresh,
    });
    setTokens(response.accessToken, response.refreshToken);
    return response;
  },

  changePassword: async (data: {
    currentPassword: string;
    newPassword: string;
    confirmPassword: string;
  }): Promise<void> => {
    return api.post('/api/Auth/change-password', data);
  },
};

import { api, setTokens, clearTokens, getRefreshToken } from './apiClient';
import { LoginRequest, LoginResponse, User } from '../types/api';

export const authService = {
  login: async (credentials: LoginRequest): Promise<LoginResponse> => {
    try {
      console.log('🔐 Login attempt:', credentials.email);
      const rawResponse: any = await api.post('/api/Auth/login', credentials);
      console.log('✅ Raw API response:', rawResponse);

      // Handle your API's response structure: { success, message, data: {...}, errors }
      let loginData = rawResponse;

      // If response has a 'data' property, extract it
      if (rawResponse.data && typeof rawResponse.data === 'object') {
        console.log('📦 Unwrapping data property...');
        loginData = rawResponse.data;
      }

      console.log('📦 Login data:', loginData);

      // Validate tokens exist
      if (!loginData.accessToken || !loginData.refreshToken) {
        console.error('❌ Missing tokens in response:', loginData);
        throw new Error('Invalid login response: missing tokens');
      }

      // Store tokens
      setTokens(loginData.accessToken, loginData.refreshToken);
      console.log('🎫 Tokens stored successfully');

      // Map the API's user structure to our User interface
      const user: User = {
        id: loginData.employeeId?.toString() || '',
        email: loginData.email || credentials.email,
        username: loginData.name || loginData.email,
        firstName: loginData.name?.split(' ')[0] || '',
        lastName: loginData.name?.split(' ').slice(1).join(' ') || '',
        role: loginData.role || 'User',
        roles: [loginData.role || 'User'],
        isActive: true,
        createdAt: new Date().toISOString(),
      };

      console.log('👤 Mapped user:', user);

      return {
        accessToken: loginData.accessToken,
        refreshToken: loginData.refreshToken,
        user,
      };
    } catch (error: any) {
      console.error('❌ Login error:', error);

      // Extract the proper error message from the API response
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
    }
  },

  getCurrentUser: async (): Promise<User> => {
    return api.get<User>('/api/Auth/me');
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

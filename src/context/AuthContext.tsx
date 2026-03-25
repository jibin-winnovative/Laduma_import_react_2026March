import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, LoginRequest } from '../types/api';
import { authService, getCachedUser, clearCachedUser } from '../services/authService';
import { clearTokens, setSessionExpiredCallback, isRefreshTokenExpired } from '../services/apiClient';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (credentials: LoginRequest) => Promise<void>;
  logout: () => Promise<void>;
  refetchUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => getCachedUser());
  const [isLoading, setIsLoading] = useState(true);

  const handleSessionExpired = useCallback(() => {
    console.log('🔒 Session expired, clearing user data');
    setUser(null);
    clearCachedUser();
    clearTokens();
  }, []);

  const fetchUser = useCallback(async () => {
    if (isRefreshTokenExpired()) {
      console.log('🔒 Refresh token expired on startup — logging out');
      handleSessionExpired();
      setIsLoading(false);
      return;
    }

    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error: any) {
      console.error('Failed to fetch user:', error);
      const statusCode = error?.statusCode || error?.response?.status;
      if (statusCode === 401) {
        handleSessionExpired();
      }
    } finally {
      setIsLoading(false);
    }
  }, [handleSessionExpired]);

  useEffect(() => {
    setSessionExpiredCallback(handleSessionExpired);
    fetchUser();
  }, [handleSessionExpired, fetchUser]);

  const login = async (credentials: LoginRequest) => {
    setIsLoading(true);
    try {
      console.log('👤 AuthContext: Starting login...');
      const response = await authService.login(credentials);
      console.log('👤 AuthContext: Login response received:', response);

      if (!response.user) {
        console.error('❌ No user object in response:', response);
        throw new Error('Invalid response: missing user data');
      }

      console.log('👤 AuthContext: Setting user:', response.user);
      setUser(response.user);
      console.log('✅ AuthContext: Login successful, user set');
    } catch (error) {
      console.error('❌ AuthContext: Login failed:', error);
      setUser(null);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await authService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      clearTokens();
      clearCachedUser();
      setIsLoading(false);
    }
  };

  const refetchUser = async () => {
    setIsLoading(true);
    await fetchUser();
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        logout,
        refetchUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
};

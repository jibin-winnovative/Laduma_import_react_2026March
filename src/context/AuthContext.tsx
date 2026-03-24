import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { User, LoginRequest } from '../types/api';
import { authService } from '../services/authService';
import { clearTokens, setSessionExpiredCallback, getAccessToken } from '../services/apiClient';

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
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const fetchUser = async () => {
    try {
      const userData = await authService.getCurrentUser();
      setUser(userData);
    } catch (error) {
      console.error('Failed to fetch user:', error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionExpired = useCallback(() => {
    console.log('🔒 Session expired, clearing user data');
    setUser(null);
  }, []);

  useEffect(() => {
    setSessionExpiredCallback(handleSessionExpired);
    fetchUser();

    const activityEvents = ['mousedown', 'keydown', 'scroll', 'touchstart', 'click'];
    let activityTimeout: NodeJS.Timeout;

    const resetActivityTimer = () => {
      clearTimeout(activityTimeout);
      activityTimeout = setTimeout(() => {
        const token = getAccessToken();
        if (token) {
          console.log('👤 User active, keeping session alive');
        }
      }, 300000);
    };

    activityEvents.forEach(event => {
      window.addEventListener(event, resetActivityTimer);
    });

    resetActivityTimer();

    return () => {
      activityEvents.forEach(event => {
        window.removeEventListener(event, resetActivityTimer);
      });
      clearTimeout(activityTimeout);
    };
  }, [handleSessionExpired]);

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

import React, { createContext, useState, useEffect, useContext } from 'react';
import { toast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/api';

interface User {
  id: string;
  name: string;
  email: string;
}

interface AuthResponse {
  token: string;
  user: User;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedToken = localStorage.getItem('auth-token');
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    const bootstrap = async () => {
      try {
        const response = await apiRequest<{ user: User }>('/auth/me', { token: storedToken });
        setToken(storedToken);
        setUser(response.user);
      } catch {
        localStorage.removeItem('auth-token');
      } finally {
        setIsLoading(false);
      }
    };

    bootstrap();
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiRequest<AuthResponse>('/auth/login', {
        method: 'POST',
        body: { email, password },
      });
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('auth-token', response.token);
      toast({
        title: 'Login successful',
        description: `Welcome back, ${response.user.name}!`,
      });
      return true;
    } catch (error) {
      toast({
        title: 'Login failed',
        description: error instanceof Error ? error.message : 'Invalid email or password',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const signup = async (name: string, email: string, password: string): Promise<boolean> => {
    setIsLoading(true);
    try {
      const response = await apiRequest<AuthResponse>('/auth/signup', {
        method: 'POST',
        body: { name, email, password },
      });
      setUser(response.user);
      setToken(response.token);
      localStorage.setItem('auth-token', response.token);
      toast({
        title: 'Signup successful',
        description: `Welcome, ${response.user.name}!`,
      });
      return true;
    } catch (error) {
      toast({
        title: 'Signup failed',
        description: error instanceof Error ? error.message : 'Could not create account',
        variant: 'destructive',
      });
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    const currentToken = token || localStorage.getItem('auth-token');
    try {
      if (currentToken) {
        await apiRequest('/auth/logout', {
          method: 'POST',
          token: currentToken,
        });
      }
    } catch {
      // Ignore network errors on logout and clear client state anyway.
    } finally {
      setUser(null);
      setToken(null);
      localStorage.removeItem('auth-token');
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out',
      });
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
};

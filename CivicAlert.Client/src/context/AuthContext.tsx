import React, { createContext, useContext, useState, useEffect } from 'react';
import axiosInstance from '../api/axiosInstance';
import i18n from 'i18next';

export interface UserState {
  userId: number | null;
  email: string | null;
  role: string | null;
  districtId: number | null;
  townId: number | null;
  fullName: string | null;
  preferredLanguage: string | null;
  departmentId?: number | null;
  departmentName?: string | null;
  departmentFullName?: string | null;
  departmentDescription?: string | null;
}

interface AuthContextType {
  user: UserState | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (userData: UserState) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserState | null>(null);
  const [loading, setLoading] = useState(true);

  const login = (userData: UserState) => {
    setUser(userData);
    if (userData.preferredLanguage) {
      i18n.changeLanguage(userData.preferredLanguage);
    }
    return new Promise<void>((resolve) => setTimeout(resolve, 0));
  };

  const logout = async () => {
    try {
      await axiosInstance.post('/auth/logout');
    } catch (err) {
      console.error('Logout failed:', err);
    } finally {
      setUser(null);
    }
  };

  const refreshUser = async () => {
    try {
      const response = await axiosInstance.get('/auth/me');
      if (response.data && response.data.success) {
        const userData: UserState = {
          userId: response.data.userId,
          email: response.data.email,
          role: response.data.role,
          districtId: response.data.districtId,
          townId: response.data.townId,
          fullName: response.data.fullName,
          preferredLanguage: response.data.preferredLanguage,
          departmentId: response.data.departmentId || null,
          departmentName: response.data.departmentName || null,
          departmentFullName: response.data.departmentFullName || null,
          departmentDescription: response.data.departmentDescription || null,
        };
        setUser(userData);
        if (userData.preferredLanguage) {
          i18n.changeLanguage(userData.preferredLanguage);
        }
      } else {
        setUser(null);
      }
    } catch (err) {
      setUser(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

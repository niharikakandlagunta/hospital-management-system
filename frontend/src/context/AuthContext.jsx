import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('medicare_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [token, setToken] = useState(() => localStorage.getItem('medicare_token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      if (token) {
        try {
          const res = await authService.getCurrentUser();
          if (res && res.data) {
            setUser(res.data);
            localStorage.setItem('medicare_user', JSON.stringify(res.data));
          }
        } catch {
          // Token invalid or expired
          logout();
        }
      }
      setLoading(false);
    };

    verifyAuth();
  }, [token]);

  const login = async (username, password) => {
    const res = await authService.login(username, password);
    if (res && res.data) {
      const { token: jwtToken, ...userInfo } = res.data;
      setToken(jwtToken);
      setUser(userInfo);
      localStorage.setItem('medicare_token', jwtToken);
      localStorage.setItem('medicare_user', JSON.stringify(userInfo));
      return userInfo;
    }
    throw new Error('Authentication failed');
  };

  const register = async (userData) => {
    const res = await authService.register(userData);
    if (res && res.data) {
      const { token: jwtToken, ...userInfo } = res.data;
      setToken(jwtToken);
      setUser(userInfo);
      localStorage.setItem('medicare_token', jwtToken);
      localStorage.setItem('medicare_user', JSON.stringify(userInfo));
      return userInfo;
    }
    throw new Error('Registration failed');
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
  };

  const hasRole = (...roles) => {
    if (!user || !user.role) return false;
    return roles.includes(user.role);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        isAuthenticated: !!token && !!user,
        login,
        register,
        logout,
        hasRole
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { registerUser, loginUser, getCurrentUser } from '../api/api';

const AuthContext = createContext(null);
const TOKEN_KEY = 'userToken';

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(!!localStorage.getItem(TOKEN_KEY));

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    let cancelled = false;
    getCurrentUser(token)
      .then((res) => {
        if (cancelled) return;
        if (res.success && res.user) setUser(res.user);
        else logout();
      })
      .catch(() => {
        if (!cancelled) logout();
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token, logout]);

  const login = async (email, password) => {
    const res = await loginUser(email, password);
    if (res.success && res.token) {
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(res.user);
      return { success: true };
    }
    return { success: false, message: res.message || 'Login failed' };
  };

  const register = async (email, password, name) => {
    const res = await registerUser(email, password, name);
    if (res.success && res.token) {
      localStorage.setItem(TOKEN_KEY, res.token);
      setToken(res.token);
      setUser(res.user);
      return { success: true };
    }
    return { success: false, message: res.message || 'Registration failed' };
  };

  const refreshUser = useCallback(async () => {
    if (!token) return null;
    const res = await getCurrentUser(token);
    if (res.success && res.user) {
      setUser(res.user);
      return res.user;
    }
    return null;
  }, [token]);

  return (
    <AuthContext.Provider
      value={{ user, setUser, token, loading, login, register, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}

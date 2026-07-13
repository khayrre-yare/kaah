import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { authApi, clearAuth, readAuth, saveAuth } from '../api/client';

const AuthContext = createContext(null);

function normalizeAuth(data) {
  return {
    token: data?.token || data?.Token || '',
    role: data?.role || data?.Role || 'User',
    name: data?.name || data?.Name || 'User',
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (localStorage.getItem('kaah3_storage_ready') !== 'yes') {
      clearAuth();
      localStorage.setItem('kaah3_storage_ready', 'yes');
    }
    const stored = readAuth();
    if (stored?.token) setUser(stored);
    setLoading(false);

    const handleUnauthorized = () => {
      clearAuth();
      setUser(null);
    };

    window.addEventListener('kaah:unauthorized', handleUnauthorized);
    return () => window.removeEventListener('kaah:unauthorized', handleUnauthorized);
  }, []);

  const login = async (email, password) => {
    const auth = normalizeAuth(await authApi.login({ email, password }));
    if (!auth.token) throw new Error('Backend-ka token ma soo celin. Hubi AuthController/LoginResponseDto.');
    saveAuth(auth);
    setUser(auth);
    return auth;
  };

  const register = async (fullName, email, password) => authApi.register({ fullName, email, password });

  const logout = () => {
    clearAuth();
    setUser(null);
  };

  const value = useMemo(() => ({
    user,
    loading,
    login,
    register,
    logout,
    isAdmin: user?.role?.toLowerCase() === 'admin',
    isAuthenticated: Boolean(user?.token),
  }), [user, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}

import { createContext, useContext, useState, useCallback } from 'react';

const BASE_URL = import.meta.env.VITE_API_URL || '';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token,    setToken]    = useState(() => localStorage.getItem('arp_token'));
  const [username, setUsername] = useState(() => localStorage.getItem('arp_username'));
  const [role,     setRole]     = useState(() => localStorage.getItem('arp_role') || 'admin');

  const login = useCallback((newToken, newUsername, newRole = 'admin') => {
    localStorage.setItem('arp_token',    newToken);
    localStorage.setItem('arp_username', newUsername);
    localStorage.setItem('arp_role',     newRole);
    setToken(newToken);
    setUsername(newUsername);
    setRole(newRole);
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem('arp_token');
    localStorage.removeItem('arp_username');
    localStorage.removeItem('arp_role');
    setToken(null);
    setUsername(null);
    setRole(null);
  }, []);

  function authFetch(path, options = {}) {
    const url = path.startsWith('http') ? path : `${BASE_URL}${path}`;
    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
        Authorization: token ? `Bearer ${token}` : '',
      },
    });
  }

  return (
    <AuthContext.Provider value={{ token, username, role, login, logout, authFetch, isAuthed: !!token }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

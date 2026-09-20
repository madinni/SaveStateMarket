import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const API_URL = 'http://localhost:3001';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('null_operative_session');
    return saved ? JSON.parse(saved) : null;
  });

  const login = (operativeData) => {
    setUser(operativeData);
    localStorage.setItem('null_operative_session', JSON.stringify(operativeData));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('null_operative_session');
  };

  const updateAvatar = async (newBase64) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/profiles/${user.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ avatar_url: newBase64 })
      });
      if (res.ok) {
        const updated = await res.json();
        login(updated);
      }
    } catch (e) {
      console.error("Falha ao atualizar avatar no json-server:", e);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateAvatar }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
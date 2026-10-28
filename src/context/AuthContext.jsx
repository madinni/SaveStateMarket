import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext();

export const API_URL = "http://localhost:3001";

const SESSION_KEY = "null_operative_session";

// Remove a senha antes de manter o operador em memória e no localStorage.
const toSession = (operative) => {
  const { password_hash, ...safe } = operative; // eslint-disable-line no-unused-vars
  return safe;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem(SESSION_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const login = (operativeData) => {
    const session = toSession(operativeData);
    setUser(session);
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(SESSION_KEY);
  };

  const updateAvatar = async (newBase64) => {
    if (!user) return;
    try {
      const res = await fetch(`${API_URL}/profiles/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ avatar_url: newBase64 }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      login(await res.json());
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
